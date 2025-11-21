/*
  Warnings:

  - A unique constraint covering the columns `[userId,hash]` on the table `historial_muestras` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."historial_muestras" ADD COLUMN     "archivoResultado" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "historial_muestras_userId_hash_key" ON "public"."historial_muestras"("userId", "hash");
