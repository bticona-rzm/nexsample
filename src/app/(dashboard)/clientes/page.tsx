"use client";

import { useState, useEffect, FormEvent } from 'react';
import { PlusCircle, User, ChevronDown, Loader2, X } from 'lucide-react';
import EditClientModal from "./EditClientModal";
import DeleteClientModal from "./DeleteClientModal";



// --- Tipos de Datos ---
type Gerente = {
  id: string;
  name: string | null;
};

type Cliente = {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  usuarios: {
    usuario: Gerente;
  }[];
};

type EditClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onEditClient: (data: { id: number; nombre: string; tipo: string }) => void;
};

type AsignacionesState = {
  [key: string]: string | null;
};


// --- Componente Modal para Añadir Cliente ---
const AddClientModal = ({ isOpen, onClose, onAddClient }: { isOpen: boolean, onClose: () => void, onAddClient: (data: { codigo: string, nombre: string, tipo: string }) => void }) => {
  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      codigo: formData.get('codigo') as string,
      nombre: formData.get('nombre') as string,
      tipo: formData.get('tipo') as string,
    };
    onAddClient(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Añadir Nuevo Cliente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
              <input type="text" name="codigo" id="codigo" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Cliente</label>
              <input type="text" name="nombre" id="nombre" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo</label>
              <select name="tipo" id="tipo" required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option>Entidad Financiera</option>
                <option>Otros</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Guardar Cliente</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Componente Principal de la Página ---
export default function ClientListPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [gerentes, setGerentes] = useState<Gerente[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionesState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);



  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      const data: Cliente[] = await response.json();
      setClientes(data);
      // Inicializa el estado de asignaciones (asumiendo un solo gerente por simplicidad de UI)
      // const initialAsignaciones: AsignacionesState = {};
      // data.forEach(cliente => {
      //   initialAsignaciones[cliente.id] = cliente.usuarios[0]?.usuario.id || null;
      // });
      // setAsignaciones(initialAsignaciones);
      setAsignaciones({});
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchClientes(); // Carga clientes y asignaciones
        const gerentesRes = await fetch('/api/usuarios?role=GERENTE');
        const gerentesData = await gerentesRes.json();
        setGerentes(gerentesData);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  //FUNCION DE AÑADIR CLIENTE
  const handleAddClient = async (data: { codigo: string, nombre: string, tipo: string }) => {
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      setIsModalOpen(false);
      await fetchClientes(); // Recarga la lista de clientes
    } catch (error) {
      console.error("Error al añadir cliente:", error);
      alert(`Error al añadir cliente: ${(error as Error).message}`);
    }
  };

  //FUNCION DE ELIMINAR CLIENTE
  const handleDeleteClient = async (id: number) => {
    try {
      const response = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
      await fetchClientes();
    } catch (error) {
      alert(`Error al eliminar cliente: ${(error as Error).message}`);
    }
  };


  //FUNCION DE EDITAR CLIENTE
  const handleEditClient = async (data: { id: number; nombre: string; tipo: string }) => {
    try {
      const response = await fetch(`/api/clientes/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setIsEditModalOpen(false);
      await fetchClientes();
    } catch (error) {
      alert(`Error al editar cliente: ${(error as Error).message}`);
    }
  };
  
  const openEditModal = (cliente: Cliente) => {
  setClienteToEdit(cliente);
  setIsEditModalOpen(true);
  };

  const openDeleteModal = (cliente: Cliente) => {
  setClienteToDelete(cliente);
  setIsDeleteOpen(true);
  };


///OTRAS FUNCIONES CON GERENTE POR VERSE
  const handleAsignarGerente = async (clienteId: string, nuevoGerenteId: string | null) => {
    const gerenteAnteriorId = asignaciones[clienteId];
    
    // Actualización optimista de la UI
    setAsignaciones(prev => ({ ...prev, [clienteId]: nuevoGerenteId }));

    try {
      // 1. Desasignar gerente anterior si existía
      if (gerenteAnteriorId) {
        await fetch('/api/clientes/asignacion', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clienteId, usuarioId: gerenteAnteriorId }),
        });
      }
      // 2. Asignar nuevo gerente si se seleccionó uno
      if (nuevoGerenteId) {
        await fetch('/api/clientes/asignacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clienteId, usuarioId: nuevoGerenteId }),
        });
      }
    } catch (error) {
      console.error("Error al actualizar asignación:", error);
      // Revertir en caso de error
      setAsignaciones(prev => ({ ...prev, [clienteId]: gerenteAnteriorId }));
      alert("No se pudo actualizar la asignación.");
    }
  };

  const getGerenteNombre = (gerenteId: string | null) => {
    if (!gerenteId) return <span className="text-gray-400 italic">No asignado</span>;
    // CORRECCIÓN: Se usa 'name' para coincidir con la definición del tipo Gerente.
    return gerentes.find(g => g.id === gerenteId)?.name || 'Desconocido';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <DeleteClientModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} cliente={clienteToDelete} onConfirm={async (id) => {
      await handleDeleteClient(id);   // reutilizas tu función existente
      setIsDeleteOpen(false);         // cierra el modal luego de eliminar
        }}/>
      <EditClientModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} cliente={clienteToEdit} onEditClient={handleEditClient}/>
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddClient={handleAddClient} />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
              <p className="mt-1 text-gray-500">Añada, visualice y asigne gerentes a los clientes.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out">
              <PlusCircle className="mr-2 -ml-1 h-5 w-5" />
              Añadir Cliente
            </button>
          </header>

          
          <main className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerente Asignado</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignar Gerente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente, index) => (
                    <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.codigo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{cliente.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cliente.tipo === 'Entidad Financiera' ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800'}`}>
                          {cliente.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getGerenteNombre(asignaciones[cliente.id])}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            value={asignaciones[cliente.id] || ''}
                            onChange={(e) => handleAsignarGerente(cliente.id, e.target.value || null)}
                            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out appearance-none bg-white text-sm"
                          >
                            <option value="">-- Seleccionar --</option>
                            {gerentes.map(gerente => (
                              <option key={gerente.id} value={gerente.id}>{gerente.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div> */}
                      </td>
                      {/* --- Botones de acciones (Editar / Eliminar) --- */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                        <button
                          onClick={() => openEditModal(cliente)}
                          className="px-3 py-1 text-sm text-white bg-yellow-500 rounded-md hover:bg-yellow-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => openDeleteModal(cliente)}
                          className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>      
    </>
  );
}