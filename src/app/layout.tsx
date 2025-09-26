// src/app/layout.tsx
import Providers from "@/components/Providers"; // Importa el proveedor
import '../styles/input.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Providers> {/* Envuelve a los children */}
          {children}
        </Providers>
      </body>
    </html>
  )
}