import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import FormularioReclamo, { OpcionSede } from "../../components/FormularioReclamo";
import { pool } from "../../lib/db";
import {
  obtenerFechaHoyPeruISO,
  formatearFechaPE,
} from "../../lib/diasHabiles";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones Virtual",
  description:
    "Libro de Reclamaciones Virtual de Aerogas del Norte S.A.C. conforme a la Ley N° 29571 (INDECOPI) con constancia inmediata.",
};

export const dynamic = "force-dynamic";

export default async function LibroReclamacionesPage() {
  // Consultar estaciones activas y detectar cuáles tienen servicio Market
  const [rows] = await pool.query(`
    SELECT 
      e.id, e.nombre, e.direccion, e.ciudad,
      MAX(CASE WHEN LOWER(s.nombre) LIKE '%market%' THEN 1 ELSE 0 END) AS tiene_market
    FROM estaciones e
    LEFT JOIN estacion_servicios es ON e.id = es.estacion_id
    LEFT JOIN servicios s ON es.servicio_id = s.id
    WHERE e.activo = 1
    GROUP BY e.id, e.nombre, e.direccion, e.ciudad
    ORDER BY e.id ASC
  `);

  const estaciones = rows as any[];

  const sedes: OpcionSede[] = [
    ...estaciones.map((e) => ({
      key: `estacion:${e.id}`,
      grupo: "Estaciones de Servicio" as const,
      nombre: e.nombre,
      direccion: `${e.direccion}, ${e.ciudad}`,
    })),
    ...estaciones
      .filter((e) => Number(e.tiene_market) === 1)
      .map((e) => ({
        key: `aeromarket:${e.id}`,
        grupo: "Tiendas AeroMarket" as const,
        nombre: `AeroMarket — ${e.nombre}`,
        direccion: `${e.direccion}, ${e.ciudad}`,
      })),
    {
      key: "web",
      grupo: "Atención Corporativa",
      nombre: "Oficina Central / Canal Web - Aerogas del Norte",
      direccion: "Chiclayo, Lambayeque, Perú",
    },
  ];

  const fechaHoyTexto = formatearFechaPE(obtenerFechaHoyPeruISO());

  return (
    <main className="min-h-screen flex flex-col bg-gray-100 w-full overflow-x-hidden">
      <Navbar />

      <div className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* ENCABEZADO OFICIAL */}
          <div className="bg-aerogas-blue text-white rounded-t-2xl p-6 sm:p-8 border-b-4 border-aerogas-red shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                    Código de Protección y Defensa del Consumidor — Ley N° 29571
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                    Libro de Reclamaciones Virtual
                  </h1>
                </div>
              </div>
            </div>
            <p className="text-sm text-blue-100 mt-4 leading-relaxed">
              Conforme al D.S. N° 011-2011-PCM y la Ley N° 31435, este establecimiento cuenta con un Libro de Reclamaciones Virtual a su disposición. Al finalizar recibirá su constancia oficial imprimible y una copia en su correo electrónico.
            </p>
          </div>

          {/* CUERPO DEL FORMULARIO */}
          <div className="bg-white rounded-b-2xl shadow-xl border border-t-0 border-gray-200 p-6 sm:p-10">
            <FormularioReclamo sedes={sedes} fechaHoyTexto={fechaHoyTexto} />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}