// components/mum/WithLogProvider.tsx
"use client";

import { LogProvider } from '@/contexts/LogContext';

export function WithLogProvider({ children }: { children: React.ReactNode }) {
  return <LogProvider>{children}</LogProvider>;
}