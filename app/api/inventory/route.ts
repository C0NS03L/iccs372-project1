import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { bigIntReplacer } from '@/app/lib/common';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, stockLevel, lowStockThreshold, unit } = data;

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
        unit: unit || 'units',
      },
    });

    const newInventoryStringId = JSON.parse(
      JSON.stringify(newInventory, bigIntReplacer)
    );

    return NextResponse.json(newInventoryStringId, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create inventory' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const inventoryItems = await prisma.inventory.findMany();
    const newInventoryItems = JSON.parse(
      JSON.stringify(inventoryItems, bigIntReplacer)
    );

    return NextResponse.json(newInventoryItems, { status: 200 });
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
    const data = await request.json();
    let { id } = data;
    const { name, ...updateData } = data;

    if (!id && !name) {
      return NextResponse.json(
        { error: 'Inventory ID or Name is required' },
        { status: 400 }
      );
    }

    if (!id) {
      const inventory = await prisma.inventory.findFirst({
        where: { name },
      });
      if (!inventory) {
        return NextResponse.json(
          { error: 'Inventory not found' },
          { status: 404 }
        );
      }
      id = inventory.id;
    }

    const inventoryId = BigInt(id);

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: updateData,
    });

    const updatedInventoryStringId = JSON.parse(
      JSON.stringify(updatedInventory, bigIntReplacer)
    );

    return NextResponse.json(updatedInventoryStringId, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    const inventoryId = BigInt(id);

    await prisma.inventory.delete({
      where: { id: inventoryId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
