/*
  Warnings:

  - You are about to drop the column `avaiable` on the `Inventory` table. All the data in the column will be lost.
  - Added the required column `tasks` to the `Experiments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experimentsId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Experiments" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tasks" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "avaiable",
ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maintenanceFrequencyDays" INTEGER,
ADD COLUMN     "nextMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "requiresMaintenance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stockLevel" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "experimentsId" BIGINT NOT NULL,
ALTER COLUMN "completed" SET DEFAULT false;

-- CreateTable
CREATE TABLE "MaintenanceTask" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "equipmentId" BIGINT NOT NULL,
    "frequencyDays" INTEGER NOT NULL,
    "lastPerformed" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_experimentsId_fkey" FOREIGN KEY ("experimentsId") REFERENCES "Experiments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
