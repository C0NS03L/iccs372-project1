import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { title, description, completed } = req.body;

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

        res.status(201).json(taskWithStringId);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add task' + error});
    }
}