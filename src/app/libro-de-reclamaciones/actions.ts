"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { pool } from "../../lib/db";
import {
  obtenerFechaHoyPeruISO,
  sumarDiasHabiles,
  formatearFechaPE,
  formatearFechaHoraPE,
} from "../../lib/diasHabiles";
import { enviarCorreosNuevoReclamo } from "../../lib/mailer";
import { verificarAntiBot } from "../../lib/antibot";

export type ResultadoRegistroReclamo = {
  ok: boolean;
  error?: string;
  redirectUrl?: string;
};

export async function registrarReclamo(
  formData: FormData
): Promise<ResultadoRegistroReclamo> {
  try {
    // 0. Capa Anti-Bots (antes de tocar MySQL o SMTP)
    const checkBot = await verificarAntiBot(formData, {
      accion: "libro_reclamaciones",
      maxIntentos: 3,
      ventanaMinutos: 15,
      tiempoMinimoMs: 3000,
    });

    if (!checkBot.ok) {
      return {
        ok: false,
        error:
          checkBot.error ||
          "No se pudo validar el envío. Intente nuevamente en unos momentos.",
      };
    }

    // 1. Lectura y limpieza de campos
    const sedeKey = String(formData.get("sede_key") || "").trim();
    const tipo_documento = String(formData.get("tipo_documento") || "").trim();
    const numero_documento = String(
      formData.get("numero_documento") || ""
    ).trim();
    const nombres_apellidos = String(
      formData.get("nombres_apellidos") || ""
    ).trim();
    const domicilio = String(formData.get("domicilio") || "").trim();
    const telefono = String(formData.get("telefono") || "").trim();
    const email = String(formData.get("email") || "").trim();

    const es_menor = formData.get("es_menor") === "on";
    const apoderado_nombre = es_menor
      ? String(formData.get("apoderado_nombre") || "").trim()
      : null;
    const apoderado_documento = es_menor
      ? String(formData.get("apoderado_documento") || "").trim()
      : null;
    const apoderado_telefono = es_menor
      ? String(formData.get("apoderado_telefono") || "").trim()
      : null;
    const apoderado_email = es_menor
      ? String(formData.get("apoderado_email") || "").trim()
      : null;

    const tipo_bien_raw = String(formData.get("tipo_bien") || "").toUpperCase();
    const tipo_bien: "PRODUCTO" | "SERVICIO" =
      tipo_bien_raw === "PRODUCTO" ? "PRODUCTO" : "SERVICIO";

    const montoRaw = String(formData.get("monto_reclamado") || "0").replace(
      ",",
      "."
    );
    const monto_reclamado = Number.isFinite(parseFloat(montoRaw))
      ? Math.max(0, parseFloat(montoRaw))
      : 0;

    const comprobante_pago =
      String(formData.get("comprobante_pago") || "").trim() || null;
    const descripcion_bien = String(
      formData.get("descripcion_bien") || ""
    ).trim();

    const tipo_registro_raw = String(
      formData.get("tipo_registro") || ""
    ).toUpperCase();
    const tipo_registro: "RECLAMO" | "QUEJA" =
      tipo_registro_raw === "QUEJA" ? "QUEJA" : "RECLAMO";

    const detalle = String(formData.get("detalle") || "").trim();
    const pedido_consumidor = String(
      formData.get("pedido_consumidor") || ""
    ).trim();
    const acepta_terminos = formData.get("acepta_terminos") === "on";

    // 2. Validaciones estrictas en servidor (anti-bypass)
    if (!sedeKey) {
      return {
        ok: false,
        error: "Seleccione la estación o sede donde ocurrió el incidente.",
      };
    }

    if (
      !tipo_documento ||
      !numero_documento ||
      !nombres_apellidos ||
      !domicilio ||
      !telefono ||
      !email
    ) {
      return {
        ok: false,
        error:
          "Complete todos los campos obligatorios de identificación del consumidor.",
      };
    }

    if (tipo_documento === "DNI" && !/^\d{8}$/.test(numero_documento)) {
      return {
        ok: false,
        error: "El número de DNI debe contener exactamente 8 dígitos numéricos.",
      };
    }

    if (tipo_documento === "RUC" && !/^\d{11}$/.test(numero_documento)) {
      return {
        ok: false,
        error: "El número de RUC debe contener exactamente 11 dígitos numéricos.",
      };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        ok: false,
        error: "Ingrese un correo electrónico válido para enviar su constancia.",
      };
    }

    if (es_menor) {
      if (
        !apoderado_nombre ||
        !apoderado_documento ||
        !apoderado_telefono ||
        !apoderado_email
      ) {
        return {
          ok: false,
          error:
            "Para consumidores menores de edad, todos los datos del padre, madre o apoderado son obligatorios por ley.",
        };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(apoderado_email)) {
        return {
          ok: false,
          error: "Ingrese un correo electrónico válido para el apoderado.",
        };
      }
    }

    if (!descripcion_bien || !detalle || !pedido_consumidor) {
      return {
        ok: false,
        error:
          "Complete la descripción del bien, el detalle de lo ocurrido y su pedido concreto.",
      };
    }

    if (!acepta_terminos) {
      return {
        ok: false,
        error:
          "Debe declarar la veracidad de los datos y aceptar el tratamiento de datos personales.",
      };
    }

    // 3. Resolver sede y dirección oficial desde MySQL
    let estacion_id: number | null = null;
    let sede_nombre = "Oficina Central / Canal Web";
    let sede_direccion = "Chiclayo, Lambayeque, Perú";

    if (sedeKey.startsWith("estacion:")) {
      const idEst = Number(sedeKey.replace("estacion:", ""));
      const [estRows] = await pool.query(
        "SELECT id, nombre, direccion, ciudad FROM estaciones WHERE id = ?",
        [idEst]
      );
      const est = (estRows as any[])[0];
      if (!est) {
        return { ok: false, error: "La estación seleccionada no es válida." };
      }
      estacion_id = est.id;
      sede_nombre = est.nombre;
      sede_direccion = `${est.direccion}, ${est.ciudad}`;
    } else if (sedeKey.startsWith("aeromarket:")) {
      const idEst = Number(sedeKey.replace("aeromarket:", ""));
      const [estRows] = await pool.query(
        "SELECT id, nombre, direccion, ciudad FROM estaciones WHERE id = ?",
        [idEst]
      );
      const est = (estRows as any[])[0];
      if (!est) {
        return {
          ok: false,
          error: "La tienda AeroMarket seleccionada no es válida.",
        };
      }
      estacion_id = est.id;
      sede_nombre = `AeroMarket — ${est.nombre}`;
      sede_direccion = `${est.direccion}, ${est.ciudad}`;
    } else if (sedeKey === "web") {
      estacion_id = null;
      sede_nombre = "Oficina Central / Canal Web - Aerogas del Norte";
      sede_direccion = "Chiclayo, Lambayeque, Perú";
    }

    // 4. Fechas legales (15 días hábiles improrrogables) y token privado
    const hoyISO = obtenerFechaHoyPeruISO();
    const anio = Number(hoyISO.split("-")[0]);
    const fecha_limite = sumarDiasHabiles(hoyISO, 15);
    const token_acceso = crypto.randomBytes(24).toString("hex");
    const ahora = new Date();

    // 5. Transacción MySQL para correlativo secuencial sin saltos ni colisiones
    const connection = await pool.getConnection();
    let codigo_reclamo = "";
    let insertId = 0;

    try {
      await connection.beginTransaction();

      const [maxRows] = await connection.query(
        "SELECT COALESCE(MAX(correlativo), 0) AS ultimo FROM libro_reclamaciones WHERE anio = ? FOR UPDATE",
        [anio]
      );
      const siguienteCorrelativo = Number((maxRows as any[])[0].ultimo) + 1;
      codigo_reclamo = `${String(siguienteCorrelativo).padStart(
        6,
        "0"
      )}-${anio}`;

      const [insertResult] = await connection.query(
        `INSERT INTO libro_reclamaciones (
          codigo_reclamo, anio, correlativo, fecha_registro, fecha_limite,
          estacion_id, sede_nombre, sede_direccion,
          tipo_documento, numero_documento, nombres_apellidos, domicilio, telefono, email,
          es_menor, apoderado_nombre, apoderado_documento, apoderado_telefono, apoderado_email,
          tipo_bien, monto_reclamado, comprobante_pago, descripcion_bien,
          tipo_registro, detalle, pedido_consumidor, acepta_terminos,
          estado, correo_constancia_enviado, correo_respuesta_enviado, token_acceso
        ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'PENDIENTE', 0, 0, ?)`,
        [
          codigo_reclamo,
          anio,
          siguienteCorrelativo,
          fecha_limite,
          estacion_id,
          sede_nombre,
          sede_direccion,
          tipo_documento,
          numero_documento,
          nombres_apellidos,
          domicilio,
          telefono,
          email,
          es_menor ? 1 : 0,
          apoderado_nombre,
          apoderado_documento,
          apoderado_telefono,
          apoderado_email,
          tipo_bien,
          monto_reclamado,
          comprobante_pago,
          descripcion_bien,
          tipo_registro,
          detalle,
          pedido_consumidor,
          token_acceso,
        ]
      );

      insertId = (insertResult as any).insertId;
      await connection.commit();
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }

    // 6. Enviar copia al consumidor y alerta interna (sin bloquear si SMTP falla)
    const resultadoCorreo = await enviarCorreosNuevoReclamo({
      codigo_reclamo,
      fecha_registro: formatearFechaHoraPE(ahora),
      fecha_limite: formatearFechaPE(fecha_limite),
      sede_nombre,
      sede_direccion,
      tipo_documento,
      numero_documento,
      nombres_apellidos,
      domicilio,
      telefono,
      email,
      es_menor,
      apoderado_nombre,
      apoderado_documento,
      apoderado_telefono,
      apoderado_email,
      tipo_bien,
      monto_reclamado,
      comprobante_pago,
      descripcion_bien,
      tipo_registro,
      detalle,
      pedido_consumidor,
      token_acceso,
    });

    if (resultadoCorreo.constanciaEnviada && insertId > 0) {
      await pool.query(
        "UPDATE libro_reclamaciones SET correo_constancia_enviado = 1 WHERE id = ?",
        [insertId]
      );
    }

    revalidatePath("/admin/reclamaciones");

    return {
      ok: true,
      redirectUrl: `/libro-de-reclamaciones/constancia/${encodeURIComponent(
        codigo_reclamo
      )}?token=${encodeURIComponent(token_acceso)}`,
    };
  } catch (error) {
    console.error("Error al registrar hoja de reclamación:", error);
    return {
      ok: false,
      error:
        "Ocurrió un error inesperado al registrar su hoja de reclamación. Por favor, intente nuevamente.",
    };
  }
}