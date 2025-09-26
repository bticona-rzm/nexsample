"use client"

import { useState, ReactNode } from "react";
import Header from "@/components/layout/Header";
//import Sidebar from "@/components/layout/Sidebar";
import Navbar from '@/components/layout/Navbar';
import Footer from "@/components/layout/Footer";
import { Alert } from '@/components/ui/alert';
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-gray-100">
      
      {/* Envolvemos Header y Navbar en un contenedor para mantenerlos agrupados */}
      <header className='relative z-40'>
        {/* 1. Tu Header se mantiene en la cima. Es sticky y se pega al borde superior. */}
        {/* Asumimos que tu Header tiene una altura de 16 (64px). Ej: className="h-16 ..." */}
        <Header />

        {/* 2. El Navbar va debajo y también es sticky. */}
        {/* Se pega debajo del Header gracias a 'top-16'. */}
        <Navbar />
      </header>

      {/* 3. El contenido principal ocupa el espacio restante y tiene su propio scroll. */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>

      <Footer />

      {/* Los modales se mantienen al final para estar por encima de todo. */}
      <div className="absolute">
        <Alert />
        <ConfirmModal />
      </div>
    </div>
  );
}
