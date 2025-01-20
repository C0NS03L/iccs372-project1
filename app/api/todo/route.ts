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

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { taskId, completed } = data;

    if (!taskId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid or missing taskId or completed status' },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: BigInt(taskId) },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updates: {
      completed?: boolean;
      lastPerformed?: Date;
      dueDate?: Date;
    } = { completed };

    if (task.category === 'MAINTENANCE' && completed) {
      const now = new Date();
      updates.lastPerformed = now;
      if (typeof task.frequencyDays === 'number' && task.frequencyDays > 0) {
        const currentDueDate = new Date(task.dueDate);
        console.log('Current due date:', currentDueDate);
        const futureDueDate = new Date(currentDueDate);
        futureDueDate.setDate(currentDueDate.getDate() + task.frequencyDays);
        updates.dueDate = futureDueDate;
        console.log('Updated due date to:', futureDueDate);
      } else {
        console.log('frequencyDays is not defined or invalid');
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: BigInt(taskId) },
      data: updates,
    });

    const updatedTaskWithStringId = JSON.parse(
      JSON.stringify(updatedTask, bigIntReplacer)
    );

    return NextResponse.json(updatedTaskWithStringId, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update task: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
