import nodemailer from "nodemailer";

export interface DatosReclamoCorreo {
  codigo_reclamo: string;
  fecha_registro: string;
  fecha_limite: string;
  sede_nombre: string;
  sede_direccion: string;
  tipo_documento: string;
  numero_documento: string;
  nombres_apellidos: string;
  domicilio: string;
  telefono: string;
  email: string;
  es_menor: boolean;
  apoderado_nombre?: string | null;
  apoderado_documento?: string | null;
  apoderado_telefono?: string | null;
  apoderado_email?: string | null;
  tipo_bien: "PRODUCTO" | "SERVICIO";
  monto_reclamado: number;
  comprobante_pago?: string | null;
  descripcion_bien: string;
  tipo_registro: "RECLAMO" | "QUEJA";
  detalle: string;
  pedido_consumidor: string;
  token_acceso: string;
}

export interface DatosRespuestaCorreo {
  codigo_reclamo: string;
  tipo_registro: "RECLAMO" | "QUEJA";
  sede_nombre: string;
  nombres_apellidos: string;
  email: string;
  apoderado_email?: string | null;
  fecha_registro: string;
  fecha_respuesta: string;
  respuesta_proveedor: string;
  token_acceso: string;
}

// Escapa caracteres HTML para evitar inyección en plantillas de correo
function escapeHtml(texto: string | null | undefined): string {
  if (!texto) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function crearTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Faltan variables SMTP (SMTP_HOST, SMTP_USER o SMTP_PASS) en .env.local"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true para SSL en puerto 465 (cPanel / Yachay)
    auth: {
      user,
      pass,
    },
    tls: {
      // Si el servidor compartido de Yachay presenta certificado con otro hostname,
      // puedes definir SMTP_TLS_INSECURE=true en .env.local
      rejectUnauthorized: process.env.SMTP_TLS_INSECURE !== "true",
    },
  });
}

function obtenerRemitente() {
  const nombre = process.env.SMTP_FROM_NAME || "Aerogas del Norte S.A.C.";
  const correo = process.env.SMTP_USER || "ventas@aerogas.com.pe";
  return `"${nombre}" <${correo}>`;
}

function construirUrlConstancia(codigo: string, token: string) {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${baseUrl}/libro-de-reclamaciones/constancia/${encodeURIComponent(
    codigo
  )}?token=${encodeURIComponent(token)}`;
}

// ============================================================================
// 1. CORREOS AL REGISTRAR UNA NUEVA HOJA DE RECLAMACIÓN
// ============================================================================
export async function enviarCorreosNuevoReclamo(
  reclamo: DatosReclamoCorreo
): Promise<{
  constanciaEnviada: boolean;
  alertaEnviada: boolean;
  error?: string;
}> {
  let constanciaEnviada = false;
  let alertaEnviada = false;

  try {
    const transporter = crearTransporter();
    const from = obtenerRemitente();
    const urlConstancia = construirUrlConstancia(
      reclamo.codigo_reclamo,
      reclamo.token_acceso
    );

    const bloqueApoderadoHtml = reclamo.es_menor
      ? `
        <tr>
          <td colspan="2" style="padding:10px 12px; background:#fff7ed; border:1px solid #fed7aa; font-size:13px; color:#9a3412;">
            <strong>Datos del Padre, Madre o Apoderado (Consumidor menor de edad):</strong><br/>
            Nombre: ${escapeHtml(reclamo.apoderado_nombre)}<br/>
            Documento: ${escapeHtml(reclamo.apoderado_documento)}<br/>
            Teléfono: ${escapeHtml(reclamo.apoderado_telefono)} | Correo: ${escapeHtml(
          reclamo.apoderado_email
        )}
          </td>
        </tr>
      `
      : "";

    const montoFormateado = Number(reclamo.monto_reclamado || 0).toFixed(2);

    // A) Plantilla oficial para el consumidor
    const htmlConsumidor = `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f3f4f6; padding:24px; color:#1f2937;">
        <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #d1d5db; border-radius:10px; overflow:hidden;">
          
          <div style="background:#162865; color:#ffffff; padding:22px 24px; border-bottom:4px solid #E5192C;">
            <p style="margin:0; font-size:12px; letter-spacing:1px; text-transform:uppercase; opacity:0.85;">
              Libro de Reclamaciones Virtual — Ley N° 29571
            </p>
            <h1 style="margin:6px 0 0 0; font-size:22px;">
              HOJA DE RECLAMACIÓN N° ${escapeHtml(reclamo.codigo_reclamo)}
            </h1>
            <p style="margin:6px 0 0 0; font-size:13px; color:#dbeafe;">
              AEROGAS DEL NORTE S.A.C. — RUC: 20458378747
            </p>
          </div>

          <div style="padding:24px;">
            <p style="margin-top:0; font-size:14px; line-height:1.5;">
              Estimado(a) <strong>${escapeHtml(reclamo.nombres_apellidos)}</strong>,
              confirmamos la recepción de su <strong>${escapeHtml(
                reclamo.tipo_registro
              )}</strong>. A continuación le remitimos una copia íntegra de su Hoja de Reclamación:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:13px; margin:16px 0;">
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb; width:38%;"><strong>Fecha y hora de registro:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.fecha_registro)}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Fecha límite de respuesta:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;"><strong>${escapeHtml(reclamo.fecha_limite)}</strong> (15 días hábiles improrrogables)</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Establecimiento / Sede:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.sede_nombre)}<br/><span style="color:#6b7280;">${escapeHtml(reclamo.sede_direccion)}</span></td>
              </tr>
            </table>

            <h3 style="margin:20px 0 8px 0; font-size:14px; color:#162865; border-bottom:1px solid #e5e7eb; padding-bottom:4px;">
              1. Identificación del Consumidor
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:13px;">
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb; width:38%;"><strong>Nombres y Apellidos:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.nombres_apellidos)}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Documento:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.tipo_documento)} ${escapeHtml(reclamo.numero_documento)}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Domicilio:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.domicilio)}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Teléfono / Correo:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.telefono)} / ${escapeHtml(reclamo.email)}</td>
              </tr>
              ${bloqueApoderadoHtml}
            </table>

            <h3 style="margin:20px 0 8px 0; font-size:14px; color:#162865; border-bottom:1px solid #e5e7eb; padding-bottom:4px;">
              2. Identificación del Bien Contratado
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:13px;">
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb; width:38%;"><strong>Tipo de Bien:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.tipo_bien)}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Monto Reclamado:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">S/ ${montoFormateado}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Comprobante de Pago:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.comprobante_pago || "No especificado")}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Descripción:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.descripcion_bien).replace(/\n/g, "<br/>")}</td>
              </tr>
            </table>

            <h3 style="margin:20px 0 8px 0; font-size:14px; color:#162865; border-bottom:1px solid #e5e7eb; padding-bottom:4px;">
              3. Detalle de la Reclamación y Pedido
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:13px;">
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb; width:38%;"><strong>Tipo:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;"><strong>${escapeHtml(reclamo.tipo_registro)}</strong></td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Detalle:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.detalle).replace(/\n/g, "<br/>")}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Pedido del Consumidor:</strong></td>
                <td style="padding:8px 12px; border:1px solid #e5e7eb;">${escapeHtml(reclamo.pedido_consumidor).replace(/\n/g, "<br/>")}</td>
              </tr>
            </table>

            <div style="text-align:center; margin:24px 0;">
              <a href="${urlConstancia}" style="display:inline-block; background:#E5192C; color:#ffffff; text-decoration:none; font-weight:bold; font-size:14px; padding:12px 24px; border-radius:8px;">
                Ver / Imprimir Constancia Oficial
              </a>
            </div>

            <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:12px; font-size:11px; color:#4b5563; line-height:1.5;">
              <p style="margin:0 0 6px 0;">
                • La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
              </p>
              <p style="margin:0;">
                • El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor de quince (15) días hábiles, el cual es improrrogable (Ley N° 31435 y D.S. N° 101-2022-PCM).
              </p>
            </div>
          </div>

        </div>
      </div>
    `;

    // Destinatarios del consumidor (incluye copia al apoderado si es distinto)
    const ccApoderado =
      reclamo.es_menor &&
      reclamo.apoderado_email &&
      reclamo.apoderado_email.trim().toLowerCase() !==
        reclamo.email.trim().toLowerCase()
        ? reclamo.apoderado_email.trim()
        : undefined;

    await transporter.sendMail({
      from,
      to: reclamo.email,
      cc: ccApoderado,
      subject: `Constancia Hoja de Reclamación N° ${reclamo.codigo_reclamo} - Aerogas del Norte`,
      html: htmlConsumidor,
    });
    constanciaEnviada = true;

    // B) Alerta interna para el equipo de Aerogas
    const correoAlerta =
      process.env.RECLAMOS_ALERT_EMAIL || process.env.SMTP_USER;
    if (correoAlerta) {
      const baseUrl = (
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      ).replace(/\/$/, "");
      const htmlAlerta = `
        <div style="font-family: Arial, Helvetica, sans-serif; padding:20px; color:#1f2937;">
          <div style="max-width:600px; margin:0 auto; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
            <div style="background:#E5192C; color:#ffffff; padding:16px 20px;">
              <h2 style="margin:0; font-size:18px;">
                Nueva Hoja de Reclamación: ${escapeHtml(reclamo.codigo_reclamo)}
              </h2>
            </div>
            <div style="padding:20px; font-size:14px; line-height:1.6;">
              <p style="margin-top:0;">Se ha registrado un nuevo ingreso en el Libro de Reclamaciones Virtual:</p>
              <ul>
                <li><strong>Tipo:</strong> ${escapeHtml(reclamo.tipo_registro)}</li>
                <li><strong>Sede:</strong> ${escapeHtml(reclamo.sede_nombre)}</li>
                <li><strong>Consumidor:</strong> ${escapeHtml(reclamo.nombres_apellidos)} (${escapeHtml(reclamo.tipo_documento)} ${escapeHtml(reclamo.numero_documento)})</li>
                <li><strong>Teléfono / Correo:</strong> ${escapeHtml(reclamo.telefono)} / ${escapeHtml(reclamo.email)}</li>
                <li><strong>Fecha límite legal (15 días hábiles):</strong> <span style="color:#E5192C; font-weight:bold;">${escapeHtml(reclamo.fecha_limite)}</span></li>
              </ul>
              <p><strong>Resumen del detalle:</strong><br/>${escapeHtml(reclamo.detalle).replace(/\n/g, "<br/>")}</p>
              <p style="margin-top:20px;">
                <a href="${baseUrl}/admin/reclamaciones" style="display:inline-block; background:#162865; color:#ffffff; text-decoration:none; font-weight:bold; padding:10px 18px; border-radius:6px;">
                  Ir al Panel de Reclamaciones
                </a>
              </p>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from,
        to: correoAlerta,
        subject: `[ALERTA INDECOPI] ${reclamo.tipo_registro} N° ${reclamo.codigo_reclamo} - ${reclamo.sede_nombre}`,
        html: htmlAlerta,
      });
      alertaEnviada = true;
    }

    return { constanciaEnviada, alertaEnviada };
  } catch (error: any) {
    console.error("Error enviando correos del Libro de Reclamaciones:", error);
    return {
      constanciaEnviada,
      alertaEnviada,
      error: error?.message || "Error desconocido de SMTP",
    };
  }
}

// ============================================================================
// 2. CORREO DE RESPUESTA OFICIAL DEL PROVEEDOR (DESDE EL PANEL ADMIN)
// ============================================================================
export async function enviarCorreoRespuestaReclamo(
  datos: DatosRespuestaCorreo
): Promise<{ enviado: boolean; error?: string }> {
  try {
    const transporter = crearTransporter();
    const from = obtenerRemitente();
    const urlConstancia = construirUrlConstancia(
      datos.codigo_reclamo,
      datos.token_acceso
    );

    const htmlRespuesta = `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f3f4f6; padding:24px; color:#1f2937;">
        <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #d1d5db; border-radius:10px; overflow:hidden;">
          <div style="background:#162865; color:#ffffff; padding:22px 24px; border-bottom:4px solid #E5192C;">
            <p style="margin:0; font-size:12px; letter-spacing:1px; text-transform:uppercase; opacity:0.85;">
              Respuesta Oficial — Libro de Reclamaciones
            </p>
            <h1 style="margin:6px 0 0 0; font-size:20px;">
              HOJA DE RECLAMACIÓN N° ${escapeHtml(datos.codigo_reclamo)}
            </h1>
            <p style="margin:6px 0 0 0; font-size:13px; color:#dbeafe;">
              AEROGAS DEL NORTE S.A.C. — RUC: 20458378747
            </p>
          </div>

          <div style="padding:24px; font-size:14px; line-height:1.6;">
            <p style="margin-top:0;">
              Estimado(a) <strong>${escapeHtml(datos.nombres_apellidos)}</strong>,
            </p>
            <p>
              En atención a su <strong>${escapeHtml(datos.tipo_registro)}</strong> registrado el
              <strong>${escapeHtml(datos.fecha_registro)}</strong> correspondiente a la sede
              <strong>${escapeHtml(datos.sede_nombre)}</strong>, le comunicamos la respuesta formal adoptada por nuestra empresa con fecha
              <strong>${escapeHtml(datos.fecha_respuesta)}</strong>:
            </p>

            <div style="background:#f8fafc; border-left:4px solid #162865; padding:16px; margin:18px 0; border-radius:0 6px 6px 0; white-space:pre-line;">
              ${escapeHtml(datos.respuesta_proveedor)}
            </div>

            <div style="text-align:center; margin:24px 0;">
              <a href="${urlConstancia}" style="display:inline-block; background:#162865; color:#ffffff; text-decoration:none; font-weight:bold; font-size:14px; padding:12px 24px; border-radius:8px;">
                Ver Hoja de Reclamación Actualizada
              </a>
            </div>

            <p style="font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb; padding-top:12px; margin-bottom:0;">
              Atentamente,<br/>
              <strong>Área de Atención al Cliente — Aerogas del Norte S.A.C.</strong><br/>
              Oficina Central: Chiclayo, Lambayeque, Perú | ventas@aerogas.com.pe
            </p>
          </div>
        </div>
      </div>
    `;

    const ccApoderado =
      datos.apoderado_email &&
      datos.apoderado_email.trim().toLowerCase() !==
        datos.email.trim().toLowerCase()
        ? datos.apoderado_email.trim()
        : undefined;

    await transporter.sendMail({
      from,
      to: datos.email,
      cc: ccApoderado,
      subject: `Respuesta Oficial a su ${datos.tipo_registro} N° ${datos.codigo_reclamo} - Aerogas del Norte`,
      html: htmlRespuesta,
    });

    return { enviado: true };
  } catch (error: any) {
    console.error("Error enviando respuesta del reclamo:", error);
    return {
      enviado: false,
      error: error?.message || "Error desconocido de SMTP",
    };
  }
}