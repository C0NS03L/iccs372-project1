/*
  Warnings:

  - Made the column `labRoomId` on table `Experiments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Experiments" ALTER COLUMN "labRoomId" SET NOT NULL;
