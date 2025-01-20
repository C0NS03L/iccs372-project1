import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { bigIntReplacer } from '../../lib/common';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query_date = searchParams.get('query_date');

  if (!query_date) {
    return NextResponse.json(
      { error: 'query_date parameter is required' },
      { status: 400 }
    );
  }

  const date = new Date(query_date);

  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
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

  try {
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: startOfDayUtc,
          lte: endOfDayUtc,
        },
      },
    });

    const tasksWithIdAsString = JSON.parse(
      JSON.stringify(tasks, bigIntReplacer)
    );

    return NextResponse.json(tasksWithIdAsString, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks: ' + error.message },
      { status: 500 }
    );
  }
}
