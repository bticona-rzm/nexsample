"use client" // Necesario porque usamos 'useState' para la interactividad

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// --- ÍCONOS (Componentes SVG para usar en el menú) ---

const ArrowIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`h-4 w-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
  </svg>
);


// Le decimos a TypeScript exactamente cómo son nuestros objetos de menú.
type NavItemLink = {
  type: 'link';
  href: string;
  label: string;
};

type NavItemSubmenu = {
  type: 'submenu';
  id: string;
  label: string;
  subItems: { href: string; label: string; }[];
};

// Un item de navegación puede ser un link O un submenú
type NavigationItem = NavItemLink | NavItemSubmenu;

// --- COMPONENTE DEL SIDEBAR ---

export default function Sidebar() {
  const pathname = usePathname(); // Hook para saber la ruta actual y resaltar el link activo

  // Estado para controlar qué submenú está abierto
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };


const navigationConfig: NavigationItem[] = [

   // 1. Gestión de Usuarios
    { type: 'link', href: '/usuarios', label: 'Gestión de Usuarios' },

  // 2. Indexación Documentos (Desplegable)
      {
        type: 'submenu',
        id: 'indexacion',
        label: 'Indexación Documentos',
        subItems: [
          { href: '/indexar-normativa', label: 'Indexar Normativa' },
          { href: '/manual-cuentas', label: 'Indexar Manual de Cuentas' },
          { href: '/leyes-decretos', label: 'Indexar Leyes Decretos' },
          { href: '/circulares', label: 'Indexar Circulares' },
        ],
      },

      
    // 3. Consultar IA
    {
        type: 'submenu',
        id: 'consultas',
        label: 'Consultas IA',
        subItems: [
          { href: '/consulta-normativa', label: 'Consulta Normativa Especifica' },
          { href: '/consulta-ia', label: 'Consultar IA' },
        ],
      },

    // --- RESTO DE LOS ÍTEMS ---
    { type: 'link', href: '/clientes', label: 'Detalle de Clientes' },
    { type: 'link', href: '/consulta-normativa', label: 'Consulta Normativa Especifica' },
    { type: 'link', href: '/analizar-acta', label: 'Resumen Actas' },
    { type: 'link', href: '/asignaciones', label: 'Asignación Entidades' },
    { type: 'link', href: '/entidades', label: 'Listado Entidades' },
    {
      type: 'submenu',
      id: 'muestras',
      label: 'Muestras',
      subItems: [
        { href: '/muestras/carga', label: 'Cargado de Muestra' },
        { href: '/muestras/atributos', label: 'Atributos' },
        { href: '/entidades/1/cartera', label: 'Listado de Muestra' },
        { href: '/muestras/observaciones', label: 'Listado Observados' },
        { href: '/muestras/reporte', label: 'Reporte' },
      ],
    },
  ];


  

  // Función para determinar si un link está activo
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 overflow-y-auto bg-white shadow-lg">
      {/* --- 2. LÓGICA DE RENDERIZADO UNIFICADA --- */}
      <ul className="space-y-2 p-4">
        {navigationConfig.map((item) => {
          // Si el item no tiene un 'type', lo tratamos como un link simple por defecto
          
          if (item.type === 'link') {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded px-4 py-2 transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          if (item.type === 'submenu') {
            return (
              <li key={item.id}>
                <button
                  onClick={() => toggleSubmenu(item.id)}
                  className="flex w-full cursor-pointer items-center justify-between rounded px-4 py-2 text-left transition hover:bg-blue-500 hover:text-white"
                >
                  <span>{item.label}</span>
                  <ArrowIcon isOpen={openSubmenu === item.id} />
                </button>
                
                {openSubmenu === item.id && (
                  <ul className="mt-2 space-y-2 pl-4">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          className={`block rounded px-4 py-2 text-sm transition-colors ${
                            isActive(subItem.href)
                              ? 'bg-gray-300 font-semibold'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }
          return null;
        })}
      </ul>
    </nav>
  );
}