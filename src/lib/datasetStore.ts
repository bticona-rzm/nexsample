// ========================================================
// 🔹 Definiciones Globales y Tipos Compartidos
// ========================================================
export type RowData = Record<string, any>;

export interface DatasetMeta {
  rows: RowData[];
  fileName?: string;
  displayName?: string;
  format?: string;
  totalRows?: number;   //  agregado
  lastAccess?: number; // opcional: para control de expiración futura
}

// ========================================================
// 🔹 Declaraciones globales separadas
// ========================================================

declare global {
  // Caché para datasets pequeños (muestra estándar)
  var datasetStoreEstandar: Record<string, DatasetMeta> | undefined;

  // Caché para datasets grandes (muestreo masivo)
  var datasetStoreMasivo: Record<string, DatasetMeta> | undefined;
}

// ========================================================
// 🔹 Inicialización única (evita redefinir en hot reload)
// ========================================================

if (!globalThis.datasetStoreEstandar) globalThis.datasetStoreEstandar = {};
if (!globalThis.datasetStoreMasivo) globalThis.datasetStoreMasivo = {};

// ========================================================
// 🔹 Exportaciones tipadas
// ========================================================

export const datasetStoreEstandar = globalThis.datasetStoreEstandar!;
export const datasetStoreMasivo = globalThis.datasetStoreMasivo!;

// ========================================================
// 🔹 Comentario de ejemplo
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


// ========================================================
// 🔹 Limpieza automática de datasets inactivos (cada 5 min)
// ========================================================
const EXPIRATION_MS = 1000 * 60 * 30; // 30 minutos
setInterval(() => {
  const now = Date.now();

  // Limpieza de estándar
  for (const [id, meta] of Object.entries(globalThis.datasetStoreEstandar || {})) {
    if ((meta as any).lastAccess && now - (meta as any).lastAccess > EXPIRATION_MS) {
      delete globalThis.datasetStoreEstandar![id];
      console.log("🧹 Dataset estándar liberado:", id);
    }
  }

  // Limpieza de masivo
  for (const [id, meta] of Object.entries(globalThis.datasetStoreMasivo || {})) {
    if ((meta as any).lastAccess && now - (meta as any).lastAccess > EXPIRATION_MS) {
      delete globalThis.datasetStoreMasivo![id];
      console.log("🧹 Dataset masivo liberado:", id);
    }
  }
}, 1000 * 60 * 5); // cada 5 minutos

// ========================================================
// 🔹 Ajustes opcionales para entornos de producción
// ========================================================

//  Límite máximo de datasets almacenados en memoria (protege RAM)
const MAX_DATASETS = 50;

// Función para recortar los datasets más antiguos si se excede el límite
function enforceDatasetLimit() {
  const enforceLimit = (store: Record<string, DatasetMeta>, tipo: string) => {
    const ids = Object.keys(store);
    if (ids.length > MAX_DATASETS) {
      // Ordenar por lastAccess (antiguos primero)
      const sorted = Object.entries(store)
        .sort(([, a], [, b]) => (a.lastAccess ?? 0) - (b.lastAccess ?? 0))
        .slice(0, 5); // eliminar los 5 más viejos
      for (const [id] of sorted) delete store[id];
      if (process.env.NODE_ENV !== "production") {
        console.warn(`⚠️ Se eliminaron datasets antiguos (${tipo}):`, sorted.map(([id]) => id));
      }
    }
  };

  enforceLimit(globalThis.datasetStoreEstandar!, "estándar");
  enforceLimit(globalThis.datasetStoreMasivo!, "masivo");
}

// Ejecutar cada 5 min junto con la limpieza
setInterval(enforceDatasetLimit, 1000 * 60 * 5);

//  Condicionar logs para que no saturen producción
const _log = (msg: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(msg, ...args);
  }
};

// Reemplazar logs directos por esta función en los futuros ajustes
// Ejemplo: _log("🧹 Dataset liberado:", id);
