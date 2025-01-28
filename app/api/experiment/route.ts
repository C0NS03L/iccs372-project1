import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { bigIntReplacer } from '@/app/lib/common';
import { toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();

interface ExperimentData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  items: InventoryItem[];
}

function validateExperimentData(data: ExperimentData) {
  const { title, description, startDate, endDate, items } = data;

  if (
    !title ||
    !description ||
    !startDate ||
    !endDate ||
    !Array.isArray(items)
  ) {
    throw new Error('Missing required fields or invalid format');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new Error('Start date cannot be after end date');
  }

  return { title, description, start, end, items };
}

async function checkTimeslotConflicts(start: Date, end: Date) {
  const conflict = await prisma.experiments.findFirst({
    where: {
      OR: [
        {
          startDate: { lt: end },
          endDate: { gt: start },
        },
      ],
    },
  });

  if (conflict) {
    const alternativeSlots = await prisma.experiments.findMany({
      select: { startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
      take: 3,
    });

    return NextResponse.json(
      {
        error: 'Timeslot conflicts with existing experiment',
        alternativeSlots,
      },
      { status: 409 }
    );
  }
}

interface InventoryItem {
  name: string;
  quantity: number;
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
      console.log(`Allocated ${allocated} of ${name} from ${inventory.name}`);

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
            arrivalDate,
          },
        });
        console.log(`Reordered ${name} for ${updatedInventory.name}`);
      }
    }

    if (remainingQuantity > 0) {
      const inventory = await prisma.inventory.findFirst({
        where: { name },
      });

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

interface CustomError extends Error {
  status?: number;
  alternativeSlots?: never[];
}

async function updateExperimentStatus(experimentId: bigint, timezone: string) {
  const experiment = await prisma.experiments.findUnique({
    where: { id: experimentId },
  });

  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const zonedStart = toZonedTime(experiment.startDate, timezone);
  const zonedEnd = toZonedTime(experiment.endDate, timezone);

  let status = 'PENDING';
  if (zonedNow >= zonedStart && zonedNow <= zonedEnd) {
    status = 'ONGOING';
  } else if (zonedNow > zonedEnd) {
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
    const { title, description, start, end, items } =
      validateExperimentData(data);

    await checkTimeslotConflicts(start, end);
    await processInventory(items);

    const newExperiment = await prisma.experiments.create({
      data: {
        title,
        description,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });

    await updateExperimentStatus(newExperiment.id, 'UTC'); // Update status based on timezone

    const response = JSON.parse(JSON.stringify(newExperiment, bigIntReplacer));

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const customError = error as CustomError;
      if (customError.status) {
        return NextResponse.json(
          {
            error: customError.message,
            ...(customError.alternativeSlots && {
              alternativeSlots: customError.alternativeSlots,
            }),
          },
          { status: customError.status }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process request: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const experiments = await prisma.experiments.findMany({
      select: {
        startDate: true,
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
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Experiment ID is required' },
        { status: 400 }
      );
    }

    const experimentId = BigInt(id);

    const { title, description, start, end, items } =
      validateExperimentData(data);

    if (start || end) {
      await checkTimeslotConflicts(start, end);
    }

    if (items && items.length > 0) {
      await processInventory(items);
    }

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

    const response = JSON.parse(
      JSON.stringify(updatedExperiment, bigIntReplacer)
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update experiment: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
