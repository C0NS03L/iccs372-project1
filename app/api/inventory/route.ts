import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { streamToString } from 'next/dist/server/stream-utils/node-web-streams-helper';
import { bigIntReplacer } from '../../lib/common';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const inventoryItems = await prisma.inventory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        stockLevel: true,
        lowStockThreshold: true,
      },
    });

    const response = JSON.parse(JSON.stringify(inventoryItems, bigIntReplacer));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory items: ' + error.message },
      { status: 500 }
    );
  }
}

async function createInventoryItem(data: never) {
  const { name, description, stockLevel, lowStockThreshold } = data;

  return prisma.inventory.create({
    data: {
      name,
      description,
      stockLevel,
      lowStockThreshold,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return NextResponse.json(
        { error: 'Missing request body' },
        { status: 400 }
      );
    }

    const data = await streamToString(request.body);
    const parsedData = JSON.parse(data);

    const newInventoryItem = await createInventoryItem(parsedData);

    const response = JSON.parse(
      JSON.stringify(newInventoryItem, bigIntReplacer)
    );

    console.log(response);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to add inventory item: ' + error.message },
      { status: 500 }
    );
  }
}


// function to add stocks to inventory using PUT and url parameter
async function updateInventoryItemStock(id: string, stockLevel: number) {
  return prisma.inventory.update({
    where: {
      id: parseInt(id),
    },
    data: {
      stockLevel: {
        increment: stockLevel,
      },
    },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { stockLevel } = await request.json();

    if (!id || !stockLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedInventoryItem = await updateInventoryItemStock(id, stockLevel);

    const response = JSON.parse(
      JSON.stringify(updatedInventoryItem, bigIntReplacer)
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update inventory item: ' + error.message },
      { status: 500 }
    );
  }
}
