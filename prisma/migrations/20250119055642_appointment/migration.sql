/*
  Warnings:

  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `experimentsId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_experimentId_fkey";

-- AlterTable
ALTER TABLE "Experiments" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "experimentsId" BIGINT NOT NULL,
ALTER COLUMN "completed" SET DEFAULT false;

-- DropTable
DROP TABLE "Booking";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_experimentsId_fkey" FOREIGN KEY ("experimentsId") REFERENCES "Experiments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
