import Link from "next/link";
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
import BotonImprimir from "../../../../components/BotonImprimir";
import { pool } from "../../../../lib/db";
import {
  formatearFechaPE,
  formatearFechaHoraPE,
} from "../../../../lib/diasHabiles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ConstanciaReclamoPage({
  params,
  searchParams,
}: Props) {
  const { codigo } = await params;
  const { token } = await searchParams;

  let reclamo: any = null;

  if (codigo && token) {
    const [rows] = await pool.query(
      "SELECT * FROM libro_reclamaciones WHERE codigo_reclamo = ? AND token_acceso = ? LIMIT 1",
      [codigo, token]
    );
    reclamo = (rows as any[])[0] || null;
  }

  if (!reclamo) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-28 pb-16 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <h1 className="text-xl font-extrabold text-aerogas-red mb-2">
              Constancia no disponible
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              El enlace de la Hoja de Reclamación es inválido o no cuenta con autorización de acceso.
            </p>
            <Link
              href="/libro-de-reclamaciones"
              className="inline-block bg-aerogas-blue hover:bg-blue-900 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Ir al Libro de Reclamaciones
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const montoFormateado = Number(reclamo.monto_reclamado || 0).toFixed(2);
  const correoEnviado = Number(reclamo.correo_constancia_enviado) === 1;

  return (
    <main className="min-h-screen flex flex-col bg-gray-100 print:bg-white w-full overflow-x-hidden">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 print:p-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* BARRA DE ACCIONES Y CONFIRMACIÓN (OCULTA AL IMPRIMIR) */}
          <div className="print:hidden space-y-4">
            <div
              className={`rounded-xl p-4 border-l-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                correoEnviado
                  ? "bg-green-50 border-green-600 text-green-900"
                  : "bg-amber-50 border-amber-500 text-amber-900"
              }`}
            >
              <div className="text-sm">
                <p className="font-extrabold">
                  Hoja de Reclamación N° {reclamo.codigo_reclamo} registrada con éxito.
                </p>
                <p className="text-xs mt-0.5">
                  {correoEnviado
                    ? `Se ha enviado una copia oficial al correo ${reclamo.email}. También puede imprimir o guardar esta constancia en PDF.`
                    : "Su registro fue guardado correctamente. Recomendamos hacer clic en 'Imprimir / Guardar en PDF' para conservar su constancia."}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <BotonImprimir />
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>

          {/* FORMATO OFICIAL IMPRIMIBLE INDECOPI */}
          <article className="bg-white rounded-2xl shadow-xl border border-gray-300 overflow-hidden print:shadow-none print:rounded-none print:border-gray-400">
            {/* CABECERA */}
            <div className="bg-aerogas-blue text-white p-6 border-b-4 border-aerogas-red print:bg-white print:text-black print:border-b-2 print:border-black">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-blue-200 print:text-gray-600 font-bold">
                    Libro de Reclamaciones Virtual — Ley N° 29571
                  </p>
                  <h1 className="text-2xl font-extrabold mt-1">
                    HOJA DE RECLAMACIÓN
                  </h1>
                  <p className="text-sm font-semibold mt-1">
                    AEROGAS DEL NORTE S.A.C. — RUC: 20458378747
                  </p>
                </div>

                <div className="bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-left sm:text-right print:border-black print:bg-gray-100">
                  <span className="block text-xs uppercase font-bold text-blue-200 print:text-gray-600">
                    N° de Hoja
                  </span>
                  <span className="text-xl font-extrabold tracking-wider">
                    {reclamo.codigo_reclamo}
                  </span>
                </div>
              </div>
            </div>

            {/* METADATOS Y SEDE */}
            <div className="p-6 sm:p-8 space-y-6 text-sm text-gray-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-500">
                    Fecha y Hora de Registro
                  </span>
                  <span className="font-bold">
                    {formatearFechaHoraPE(reclamo.fecha_registro)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-500">
                    Fecha Límite de Respuesta
                  </span>
                  <span className="font-bold text-aerogas-red print:text-black">
                    {formatearFechaPE(reclamo.fecha_limite)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-500">
                    Estado Actual
                  </span>
                  <span
                    className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      reclamo.estado === "ATENDIDO"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {reclamo.estado}
                  </span>
                </div>
                <div className="sm:col-span-3 pt-2 border-t border-gray-200">
                  <span className="block text-xs font-bold uppercase text-gray-500">
                    Establecimiento / Sede
                  </span>
                  <span className="font-bold">{reclamo.sede_nombre}</span>
                  <span className="text-gray-600"> — {reclamo.sede_direccion}</span>
                </div>
              </div>

              {/* 1. CONSUMIDOR */}
              <div>
                <h2 className="text-sm font-extrabold uppercase text-aerogas-blue border-b border-gray-300 pb-1.5 mb-3 print:text-black">
                  1. Identificación del Consumidor Reclamante
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Nombres y Apellidos / Razón Social
                    </span>
                    <span className="font-semibold">
                      {reclamo.nombres_apellidos}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Documento</span>
                    <span className="font-semibold">
                      {reclamo.tipo_documento} {reclamo.numero_documento}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Domicilio</span>
                    <span className="font-semibold">{reclamo.domicilio}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Teléfono / Correo Electrónico
                    </span>
                    <span className="font-semibold">
                      {reclamo.telefono} — {reclamo.email}
                    </span>
                  </div>
                </div>

                {Number(reclamo.es_menor) === 1 && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs">
                    <p className="font-bold text-orange-900 mb-1">
                      Padre, Madre o Apoderado (Consumidor menor de edad):
                    </p>
                    <p>
                      <strong>Nombre:</strong> {reclamo.apoderado_nombre} |{" "}
                      <strong>Doc.:</strong> {reclamo.apoderado_documento} |{" "}
                      <strong>Teléfono:</strong> {reclamo.apoderado_telefono} |{" "}
                      <strong>Correo:</strong> {reclamo.apoderado_email}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. BIEN CONTRATADO */}
              <div>
                <h2 className="text-sm font-extrabold uppercase text-aerogas-blue border-b border-gray-300 pb-1.5 mb-3 print:text-black">
                  2. Identificación del Bien Contratado
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Tipo</span>
                    <span className="font-semibold">{reclamo.tipo_bien}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Monto Reclamado
                    </span>
                    <span className="font-semibold">S/ {montoFormateado}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Comprobante de Pago
                    </span>
                    <span className="font-semibold">
                      {reclamo.comprobante_pago || "No especificado"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Descripción</span>
                  <p className="font-medium whitespace-pre-line">
                    {reclamo.descripcion_bien}
                  </p>
                </div>
              </div>

              {/* 3. DETALLE Y PEDIDO */}
              <div>
                <h2 className="text-sm font-extrabold uppercase text-aerogas-blue border-b border-gray-300 pb-1.5 mb-3 print:text-black">
                  3. Detalle de la Reclamación y Pedido del Consumidor
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Tipo de Registro
                    </span>
                    <span className="inline-block font-extrabold text-aerogas-red print:text-black">
                      {reclamo.tipo_registro}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Detalle</span>
                    <p className="bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-line">
                      {reclamo.detalle}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Pedido del Consumidor
                    </span>
                    <p className="bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-line">
                      {reclamo.pedido_consumidor}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. OBSERVACIONES Y ACCIONES DEL PROVEEDOR */}
              <div>
                <h2 className="text-sm font-extrabold uppercase text-aerogas-blue border-b border-gray-300 pb-1.5 mb-3 print:text-black">
                  4. Observaciones y Acciones Adoptadas por el Proveedor
                </h2>
                {reclamo.respuesta_proveedor ? (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-gray-600">
                      <strong>Fecha de Comunicación de Respuesta:</strong>{" "}
                      {formatearFechaHoraPE(reclamo.fecha_respuesta)}
                    </p>
                    <p className="whitespace-pre-line text-gray-800">
                      {reclamo.respuesta_proveedor}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4">
                    Pendiente de respuesta formal. El proveedor comunicará las acciones adoptadas dentro del plazo legal de quince (15) días hábiles improrrogables (hasta el {formatearFechaPE(reclamo.fecha_limite)}).
                  </p>
                )}
              </div>

              {/* PIE LEGAL OBLIGATORIO */}
              <div className="border-t border-gray-300 pt-4 text-[11px] text-gray-500 space-y-1 leading-relaxed">
                <p>
                  • La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
                </p>
                <p>
                  • El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor de quince (15) días hábiles, el cual es improrrogable (Ley N° 31435 y D.S. N° 101-2022-PCM).
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </main>
  );
}