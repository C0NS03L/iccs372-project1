import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TaskAddRequest = {
  title: string;
  description: string;
  completed: boolean;
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

export async function POST(request: TaskAddRequest) {
  try {
    const { title, description, completed } = request;

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        completed,
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
    NextResponse.json({ error: 'Failed to add task' + error }, { status: 500 });
  }
}
