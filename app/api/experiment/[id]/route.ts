import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processInventory } from '../helper';

const prisma = new PrismaClient();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json(
        { message: 'Invalid experiment ID: ' + id },
        { status: 400 }
      );
    }

    const experiment = await prisma.experiments.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!experiment) {
      return NextResponse.json(
        { message: 'Experiment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(experiment, (_, value) =>
          typeof value === 'bigint' ? Number(value) : value
        )
      )
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Invalid experiment ID: ' + id },
        { status: 400 }
      );
    }

    const oldExperiment = await prisma.experiments.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    const processInventoryData = data.items.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newItem: { id: any; quantity: number }) => {
        //@ts-expect-error stupid type error >:C
        const oldItem = oldExperiment?.items?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => item.id === newItem.id
        );

        // Calculate the difference in quantity
        // If oldItem exists, subtract its quantity from new quantity
        // If oldItem doesn't exist, use the full new quantity
        const quantityDifference = newItem.quantity - (oldItem?.quantity || 0);

        console.log('quantityDifference', quantityDifference);

        return {
          ...newItem,
          quantity: quantityDifference,
        };
      }
    );

    processInventory(processInventoryData, new Date(data.startDate));

    const experiment = await prisma.experiments.update({
      where: {
        id: parseInt(id),
      },
      data,
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(experiment, (_, value) =>
          typeof value === 'bigint' ? Number(value) : value
        )
      )
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json(
        { message: 'Invalid experiment ID: ' + id },
        { status: 400 }
      );
    }

    await prisma.experiments.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json({ message: 'Experiment deleted' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
