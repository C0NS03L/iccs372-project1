/*
  Warnings:

  - Added the required column `tasks` to the `Experiments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Experiments" ADD COLUMN     "tasks" JSONB NOT NULL;
