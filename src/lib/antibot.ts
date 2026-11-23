import { headers } from "next/headers";

type RegistroRateLimit = {
  count: number;
  resetAt: number;
};

// Persiste en memoria del proceso Node.js (incluso entre recargas en desarrollo)
const globalForRateLimit = globalThis as unknown as {
  __aerogasRateLimit?: Map<string, RegistroRateLimit>;
};

const rateLimitStore =
  globalForRateLimit.__aerogasRateLimit || new Map<string, RegistroRateLimit>();

if (!globalForRateLimit.__aerogasRateLimit) {
  globalForRateLimit.__aerogasRateLimit = rateLimitStore;
}

export type OpcionesAntiBot = {
  accion: string; // Ej: "reclamos", "cotizacion_b2b", "postulacion"
  maxIntentos?: number; // Máximo permitido por ventana (default: 3)
  ventanaMinutos?: number; // Duración de la ventana en minutos (default: 15)
  tiempoMinimoMs?: number; // Tiempo mínimo de llenado en ms (default: 2500)
};

export type ResultadoAntiBot = {
  ok: boolean;
  motivo?: "honeypot" | "muy_rapido" | "rate_limit";
  error?: string;
};

/**
 * Obtiene la IP real del cliente detrás de proxies (Nginx, cPanel, AWS, Vercel).
 */
async function obtenerIpCliente(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "ip-local";
}

/**
 * Limpia entradas expiradas del mapa para evitar consumo innecesario de RAM.
 */
function limpiarRegistrosExpirados(ahora: number) {
  if (rateLimitStore.size < 200) return;
  for (const [clave, registro] of rateLimitStore.entries()) {
    if (registro.resetAt <= ahora) {
      rateLimitStore.delete(clave);
    }
  }
}

/**
 * Ejecuta las 3 capas anti-bots en el servidor:
 * 1. Campo honeypot oculto
 * 2. Tiempo mínimo de llenado humano
 * 3. Rate limiting por IP y acción
 */
export async function verificarAntiBot(
  formData: FormData,
  opciones: OpcionesAntiBot
): Promise<ResultadoAntiBot> {
  const {
    accion,
    maxIntentos = 3,
    ventanaMinutos = 15,
    tiempoMinimoMs = 2500,
  } = opciones;

  // 1. HONEYPOT: Si el campo trampa llega con texto, es un bot
  const honeypot = String(formData.get("sitio_web_empresa") || "").trim();
  if (honeypot.length > 0) {
    return {
      ok: false,
      motivo: "honeypot",
      error: "No se pudo validar el envío del formulario.",
    };
  }

  // 2. TIEMPO MÍNIMO DE LLENADO: Detecta envíos instantáneos o scripts sin navegador
  const tsRaw = String(formData.get("form_loaded_at") || "").trim();
  const loadedAt = Number(tsRaw);
  const ahora = Date.now();

  if (!Number.isFinite(loadedAt) || loadedAt <= 0 || ahora - loadedAt < tiempoMinimoMs) {
    return {
      ok: false,
      motivo: "muy_rapido",
      error:
        "El formulario se envió demasiado rápido. Por favor, revise sus datos e intente nuevamente en unos segundos.",
    };
  }

  // 3. RATE LIMITING POR IP
  limpiarRegistrosExpirados(ahora);

  const ip = await obtenerIpCliente();
  const clave = `${accion}:${ip}`;
  const ventanaMs = ventanaMinutos * 60 * 1000;
  const registro = rateLimitStore.get(clave);

  if (!registro || registro.resetAt <= ahora) {
    rateLimitStore.set(clave, {
      count: 1,
      resetAt: ahora + ventanaMs,
    });
    return { ok: true };
  }

  if (registro.count >= maxIntentos) {
    const minutosRestantes = Math.max(
      1,
      Math.ceil((registro.resetAt - ahora) / 60000)
    );
    return {
      ok: false,
      motivo: "rate_limit",
      error: `Ha superado el límite de envíos permitidos. Por seguridad, espere ${minutosRestantes} ${
        minutosRestantes === 1 ? "minuto" : "minutos"
      } antes de volver a intentarlo.`,
    };
  }

  registro.count += 1;
  rateLimitStore.set(clave, registro);

  return { ok: true };
}

// ============================================================================
// VALIDADOR ESTRICTO DE ARCHIVOS SUBIDOS (PESO + EXTENSIÓN + MAGIC BYTES)
// ============================================================================
export type TipoArchivoPermitido = "pdf" | "imagen" | "word";

export type ResultadoArchivo = {
  ok: boolean;
  error?: string;
  buffer?: Buffer;
  nombreSeguro?: string;
};

function coincideFirmaBytes(buffer: Buffer, firma: number[]): boolean {
  if (buffer.length < firma.length) return false;
  return firma.every((byte, i) => buffer[i] === byte);
}

function esWebp(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  return (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

/**
 * Valida tamaño máximo, extensión y firma binaria real de un archivo subido.
 */
export async function validarArchivoSubido(
  file: File | null,
  opciones: {
    maxMB?: number;
    tiposPermitidos: TipoArchivoPermitido[];
    obligatorio?: boolean;
  }
): Promise<ResultadoArchivo> {
  const { maxMB = 5, tiposPermitidos, obligatorio = false } = opciones;

  if (!file || file.size === 0) {
    if (obligatorio) {
      return { ok: false, error: "Debe adjuntar el archivo solicitado." };
    }
    return { ok: true };
  }

  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `El archivo supera el tamaño máximo permitido de ${maxMB} MB.`,
    };
  }

  const extension = (file.name.split(".").pop() || "").toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let valido = false;

  if (tiposPermitidos.includes("pdf") && extension === "pdf") {
    // %PDF
    valido = coincideFirmaBytes(buffer, [0x25, 0x50, 0x44, 0x46]);
  }

  if (!valido && tiposPermitidos.includes("imagen")) {
    if ((extension === "jpg" || extension === "jpeg") && coincideFirmaBytes(buffer, [0xff, 0xd8, 0xff])) {
      valido = true;
    } else if (extension === "png" && coincideFirmaBytes(buffer, [0x89, 0x50, 0x4e, 0x47])) {
      valido = true;
    } else if (extension === "webp" && esWebp(buffer)) {
      valido = true;
    }
  }

  if (!valido && tiposPermitidos.includes("word")) {
    if (extension === "docx" && coincideFirmaBytes(buffer, [0x50, 0x4b, 0x03, 0x04])) {
      valido = true;
    } else if (extension === "doc" && coincideFirmaBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0])) {
      valido = true;
    }
  }

  if (!valido) {
    const etiquetas: Record<TipoArchivoPermitido, string> = {
      pdf: "PDF",
      imagen: "JPG, PNG o WEBP",
      word: "Word (.doc, .docx)",
    };
    const lista = tiposPermitidos.map((t) => etiquetas[t]).join(", ");
    return {
      ok: false,
      error: `Formato de archivo no permitido o dañado. Solo se aceptan archivos: ${lista}.`,
    };
  }

  const nombreSeguro = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return { ok: true, buffer, nombreSeguro };
}