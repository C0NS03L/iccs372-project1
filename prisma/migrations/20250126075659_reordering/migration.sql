/*
  Warnings:

  - Added the required column `inventoryName` to the `Reorder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reorder" ADD COLUMN     "inventoryName" TEXT NOT NULL;
