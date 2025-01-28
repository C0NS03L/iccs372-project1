/*
  Warnings:

  - You are about to drop the column `completed` on the `Experiments` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Experiments` table. All the data in the column will be lost.
  - You are about to drop the column `available` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `nextMaintenanceDate` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `equipmentId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `frequencyDays` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `lastPerformed` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `ExperimentEquipmentUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExperimentEquipmentUsage" DROP CONSTRAINT "ExperimentEquipmentUsage_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "ExperimentEquipmentUsage" DROP CONSTRAINT "ExperimentEquipmentUsage_experimentId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_equipmentId_fkey";

-- AlterTable
ALTER TABLE "Experiments" DROP COLUMN "completed",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "available",
DROP COLUMN "nextMaintenanceDate";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "equipmentId",
DROP COLUMN "frequencyDays",
DROP COLUMN "lastPerformed";

-- DropTable
DROP TABLE "ExperimentEquipmentUsage";

-- DropEnum
DROP TYPE "ExperimentStatus";

-- CreateTable
CREATE TABLE "Reorder" (
    "id" BIGSERIAL NOT NULL,
    "inventoryId" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reorder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reorder" ADD CONSTRAINT "Reorder_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
