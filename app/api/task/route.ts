import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type TaskAddRequest = {
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
};

export async function GET() {
  try {
    const todos = await prisma.task.findMany({
      select: {
        title: true,
        completed: true,
      },
    });
    return NextResponse.json(todos, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch todos' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await streamToString(request.body);
    const { title, description, completed, dueDate }: TaskAddRequest =
      JSON.parse(data);

    // If dueDate is not provided, set it to end of current day (2025-01-28 23:59:59)
    const taskDueDate = dueDate
      ? new Date(dueDate)
      : new Date(
          Date.UTC(
            2025, // year
            0, // month (0-based, so 0 is January)
            28, // day
            23, // hours
            59, // minutes
            59 // seconds
          )
        );

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        completed,
        category: 'GENERAL',
        dueDate: taskDueDate,
      },
    });

    // Convert BigInt fields to strings
    const taskWithStringId = {
      ...newTask,
      id: newTask.id.toString(),
    };

    return NextResponse.json(taskWithStringId, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to add task' + error },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function streamToString(stream: any) {
  //The Next body is stupid dont mind the any type
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
