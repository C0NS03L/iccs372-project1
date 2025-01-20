import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { streamToString } from 'next/dist/server/stream-utils/node-web-streams-helper';
import { bigIntReplacer } from '../../lib/common';

const prisma = new PrismaClient();

export async function GET() {

  try{
    const inventory = await prisma.inventory.groupBy({
      by: ['name'],
      _count: {
        name: true,
      },
    });
    // format the inventory data to {name: string, stock: number}[]
    const formattedInventory = inventory.map(
      (item: { name: string; _count: { name: number } }) => ({
        name: item.name,
        stock: item._count.name,
      })
    );

    return NextResponse.json(formattedInventory);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const data = await streamToString(request.body);
    const {
      name,
      description,
      available,
      stockLevel,
      lowStockThreshold,
      maintenanceTasks,
    } = JSON.parse(data);

    const newInventoryItem = await prisma.inventory.create({
      data: {
        name,
        description,
        available,
        stockLevel,
        lowStockThreshold,
        Task: {
          create: maintenanceTasks.map(
            (task: {
              title: string;
              description: string;
              frequencyDays: number;
            }) => ({
              title: task.title,
              description: task.description,
              frequencyDays: task.frequencyDays,
              dueDate: new Date(
                Date.now() + task.frequencyDays * 24 * 60 * 60 * 1000
              ),
              category:'MAINTENANCE',
            })
          ),
        },
      },
    });
    const newInventoryItemWithStringId = JSON.parse(
      JSON.stringify(newInventoryItem, bigIntReplacer)
    );

    console.log(newInventoryItemWithStringId);

    return NextResponse.json(newInventoryItemWithStringId, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add inventory item: ' + error.message },
      { status: 500 }
    );
  }
}
