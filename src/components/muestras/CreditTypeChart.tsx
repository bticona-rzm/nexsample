"use client"

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

interface DataRow {
  tipo: string;
  [key: string]: any;
}

// 1. Definimos una paleta de colores atractiva
const colorPalette = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

export default function CreditTypeChart({ data }: { data: DataRow[] }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500">No hay datos para el gráfico.</div>;
  }
  
  const conteoPorTipo = data.reduce((acc, dato) => {
    const tipo = dato.tipo || 'No especificado';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const labels = Object.keys(conteoPorTipo);

  const chartData = {
    labels: labels,
    datasets: [{
      label: 'Cantidad de Operaciones',
      data: Object.values(conteoPorTipo),
      // 2. Usamos la paleta de colores para el fondo de cada barra
      backgroundColor: colorPalette.slice(0, labels.length),
      borderWidth: 0, // Quitamos el borde para un look más limpio
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#374151',
        font: { weight: 'bold', size: 14 }
      } as any,
    },
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Asegura que el eje Y solo muestre números enteros
        }
      } 
    },
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen por Tipo de Crédito</h2>
      <Bar options={chartOptions} data={chartData} />
    </div>
  );
}