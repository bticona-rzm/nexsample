import { X } from "lucide-react";

type Cliente = {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
};

type EditClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onEditClient: (data: { id: number; nombre: string; tipo: string }) => void;
};

export default function EditClientModal({
  isOpen,
  onClose,
  cliente,
  onEditClient,
}: EditClientModalProps) {
  if (!isOpen || !cliente) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onEditClient({
      id: cliente.id,
      nombre: formData.get("nombre") as string,
      tipo: formData.get("tipo") as string,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Editar Cliente</h2>
          <button onClick={onClose} className="text-gr  ay-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código solo lectura */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Código</label>
            <input
              type="text"
              value={cliente.codigo}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              defaultValue={cliente.nombre}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              name="tipo"
              id="tipo"
              defaultValue={cliente.tipo}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="Entidad Financiera">Entidad Financiera</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
