import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const reorders = await prisma.reorder.findMany({
      select: {
        inventoryName: true,
        quantity: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json(reorders, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch reorders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { inventoryId, inventoryName, quantity } = data;

    if (!inventoryId || !inventoryName || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newReorder = await prisma.reorder.create({
      data: {
        inventoryId,
        inventoryName,
        quantity,
      },
    });

    return NextResponse.json(newReorder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create reorder' },
      { status: 500 }
    );
  }
}
