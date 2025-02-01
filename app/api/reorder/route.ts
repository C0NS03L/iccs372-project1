import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { bigIntReplacer } from '@/app/lib/common';

const prisma = new PrismaClient();

async function getReordersByArrivalDate(arrivalDate: string | number | Date) {
  const date = new Date(arrivalDate);
  if (isNaN(date.getTime())) {
    return { error: 'Invalid date format', status: 400 };
  }

  const startOfDayUtc = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0
    )
  );
  const endOfDayUtc = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59
    )
  );

  const reorders = await prisma.reorder.findMany({
    where: { arrivalDate: { gte: startOfDayUtc, lte: endOfDayUtc } },
    orderBy: { createdAt: 'desc' },
  });

  return reorders.map(({ inventoryName, quantity, status, createdAt }) => ({
    inventoryName,
    quantity,
    status,
    createdAt,
  }));
}

async function getGroupedReorders() {
  const reorders = await prisma.reorder.groupBy({
    by: ['inventoryName'],
    _sum: { quantity: true },
    _max: { status: true, createdAt: true },
  });

  return reorders.map(({ inventoryName, _sum, _max }) => ({
    inventoryName,
    quantity: _sum.quantity,
    status: _max.status,
    createdAt: _max.createdAt,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const arrivalDate = searchParams.get('arrival_date');
    const data = arrivalDate
      ? await getReordersByArrivalDate(arrivalDate)
      : await getGroupedReorders();

    if (!Array.isArray(data) && 'error' in data)
      return NextResponse.json(data, { status: data.status });
    return NextResponse.json(JSON.parse(JSON.stringify(data, bigIntReplacer)), {
      status: 200,
    });
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
    const { inventoryId, inventoryName, quantity } = await request.json();

    if (!inventoryId || !inventoryName || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const arrivalDate = new Date('2025-01-28 15:52:20');
    arrivalDate.setDate(arrivalDate.getDate() + 3);

    const newReorder = await prisma.reorder.create({
      data: { inventoryId, inventoryName, quantity, arrivalDate },
    });

    return NextResponse.json(
      JSON.parse(JSON.stringify(newReorder, bigIntReplacer)),
      { status: 201 }
    );
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

    const updatedReorder = await prisma.reorder.update({
      where: { id: BigInt(id) },
      data: { quantity, status },
    });

    const serializedUpdatedReorder = JSON.parse(
      JSON.stringify(updatedReorder, bigIntReplacer)
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
