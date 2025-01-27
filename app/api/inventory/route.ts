import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { bigIntReplacer } from '@/app/lib/common';

const prisma = new PrismaClient();

interface InventoryItem {
  name: string;
  description: string;
  stockLevel: number;
  lowStockThreshold: number;
}

export async function POST(request: NextRequest) {
  try {
    const data: InventoryItem = await request.json();
    const { name, description, stockLevel, lowStockThreshold } = data;

    if (
      !name ||
      !description ||
      stockLevel === undefined ||
      lowStockThreshold === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newInventory = await prisma.inventory.create({
      data: {
        name,
        description,
        stockLevel,
        lowStockThreshold,
      },
    });

    const newInventoryWithStringId = JSON.parse(
      JSON.stringify(newInventory, bigIntReplacer)
    );
    return NextResponse.json(newInventoryWithStringId, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      select: {
        name: true,
        description: true,
        stockLevel: true,
        lowStockThreshold: true,
      },
    });

    const inventoryWithStringId = inventory.map((item) =>
      JSON.parse(JSON.stringify(item, bigIntReplacer))
    );

    return NextResponse.json(inventoryWithStringId, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { stockLevel } = await request.json();

    if (!id || stockLevel === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id: BigInt(id) },
      data: { stockLevel },
    });

    const updatedInventoryWithStringId = JSON.parse(
      JSON.stringify(updatedInventory, bigIntReplacer)
    );

    return NextResponse.json(updatedInventoryWithStringId, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}
