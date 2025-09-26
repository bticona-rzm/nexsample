import { AlertTriangle, X } from "lucide-react";

type Cliente = {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
};

type DeleteClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onConfirm: (id: number) => void | Promise<void>;
};

export default function DeleteClientModal({
  isOpen,
  onClose,
  cliente,
  onConfirm,
}: DeleteClientModalProps) {
  if (!isOpen || !cliente) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>

          <h2 id="delete-title" className="text-xl font-semibold text-gray-900">
            ¿Estás seguro de eliminar este cliente?
          </h2>
          <p className="mt-2 text-gray-600">
            Estás a punto de eliminar a <strong className="text-gray-900">{cliente.nombre}</strong>.
            Esta acción es <span className="font-medium">irreversible</span>.
          </p>
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(cliente.id)}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Sí, eliminar
          </button>
        </div>

        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
