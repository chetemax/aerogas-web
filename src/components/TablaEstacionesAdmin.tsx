"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type EstacionAdmin = {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
};

const POR_PAGINA = 10;

export default function TablaEstacionesAdmin({
  estaciones,
  eliminarEstacion,
}: {
  estaciones: EstacionAdmin[];
  eliminarEstacion: (formData: FormData) => Promise<void>;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [ciudadFiltro, setCiudadFiltro] = useState("Todas");
  const [paginaActual, setPaginaActual] = useState(1);

  const ciudades = useMemo(() => {
    const set = new Set<string>();
    estaciones.forEach((e) => {
      if (e.ciudad?.trim()) set.add(e.ciudad.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [estaciones]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return estaciones.filter((e) => {
      const okCiudad =
        ciudadFiltro === "Todas" ||
        (e.ciudad || "").trim().toLowerCase() === ciudadFiltro.toLowerCase();
      const okTexto =
        !q ||
        e.nombre.toLowerCase().includes(q) ||
        (e.ciudad || "").toLowerCase().includes(q) ||
        (e.direccion || "").toLowerCase().includes(q) ||
        String(e.id) === q;
      return okCiudad && okTexto;
    });
  }, [estaciones, busqueda, ciudadFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const inicio = (paginaSegura - 1) * POR_PAGINA;
  const visibles = filtradas.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="space-y-5">
      {/* BUSCADOR Y FILTRO POR CIUDAD */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            placeholder="Buscar estación por nombre, dirección o ID..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aerogas-blue outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={ciudadFiltro}
            onChange={(e) => {
              setCiudadFiltro(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-aerogas-blue outline-none"
          >
            <option value="Todas">Todas las ciudades ({estaciones.length})</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VISTA MÓVIL (TARJETAS SIN SCROLL HORIZONTAL) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {visibles.map((estacion) => (
          <div
            key={estacion.id}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-gray-400">
                  #{estacion.id}
                </span>
                <h3 className="font-bold text-gray-900 text-sm">
                  {estacion.nombre}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {estacion.direccion} — <strong>{estacion.ciudad}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <Link
                href={`/admin/editar/${estacion.id}`}
                className="flex-1 text-center text-blue-700 bg-blue-50 border border-blue-200 py-2 rounded-lg text-xs font-bold"
              >
                Editar
              </Link>
              <form
                action={eliminarEstacion}
                className="flex-1"
                onSubmit={(e) => {
                  if (
                    !window.confirm(
                      `¿Seguro que deseas eliminar "${estacion.nombre}"? Esta acción no se puede deshacer.`
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={estacion.id} />
                <button
                  type="submit"
                  className="w-full text-red-700 bg-red-50 border border-red-200 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        ))}

        {visibles.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500 border border-gray-200 rounded-xl">
            No se encontraron estaciones con los filtros actuales.
          </div>
        )}
      </div>

      {/* VISTA ESCRITORIO / TABLET (TABLA COMPLETA) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-aerogas-blue">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                ID
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                Estación
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibles.map((estacion) => (
              <tr
                key={estacion.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                  #{estacion.id}
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-gray-900">
                    {estacion.nombre}
                  </p>
                  <p className="text-xs text-gray-500">{estacion.direccion}</p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                  {estacion.ciudad}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href={`/admin/editar/${estacion.id}`}
                      className="text-blue-700 hover:text-white bg-blue-50 hover:bg-aerogas-blue border border-blue-200 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors"
                    >
                      Editar
                    </Link>

                    <form
                      action={eliminarEstacion}
                      onSubmit={(e) => {
                        if (
                          !window.confirm(
                            `¿Seguro que deseas eliminar "${estacion.nombre}"? Esta acción no se puede deshacer.`
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="id" value={estacion.id} />
                      <button
                        type="submit"
                        className="text-red-700 hover:text-white bg-red-50 hover:bg-aerogas-red border border-red-200 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}

            {visibles.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-gray-500 text-sm"
                >
                  {estaciones.length === 0
                    ? 'No hay estaciones registradas. Haz clic en "+ Nueva Estación" para comenzar.'
                    : "No se encontraron estaciones que coincidan con tu búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN RESPONSIVA */}
      {filtradas.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-gray-500 font-medium">
            Mostrando <strong>{inicio + 1}</strong>–
            <strong>{Math.min(inicio + POR_PAGINA, filtradas.length)}</strong>{" "}
            de <strong>{filtradas.length}</strong> estaciones
          </p>

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginación del panel"
              className="flex flex-wrap items-center justify-center gap-1.5"
            >
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaSegura === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 bg-white text-aerogas-blue hover:bg-aerogas-blue hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                (num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPaginaActual(num)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      paginaSegura === num
                        ? "bg-aerogas-red text-white shadow-sm"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-aerogas-blue"
                    }`}
                  >
                    {num}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={paginaSegura === totalPaginas}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 bg-white text-aerogas-blue hover:bg-aerogas-blue hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}