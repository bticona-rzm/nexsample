// --- TIPOS DE DATOS ---
interface EntidadProgreso {
  id: number;
  nombre: string;
  // Ya no necesitamos la propiedad 'logo'
  progreso: number;
}

// --- DATOS DE MUESTRA ---
const entidades: EntidadProgreso[] = [
  { id: 1, nombre: 'Banco Nacional de Crédito', progreso: 85 },
  { id: 2, nombre: 'Banco Mercantil Santa Cruz', progreso: 55 },
  { id: 3, nombre: 'Banco Unión', progreso: 20 },
  { id: 4, nombre: 'Banco Sol', progreso: 95 },
  { id: 5, nombre: 'Banco Fie', progreso: 42 },
];

// --- FUNCIONES Y COMPONENTES AUXILIARES ---

/**
 * Genera las iniciales a partir de un nombre.
 * Ej: "Banco Nacional" -> "BN"
 */
const getInitials = (name: string): string => {
  const words = name.split(' ');
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Componente reutilizable para mostrar un avatar con iniciales y color.
 */
const Avatar = ({ name }: { name: string }) => {
  const initials = getInitials(name);
  
  // Paleta de colores para los avatares
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 
    'bg-amber-500', 'bg-pink-500', 'bg-indigo-500'
  ];
  
  // Asigna un color consistente basado en el nombre
  const colorIndex = name.length % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-white font-bold ${colorClass}`}>
      {initials}
    </div>
  );
};

// --- COMPONENTE DE LA PÁGINA ---
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Dashboard de Progreso de Revisión
      </h1>

      <div className="space-y-6">
        {entidades.map((entidad) => {
          // Lógica para determinar el color de la barra de progreso
          let colorClass = 'bg-red-500';
          if (entidad.progreso >= 70) {
            colorClass = 'bg-green-500';
          } else if (entidad.progreso >= 40) {
            colorClass = 'bg-yellow-500';
          }

          return (
            <div key={entidad.id} className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
              {/* Avatar con iniciales */}
              <Avatar name={entidad.nombre} />

              {/* Contenido: Nombre y Barra de Progreso */}
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-700">{entidad.nombre}</span>
                  <span className={`text-sm font-bold ${colorClass.replace('bg-', 'text-')}`}>
                    {entidad.progreso}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${entidad.progreso}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}