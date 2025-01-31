import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bigIntSerializer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export async function GET() {
  try {
    const reorders = await prisma.reorder.findMany({
      select: {
        id: true,
        inventoryId: true,
        inventoryName: true,
        quantity: true,
        status: true,
        arrivalDate: true,
      },
    });

    const serializedReorders = JSON.parse(
      JSON.stringify(reorders, bigIntSerializer)
    );

    return NextResponse.json(serializedReorders, { status: 200 });
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

    const arrivalDate = new Date('2025-01-28 15:52:20');
    arrivalDate.setDate(arrivalDate.getDate() + 3);

    const newReorder = await prisma.reorder.create({
      data: {
        inventoryId: BigInt(inventoryId),
        inventoryName,
        quantity,
        arrivalDate,
        status: 'PENDING',
      },
    });

    const serializedNewReorder = JSON.parse(
      JSON.stringify(newReorder, bigIntSerializer)
    );

    return NextResponse.json(serializedNewReorder, { status: 201 });
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
    const data = await request.json();
    const { id, quantity, status } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Reorder ID is required' },
        { status: 400 }
      );
    }

    const reorderId = BigInt(id);

    const updatedReorder = await prisma.reorder.update({
      where: { id: reorderId },
      data: {
        status,
        quantity,
        updatedAt: new Date(),
      },
    });

    const serializedUpdatedReorder = JSON.parse(
      JSON.stringify(updatedReorder, bigIntSerializer)
    );

    return NextResponse.json(serializedUpdatedReorder, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating reorder:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'Failed to update reorder' },
      { status: 500 }
    );
  }
}
