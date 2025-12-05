"use client" // Necesario porque usamos 'useState' para la interactividad

import { useState, useRef, useEffect} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// --- ÍCONOS (Componentes SVG para usar en el menú) ---

const ArrowIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg
      className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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

export default function Navbar() {
  const pathname = usePathname(); // Hook para saber la ruta actual y resaltar el link activo

  // Estado para controlar qué submenú está abierto
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const navbarRef = useRef<HTMLElement>(null); // Ref para el menú

  const toggleSubmenu = (menuId: string) => {
    setOpenSubmenu(openSubmenu === menuId ? null : menuId);
  };

  
  // Efecto para cerrar el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



const navigationConfig: NavigationItem[] = [

   // 1. Gestión de Usuarios
     { type: 'link', href: '/usuarios', label: 'Gestión de Usuarios' },

  // 2. Indexación Documentos (Desplegable)
      // {
      //   type: 'submenu',
      //   id: 'indexacion',
      //   label: 'Indexación Documentos',
      //   subItems: [
      //     { href: '/indexar-normativa', label: 'Indexar Normativa' },
      //     { href: '/manual-cuentas', label: 'Indexar Manual de Cuentas' },
      //     { href: '/leyes-decretos', label: 'Indexar Leyes Decretos' },
      //     { href: '/circulares', label: 'Indexar Circulares' },
      //   ],
      // },

      
    // 3. Consultar IA
  // {
  //     type: 'submenu',
  //     id: 'consultas',
  //     label: 'Consultas IA',
  //     subItems: [
  //       { href: '/consulta-normativa', label: 'Consulta Normativa Especifica' },
  //       { href: '/consulta-ia', label: 'Consultar IA' },
  //     ],
  //   },

    // 4. PARAMETRIZACION
    { type: 'link', href: '/parametrizacion', label: 'Parámetros de Muestreo' },
    // 5. DATOS DE MUESTRAS
    { type: 'link', href: '/muestra', label: 'Muestreo de Controles'},
    // 6. CLIENTES
    { type: 'link', href: '/clientes', label: 'Lista de Clientes'},
    // 7. MUM
    { type: 'link', href: '/mum', label: 'MUM'},
    // 8. Muestreo de Atributos
    { type: 'link', href: '/atributos', label: 'Muestreo de Atributos'},

    
    // --- RESTO DE LOS ÍTEMS ---
    // { type: 'link', href: '/clientes', label: 'Detalle de Clientes' },
    // { type: 'link', href: '/analizar-acta', label: 'Resumen Actas' },
    // { type: 'link', href: '/asignaciones', label: 'Asignación Entidades' },
    // { type: 'link', href: '/entidades', label: 'Listado Entidades' },
    // {
    //   type: 'submenu',
    //   id: 'muestras',
    //   label: 'Muestras',
    //   subItems: [
    //     { href: '/muestras/carga', label: 'Cargado de Muestra' },
    //     { href: '/muestras/atributos', label: 'Atributos' },
    //     { href: '/entidades/1/cartera', label: 'Listado de Muestra' },
    //     { href: '/muestras/observaciones', label: 'Listado Observados' },
    //     { href: '/muestras/reporte', label: 'Reporte' },
    //   ],
    // },

  ];


  

  // Función para determinar si un link está activo
  const isActive = (href: string) => pathname === href;

  return (
    <nav ref={navbarRef} className="sticky top-16 z-50 flex h-16 w-full items-center justify-between bg-white px-6 shadow-md">
      {/* --- 2. LÓGICA DE RENDERIZADO UNIFICADA --- */}
      <ul className="flex h-full items-center space-x-4">
        {navigationConfig.map((item) => {
          // Si el item no tiene un 'type', lo tratamos como un link simple por defecto
          
          if (item.type === 'link') {
            return (
              <li key={item.href} className="h-full border-l border-gray-200 first:border-l-0">
                <Link
                  href={item.href}
                  className={`flex h-full items-center px-4 transition-colors ${
                    isActive(item.href)
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          if (item.type === 'submenu') {
            const isOpen = openSubmenu === item.id; 
            return (
              <li key={item.id} className="relative h-full border-l border-gray-200 first:border-l-0">
                <button
                  onClick={() => toggleSubmenu(item.id)}
                  className={`flex h-full items-center px-4 transition-colors ${
                    isOpen ? 'bg-gray-100' : ''
                  } text-gray-700 hover:bg-gray-100`}
                >
                  <span>{item.label}</span>
                  <ArrowIcon isOpen={isOpen} />
                </button>
                
                {isOpen && (
                  <ul className="absolute left-0 top-full mt-1 w-56 rounded-md bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          onClick={() => setOpenSubmenu(null)} // Cierra el menú al hacer clic
                          className={`block w-full rounded px-4 py-2 text-left text-sm transition-colors ${
                            isActive(subItem.href)
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
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