import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  ask: (title: string, message: string) => Promise<boolean>;
  close: () => void;
}

export const useConfirm = create<ConfirmState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
  onCancel: () => {},
  close: () => set({ isOpen: false }),
  ask: (title, message) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          set({ isOpen: false });
          resolve(true);
        },
        onCancel: () => {
          set({ isOpen: false });
          resolve(false);
        },
      });
    });
  },
}));