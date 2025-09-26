"use client"

interface DataRow {
  [key: string]: any;
}

// Función para formatear los valores de la tabla como en tu código Laravel
const formatValue = (key: string, value: any) => {
  const numericKeys = ['CI_NIT', 'NRO_OPERACION', 'NRO_INTERNO', 'COD_OFICINA', 'COD_LOCALIDAD'];
  const currencyKeys = ['MONTO_DESEMB_USD', 'MONTO_DESEMB_ORIG'];

  if (currencyKeys.includes(key)) {
    return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(value);
  }
  if (typeof value === 'number' && !numericKeys.includes(key)) {
    return value.toString();
  }
  return value;
};

export default function DataTable({ data }: { data: DataRow[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No hay datos cargados para mostrar.</div>
    );
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {headers.map(header => (
              <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                {header.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {headers.map(header => (
                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {formatValue(header, row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}