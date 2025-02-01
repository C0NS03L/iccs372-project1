/*
  Warnings:

  - Added the required column `labRoomId` to the `Experiments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Experiments" ADD COLUMN "labRoomId" BIGINT;



-- CreateTable
CREATE TABLE "LabRoom" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabRoom_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Experiments" ADD CONSTRAINT "Experiments_labRoomId_fkey" FOREIGN KEY ("labRoomId") REFERENCES "LabRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
