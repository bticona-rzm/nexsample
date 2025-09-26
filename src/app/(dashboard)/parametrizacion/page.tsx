
/**
 * Parametrización de muestreo (solo frontend, datos quemados)
 * - Next.js (app router) / React 19 / Tailwind
 * - Pega este archivo como: app/parametrizacion/page.tsx
 * - No requiere backend. Todo es local y controlado por estado.
 */

"use client";
import { useState } from "react";

// Componentes de tablas (puedes moverlos a archivos separados)
// === TABLA 1: Selección de confianza ===
function TablaConfianza() {
  // Datos para la primera tabla
  const datosTabla1 = [
    { riesgo: "Alto", conf: ["95", "100"], factor: ["3.0"] },
    { riesgo: "Moderado", conf: ["80", "90"], factor: ["1.6", "2.3"] },
    { riesgo: "Bajo", conf: ["65", "75"], factor: ["1.1", "1.4"] },
  ];

  // Datos para la segunda tabla (nueva)
  const datosTabla2 = [
    { nivel: "50%", factor: "0.7" },
    { nivel: "55%", factor: "0.8" },
    { nivel: "60%", factor: "0.9" },
    { nivel: "65%", factor: "1.1" },
    { nivel: "70%", factor: "1.2" },
    { nivel: "75%", factor: "1.4" },
    { nivel: "80%", factor: "1.6" },
    { nivel: "85%", factor: "1.9" },
    { nivel: "90%", factor: "2.3" },
    { nivel: "95%", factor: "3.0" },
    { nivel: "98%", factor: "3.7" },
    { nivel: "99%", factor: "4.6" },
  ];

  return (
    <section className="bg-white">
      {/* Título y descripción de la primera tabla */}
      <h2 className="text-2xl font-bold text-[#0f3c73] mb-2">Selección de confianza</h2>
      <p className="text-sm text-black-600 mb-6">
        Define el nivel de confianza y el factor correspondiente según la reducción de riesgo requerida.
      </p>

      {/* Tabla 1 existente */}
      <table className="w-full border-collapse text-sm mb-12">
        <thead>
          <tr className="bg-gradient-to-r from-[#0f3c73] to-[#008795] text-white">
            <th className="px-4 py-3 text-left rounded-tl-lg">Reducción del riesgo requerido</th>
            <th className="px-4 py-3 text-left">Nivel de confianza</th>
            <th className="px-4 py-3 text-left">Factor de confianza</th>
            <th className="px-4 py-3 text-center rounded-tr-lg">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {datosTabla1.map((row, i) => (
            <tr key={i} className="align-middle hover:bg-gray-50 transition-colors text-zinc-800">
              <td className="px-4 py-3 font-bold text-zinc-800">{row.riesgo}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {row.conf.map((val, idx) => (
                    <input
                      key={idx}
                      type="number"
                      defaultValue={val}
                      className="w-16 border rounded px-2 py-1 text-sm text-center"
                    />
                  ))}
                  <span>%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {row.factor.map((val, idx) => (
                    <input
                      key={idx}
                      type="number"
                      defaultValue={val}
                      className="w-16 border rounded px-2 py-1 text-sm text-center"
                    />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-center align-middle">
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors">
                  Guardar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Título y descripción de la segunda tabla */}
      <h3 className="text-xl font-bold text-[#0f3c73] mb-2">Factores de confianza para distintos niveles</h3>
      <p className="text-sm text-black-600 mb-6">
        Proporciona los factores de confianza correspondientes a cada nivel de confianza.
      </p>
      
      {/* Segunda tabla (nueva) */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-[#0f3c73] to-[#008795] text-white">
            <th className="px-4 py-3 text-left rounded-tl-lg">Nivel de Confianza</th>
            <th className="px-4 py-3 text-left">Factor de Confianza</th>
            <th className="px-4 py-3 text-center rounded-tr-lg">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {datosTabla2.map((row, i) => (
            <tr key={i} className="align-middle hover:bg-gray-50 transition-colors text-zinc-800">
              <td className="px-4 py-3 font-bold text-zinc-800">{row.nivel}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  defaultValue={row.factor}
                  className="w-16 border rounded px-2 py-1 text-sm text-center"
                />
              </td>
              <td className="px-4 py-3 text-center align-middle">
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors">
                  Guardar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// === TABLA 2: Muestreo sustantivo (atributos) ===
function TablaAtributos() {
  return (
    <section className="bg-white">
      <h2 className="text-2xl font-bold text-[#0f3c73] mb-2">
        Muestreo sustantivo (Atributos)
      </h2>
      <p className="text-sm text-black-600 mb-6">
        Basado en el tamaño de la población y el riesgo inherente de los atributos.
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-[#0f3c73] to-[#008795] text-white">
            <th className="px-4 py-3 text-left rounded-tl-lg">Número de la población</th>
            <th className="px-4 py-3 text-center">Riesgo bajo</th>
            <th className="px-4 py-3 text-center">Riesgo moderado</th>
            <th className="px-4 py-3 text-center">Riesgo alto</th>
            <th className="px-4 py-3 text-center rounded-tr-lg">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {[
            { rango: [1, 10], bajo: 5, moderado: 7, alto: 7 },
            { rango: [11, 49], bajo: 10, moderado: 15, alto: 15 },
            { rango: [50, 249], bajo: 15, moderado: 25, alto: 25 },
            { rango: "mayor", valor: 250, bajo: 15, moderado: 30, alto: 30 }, // <- aquí el cambio
          ].map((row, i) => (
            <tr key={i} className="align-middle">
              {/* Tamaño población */}
              <td className="px-4 py-3 text-center text-zinc-800">
                {Array.isArray(row.rango) ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={row.rango[0]}
                      className="w-16 border rounded px-2 py-1 text-sm text-center"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      defaultValue={row.rango[1]}
                      className="w-16 border rounded px-2 py-1 text-sm text-center"
                    />
                  </div>
                ) : row.rango === "mayor" ? (
                  <div className="flex items-center  gap-2">
                    <span className="font-bold">+ 250</span>
                    <input
                      type="number"
                      defaultValue={row.valor}
                      className="w-16 border rounded px-2 py-1 text-sm text-center"
                    />
                  </div>
                ) : (
                  <span>{row.rango}</span>
                )}
              </td>

              {/* Riesgo bajo */}
              <td className="px-4 py-3 text-center">
                <input
                  type="number"
                  defaultValue={row.bajo}
                  className="w-20 border rounded px-2 py-1 text-sm text-center"
                />
              </td>

              {/* Riesgo moderado */}
              <td className="px-4 py-3 text-center">
                <input
                  type="number"
                  defaultValue={row.moderado}
                  className="w-20 border rounded px-2 py-1 text-sm text-center"
                />
              </td>

              {/* Riesgo alto */}
              <td className="px-4 py-3 text-center">
                <input
                  type="number"
                  defaultValue={row.alto}
                  className="w-20 border rounded px-2 py-1 text-sm text-center"
                />
              </td>

              {/* Acción */}
              <td className="px-4 py-3 text-center align-middle">
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors">
                  Guardar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}


// === TABLA 3: Determinación de la frecuencia del control ===
function TablaFrecuencia() {
  return (
    <section className="bg-white">
      <h2 className="text-2xl font-bold text-[#0f3c73] mb-2">
        Determinación de la frecuencia del control
      </h2>
      <p className="text-sm text-black-600 mb-6">
        Traduce el número de ocurrencias en una frecuencia estándar que se utilizará para determinar el tamaño de la muestra.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f3c73] to-[#008795] text-white">
              <th className="px-4 py-3 text-left rounded-tl-lg">Número de ocurrencias</th>
              <th className="px-4 py-3 text-center">Equivale a la siguiente frecuencia</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {[
              { occ: [1], freq: "Anual" },
              { occ: [2], freq: "Semestral" },
              { occ: [3, 6], freq: "Bimensual" },
              { occ: [7, 12], freq: "Mensual" },
              { occ: [13, 26], freq: "Quincenal" },
              { occ: [27, 52], freq: "Semanal" },
              { occ: [53, 366], freq: "Diario" },
              { occ: [">=366"], freq: "Periódico" }, // modificamos aquí
            ].map((row, i) => (
              <tr key={i} className="align-middle hover:bg-gray-50 transition-colors text-zinc-800">
                <td className="px-4 py-3 flex items-center gap-3">
                  {/* Caso normal con 2 límites */}
                  {row.occ.length === 2 ? (
                    <>
                      <input
                        type="number"
                        defaultValue={row.occ[0]}
                        className="w-14 border rounded px-2 py-1 text-sm text-center"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        defaultValue={row.occ[1]}
                        className="w-14 border rounded px-2 py-1 text-sm text-center"
                      />
                    </>
                  ) : row.occ[0] === ">=366" ? (
                    // Caso especial con ≥
                    <div className="flex items-center gap-2">
                      <span className="font-bold">≥ de 366</span>
                      <input
                        type="number"
                        defaultValue={366}
                        className="w-16 border rounded px-2 py-1 text-sm text-center"
                      />
                    </div>
                  ) : (
                    // Caso simple con un valor
                    <input
                      type="number"
                      defaultValue={row.occ[0]}
                      className="w-14 border rounded px-2 py-1 text-sm text-center"
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-center font-bold">{row.freq}</td>
                <td className="px-4 py-3 text-center">
                  <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors">
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


// === TABLA 4: Tamaño de muestra de controles ===
function TablaControles() {
  const tamanioMuestra = [
    { frecuencia: "Anual", bajo: 1, medio: 1, alto: 1 },
    { frecuencia: "Semestral", bajo: 1, medio: 2, alto: 2 },
    { frecuencia: "Bimensual", bajo: 3, medio: 4, alto: 4 },
    { frecuencia: "Mensual", bajo: 3, medio: 4, alto: 4 },
    { frecuencia: "Quincenal", bajo: 5, medio: 8, alto: 8 },
    { frecuencia: "Semanal", bajo: 6, medio: 10, alto: 10 },
    { frecuencia: "Diario", bajo: 25, medio: 30, alto: 30 },
    { frecuencia: "Más que diario", bajo: 30, medio: 40, alto: 40 },
  ];

  return (
    <section className="bg-white">
      <h2 className="text-2xl font-bold text-[#0f3c73] mb-2">Determinación del tamaño de muestra de controles</h2>
      <p className="text-sm text-black-600 mb-6">
        Define el tamaño de muestra en base a la frecuencia del control y el nivel de riesgo inherente.
      </p>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f3c73] to-[#008795] text-white">
              <th className="px-4 py-3 text-left rounded-tl-lg">Frecuencia del control</th>
              <th className="px-4 py-3 text-center">Riesgo bajo</th>
              <th className="px-4 py-3 text-center">Riesgo moderado</th>
              <th className="px-4 py-3 text-center">Riesgo alto</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {tamanioMuestra.map((row, i) => (
              <tr key={i} className="align-middle hover:bg-gray-50 transition-colors text-zinc-800">
                <td className="px-4 py-3 font-bold text-zinc-800">{row.frecuencia}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    defaultValue={row.bajo}
                    className="w-16 border rounded-md text-center px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    defaultValue={row.medio}
                    className="w-16 border rounded-md text-center px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    defaultValue={row.alto}
                    className="w-16 border rounded  px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-4 py-3 text-center align-middle">
                  <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors">
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </section>
  );
}

// === TABLA 5: Factores de confianza ajustados ===
function TablaFactores() {
  const datosMuestra = [
    { desviaciones: 1, confianza95: 4.7, confianza90: 3.9, confianza80: 3.0, confianza70: 2.4 },
    { desviaciones: 2, confianza95: 6.3, confianza90: 5.3, confianza80: 4.3, confianza70: 3.6 },
    { desviaciones: 3, confianza95: 7.8, confianza90: 6.7, confianza80: 5.5, confianza70: 4.7 },
    { desviaciones: 4, confianza95: 9.2, confianza90: 8.0, confianza80: 6.7, confianza70: 5.8 },
    { desviaciones: 5, confianza95: 10.5, confianza90: 9.3, confianza80: 7.9, confianza70: 7.0 },
  ];

  return (
    <section className="bg-white">
      <h2 className="text-2xl font-bold text-[#0f3c73] mb-2">
        Factores de confianza ajustados por desviaciones
      </h2>
      <p className="text-sm text-black-600 mb-6">
        Determina el factor de confianza basándose en el nivel de confianza y el número de desviaciones encontradas.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f3c73] to-[#008795] text-white">
              <th className="px-4 py-3 text-left rounded-tl-lg">Número de desviaciones</th>
              <th className="px-4 py-3 text-center">95% de confianza</th>
              <th className="px-4 py-3 text-center">90% de confianza</th>
              <th className="px-4 py-3 text-center">80% de confianza</th>
              <th className="px-4 py-3 text-center">70% de confianza</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {datosMuestra.map((row, i) => (
              <tr key={i} className="align-middle hover:bg-gray-50 transition-colors text-zinc-800">
                <td className="px-4 py-3 font-bold">{row.desviaciones}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    defaultValue={row.confianza95}
                    className="w-16 border rounded-md text-center px-2 py-1 text-sm"
                  />
                </td>
                {/* Campo de entrada para 90% de confianza */}
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    defaultValue={row.confianza90}
                    className="w-16 border rounded-md text-center px-2 py-1 text-sm"
                  />
                </td>
                {/* Campo de entrada para 80% de confianza */}
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    defaultValue={row.confianza80}
                    className="w-16 border rounded-md text-center px-2 py-1 text-sm"
                  />
                </td>
                {/* Campo de entrada para 70% de confianza */}
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    defaultValue={row.confianza70}
                    className="w-16 border rounded-md text-center px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-3 text-center align-middle">
                  <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors">
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TablaDesviaciones() {
  const [activeTab, setActiveTab] = useState("nia330");

  const tabs = [
    { id: "nia330", label: "NIA 330 / AICPA" },
    { id: "guiapymes", label: "GUIA NIA PYMES" },
  ];

  // Datos para la tabla NIA 330 / AICPA (para que puedas reemplazar)
  const datosNIA330 = [
    { desviaciones: "0%", rci: "BAJO" },
    { desviaciones: "1%", rci: "BAJO" },
    { desviaciones: "2%", rci: "BAJO" },
    { desviaciones: "3,3%", rci: "BAJO" },
    { desviaciones: "4%", rci: "BAJO" },
    { desviaciones: "5%", rci: "MODERADO" },
    { desviaciones: "6%", rci: "MODERADO" },
    { desviaciones: "8%", rci: "MODERADO" },
    { desviaciones: "10%", rci: "ALTO" },
  ];

  // Datos para la tabla GUIA NIA PYMES (para que puedas reemplazar)
  const datosGUIA = [
    { desviaciones: "0%", rci: "BAJO" },
    { desviaciones: "1%", rci: "BAJO" },
    { desviaciones: "2%", rci: "BAJO" },
    { desviaciones: "3,3%", rci: "MODERADO" },
    { desviaciones: "4%", rci: "ALTO" },
    { desviaciones: "5%", rci: "ALTO" },
    { desviaciones: "6%", rci: "ALTO" },
  ];

  const tablaActual = activeTab === "nia330" ? datosNIA330 : datosGUIA;

  return (
    <section className="bg-white">
      <h2 className="text-2xl font-bold text-[#0f3c73] mb-6">Desviaciones</h2>

      {/* Navegación de pestañas */}
      <div className="flex space-x-4 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? "border-[#0f3c73] text-[#0f3c73]"
                : "border-transparent text-gray-500 hover:text-[#0f3c73]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la tabla */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f3c73] to-[#008795] text-white">
              <th className="px-4 py-3 text-center rounded-tl-lg">% de desviaciones</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">RCI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {tablaActual.map((row, i) => (
              <tr key={i} className="align-middle hover:bg-gray-50 transition-colors text-zinc-800">
                <td className="px-4 py-3 text-center">{row.desviaciones}</td>
                <td className="px-4 py-3 text-center">{row.rci}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


export default function ParametrizacionPage() {
  const [activeTab, setActiveTab] = useState("confianza");

  const tabs = [
    { id: "confianza", label: "Confianza" },
    { id: "atributos", label: "Atributos" },
    { id: "frecuencia", label: "Frecuencia" },
    { id: "controles", label: "Controles" },
    { id: "factores", label: "Factores" },
    { id: "desviaciones", label: "Desviaciones" },
  ];

  return (
    <main className="mx-auto max-w-8xl p-3">
      <h1 className="text-2xl font-bold text-color-black mb-6">
        Parametrización de Muestreo
      </h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? "border-[#0f3c73] text-[#0f3c73]"
                : "border-transparent text-gray-500 hover:text-[#0f3c73]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido dinámico */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === "confianza" && <TablaConfianza />}
        {activeTab === "atributos" && <TablaAtributos />}
        {activeTab === "frecuencia" && <TablaFrecuencia />}
        {activeTab === "controles" && <TablaControles />}
        {activeTab === "factores" && <TablaFactores />}
        {activeTab === "desviaciones" && <TablaDesviaciones />}
      </div>
    </main>
  );
}
