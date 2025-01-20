import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type TaskAddRequest = {
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

export async function POST(request: NextRequest) {
  try {
    const data = await streamToString(request.body);
    const { title, description, completed }: TaskAddRequest = JSON.parse(data);

    // console.log('Title: ' + title);
    // console.log('Description: ' + description);
    // console.log('Completed: ' + completed);

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        completed,
        category: 'GENERAL',
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
