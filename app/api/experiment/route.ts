import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { streamToString } from 'next/dist/server/stream-utils/node-web-streams-helper';

const prisma = new PrismaClient();

export type ExperimentAddRequest = {
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  tasks: never; // Assuming tasks is a JSON object
};

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

export async function POST(request: NextRequest) {
  try {
    const data = await streamToString(request.body);
    const {
      title,
      description,
      startDate,
      endDate,
      tasks,
    }: ExperimentAddRequest = JSON.parse(data);

    const newExperiment = await prisma.experiments.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tasks,
      },
    });

    // Convert BigInt fields to strings
    const experimentWithStringId = {
      ...newExperiment,
      id: newExperiment.id.toString(),
    };

    return NextResponse.json(experimentWithStringId, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to add experiment' + error },
      { status: 500 }
    );
  }
}
