"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type ReclamoResumen = {
  id: number;
  codigo_reclamo: string;
  fecha_registro_texto: string;
  fecha_limite_texto: string;
  sede_nombre: string;
  tipo_documento: string;
  numero_documento: string;
  nombres_apellidos: string;
  email: string;
  tipo_registro: "RECLAMO" | "QUEJA";
  estado: "PENDIENTE" | "ATENDIDO";
  fecha_respuesta_texto: string | null;
  dias_restantes: number;
  correo_constancia_enviado: boolean;
  correo_respuesta_enviado: boolean;
};

export default function TablaReclamaciones({
  reclamaciones,
}: {
  reclamaciones: ReclamoResumen[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "PENDIENTE" | "ATENDIDO">("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | "RECLAMO" | "QUEJA">("TODOS");

  // Métricas rápidas para la barra superior
  const metricas = useMemo(() => {
    const pendientes = reclamaciones.filter((r) => r.estado === "PENDIENTE");
    const urgentes = pendientes.filter((r) => r.dias_restantes <= 5);
    const atendidos = reclamaciones.filter((r) => r.estado === "ATENDIDO");
    return {
      total: reclamaciones.length,
      pendientes: pendientes.length,
      urgentes: urgentes.length,
      atendidos: atendidos.length,
    };
  }, [reclamaciones]);

  // Filtrado combinado
  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return reclamaciones.filter((r) => {
      if (filtroEstado !== "TODOS" && r.estado !== filtroEstado) return false;
      if (filtroTipo !== "TODOS" && r.tipo_registro !== filtroTipo) return false;
      if (termino) {
        const coincide =
          r.codigo_reclamo.toLowerCase().includes(termino) ||
          r.numero_documento.toLowerCase().includes(termino) ||
          r.nombres_apellidos.toLowerCase().includes(termino) ||
          r.sede_nombre.toLowerCase().includes(termino);
        if (!coincide) return false;
      }
      return true;
    });
  }, [reclamaciones, busqueda, filtroEstado, filtroTipo]);

  function renderSemaforo(r: ReclamoResumen) {
    if (r.estado === "ATENDIDO") {
      return (
        <div className="inline-flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-green-100 text-green-800 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-600" />
            Atendido
          </span>
          {r.fecha_respuesta_texto && (
            <span className="text-[11px] text-gray-500 mt-1">
              {r.fecha_respuesta_texto}
            </span>
          )}
        </div>
      );
    }

    if (r.dias_restantes < 0) {
      return (
        <div className="inline-flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Vencido ({Math.abs(r.dias_restantes)}d)
          </span>
          <span className="text-[11px] text-red-600 font-semibold mt-1">
            Límite: {r.fecha_limite_texto}
          </span>
        </div>
      );
    }

    if (r.dias_restantes === 0) {
      return (
        <div className="inline-flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Vence hoy
          </span>
          <span className="text-[11px] text-red-600 font-semibold mt-1">
            Límite: {r.fecha_limite_texto}
          </span>
        </div>
      );
    }

    if (r.dias_restantes <= 5) {
      return (
        <div className="inline-flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Quedan {r.dias_restantes} {r.dias_restantes === 1 ? "día" : "días"}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold mt-1">
            Límite: {r.fecha_limite_texto}
          </span>
        </div>
      );
    }

    return (
      <div className="inline-flex flex-col items-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-aerogas-blue border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Quedan {r.dias_restantes} días
        </span>
        <span className="text-[11px] text-gray-500 mt-1">
          Límite: {r.fecha_limite_texto}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Total Hojas</p>
          <p className="text-3xl font-extrabold text-aerogas-blue mt-1">
            {metricas.total}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Pendientes</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">
            {metricas.pendientes}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-red-600">
            Urgentes (&le; 5 días hábiles)
          </p>
          <p className="text-3xl font-extrabold text-aerogas-red mt-1">
            {metricas.urgentes}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Atendidos</p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">
            {metricas.atendidos}
          </p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Buscador */}
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
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, DNI/RUC, cliente o sede..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aerogas-blue outline-none"
          />
        </div>

        {/* Selectores de filtro */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-xs font-bold">
            {(["TODOS", "PENDIENTE", "ATENDIDO"] as const).map((est) => (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est)}
                className={`px-3.5 py-2 transition-colors cursor-pointer ${
                  filtroEstado === est
                    ? "bg-aerogas-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {est === "TODOS"
                  ? "Todos"
                  : est === "PENDIENTE"
                  ? "Pendientes"
                  : "Atendidos"}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-xs font-bold">
            {(["TODOS", "RECLAMO", "QUEJA"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3.5 py-2 transition-colors cursor-pointer ${
                  filtroTipo === tipo
                    ? "bg-aerogas-red text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tipo === "TODOS"
                  ? "Todos"
                  : tipo === "RECLAMO"
                  ? "Reclamos"
                  : "Quejas"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLA DE HOJAS DE RECLAMACIÓN */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-aerogas-blue">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                  N° Hoja / Fecha
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Establecimiento
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Consumidor
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Plazo Legal (15d Hábiles)
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-sm">
              {filtrados.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-extrabold text-aerogas-blue">
                      {r.codigo_reclamo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.fecha_registro_texto}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800 text-xs sm:text-sm max-w-[220px]">
                      {r.sede_nombre}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900">
                      {r.nombres_apellidos}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.tipo_documento}: {r.numero_documento}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-extrabold ${
                        r.tipo_registro === "RECLAMO"
                          ? "bg-red-50 text-aerogas-red border border-red-200"
                          : "bg-purple-50 text-purple-800 border border-purple-200"
                      }`}
                    >
                      {r.tipo_registro}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    {renderSemaforo(r)}
                  </td>

                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    <Link
                      href={`/admin/reclamaciones/${r.id}`}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm ${
                        r.estado === "PENDIENTE"
                          ? "bg-aerogas-red hover:bg-red-700 text-white"
                          : "bg-blue-50 hover:bg-aerogas-blue text-aerogas-blue hover:text-white border border-blue-200"
                      }`}
                    >
                      {r.estado === "PENDIENTE" ? "Atender" : "Ver Hoja"}
                    </Link>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 text-sm"
                  >
                    {reclamaciones.length === 0
                      ? "Aún no existen registros en el Libro de Reclamaciones Virtual."
                      : "No se encontraron hojas que coincidan con los filtros seleccionados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AVISO DE CONSERVACIÓN LEGAL */}
      <p className="text-xs text-gray-500 text-center">
        Por disposición del D.S. N° 011-2011-PCM (INDECOPI), las hojas de reclamación son inmutables y no pueden eliminarse del historial durante un mínimo de 2 años.
      </p>
    </div>
  );
}