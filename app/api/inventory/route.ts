import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { streamToString } from 'next/dist/server/stream-utils/node-web-streams-helper';
import { bigIntReplacer } from '../../lib/common';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    if (!request.body) {
      throw new Error('Request body is empty');
    }

    const data = await streamToString(request.body);
    const {
      name,
      description,
      available,
      stockLevel,
      lowStockThreshold,
      maintenanceTasks,
    } = JSON.parse(data);

    // Validate required fields
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid or missing "name" field');
    }
    if (!description || typeof description !== 'string') {
      throw new Error('Invalid or missing "description" field');
    }
    if (available === undefined || typeof available !== 'boolean') {
      throw new Error('Invalid or missing "available" field');
    }
    if (
      stockLevel === undefined ||
      typeof stockLevel !== 'number' ||
      stockLevel < 0
    ) {
      throw new Error(
        '"stockLevel" must be a non-negative number and is required'
      );
    }
    if (
      lowStockThreshold === undefined ||
      typeof lowStockThreshold !== 'number' ||
      lowStockThreshold < 0
    ) {
      throw new Error(
        '"lowStockThreshold" must be a non-negative number and is required'
      );
    }

    // Validate maintenanceTasks
    if (!Array.isArray(maintenanceTasks)) {
      throw new Error('Invalid or missing "maintenanceTasks" field');
    }
    maintenanceTasks.forEach((task, index) => {
      if (
        !task ||
        typeof task.title !== 'string' ||
        typeof task.description !== 'string' ||
        typeof task.frequencyDays !== 'number' ||
        task.frequencyDays <= 0
      ) {
        throw new Error(
          `Invalid task at index ${index}: "title", "description", and "frequencyDays" are required, and "frequencyDays" must be greater than 0`
        );
      }
    });

    // Create new inventory item
    const newInventoryItem = await prisma.inventory.create({
      data: {
        name,
        description,
        available,
        stockLevel,
        lowStockThreshold,
        Task: {
          create: maintenanceTasks.map((task) => ({
            title: task.title,
            description: task.description,
            frequencyDays: task.frequencyDays,
            dueDate: new Date(
              Date.now() + task.frequencyDays * 24 * 60 * 60 * 1000
            ),
            category: 'MAINTENANCE',
          })),
        },
      },
    });

    // Format output to handle BigInt serialization
    const newInventoryItemWithStringId = JSON.parse(
      JSON.stringify(newInventoryItem, bigIntReplacer)
    );

    console.log(newInventoryItemWithStringId);

    return NextResponse.json(newInventoryItemWithStringId, { status: 201 });
  } catch (error) {
    console.error('Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to add inventory item: ' + error.message },
      { status: 500 }
    );
  }
}
