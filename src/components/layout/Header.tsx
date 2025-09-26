"use client" // Necesario para la interactividad (signOut, onMenuToggle)

import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import logoBlanco from '@/images/logo-ruizmier-w.png'; // Importa tu logo

// --- ÍCONOS SVG ---

const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


// --- COMPONENTE HEADER ---

export default function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center bg-gradient-to-r from-[#0f3c73] to-[#008795] px-4 text-white">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center">
          <Image
            src={logoBlanco}
            alt="Logo"
            className="h-10 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-4">
          {/* Botón de Logout para Desktop */}
          <div className="hidden md:block">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Cerrar Sesión
            </button>
          </div>

          
        </div>
      </div>
    </header>
  );
}