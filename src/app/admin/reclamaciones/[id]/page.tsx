import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pool } from "../../../../lib/db";
import {
  calcularDiasHabilesRestantes,
  formatearFechaPE,
  formatearFechaHoraPE,
} from "../../../../lib/diasHabiles";
import { enviarCorreoRespuestaReclamo } from "../../../../lib/mailer";
import BotonImprimir from "../../../../components/BotonImprimir";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
};

function aFechaISO(valor: Date | string): string {
  if (valor instanceof Date) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, "0");
    const d = String(valor.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(valor).split("T")[0];
}

export default async function DetalleReclamoAdminPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { msg } = await searchParams;

  const [rows] = await pool.query(
    "SELECT * FROM libro_reclamaciones WHERE id = ? LIMIT 1",
    [id]
  );
  const reclamo = (rows as any[])[0];

  if (!reclamo) {
    return (
      <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center max-w-md w-full">
          <h1 className="text-xl font-extrabold text-aerogas-red mb-2">
            Hoja de Reclamación no encontrada
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            El registro solicitado no existe en la base de datos.
          </p>
          <Link
            href="/admin/reclamaciones"
            className="inline-block bg-aerogas-blue text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-blue-900"
          >
            Volver al Listado
          </Link>
        </div>
      </main>
    );
  }

  const fechaLimiteISO = aFechaISO(reclamo.fecha_limite);
  const diasRestantes = calcularDiasHabilesRestantes(fechaLimiteISO);
  const montoFormateado = Number(reclamo.monto_reclamado || 0).toFixed(2);
  const esAtendido = reclamo.estado === "ATENDIDO";
  const correoRespuestaEnviado = Number(reclamo.correo_respuesta_enviado) === 1;

  // SERVER ACTION 1: Guardar respuesta oficial y notificar por correo al consumidor
  async function responderReclamo(formData: FormData) {
    "use server";

    const respuesta = String(formData.get("respuesta_proveedor") || "").trim();
    if (!respuesta) {
      redirect(`/admin/reclamaciones/${id}?msg=vacio`);
    }

    // Reconsultar para evitar sobrescribir una hoja ya atendida
    const [checkRows] = await pool.query(
      "SELECT * FROM libro_reclamaciones WHERE id = ? LIMIT 1",
      [id]
    );
    const actual = (checkRows as any[])[0];
    if (!actual || actual.estado === "ATENDIDO") {
      redirect(`/admin/reclamaciones/${id}`);
    }

    const ahora = new Date();

    await pool.query(
      `UPDATE libro_reclamaciones
       SET estado = 'ATENDIDO', respuesta_proveedor = ?, fecha_respuesta = NOW()
       WHERE id = ?`,
      [respuesta, id]
    );

    const envio = await enviarCorreoRespuestaReclamo({
      codigo_reclamo: actual.codigo_reclamo,
      tipo_registro: actual.tipo_registro,
      sede_nombre: actual.sede_nombre,
      nombres_apellidos: actual.nombres_apellidos,
      email: actual.email,
      apoderado_email: actual.apoderado_email,
      fecha_registro: formatearFechaHoraPE(actual.fecha_registro),
      fecha_respuesta: formatearFechaHoraPE(ahora),
      respuesta_proveedor: respuesta,
      token_acceso: actual.token_acceso,
    });

    if (envio.enviado) {
      await pool.query(
        "UPDATE libro_reclamaciones SET correo_respuesta_enviado = 1 WHERE id = ?",
        [id]
      );
    }

    revalidatePath("/admin/reclamaciones");
    revalidatePath(`/admin/reclamaciones/${id}`);
    revalidatePath(
      `/libro-de-reclamaciones/constancia/${actual.codigo_reclamo}`
    );

    redirect(
      `/admin/reclamaciones/${id}?msg=${
        envio.enviado ? "ok" : "guardado_sin_correo"
      }`
    );
  }

  // SERVER ACTION 2: Reenviar correo oficial si falló el primer intento
  async function reenviarCorreoRespuesta() {
    "use server";

    const [checkRows] = await pool.query(
      "SELECT * FROM libro_reclamaciones WHERE id = ? LIMIT 1",
      [id]
    );
    const actual = (checkRows as any[])[0];
    if (!actual || !actual.respuesta_proveedor) {
      redirect(`/admin/reclamaciones/${id}`);
    }

    const envio = await enviarCorreoRespuestaReclamo({
      codigo_reclamo: actual.codigo_reclamo,
      tipo_registro: actual.tipo_registro,
      sede_nombre: actual.sede_nombre,
      nombres_apellidos: actual.nombres_apellidos,
      email: actual.email,
      apoderado_email: actual.apoderado_email,
      fecha_registro: formatearFechaHoraPE(actual.fecha_registro),
      fecha_respuesta: formatearFechaHoraPE(actual.fecha_respuesta),
      respuesta_proveedor: actual.respuesta_proveedor,
      token_acceso: actual.token_acceso,
    });

    if (envio.enviado) {
      await pool.query(
        "UPDATE libro_reclamaciones SET correo_respuesta_enviado = 1 WHERE id = ?",
        [id]
      );
    }

    revalidatePath(`/admin/reclamaciones/${id}`);
    redirect(
      `/admin/reclamaciones/${id}?msg=${
        envio.enviado ? "reenviado" : "error_reenvio"
      }`
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 print:bg-white py-10 px-4 sm:px-6 lg:px-8 print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* BARRA SUPERIOR ADMIN (OCULTA AL IMPRIMIR) */}
        <div className="print:hidden bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link
            href="/admin/reclamaciones"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-aerogas-blue"
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
            Volver al Libro de Reclamaciones
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <BotonImprimir texto="Imprimir Hoja para Archivo / INDECOPI" />
          </div>
        </div>

        {/* ALERTAS DE ACCIÓN (OCULTAS AL IMPRIMIR) */}
        {msg && (
          <div
            className={`print:hidden rounded-xl p-4 border-l-4 text-sm font-semibold shadow-sm ${
              msg === "ok" || msg === "reenviado"
                ? "bg-green-50 border-green-600 text-green-900"
                : "bg-amber-50 border-amber-500 text-amber-900"
            }`}
          >
            {msg === "ok" &&
              `Respuesta registrada correctamente y enviada al correo ${reclamo.email}.`}
            {msg === "reenviado" &&
              `Correo de respuesta reenviado con éxito a ${reclamo.email}.`}
            {msg === "guardado_sin_correo" &&
              "La respuesta se guardó en la base de datos, pero hubo un error al enviar el correo SMTP. Puede intentar el reenvío más abajo."}
            {msg === "error_reenvio" &&
              "No se pudo conectar con el servidor SMTP para reenviar el correo. Verifique sus credenciales en .env.local."}
            {msg === "vacio" && "Debe redactar el texto de la respuesta oficial."}
          </div>
        )}

        {/* BANNER DE SEMÁFORO DE PLAZO (OCULTO AL IMPRIMIR) */}
        <div
          className={`print:hidden rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm ${
            esAtendido
              ? "bg-green-50 border-green-200 text-green-900"
              : diasRestantes <= 0
              ? "bg-red-50 border-red-300 text-red-900"
              : diasRestantes <= 5
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-blue-50 border-blue-200 text-aerogas-blue"
          }`}
        >
          <div className="font-bold">
            {esAtendido
              ? `Caso atendido el ${formatearFechaHoraPE(reclamo.fecha_respuesta)}`
              : diasRestantes < 0
              ? `ATENCIÓN: Plazo legal vencido hace ${Math.abs(
                  diasRestantes
                )} días hábiles.`
              : diasRestantes === 0
              ? "ATENCIÓN: El plazo legal de 15 días hábiles vence HOY."
              : `Plazo legal vigente: quedan ${diasRestantes} ${
                  diasRestantes === 1 ? "día hábil" : "días hábiles"
                } para responder.`}
          </div>
          <div className="text-xs font-semibold">
            Fecha límite: {formatearFechaPE(fechaLimiteISO)}
          </div>
        </div>

        {/* FORMATO OFICIAL DE LA HOJA DE RECLAMACIÓN */}
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

          <div className="p-6 sm:p-8 space-y-6 text-sm text-gray-800">
            {/* METADATOS Y ESTABLECIMIENTO */}
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
                  Fecha Límite Legal
                </span>
                <span className="font-bold text-aerogas-red print:text-black">
                  {formatearFechaPE(fechaLimiteISO)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-gray-500">
                  Estado
                </span>
                <span
                  className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    esAtendido
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
                <span className="text-gray-600">
                  {" "}
                  — {reclamo.sede_direccion}
                </span>
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

            {/* 4. OBSERVACIONES Y RESPUESTA OFICIAL DEL PROVEEDOR */}
            <div>
              <h2 className="text-sm font-extrabold uppercase text-aerogas-blue border-b border-gray-300 pb-1.5 mb-3 print:text-black">
                4. Observaciones y Acciones Adoptadas por el Proveedor
              </h2>

              {esAtendido ? (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                    <span>
                      <strong>Fecha de Comunicación de Respuesta:</strong>{" "}
                      {formatearFechaHoraPE(reclamo.fecha_respuesta)}
                    </span>
                    <span
                      className={`print:hidden px-2.5 py-0.5 rounded-full font-bold ${
                        correoRespuestaEnviado
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {correoRespuestaEnviado
                        ? "Notificación enviada por correo"
                        : "Envío de correo pendiente"}
                    </span>
                  </div>

                  <p className="whitespace-pre-line text-gray-900 leading-relaxed">
                    {reclamo.respuesta_proveedor}
                  </p>

                  {!correoRespuestaEnviado && (
                    <form
                      action={reenviarCorreoRespuesta}
                      className="print:hidden pt-3 border-t border-blue-200"
                    >
                      <button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Reenviar Respuesta Oficial por Correo a {reclamo.email}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <form
                  action={responderReclamo}
                  className="print:hidden bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="respuesta_proveedor"
                      className="block text-sm font-bold text-aerogas-blue mb-1.5"
                    >
                      Redactar Respuesta Oficial al Consumidor *
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Al enviar esta respuesta, la hoja pasará a estado <strong>ATENDIDO</strong> de forma definitiva y se enviará automáticamente al correo <strong>{reclamo.email}</strong>
                      {reclamo.apoderado_email &&
                      reclamo.apoderado_email !== reclamo.email
                        ? ` (con copia a ${reclamo.apoderado_email})`
                        : ""}
                      .
                    </p>
                    <textarea
                      id="respuesta_proveedor"
                      name="respuesta_proveedor"
                      rows={5}
                      required
                      placeholder="Detalla las acciones adoptadas, verificación realizada y solución brindada al consumidor..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-aerogas-blue outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-aerogas-blue hover:bg-blue-900 text-white font-bold px-6 py-3 rounded-lg text-sm shadow-md transition-colors cursor-pointer"
                  >
                    Registrar Respuesta Oficial y Notificar al Cliente
                  </button>
                </form>
              )}
            </div>

            {/* PIE LEGAL INDECOPI */}
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
    </main>
  );
}