// src/lib/types.ts

// Se importa directamente desde el cliente de Prisma, la única fuente de la verdad.
import type { User as PrismaUser } from '@prisma/client';
import { Role as PrismaRole } from '@prisma/client';

// Re-exportamos el enum Role para usarlo en toda la aplicación cliente.
export const Role = PrismaRole;
export type Role = PrismaRole;

// Exportamos el tipo User generado por Prisma.
// Esto evita tener que mantener una interfaz manual y asegura que siempre esté sincronizado.
export type User = PrismaUser;


// Esta interfaz es para el lado del cliente.

export interface Documento {
  id: number;
  carpeta: string | null;
  name: string;
  date: string; 
  isIndexed: boolean;
  // Se permite que estos campos sean nulos para coincidir con el esquema de Prisma.
  filePath: string | null;
  fileHash?: string | null; // Añadido para consistencia
  file?: File;
}

// El tipo para los grupos que se usan en la página y el componente.
export type GrupoDeDocumentos = {
  carpeta: string;
  documentos: Documento[];
};


// Usamos esto para los setters de estado
type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

// 1. Tipo para una fila genérica de los datos de Excel
export interface ExcelRow {
    [key: string]: any;
}

// 2. Interfaz para las propiedades del componente Extraction
export interface ExtractionProps {
    // Props relacionadas con la planificación/carga
    isPlanificacionDone: boolean;
    excelData: ExcelRow[];
    headers: string[];
    sampleInterval: number;
    estimatedSampleSize: number;
    estimatedPopulationValue: number;
    populationRecords: number;
    selectedFieldFromPlanificacion: string | null;

    // Estados y Setters de la extracción
    extractionType: "intervaloFijo" | "seleccionCelda";
    setExtractionType: SetState<"intervaloFijo" | "seleccionCelda">;

    highValueManagement: "agregados" | "separado";
    setHighValueManagement: SetState<"agregados" | "separado">;

    // Parámetros de Extracción
    sampleField: string | null;
    setSampleField: SetState<string | null>;
    
    randomStartPoint: number;
    setRandomStartPoint: SetState<number>;

    // Gestión de Valores Altos
    modifyHighValueLimit: boolean;
    setModifyHighValueLimit: SetState<boolean>;
    
    highValueLimit: number;
    setHighValueLimit: SetState<number>;

    highValueCount: number;
    setHighValueCount: SetState<number>;

    // Nombres de archivos
    extractionFilename: string;
    highValueFilename: string;
    setHighValueFilename: SetState<string>; // Este setter estaba faltando en tu lista de errores pero es lógico

    // Control de flujo
    setIsExtraccionDone: SetState<boolean>;
    setActiveTab: SetState<string>; // Asumiendo que las pestañas se manejan con strings
}

// 3. Tipos para el payload del API (se mantiene por si lo usas en route.ts)
export interface ExtractionPayload {
    excelData: ExcelRow[];
    estimatedSampleSize: number;
    sampleInterval: number;
    highValueLimit: number;
    highValueManagement: "agregados" | "separado";
    sampleField: string;
    randomStartPoint: number;
    estimatedPopulationValue: number;
    extractionType: "intervaloFijo" | "seleccionCelda";
    extractionFilename: string;
    highValueFilename: string;
}

// 4. Tipos para los parámetros del payload del API de Planificación (opcional pero útil)
export interface PlanificacionPayload {
    estimatedPopulationValue: number;
    confidenceLevel: 90 | 95 | 99;
    // ... otros parámetros del API
}

// 5. Tipos para los parámetros del payload del API de Extracción
export interface ExtractionPayload {
    excelData: ExcelRow[];
    estimatedSampleSize: number;
    sampleInterval: number;
    highValueLimit: number;
    highValueManagement: "agregados" | "separado";
    sampleField: string;
    randomStartPoint: number;
    estimatedPopulationValue: number;
    extractionType: "intervaloFijo" | "seleccionCelda";
    extractionFilename: string;
    highValueFilename: string;
}

export interface EvaluationResult {
    // ... otras propiedades que ya existan
    
    // Propiedades que TypeScript dice que faltan:
    sampleDeviationRate: number; 
    unilateralUpperLimit: number;
    bilateralLowerLimit: number;
    bilateralUpperLimit: number;
}

export interface PlanificationDataType {
    populationSize: number;
    expectedDeviation: number;
    tolerableDeviation: number;
    confidenceLevel: number;
    alphaConfidenceLevel: number;
    controlType: string;
}