/*
  Warnings:

  - You are about to drop the column `maintenanceFrequencyDays` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `requiresMaintenance` on the `Inventory` table. All the data in the column will be lost.
  - Added the required column `dueDate` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_experimentsId_fkey";

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "maintenanceFrequencyDays",
DROP COLUMN "requiresMaintenance";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "equipmentId" BIGINT,
ALTER COLUMN "experimentsId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_experimentsId_fkey" FOREIGN KEY ("experimentsId") REFERENCES "Experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
