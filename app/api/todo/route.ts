import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTodayExperiments() {
  const today = new Date();

  // Prisma stores dates in UTC, so we need to use today's date to UTC
  const startOfDayUtc = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      0,
      0,
      0
    )
  );
  const endOfDayUtc = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      23,
      59,
      59
    )
  );

  const experiments = await prisma.experiments.findMany({
    where: {
      startDate: {
        lte: endOfDayUtc,
      },
      endDate: {
        gte: startOfDayUtc,
      },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      title: true,
      tasks: true,
    },
  });

  return experiments.map((experiment) => ({
    ...experiment,
    id: experiment.id.toString(),
  }));
}
export async function GET() {
  try {
    const today_experiment_json = await getTodayExperiments();

    console.log("Today's experiments:", today_experiment_json);

    const tasks = today_experiment_json
      .map((experiment) => experiment.tasks)
      .flat();
    console.log('Tasks:', tasks);
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch experiments: ' + error.message },
      { status: 500 }
    );
  }
}
