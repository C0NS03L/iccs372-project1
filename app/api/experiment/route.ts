import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
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

  const missingFields = [];
  if (!title) missingFields.push('title');
  if (!description) missingFields.push('description');
  if (!startDate) missingFields.push('startDate');
  if (!endDate) missingFields.push('endDate');
  if (!items) missingFields.push('items');
  if (!labRoomId) missingFields.push('labRoomId');

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
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
    throw new Error('Timeslot conflict detected');
  }
}

export async function processInventory(
  items: InventoryItem[],
  experimentStartDate: Date
) {
  console.log('Processing inventory for experiment:', items);
  const arrivalDate = new Date(experimentStartDate);
  arrivalDate.setDate(arrivalDate.getDate() - 3);

  try {
    for (const { name, quantity } of items) {
      const inventoryItems = await prisma.inventory.findMany({
        where: { name },
        orderBy: { stockLevel: 'desc' },
      });

      let remainingQuantity = quantity;

      for (const inventory of inventoryItems) {
        if (remainingQuantity <= 0) {
          // Find existing reorder entry for this inventory item
          const existingReorder = await prisma.reorder.findFirst({
            where: {
              inventoryId: inventory.id,
              inventoryName: name,
            },
            orderBy: {
              arrivalDate: 'asc',
            },
          });

          // If there's an existing reorder, update its quantity
          if (existingReorder) {
            console.log(existingReorder);
            const newQuantity = Math.max(existingReorder.quantity + quantity);
            await prisma.reorder.update({
              where: {
                id: existingReorder.id,
              },
              data: {
                quantity: newQuantity,
              },
            });

            console.log('Updating reorder', name, 'NEWquantity', newQuantity);

            // If the new quantity is 0, we can delete the reorder entry
            if (newQuantity <= 0) {
              await prisma.reorder.delete({
                where: {
                  id: existingReorder.id,
                },
              });

              if (newQuantity < 0) {
                console.log('Returning', -newQuantity, 'of', name);
                await prisma.inventory.update({
                  where: { id: inventory.id },
                  data: { stockLevel: { increment: -newQuantity } },
                });
              }
            }
          }

          // Skip to next inventory item since we don't need any more quantity
          continue;
        }

        const allocated = Math.min(remainingQuantity, inventory.stockLevel);
        remainingQuantity -= allocated;

        console.log(
          'Allocating',
          allocated,
          'of',
          name,
          'from',
          inventory.name
        );

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
          console.log('Reordering', name, 'from', inventory.name);
          await prisma.reorder.create({
            data: {
              inventoryId: updatedInventory.id,
              inventoryName: name,
              quantity:
                updatedInventory.lowStockThreshold -
                updatedInventory.stockLevel,
              arrivalDate: arrivalDate,
            },
          });
        }
      }

      if (remainingQuantity > 0) {
        console.log('Reordering', remainingQuantity, 'of', name);
        const inventory = await prisma.inventory.findFirst({ where: { name } });

        if (!inventory) {
          throw new Error(`Inventory item "${name}" not found.`);
        }

        console.log('Reordering', name, 'amount', remainingQuantity);
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
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
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
        items: items as unknown as Prisma.JsonArray,
      },
    });

    await updateExperimentStatus(newExperiment.id, 'UTC');

    return NextResponse.json(
      JSON.parse(JSON.stringify(newExperiment, bigIntReplacer)),
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error);
      return NextResponse.json(
        { error: error.message || 'Failed to create experiment' },
        { status: 500 }
      );
    } else {
      console.error(error);
      return NextResponse.json(
        { error: 'Failed to create experiment' },
        { status: 500 }
      );
    }
  }
}

export async function GET() {
  try {
    const experiments = await prisma.experiments.findMany({
      select: {
        id: true,
        startDate: true,
        endDate: true,
        title: true,
        description: true,
        status: true,
        LabRoom: { select: { name: true } },
        items: true,
      },
    });

    return NextResponse.json(
      JSON.parse(JSON.stringify(experiments, bigIntReplacer)),
      { status: 200 }
    );
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
        ...(items && { items: items as unknown as Prisma.JsonArray }),
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
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update experiment',
      },
      { status: 500 }
    );
  }
}
