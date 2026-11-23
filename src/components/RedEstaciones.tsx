"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import MapaEstaciones, { UbicacionUsuario } from "./MapaEstaciones";

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

type EstacionConDistancia = Estacion & {
  distanciaKm: number | null;
};

const ESTACIONES_POR_PAGINA = 6; // 2 filas de 3 columnas

function parseCoordenada(valor: string): number | null {
  if (!valor) return null;
  const num = parseFloat(String(valor).replace(",", "."));
  return isNaN(num) ? null : num;
}

// Fórmula de Haversine para distancia real en kilómetros entre dos coordenadas GPS
function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio medio de la Tierra en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatearDistancia(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export default function RedEstaciones({
  estaciones,
}: {
  estaciones: Estacion[];
}) {
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>("Todas");
  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<string>("Todos");
  const [ubicacionUsuario, setUbicacionUsuario] =
    useState<UbicacionUsuario | null>(null);
  const [buscandoGps, setBuscandoGps] = useState<boolean>(false);
  const [errorGps, setErrorGps] = useState<string>("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const gridRef = useRef<HTMLDivElement>(null);

  // 1. Ciudades disponibles con conteo
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

  // 2. Servicios/combustibles disponibles (calculados sobre la ciudad activa para evitar filtros vacíos)
  const serviciosDisponibles = useMemo(() => {
    const base =
      ciudadSeleccionada === "Todas"
        ? estaciones
        : estaciones.filter(
            (est) =>
              (est.ciudad || "").trim().toLowerCase() ===
              ciudadSeleccionada.toLowerCase()
          );

    const conteo = new Map<string, { nombre: string; cantidad: number }>();
    base.forEach((est) => {
      const vistosEnEstacion = new Set<string>();
      est.servicios.forEach((srv) => {
        const limpio = srv.trim();
        if (!limpio) return;
        const clave = limpio.toLowerCase();
        if (vistosEnEstacion.has(clave)) return;
        vistosEnEstacion.add(clave);

        if (conteo.has(clave)) {
          conteo.get(clave)!.cantidad += 1;
        } else {
          conteo.set(clave, { nombre: limpio, cantidad: 1 });
        }
      });
    });

    return Array.from(conteo.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );
  }, [estaciones, ciudadSeleccionada]);

  // 3. Aplicar filtros combinados (ciudad + servicio) y calcular/ordenar distancia si el GPS está activo
  const estacionesProcesadas: EstacionConDistancia[] = useMemo(() => {
    const filtradas = estaciones.filter((est) => {
      const cumpleCiudad =
        ciudadSeleccionada === "Todas" ||
        (est.ciudad || "").trim().toLowerCase() ===
          ciudadSeleccionada.toLowerCase();

      const cumpleServicio =
        servicioSeleccionado === "Todos" ||
        est.servicios.some(
          (s) => s.trim().toLowerCase() === servicioSeleccionado.toLowerCase()
        );

      return cumpleCiudad && cumpleServicio;
    });

    const conDistancia: EstacionConDistancia[] = filtradas.map((est) => {
      if (!ubicacionUsuario) {
        return { ...est, distanciaKm: null };
      }
      const lat = parseCoordenada(est.latitud);
      const lon = parseCoordenada(est.longitud);
      if (lat === null || lon === null) {
        return { ...est, distanciaKm: null };
      }
      return {
        ...est,
        distanciaKm: calcularDistanciaKm(
          ubicacionUsuario.lat,
          ubicacionUsuario.lon,
          lat,
          lon
        ),
      };
    });

    if (ubicacionUsuario) {
      conDistancia.sort((a, b) => {
        if (a.distanciaKm === null && b.distanciaKm === null) return 0;
        if (a.distanciaKm === null) return 1;
        if (b.distanciaKm === null) return -1;
        return a.distanciaKm - b.distanciaKm;
      });
    }

    return conDistancia;
  }, [estaciones, ciudadSeleccionada, servicioSeleccionado, ubicacionUsuario]);

  const estacionMasCercana = useMemo(() => {
    if (!ubicacionUsuario) return null;
    return (
      estacionesProcesadas.find((e) => typeof e.distanciaKm === "number") ||
      null
    );
  }, [ubicacionUsuario, estacionesProcesadas]);

  // 4. Paginación segura
  const totalEstaciones = estacionesProcesadas.length;
  const totalPaginas = Math.ceil(totalEstaciones / ESTACIONES_POR_PAGINA);
  const paginaSegura =
    totalPaginas > 0 ? Math.min(paginaActual, totalPaginas) : 1;
  const indiceInicio = (paginaSegura - 1) * ESTACIONES_POR_PAGINA;
  const indiceFin = Math.min(
    indiceInicio + ESTACIONES_POR_PAGINA,
    totalEstaciones
  );
  const estacionesVisibles = estacionesProcesadas.slice(
    indiceInicio,
    indiceInicio + ESTACIONES_POR_PAGINA
  );

  // Manejadores de filtros
  const handleCambiarCiudad = (ciudad: string) => {
    setCiudadSeleccionada(ciudad);
    setServicioSeleccionado("Todos");
    setPaginaActual(1);
  };

  const handleCambiarServicio = (servicio: string) => {
    setServicioSeleccionado(servicio);
    setPaginaActual(1);
  };

  const handleLimpiarFiltros = () => {
    setCiudadSeleccionada("Todas");
    setServicioSeleccionado("Todos");
    setUbicacionUsuario(null);
    setErrorGps("");
    setPaginaActual(1);
  };

  const handleBuscarMasCercana = () => {
    setErrorGps("");

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setErrorGps("Tu navegador no soporta geolocalización GPS.");
      return;
    }

    setBuscandoGps(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacionUsuario({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        // Mostrar todas las ciudades para encontrar realmente la más cercana (manteniendo el combustible si eligió uno)
        setCiudadSeleccionada("Todas");
        setPaginaActual(1);
        setBuscandoGps(false);
      },
      (err) => {
        setBuscandoGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorGps(
            "Permiso de ubicación denegado. Activa el GPS en tu navegador para ubicar la estación más cercana."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorGps(
            "No pudimos determinar tu ubicación actual. Intenta nuevamente."
          );
        } else {
          setErrorGps(
            "La solicitud de ubicación tardó demasiado. Intenta nuevamente."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPaginaActual(nuevaPagina);

    if (gridRef.current) {
      const posicion =
        gridRef.current.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: posicion, behavior: "smooth" });
    }
  };

  const obtenerUrlRuta = (est: Estacion) => {
    const lat = parseCoordenada(est.latitud);
    const lon = parseCoordenada(est.longitud);
    if (lat !== null && lon !== null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    }
    return est.mapa_url || "";
  };

  return (
    <div>
      {/* PANEL DE FILTROS INTELIGENTES */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 mb-8 space-y-5">
        {/* FILA 1: FILTRO POR CIUDAD + BOTÓN GPS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mr-1">
              Ciudad:
            </span>

            <button
              type="button"
              onClick={() => handleCambiarCiudad("Todas")}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                ciudadSeleccionada === "Todas"
                  ? "bg-aerogas-blue text-white border-aerogas-blue shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:border-aerogas-blue hover:text-aerogas-blue"
              }`}
            >
              <span>Todas</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
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
                ciudadSeleccionada.toLowerCase() ===
                ciudad.nombre.toLowerCase();
              return (
                <button
                  key={ciudad.nombre}
                  type="button"
                  onClick={() => handleCambiarCiudad(ciudad.nombre)}
                  className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                    activo
                      ? "bg-aerogas-blue text-white border-aerogas-blue shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:border-aerogas-blue hover:text-aerogas-blue"
                  }`}
                >
                  <span>{ciudad.nombre}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
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

          {/* BOTÓN GEOLOCALIZACIÓN "ESTACIÓN MÁS CERCANA" */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={handleBuscarMasCercana}
              disabled={buscandoGps}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-aerogas-red hover:bg-red-700 disabled:bg-gray-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:cursor-wait"
            >
              {buscandoGps ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Ubicando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M12 2v3m0 14v3m10-10h-3M5 12H2m15.364 0a5.364 5.364 0 11-10.728 0 5.364 5.364 0 0110.728 0z"
                    />
                  </svg>
                  Estación más cercana
                </>
              )}
            </button>

            {ubicacionUsuario && (
              <button
                type="button"
                onClick={() => {
                  setUbicacionUsuario(null);
                  setPaginaActual(1);
                }}
                title="Desactivar orden por ubicación GPS"
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer shrink-0"
              >
                Quitar GPS
              </button>
            )}
          </div>
        </div>

        {/* FILA 2: FILTRO POR COMBUSTIBLE / SERVICIO */}
        {serviciosDisponibles.length > 0 && (
          <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mr-1">
              Combustible / Servicio:
            </span>

            <button
              type="button"
              onClick={() => handleCambiarServicio("Todos")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                servicioSeleccionado === "Todos"
                  ? "bg-aerogas-red text-white border-aerogas-red shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:border-aerogas-red hover:text-aerogas-red"
              }`}
            >
              Todos
            </button>

            {serviciosDisponibles.map((srv) => {
              const activo =
                servicioSeleccionado.toLowerCase() === srv.nombre.toLowerCase();
              return (
                <button
                  key={srv.nombre}
                  type="button"
                  onClick={() => handleCambiarServicio(srv.nombre)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    activo
                      ? "bg-aerogas-red text-white border-aerogas-red shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:border-aerogas-red hover:text-aerogas-red"
                  }`}
                >
                  <span>{srv.nombre}</span>
                  <span
                    className={`text-[11px] px-1.5 rounded-full ${
                      activo
                        ? "bg-white/25 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {srv.cantidad}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ALERTA DE ERROR GPS */}
        {errorGps && (
          <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 px-4 py-3 rounded-r-lg text-xs sm:text-sm font-medium">
            {errorGps}
          </div>
        )}

        {/* TARJETA DESTACADA DE LA ESTACIÓN MÁS CERCANA */}
        {estacionMasCercana &&
          typeof estacionMasCercana.distanciaKm === "number" && (
            <div className="bg-white border-2 border-aerogas-blue rounded-xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                      Estación más cercana — A{" "}
                      {formatearDistancia(estacionMasCercana.distanciaKm)} de ti
                    </span>
                    {servicioSeleccionado !== "Todos" && (
                      <span className="text-[11px] font-bold text-aerogas-red bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        Con {servicioSeleccionado}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-aerogas-blue">
                    {estacionMasCercana.nombre}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {estacionMasCercana.direccion}, {estacionMasCercana.ciudad}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {obtenerUrlRuta(estacionMasCercana) && (
                  <a
                    href={obtenerUrlRuta(estacionMasCercana)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-aerogas-red hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs sm:text-sm transition-colors shadow-sm"
                  >
                    Cómo llegar (Maps)
                  </a>
                )}
                <Link
                  href={`/estacion/${estacionMasCercana.id}`}
                  className="inline-flex items-center gap-1.5 bg-aerogas-blue hover:bg-blue-900 text-white font-bold px-4 py-2.5 rounded-lg text-xs sm:text-sm transition-colors"
                >
                  Ver Detalles
                </Link>
              </div>
            </div>
          )}
      </div>

      {/* MAPA INTERACTIVO SINCRONIZADO */}
      <div className="mb-14">
        <MapaEstaciones
          estaciones={estacionesProcesadas}
          ubicacionUsuario={ubicacionUsuario}
          estacionDestacadaId={estacionMasCercana?.id || null}
        />
      </div>

      {/* ENCABEZADO DE CONTEO SOBRE LAS TARJETAS */}
      <div
        ref={gridRef}
        className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 gap-2 text-center sm:text-left"
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
              en{" "}
              <span className="font-bold text-aerogas-red">
                {ciudadSeleccionada}
              </span>
            </>
          )}
          {servicioSeleccionado !== "Todos" && (
            <>
              {" "}
              con{" "}
              <span className="font-bold text-aerogas-red">
                {servicioSeleccionado}
              </span>
            </>
          )}
          {ubicacionUsuario && (
            <span className="text-green-700 font-semibold">
              {" "}
              (ordenadas por cercanía)
            </span>
          )}
        </p>

        {totalPaginas > 1 && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Página {paginaSegura} de {totalPaginas}
          </p>
        )}
      </div>

      {/* CUADRÍCULA DE TARJETAS (MÁXIMO 2 FILAS DE 3) */}
      {estacionesVisibles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {estacionesVisibles.map((estacion) => {
            const urlRuta = obtenerUrlRuta(estacion);
            const esLaMasCercana =
              estacionMasCercana && estacionMasCercana.id === estacion.id;

            return (
              <div
                key={estacion.id}
                className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden border ${
                  esLaMasCercana
                    ? "border-aerogas-blue ring-2 ring-aerogas-blue/20"
                    : "border-gray-200"
                }`}
              >
                <div className="w-full h-48 bg-gray-200 relative">
                  <img
                    src={estacion.imagen}
                    alt={`Fotografía de ${estacion.nombre}`}
                    className="w-full h-full object-cover"
                  />

                  {typeof estacion.distanciaKm === "number" && (
                    <span className="absolute top-3 right-3 bg-aerogas-blue/95 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md border border-white/20">
                      A {formatearDistancia(estacion.distanciaKm)}
                    </span>
                  )}

                  {esLaMasCercana && (
                    <span className="absolute top-3 left-3 bg-green-600 text-white text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-md">
                      Más cercana
                    </span>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-aerogas-blue mb-2">
                    {estacion.nombre}
                  </h3>

                  <p className="text-gray-500 mb-4 flex items-start gap-2 text-sm">
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
                    {estacion.servicios.map(
                      (servicio: string, index: number) => {
                        const servicioActivo =
                          servicioSeleccionado !== "Todos" &&
                          servicio.trim().toLowerCase() ===
                            servicioSeleccionado.toLowerCase();
                        return (
                          <span
                            key={index}
                            className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              servicioActivo
                                ? "bg-aerogas-red text-white border-aerogas-red"
                                : "bg-aerogas-gray text-aerogas-blue border-gray-300"
                            }`}
                          >
                            {servicio}
                          </span>
                        );
                      }
                    )}
                  </div>

                  <div className="mt-auto flex gap-2.5">
                    <Link
                      href={`/estacion/${estacion.id}`}
                      className="flex-1 bg-aerogas-blue hover:bg-blue-900 text-white font-semibold py-2.5 px-3 rounded-lg transition-colors text-center text-sm"
                    >
                      Ver Detalles
                    </Link>

                    {urlRuta && (
                      <a
                        href={urlRuta}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-100 hover:bg-aerogas-red text-aerogas-blue hover:text-white border border-gray-300 hover:border-aerogas-red font-semibold py-2.5 px-3.5 rounded-lg transition-colors text-center text-sm shrink-0"
                      >
                        Cómo llegar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center space-y-4">
          <p className="text-gray-600 font-medium">
            No encontramos estaciones que cumplan con esta combinación de filtros.
          </p>
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="bg-aerogas-blue hover:bg-blue-900 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Ver todas las estaciones
          </button>
        </div>
      )}

      {/* BARRA DE PAGINACIÓN CORPORATIVA RESPONSIVA */}
      {totalPaginas > 1 && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <nav
            aria-label="Paginación de estaciones"
            className="inline-flex flex-wrap justify-center items-center gap-2 max-w-full bg-gray-50 p-2 rounded-xl border border-gray-200 shadow-sm"
          >
            <button
              type="button"
              onClick={() => handleCambiarPagina(paginaSegura - 1)}
              disabled={paginaSegura === 1}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold text-aerogas-blue bg-white border border-gray-200 hover:bg-aerogas-blue hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-aerogas-blue disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex flex-wrap justify-center items-center gap-1.5 px-1">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                (num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleCambiarPagina(num)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      paginaSegura === num
                        ? "bg-aerogas-red text-white shadow-md scale-105"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-aerogas-blue hover:text-aerogas-blue"
                    }`}
                  >
                    {num}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => handleCambiarPagina(paginaSegura + 1)}
              disabled={paginaSegura === totalPaginas}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold text-aerogas-blue bg-white border border-gray-200 hover:bg-aerogas-blue hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-aerogas-blue disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </nav>

          <p className="text-xs text-gray-500">
            Mostrando {indiceInicio + 1}–{indiceFin} de {totalEstaciones}{" "}
            estaciones disponibles
          </p>
        </div>
      )}
    </div>
  );
}