"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import MapaEstaciones from "./MapaEstaciones";

export type Estacion = {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  imagen: string;
  mapa_url: string;
  latitud: string;
  longitud: string;
  servicios: string[];
};

const ESTACIONES_POR_PAGINA = 6; // 2 filas de 3 columnas

export default function RedEstaciones({ estaciones }: { estaciones: Estacion[] }) {
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>("Todas");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const gridRef = useRef<HTMLDivElement>(null);

  // Construir automáticamente la lista de ciudades y su conteo
  const ciudades = useMemo(() => {
    const conteo = new Map<string, { nombre: string; cantidad: number }>();
    estaciones.forEach((est) => {
      const nombreLimpio = (est.ciudad || "").trim();
      if (!nombreLimpio) return;
      const clave = nombreLimpio.toLowerCase();
      if (conteo.has(clave)) {
        conteo.get(clave)!.cantidad += 1;
      } else {
        conteo.set(clave, { nombre: nombreLimpio, cantidad: 1 });
      }
    });
    return Array.from(conteo.values());
  }, [estaciones]);

  // Estaciones filtradas por ciudad (alimenta tanto al mapa como a las tarjetas)
  const estacionesFiltradas = useMemo(() => {
    if (ciudadSeleccionada === "Todas") return estaciones;
    return estaciones.filter(
      (est) =>
        (est.ciudad || "").trim().toLowerCase() ===
        ciudadSeleccionada.toLowerCase()
    );
  }, [estaciones, ciudadSeleccionada]);

  // Cálculos de paginación
  const totalEstaciones = estacionesFiltradas.length;
  const totalPaginas = Math.ceil(totalEstaciones / ESTACIONES_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ESTACIONES_POR_PAGINA;
  const indiceFin = Math.min(indiceInicio + ESTACIONES_POR_PAGINA, totalEstaciones);
  const estacionesVisibles = estacionesFiltradas.slice(
    indiceInicio,
    indiceInicio + ESTACIONES_POR_PAGINA
  );

  const handleCambiarCiudad = (ciudad: string) => {
    setCiudadSeleccionada(ciudad);
    setPaginaActual(1);
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPaginaActual(nuevaPagina);

    // Desplazamiento suave al inicio de las tarjetas para que no quede al final
    if (gridRef.current) {
      const posicion =
        gridRef.current.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: posicion, behavior: "smooth" });
    }
  };

  return (
    <div>
      {/* FILTROS POR CIUDAD (Mueven el mapa y filtran las tarjetas) */}
      <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => handleCambiarCiudad("Todas")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer border ${
            ciudadSeleccionada === "Todas"
              ? "bg-aerogas-blue text-white border-aerogas-blue shadow-md"
              : "bg-white text-gray-700 border-gray-300 hover:border-aerogas-blue hover:text-aerogas-blue"
          }`}
        >
          <span>Todas</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              ciudadSeleccionada === "Todas"
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {estaciones.length}
          </span>
        </button>

        {ciudades.map((ciudad) => {
          const activo =
            ciudadSeleccionada.toLowerCase() === ciudad.nombre.toLowerCase();
          return (
            <button
              key={ciudad.nombre}
              type="button"
              onClick={() => handleCambiarCiudad(ciudad.nombre)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer border ${
                activo
                  ? "bg-aerogas-blue text-white border-aerogas-blue shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:border-aerogas-blue hover:text-aerogas-blue"
              }`}
            >
              <span>{ciudad.nombre}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activo
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {ciudad.cantidad}
              </span>
            </button>
          );
        })}
      </div>

      {/* MAPA INTERACTIVO SINCRONIZADO CON EL FILTRO */}
      <div className="mb-14">
        <MapaEstaciones estaciones={estacionesFiltradas} />
      </div>

      {/* ENCABEZADO DE CONTEO SOBRE LAS TARJETAS */}
      <div
        ref={gridRef}
        className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 gap-2"
      >
        <p className="text-sm text-gray-600 font-medium">
          Mostrando{" "}
          <span className="font-bold text-aerogas-blue">
            {totalEstaciones > 0 ? indiceInicio + 1 : 0}–{indiceFin}
          </span>{" "}
          de{" "}
          <span className="font-bold text-aerogas-blue">{totalEstaciones}</span>{" "}
          {totalEstaciones === 1 ? "estación" : "estaciones"}
          {ciudadSeleccionada !== "Todas" && (
            <>
              {" "}
              en <span className="font-bold text-aerogas-red">{ciudadSeleccionada}</span>
            </>
          )}
        </p>

        {totalPaginas > 1 && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Página {paginaActual} de {totalPaginas}
          </p>
        )}
      </div>

      {/* CUADRÍCULA DE TARJETAS (MÁXIMO 2 FILAS DE 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {estacionesVisibles.map((estacion) => (
          <div
            key={estacion.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden"
          >
            <div className="w-full h-48 bg-gray-200 relative">
              <img
                src={estacion.imagen}
                alt={`Fotografía de ${estacion.nombre}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-aerogas-blue mb-2">
                {estacion.nombre}
              </h3>

              <p className="text-gray-500 mb-4 flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-aerogas-red shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span>
                  {estacion.direccion}, {estacion.ciudad}
                </span>
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {estacion.servicios.map((servicio: string, index: number) => (
                  <span
                    key={index}
                    className="bg-aerogas-gray text-aerogas-blue text-xs font-bold px-3 py-1 rounded-full border border-gray-300"
                  >
                    {servicio}
                  </span>
                ))}
              </div>

              <Link
                href={`/estacion/${estacion.id}`}
                className="w-full bg-aerogas-blue hover:bg-blue-900 text-white font-semibold py-3 rounded-lg transition-colors mt-auto text-center inline-block"
              >
                Ver Detalles
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* BARRA DE PAGINACIÓN CORPORATIVA */}
      {totalPaginas > 1 && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <nav
            aria-label="Paginación de estaciones"
            className="inline-flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 shadow-sm"
          >
            {/* Botón Anterior */}
            <button
              type="button"
              onClick={() => handleCambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-aerogas-blue bg-white border border-gray-200 hover:bg-aerogas-blue hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-aerogas-blue disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1.5 px-1">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleCambiarPagina(num)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    paginaActual === num
                      ? "bg-aerogas-red text-white shadow-md scale-105"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-aerogas-blue hover:text-aerogas-blue"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Botón Siguiente */}
            <button
              type="button"
              onClick={() => handleCambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-aerogas-blue bg-white border border-gray-200 hover:bg-aerogas-blue hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-aerogas-blue disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>

          <p className="text-xs text-gray-500">
            Mostrando {indiceInicio + 1}–{indiceFin} de {totalEstaciones} estaciones disponibles
          </p>
        </div>
      )}
    </div>
  );
}