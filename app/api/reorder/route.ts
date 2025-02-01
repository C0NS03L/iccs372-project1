import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { bigIntReplacer } from '@/app/lib/common';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const reorders = await prisma.reorder.groupBy({
      by: ['inventoryName'],
      _sum: {
        quantity: true,
      },
      _max: {
        status: true,
        createdAt: true,
      },
    });

    const formattedReorders = reorders.map((reorder) => ({
      inventoryName: reorder.inventoryName,
      quantity: reorder._sum.quantity,
      status: reorder._max.status,
      createdAt: reorder._max.createdAt,
    }));

    // use bigInt replacer
    return NextResponse.json(formattedReorders, { status: 200 });
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

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 3);

    const newReorder = await prisma.reorder.create({
      data: {
        inventoryId,
        inventoryName,
        quantity,
        arrivalDate,
      },
    });

    const newReorderWithStringId = JSON.parse(
      JSON.stringify(newReorder, bigIntReplacer)
    );

    return NextResponse.json(newReorderWithStringId, { status: 201 });
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
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Reorder ID is required' },
        { status: 400 }
      );
    }

    const reorderId = BigInt(id);

    const updatedReorder = await prisma.reorder.update({
      where: { id: reorderId },
      data,
    });

    return NextResponse.json(updatedReorder, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update reorder' },
      { status: 500 }
    );
  }
}
