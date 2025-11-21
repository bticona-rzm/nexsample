-- AlterTable
ALTER TABLE "public"."historial_muestras" ADD COLUMN     "controlField" TEXT,
ADD COLUMN     "controlTotal" TEXT,
ADD COLUMN     "executionTimeMs" INTEGER,
ADD COLUMN     "indicesJson" JSONB,
ADD COLUMN     "randomAlgorithm" TEXT,
ADD COLUMN     "rangeEnd" INTEGER,
ADD COLUMN     "rangeStart" INTEGER,
ADD COLUMN     "sourceDatasetId" TEXT,
ADD COLUMN     "totalRecords" INTEGER;

-- CreateTable
CREATE TABLE "public"."historial_import" (
    "id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombreArchivo" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "tamanoBytes" INTEGER,
    "tipoMime" TEXT,
    "origenDatos" TEXT,
    "nombreHoja" TEXT,
    "tieneEncabezados" BOOLEAN,
    "delimitadorDetectado" TEXT,
    "previewInicio" INTEGER,
    "previewFin" INTEGER,
    "registrosTotales" INTEGER NOT NULL,
    "datasetId" TEXT,
    "metadata" JSONB,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "historial_import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historial_export" (
    "id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombreExportado" TEXT NOT NULL,
    "rutaExportacion" TEXT NOT NULL,
    "formatoExportacion" TEXT NOT NULL,
    "rangoInicio" INTEGER NOT NULL,
    "rangoFin" INTEGER NOT NULL,
    "registrosExportados" INTEGER NOT NULL,
    "muestraId" TEXT,
    "archivoFuenteNombre" TEXT,
    "metadata" JSONB,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "historial_export_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."historial_import" ADD CONSTRAINT "historial_import_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historial_export" ADD CONSTRAINT "historial_export_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
