"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Prompt {
  title: string
  subtitle: string
}

const prompts: Prompt[] = [
  {
    title: "Conocer las tasas impositivas en Bolivia",
    subtitle: "Solicitar información sobre las tasas del IUE y el IVA en 2025",
  },
  {
    title: "Entender el Impuesto a las Transacciones (IT)",
    subtitle: "Pedir una explicación detallada del IT y su cálculo",
  },
  {
    title: "Explorar incentivos fiscales para empresas",
    subtitle: "Consultar sobre beneficios tributarios para la reinversión de utilidades",
  },
  {
    title: "Conocer las obligaciones de facturación electrónica",
    subtitle: "Preguntar sobre los plazos y requisitos para la emisión de facturas electrónicas en 2025",
  },
  {
    title: "Informarse sobre el Presupuesto General del Estado 2025",
    subtitle: "Solicitar un resumen de las disposiciones fiscales en la Ley 1613",
  },
  {
    title: "Comprender el Régimen Complementario al IVA (RC-IVA)",
    subtitle: "Pedir detalles sobre la aplicación del RC-IVA para personas naturales",
  },
  {
    title: "Analizar impuestos especiales en sectores extractivos",
    subtitle: "Consultar sobre las tasas adicionales para empresas mineras y de hidrocarburos",
  },
  {
    title: "Investigar exenciones del IVA en sectores específicos",
    subtitle: "Preguntar sobre la tasa cero de IVA para bienes de capital en agricultura e industria",
  },
  {
    title: "Conocer las sanciones por incumplimiento tributario",
    subtitle: "Solicitar información sobre multas y facilidades de pago para deudas tributarias",
  },
  {
    title: "Entender la tributación de ingresos personales",
    subtitle: "Pedir una explicación sobre el tratamiento fiscal de los ingresos de fuente boliviana",
  },
]

export function DynamicPrompts() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % prompts.length)
    }, 8000) // 8 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-[150px] overflow-hidden">
      {" "}
      {/* Fixed height container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-semibold text-white">{prompts[currentIndex].title}</h1>
          <p className="text-gray-400 text-xl">{prompts[currentIndex].subtitle}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

