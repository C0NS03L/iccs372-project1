// pages/api/experiments.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const experiments = await prisma.experiments.findMany({
            select: {
                startDate: true,
                title: true,
            },
        });
        res.status(200).json(experiments);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch experiments' });
    }
}