import { create } from 'zustand';

type AlertType = 'success' | 'error' | 'warning';

interface AlertState {
  isOpen: boolean;
  message: string;
  type: AlertType;
  showAlert: (message: string, type: AlertType) => void;
  hideAlert: () => void;
}

export const useAlert = create<AlertState>((set) => ({
  isOpen: false,
  message: '',
  type: 'success',
  showAlert: (message, type) => set({ isOpen: true, message, type }),
  hideAlert: () => set({ isOpen: false }),
}));