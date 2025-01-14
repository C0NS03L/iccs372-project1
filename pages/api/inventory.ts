// pages/api/inventory.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // SELECT name, COUNT(*) as stock
    // FROM "Inventory"
    // GROUP BY name
    const inventory = await prisma.inventory.groupBy({
      by: ['name'],
      _count: {
        name: true,
      },
    });
    // format the inventory data to {name: string, stock: number}[]
    const formattedInventory = inventory.map(
      (item: { name: string; _count: { name: number } }) => ({
        name: item.name,
        stock: item._count.name,
      })
    );

    res.status(200).json(formattedInventory);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
}
