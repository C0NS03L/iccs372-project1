import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { streamToString } from 'next/dist/server/stream-utils/node-web-streams-helper';
import { bigIntReplacer } from '../../lib/common';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const experiments = await prisma.experiments.findMany({
      select: {
        startDate: true,
        title: true,
      },
    });
    return NextResponse.json(experiments, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch experiments' + error },
      { status: 500 }
    );
  }
}

// appointment system

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await streamToString(request.body);
  const { title, description, experimentTask, startDate, endDate } =
    JSON.parse(data);

  if (!title || !description || !experimentTask || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return NextResponse.json(
      { error: 'Start date cannot be after end date' },
      { status: 400 }
    );
  }

  try {
    const conflicts = await prisma.experiments.findFirst({
      where: {
        OR: [
          {
            startDate: { lt: end },
            endDate: { gt: start },
          },
        ],
      },
    });

    if (conflicts) {
      return NextResponse.json(
        {
          error:
            'This time slot is already booked. Please select a different time.',
        },
        { status: 400 }
      );
    }

    const newExperiment = await prisma.experiments.create({
      data: {
        title,
        description,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        Task: {
          create: experimentTask.map(
            (task: { title: string; description: string }) => ({
              title: task.title,
              description: task.description,
              dueDate: startDate,
              category: 'EXPERIMENT',
            })
          ),
        },
      },
    });
    // Convert BigInt fields to strings
    const newExperimentWithStringId = JSON.parse(
      JSON.stringify(newExperiment, bigIntReplacer)
    );
    return NextResponse.json(newExperimentWithStringId, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to add experiment: ' + error.message },
      { status: 500 }
    );
  }
}
