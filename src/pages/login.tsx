"use client"

import React, { useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import Image from "next/image"
import { signIn } from "next-auth/react"

import logoRuizmier from '@/images/logo-ruizmier-w.png';
import traineebotImage from '@/images/traineebot.png';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"

const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })
      if (res?.error) {
        setError("Las credenciales son incorrectas. Intenta de nuevo.")
      } else if (res?.ok) {
        router.push("/")
      }
    } catch (err) {
      setError("Ha ocurrido un error inesperado.")
      console.error("Login failed:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4 text-white">
      <div className="fixed top-4 left-4">
        <Logo isDarkMode={true} isAuthPage={true} />
      </div>

      {/* --- Contenedor principal ahora usa 'grid' para mejor ajuste --- */}
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl bg-gray-800 shadow-2xl lg:grid-cols-2">
        
        {/* Columna Izquierda: Imagen (ahora se apila en móvil) */}
        <div className="relative h-64 w-full lg:h-auto">
          <Image
            src={traineebotImage}
            alt="Trainee Bot"
            fill
            className="object-cover"
          />
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="flex flex-col justify-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="relative h-[80px] w-full max-w-[250px]">
              <Image
                src={logoRuizmier}
                alt="Logo Principal"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="rounded-md bg-red-500/20 p-3 text-center text-sm text-red-300">{error}</div>}

            <div>
              <label htmlFor="email" className="sr-only">Correo Electrónico</label>
              <Input
                id="email"
                type="email"
                placeholder="Correo Electrónico"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="submit"
              className="flex w-full justify-center bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800"
              disabled={isSubmitting}
              aria-label="Iniciar sesión"
            >
              {isSubmitting && <SpinnerIcon />}
              {isSubmitting ? "Iniciando..." : "Iniciar Sesión"}
            </Button>
          </form>

          {/* <p className="text-center text-sm text-gray-400">
            ¿No tienes una cuenta?{" "}
            <Link href="/signup" className="font-medium text-sky-400 hover:underline">
              Regístrate
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  )
}