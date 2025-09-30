/*
  Warnings:

  - You are about to drop the column `date` on the `historial_muestras` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."historial_muestras_userId_idx";

-- AlterTable
ALTER TABLE "public"."historial_muestras" DROP COLUMN "date",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "historial_muestras_userId_created_at_idx" ON "public"."historial_muestras"("userId", "created_at" DESC);
