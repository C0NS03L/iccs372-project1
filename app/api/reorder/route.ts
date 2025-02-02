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

  return reorders.map(
    ({ inventoryName, quantity, status, createdAt, arrivalDate }) => ({
      inventoryName,
      quantity,
      status,
      createdAt,
      arrivalDate,
    })
  );
}

async function getGroupedReorders() {
  const reorders = await prisma.reorder.groupBy({
    by: ['inventoryName'],
    _sum: { quantity: true },
    _max: { status: true, createdAt: true, arrivalDate: true },
  });

  return reorders.map(({ inventoryName, _sum, _max }) => ({
    inventoryName,
    quantity: _sum.quantity,
    status: _max.status,
    createdAt: _max.createdAt,
    arrivalDate: _max.arrivalDate,
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

    console.log(inventoryId, inventoryName, quantity);

    if (!inventoryId || !inventoryName || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const arrivalDate = new Date();
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
    const { id } = data;
    const { name, quantity, status } = data;

    if (!id && !name) {
      return NextResponse.json(
        { error: 'Reorder ID or Name is required' },
        { status: 400 }
      );
    }

    let updatedReorders;

    if (!id) {
      // Update all reorders with the given name
      updatedReorders = await prisma.reorder.updateMany({
        where: { inventoryName: name },
        data: { status },
      });

      if (updatedReorders.count === 0) {
        return NextResponse.json(
          { error: 'No reorders found' },
          { status: 404 }
        );
      }

      // Fetch the updated reorders to return
      const reorders = await prisma.reorder.findMany({
        where: { inventoryName: name },
      });

      return NextResponse.json(
        {
          message: `Updated ${updatedReorders.count} reorders`,
          reorders: JSON.parse(JSON.stringify(reorders, bigIntReplacer)),
        },
        { status: 200 }
      );
    } else {
      // Update single reorder by ID
      const updatedReorder = await prisma.reorder.update({
        where: { id: BigInt(id) },
        data: { quantity, status },
      });

      return NextResponse.json(
        JSON.parse(JSON.stringify(updatedReorder, bigIntReplacer)),
        { status: 200 }
      );
    }
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

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Reorder ID is required' },
        { status: 400 }
      );
    }

    const deletedReorder = await prisma.reorder.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json(
      JSON.parse(JSON.stringify(deletedReorder, bigIntReplacer)),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting reorder:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'Failed to delete reorder' },
      { status: 500 }
    );
  }
}
