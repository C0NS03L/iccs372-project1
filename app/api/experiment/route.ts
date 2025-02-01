import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { bigIntReplacer } from '@/app/lib/common';
import { toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();

interface InventoryItem {
  name: string;
  quantity: number;
}

interface ExperimentData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  items: InventoryItem[];
  labRoomId: string;
}

function validateExperimentData(data: ExperimentData) {
  const { title, description, startDate, endDate, items, labRoomId } = data;

  if (
    !title ||
    !description ||
    !startDate ||
    !endDate ||
    !items ||
    !labRoomId
  ) {
    throw new Error('Missing required fields or invalid format');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const labRoomIdBigInt = BigInt(labRoomId);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  if (start > end) {
    throw new Error('Start date cannot be after end date');
  }

  return { title, description, start, end, items, labRoomId: labRoomIdBigInt };
}

async function checkTimeslotConflicts(
  start: Date,
  end: Date,
  labRoomId: bigint
) {
  const conflict = await prisma.experiments.findFirst({
    where: {
      labRoomId,
      OR: [{ startDate: { lt: end }, endDate: { gt: start } }],
    },
  });

  if (conflict) {
    const alternativeSlots = await prisma.experiments.findMany({
      select: { startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
      take: 3,
    });

    throw {
      status: 409,
      message: 'Timeslot conflicts with an existing experiment',
      alternativeSlots,
    };
  }
}

async function processInventory(
  items: InventoryItem[],
  experimentStartDate: Date
) {
  const arrivalDate = new Date(experimentStartDate);
  arrivalDate.setDate(arrivalDate.getDate() - 3);

  for (const { name, quantity } of items) {
    const inventoryItems = await prisma.inventory.findMany({
      where: { name },
      orderBy: { stockLevel: 'desc' },
    });

    let remainingQuantity = quantity;

    for (const inventory of inventoryItems) {
      const allocated = Math.min(remainingQuantity, inventory.stockLevel);
      remainingQuantity -= allocated;

      await prisma.inventory.update({
        where: { id: inventory.id },
        data: { stockLevel: { decrement: allocated } },
      });

      const updatedInventory = await prisma.inventory.findUnique({
        where: { id: inventory.id },
      });

      if (
        updatedInventory &&
        updatedInventory.stockLevel < updatedInventory.lowStockThreshold
      ) {
        await prisma.reorder.create({
          data: {
            inventoryId: updatedInventory.id,
            inventoryName: name,
            quantity:
              updatedInventory.lowStockThreshold - updatedInventory.stockLevel,
            arrivalDate: arrivalDate,
          },
        });
      }
    }

    if (remainingQuantity > 0) {
      const inventory = await prisma.inventory.findFirst({ where: { name } });

      if (!inventory) {
        throw new Error(`Inventory item "${name}" not found.`);
      }

      await prisma.reorder.create({
        data: {
          inventoryId: inventory.id,
          inventoryName: name,
          quantity: remainingQuantity,
          arrivalDate,
        },
      });
    }
  }
}

async function updateExperimentStatus(experimentId: bigint, timezone: string) {
  const experiment = await prisma.experiments.findUnique({
    where: { id: experimentId },
  });

  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const now = toZonedTime(new Date(), timezone);
  const zonedStart = toZonedTime(experiment.startDate, timezone);
  const zonedEnd = toZonedTime(experiment.endDate, timezone);

  let status = 'PENDING';
  if (now >= zonedStart && now <= zonedEnd) {
    status = 'ONGOING';
  } else if (now > zonedEnd) {
    status = 'COMPLETED';
  }

  await prisma.experiments.update({
    where: { id: experimentId },
    data: { status },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data: ExperimentData = await request.json();
    const { title, description, start, end, items, labRoomId } =
      validateExperimentData(data);

    await checkTimeslotConflicts(start, end, labRoomId);
    await processInventory(items, start);

    const newExperiment = await prisma.experiments.create({
      data: {
        title,
        description,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: 'PENDING',
        labRoomId,
      },
    });

    await updateExperimentStatus(newExperiment.id, 'UTC');

    return NextResponse.json(
      JSON.parse(JSON.stringify(newExperiment, bigIntReplacer)),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to process request',
        alternativeSlots: error.alternativeSlots,
      },
      { status: error.status || 500 }
    );
  }
}

export async function GET() {
  try {
    const experiments = await prisma.experiments.findMany({
      select: {
        startDate: true,
        endDate: true,
        title: true,
        description: true,
        status: true,
      },
    });

    return NextResponse.json(experiments, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Experiment ID is required' },
        { status: 400 }
      );
    }

    const experimentId = BigInt(id);
    const data: ExperimentData = await request.json();
    const { title, description, start, end, items, labRoomId } =
      validateExperimentData(data);

    await checkTimeslotConflicts(start, end, labRoomId);
    await processInventory(items, start);

    const updatedExperiment = await prisma.experiments.update({
      where: { id: experimentId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(start && { startDate: start.toISOString() }),
        ...(end && { endDate: end.toISOString() }),
      },
    });

    await updateExperimentStatus(updatedExperiment.id, 'UTC');

    return NextResponse.json(
      JSON.parse(JSON.stringify(updatedExperiment, bigIntReplacer)),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Failed to update experiment' },
      { status: 500 }
    );
  }
}
