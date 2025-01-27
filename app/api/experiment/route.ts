import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { bigIntReplacer } from '@/app/lib/common';

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

/**
 * Checks for timeslot conflicts and suggests alternative slots if conflicts exist.
 */
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

async function processInventory(items: InventoryItem[]) {
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

      // Check if stock level falls below the low stock threshold
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
        },
      });
    }
  }
}

interface CustomError extends Error {
  status?: number;
  alternativeSlots?: never[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data: ExperimentData = await request.json();
    const { title, description, start, end, items } = validateExperimentData(data);

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
/**
 * GET handler for fetching experiments.
 */
export async function GET() {
  try {
    const experiments = await prisma.experiments.findMany({
      select: {
        startDate: true,
        title: true,
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
