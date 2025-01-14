// app/api/experiment/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
      { error: "Failed to fetch experiments" + error },
      { status: 500 }
    );
  }
}
