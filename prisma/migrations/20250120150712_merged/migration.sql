/*
  Warnings:

  - You are about to drop the column `avaiable` on the `Inventory` table. All the data in the column will be lost.
  - Added the required column `category` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('MAINTENANCE', 'EXPERIMENT', 'GENERAL');

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_experimentsId_fkey";

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "avaiable",
ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "nextMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "stockLevel" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "category" "TaskCategory" NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "equipmentId" BIGINT,
ADD COLUMN     "frequencyDays" INTEGER,
ADD COLUMN     "lastPerformed" TIMESTAMP(3),
ALTER COLUMN "experimentsId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_experimentsId_fkey" FOREIGN KEY ("experimentsId") REFERENCES "Experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
