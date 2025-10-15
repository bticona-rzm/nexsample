// src/lib/datasetStore.ts

// ========================================================
// 🔹 Definiciones Globales y Tipos Compartidos
// ========================================================

// Cada fila del dataset puede tener cualquier estructura (columna -> valor)
export type RowData = Record<string, any>;

// Metadatos del dataset (tanto estándar como masivo)
export interface DatasetMeta {
  rows: RowData[];
  fileName?: string;
  format?: string;
  displayName?: string; // opcional si quieres usarlo más adelante
}

// ========================================================
// 🔹 Declaraciones globales (visibles en todo el proyecto)
// ========================================================
declare global {
  var datasetStore: Record<string, DatasetMeta> | undefined;
  var datasetStoreMasivo: Record<string, DatasetMeta> | undefined;
}

// ========================================================
// 🔹 Inicialización (solo se ejecuta una vez)
// ========================================================

// Evita redefinir si ya existe en memoria
if (!globalThis.datasetStore) globalThis.datasetStore = {};
if (!globalThis.datasetStoreMasivo) globalThis.datasetStoreMasivo = {};

// ========================================================
// 🔹 Exportaciones tipadas
// ========================================================
export const datasetStore = globalThis.datasetStore!;
export const datasetStoreMasivo = globalThis.datasetStoreMasivo!;

// ========================================================
// 🔹 Ejemplo de uso (en comentarios)
// ========================================================
//
// import { datasetStoreMasivo } from "@/lib/datasetStore";
//
// datasetStoreMasivo["id_123"] = {
//   rows: [{ nombre: "Ejemplo", valor: 10 }],
//   fileName: "archivo.csv",
//   format: "csv",
// };
//
// console.log(datasetStoreMasivo["id_123"].fileName); // "archivo.csv"
//
