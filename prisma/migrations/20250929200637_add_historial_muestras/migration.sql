-- CreateTable
CREATE TABLE "public"."historial_muestras" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "records" INTEGER NOT NULL,
    "range" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "allowDuplicates" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "historial_muestras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historial_muestras_userId_idx" ON "public"."historial_muestras"("userId");

-- AddForeignKey
ALTER TABLE "public"."historial_muestras" ADD CONSTRAINT "historial_muestras_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
