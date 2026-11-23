import Link from "next/link";
import { pool } from "../../../lib/db";
import {
  calcularDiasHabilesRestantes,
  formatearFechaPE,
  formatearFechaHoraPE,
} from "../../../lib/diasHabiles";
import TablaReclamaciones, {
  ReclamoResumen,
} from "../../../components/TablaReclamaciones";

export const dynamic = "force-dynamic";

function aFechaISO(valor: Date | string): string {
  if (valor instanceof Date) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, "0");
    const d = String(valor.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(valor).split("T")[0];
}

export default async function AdminReclamacionesPage() {
  // Orden: Pendientes primero (más urgentes arriba), luego Atendidos (más recientes arriba)
  const [rows] = await pool.query(`
    SELECT 
      id, codigo_reclamo, fecha_registro, fecha_limite,
      sede_nombre, tipo_documento, numero_documento, nombres_apellidos, email,
      tipo_registro, estado, fecha_respuesta,
      correo_constancia_enviado, correo_respuesta_enviado
    FROM libro_reclamaciones
    ORDER BY 
      CASE WHEN estado = 'PENDIENTE' THEN 0 ELSE 1 END ASC,
      fecha_limite ASC,
      id DESC
  `);

  const reclamaciones: ReclamoResumen[] = (rows as any[]).map((row) => {
    const fechaLimiteISO = aFechaISO(row.fecha_limite);
    return {
      id: row.id,
      codigo_reclamo: row.codigo_reclamo,
      fecha_registro_texto: formatearFechaHoraPE(row.fecha_registro),
      fecha_limite_texto: formatearFechaPE(fechaLimiteISO),
      sede_nombre: row.sede_nombre,
      tipo_documento: row.tipo_documento,
      numero_documento: row.numero_documento,
      nombres_apellidos: row.nombres_apellidos,
      email: row.email,
      tipo_registro: row.tipo_registro,
      estado: row.estado,
      fecha_respuesta_texto: row.fecha_respuesta
        ? formatearFechaPE(row.fecha_respuesta)
        : null,
      dias_restantes: calcularDiasHabilesRestantes(fechaLimiteISO),
      correo_constancia_enviado: Number(row.correo_constancia_enviado) === 1,
      correo_respuesta_enviado: Number(row.correo_respuesta_enviado) === 1,
    };
  });

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ENCABEZADO */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-aerogas-blue/10 text-aerogas-blue flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-aerogas-blue">
                Libro de Reclamaciones
              </h1>
              <p className="text-sm text-gray-500">
                Control de plazos INDECOPI (15 días hábiles improrrogables) y respuestas oficiales
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/libro-de-reclamaciones"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-aerogas-blue font-semibold border border-blue-200 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Ver Formulario Público
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Volver al Panel
            </Link>
          </div>
        </div>

        {/* TABLA INTERACTIVA */}
        <TablaReclamaciones reclamaciones={reclamaciones} />
      </div>
    </main>
  );
}