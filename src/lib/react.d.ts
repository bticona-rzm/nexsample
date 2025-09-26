import 'react';

declare module 'react' {
  // Aumenta la definición de los atributos de un input
  // para que acepte 'webkitdirectory'.
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
  }
}