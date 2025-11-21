"use client";

export interface HistorialImport {
  id: string;
  nombreArchivo: string;
  registrosTotales: number;
  delimitadorDetectado?: string | null;
  creadoEn: string;
}

export interface HistorialMuestra {
  id: string; 
  name: string;
  range: string;
  records: number;
  seed: number;
  createdAt: string;
}

export interface HistorialExport {
  id: string;
  nombreExportado: string;
  registrosExportados: number;
  formatoExportacion: string;
  creadoEn: string;
}

export interface HistorialState {
  imports: HistorialImport[];
  muestras: HistorialMuestra[];
  exports: HistorialExport[];
}

export default function TablaHistorial({ historial }: { historial: HistorialState }) {
  const { imports, muestras, exports } = historial;

  return (
    <div className="space-y-6">

      {/* IMPORTACIONES */}
      <Section title="📥 Importaciones" count={imports.length}>
        {imports.length === 0 ? (
          <Empty text="No hay importaciones registradas" />
        ) : (
          <Table
            columns={["Archivo", "Registros", "Delimitador", "Fecha"]}
            rows={imports.map((h: HistorialImport) => [
              h.nombreArchivo,
              h.registrosTotales,
              h.delimitadorDetectado ?? "—",
              new Date(h.creadoEn).toLocaleString("es-BO")
            ])}
          />
        )}
      </Section>

      {/* MUESTREOS */}
      <Section title="🧮 Muestreos" count={muestras.length}>
        {muestras.length === 0 ? (
          <Empty text="No hay muestreos registrados" />
        ) : (
          <Table
            columns={["Nombre", "Rango", "Registros", "Seed", "Fecha"]}
            rows={muestras.map((h: HistorialMuestra) => [
              h.name,
              h.range,
              h.records,
              h.seed,
              new Date(h.createdAt).toLocaleString("es-BO")
            ])}
          />
        )}
      </Section>

      {/* EXPORTACIONES */}
      <Section title="📤 Exportaciones" count={exports.length}>
        {exports.length === 0 ? (
          <Empty text="No hay exportaciones registradas" />
        ) : (
          <Table
            columns={["Archivo", "Registros", "Formato", "Fecha"]}
            rows={exports.map((h: HistorialExport) => [
              h.nombreExportado,
              h.registrosExportados,
              h.formatoExportacion,
              new Date(h.creadoEn).toLocaleString("es-BO")
            ])}
          />
        )}
      </Section>

    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <h3 className="font-semibold text-lg mb-2">
        {title} ({count})
      </h3>
      {children}
    </div>
  );
}

function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: any[][];
}) {
  return (
    <table className="w-full border text-sm">
      <thead className="bg-gray-100">
        <tr>
          {columns.map((c: string, i: number) => (
            <th key={i} className="border p-2 text-left">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row: any[], i: number) => (
          <tr key={i} className="border">
            {row.map((cell: any, j: number) => (
              <td key={j} className="border p-2">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-gray-500 text-sm">{text}</p>;
}
