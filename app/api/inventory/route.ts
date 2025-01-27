import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { inventoryId, inventoryName, quantity} = data;

    if (!inventoryId || !inventoryName || !quantity  ) {
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

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { status, arrivalDate } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const reorderId = BigInt(id);

    const updatedReorder = await prisma.reorder.update({
      where: { id: reorderId },
      data: {
        status,
        ...(arrivalDate && { arrivalDate: new Date(arrivalDate) }),
      },
    });

    if (status === 'COMPLETED') {
      const reorder = await prisma.reorder.findUnique({
        where: { id: reorderId },
        include: { Inventory: true },
      });

      if (reorder) {
        await prisma.inventory.update({
          where: { id: reorder.inventoryId },
          data: { stockLevel: { increment: reorder.quantity } },
        });
      }
    }

    return NextResponse.json(updatedReorder, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update reorder' },
      { status: 500 }
    );
  }
}