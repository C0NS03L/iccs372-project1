import {NextResponse} from 'next/server';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export async function getTodayExperiments() {
    const today = new Date();
    const iso_today = today.toISOString();

    const experiments = await prisma.experiments.findMany({
        where: {
            startDate: {
                lte: iso_today,
            },
            endDate: {
                gte: iso_today,
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
    }))
}

export async function GET() {
    try {
        const today_experiment = await getTodayExperiments();
        const today_experiment_json = await today_experiment

        console.log('Today\'s experiments:', today_experiment_json);

        const tasks = today_experiment_json.map((experiment: { tasks: string }) => experiment.tasks);
        return NextResponse.json(tasks, {status: 200});
    } catch (error) {
        console.error('Error fetching experiments:', error);
        return NextResponse.json(
            {error: 'Failed to fetch experiments: ' + error.message},
            {status: 500}
        );
    }
}