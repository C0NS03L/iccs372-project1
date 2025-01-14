import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // SELECT name, COUNT(*) as stock
    // FROM "Inventory"
    // GROUP BY name
    const inventory = await prisma.inventory.groupBy({
      by: ["name"],
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

    return NextResponse.json(formattedInventory);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory" + error },
      { status: 500 }
    );
  }
}
