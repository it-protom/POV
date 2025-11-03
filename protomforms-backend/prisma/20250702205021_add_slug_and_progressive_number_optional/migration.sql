/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "progressiveNumber" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");
