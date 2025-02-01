import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface InventoryItem {
  name: string;
  quantity: number;
}

export async function processInventory(
  items: InventoryItem[],
  experimentStartDate: Date
) {
  const arrivalDate = new Date(experimentStartDate);
  arrivalDate.setDate(arrivalDate.getDate() - 3);

  try {
    for (const { name, quantity } of items) {
      const inventoryItems = await prisma.inventory.findMany({
        where: { name },
        orderBy: { stockLevel: 'desc' },
      });

      let remainingQuantity = quantity;

      for (const inventory of inventoryItems) {
        if (remainingQuantity <= 0) {
          // Find existing reorder entry for this inventory item
          const existingReorder = await prisma.reorder.findFirst({
            where: {
              inventoryId: inventory.id,
              inventoryName: name,
            },
            orderBy: {
              arrivalDate: 'asc',
            },
          });

          // If there's an existing reorder, update its quantity
          if (existingReorder) {
            const newQuantity = Math.max(existingReorder.quantity + quantity);
            await prisma.reorder.update({
              where: {
                id: existingReorder.id,
              },
              data: {
                quantity: newQuantity,
              },
            });

            // If the new quantity is 0, we can delete the reorder entry
            if (newQuantity <= 0) {
              await prisma.reorder.delete({
                where: {
                  id: existingReorder.id,
                },
              });

              if (newQuantity < 0) {
                await prisma.inventory.update({
                  where: { id: inventory.id },
                  data: { stockLevel: { increment: -newQuantity } },
                });
              }
            }
          }

          // Skip to next inventory item since we don't need any more quantity
          continue;
        }

        const allocated = Math.min(remainingQuantity, inventory.stockLevel);
        remainingQuantity -= allocated;

        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { stockLevel: { decrement: allocated } },
        });

        const updatedInventory = await prisma.inventory.findUnique({
          where: { id: inventory.id },
        });

        if (
          updatedInventory &&
          updatedInventory.stockLevel < updatedInventory.lowStockThreshold
        ) {
          await prisma.reorder.create({
            data: {
              inventoryId: updatedInventory.id,
              inventoryName: name,
              quantity:
                updatedInventory.lowStockThreshold -
                updatedInventory.stockLevel,
              arrivalDate: arrivalDate,
            },
          });
        }
      }

      if (remainingQuantity > 0) {
        const inventory = await prisma.inventory.findFirst({ where: { name } });

        if (!inventory) {
          throw new Error(`Inventory item "${name}" not found.`);
        }

        await prisma.reorder.create({
          data: {
            inventoryId: inventory.id,
            inventoryName: name,
            quantity: remainingQuantity,
            arrivalDate,
          },
        });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
  }
}
