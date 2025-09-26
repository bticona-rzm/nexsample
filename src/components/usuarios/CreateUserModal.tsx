"use client"

import { useState, FormEvent, useEffect } from 'react';
import { User, Role } from '@/lib/types';
import { SpinnerIcon } from '@/components/ui/spinner';

// No necesitamos importar Button e Input si definimos los estilos directamente

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: User) => void;
  allRoles: Role[];
}

export default function CreateUserModal({ isOpen, onClose, onUserCreated, allRoles }: CreateUserModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo crear el usuario.');
      
      onUserCreated(result);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      {/* Contenedor del modal con borde azul */}
      <div 
        className={`w-full max-w-md rounded-lg bg-white text-gray-900 shadow-2xl ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold">Crear Nuevo Usuario</h2>
          <button onClick={onClose} className="text-2xl font-light text-gray-500 hover:text-gray-900">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && <div className="rounded bg-red-100 p-3 text-center text-sm font-medium text-red-700">{error}</div>}
          
          {/* Estilos mejorados para los campos de entrada */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
            <input id="name" name="name" required disabled={isSubmitting} className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input id="email" name="email" type="email" required disabled={isSubmitting} className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input id="password" name="password" type="password" required disabled={isSubmitting} className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">Rol</label>
            <select 
              id="role" 
              name="role" 
              required 
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          {/* Botones con nuevos colores y estilos */}
          <div className="flex justify-end gap-4 border-t border-gray-200 pt-4 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting && <SpinnerIcon />}
              {isSubmitting ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}