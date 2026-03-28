/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Links` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `Links` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Links" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Links_slug_key" ON "Links"("slug");
