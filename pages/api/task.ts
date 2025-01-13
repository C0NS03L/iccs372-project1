import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const todos = await prisma.task.findMany({
            select: {
                title: true,
                completed: true,
            },
        });
        res.status(200).json(todos);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch todos' + error });
    }
}
