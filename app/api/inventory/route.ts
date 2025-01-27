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

    const response = JSON.parse(
      JSON.stringify(inventoryItems, bigIntReplacer)
    );

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
