"use client"

import { useState } from 'react';
import Link from 'next/link';
import type { User, Role } from '@/lib/types';
import CreateUserModal from './CreateUserModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface UserTableProps {
  initialUsers: User[];
  allRoles: Role[];
}

export default function UserTable({ initialUsers, allRoles }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleAssignRole = async (userId: string, newRole: Role) => {
  // Guarda el estado original en caso de que necesitemos revertir
  const originalUsers = [...users];
  const userToUpdate = users.find(u => u.id === userId);

  if (!userToUpdate) return;

  // 1. Actualización optimista de la UI
  setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  setSuccessMessage(null); // Limpia mensajes anteriores
  setErrorMessage(null);

  try {
    // 2. Llamada a la API para persistir el cambio
    // CORRECCIÓN: Se apunta a la URL del recurso principal del usuario.
    const response = await fetch(`/api/usuarios/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: newRole }),
    });

    if (!response.ok) {
      // Intenta leer el mensaje de error del cuerpo de la respuesta de la API
      const errorData = await response.text();
      // Lanza un error con el mensaje específico de la API, o uno genérico si no hay cuerpo
      throw new Error(errorData || 'No se pudo actualizar el rol en la base de datos.');
    }

    // 3. Si todo fue bien, muestra el mensaje de éxito
    const updatedUser = await response.json(); // Opcional: usar la respuesta para actualizar el estado
    setSuccessMessage(`Rol de ${updatedUser.name} actualizado a ${newRole}.`);

  } catch (error) {
    console.error("Error al asignar el rol:", error);
    
    // 4. Si hubo un error, revierte el estado de la UI al original
    setUsers(originalUsers);
    // Muestra el mensaje de error específico que viene de la API
    setErrorMessage((error as Error).message || "Error al actualizar el rol. Por favor, intente de nuevo.");
  }
};

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/usuarios/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo eliminar el usuario.');
      }

      setUsers(users.filter(u => u.id !== userToDelete.id));
      setSuccessMessage('Usuario eliminado correctamente.');

    } catch (error: any) {
      console.error("Error al eliminar:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };
  
  const handleUserCreated = (newUser: User) => {
    setUsers(currentUsers => [...currentUsers, newUser]);
    setSuccessMessage(`Usuario '${newUser.name}' creado con éxito.`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
        >
          Crear Usuario
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-3 mb-6 rounded border border-green-300" role="alert">
          {successMessage}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                {/* Celda para el Rol */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                {/* Celda para las Acciones */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleAssignRole(user.id, e.target.value as Role)}
                      className="border border-gray-300 rounded p-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {allRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => openDeleteModal(user)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
        allRoles={allRoles}
      />
      
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        userName={userToDelete?.name || null}
      />
    </div>
  );
}