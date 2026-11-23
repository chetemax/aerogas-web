// Feriados nacionales fijos del Perú (formato MM-DD)
const FERIADOS_FIJOS_PE = new Set([
  "01-01", // Año Nuevo
  "05-01", // Día del Trabajo
  "06-07", // Batalla de Arica y Día de la Bandera
  "06-29", // San Pedro y San Pablo
  "07-23", // Día de la Fuerza Aérea del Perú
  "07-28", // Fiestas Patrias
  "07-29", // Fiestas Patrias
  "08-06", // Batalla de Junín
  "08-30", // Santa Rosa de Lima
  "10-08", // Combate de Angamos
  "11-01", // Todos los Santos
  "12-08", // Inmaculada Concepción
  "12-09", // Batalla de Ayacucho
  "12-25", // Navidad
]);

// Feriados móviles (Semana Santa: Jueves y Viernes Santo)
const FERIADOS_MOVILES_PE = new Set([
  "2026-04-02",
  "2026-04-03",
  "2027-03-25",
  "2027-03-26",
  "2028-04-13",
  "2028-04-14",
]);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function esFeriadoPeru(fecha: Date): boolean {
  const yyyy = fecha.getFullYear();
  const mm = pad(fecha.getMonth() + 1);
  const dd = pad(fecha.getDate());
  return (
    FERIADOS_FIJOS_PE.has(`${mm}-${dd}`) ||
    FERIADOS_MOVILES_PE.has(`${yyyy}-${mm}-${dd}`)
  );
}

/**
 * Retorna la fecha actual en zona horaria de Perú (America/Lima) como YYYY-MM-DD.
 */
export function obtenerFechaHoyPeruISO(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // YYYY-MM-DD
}

/**
 * Suma N días hábiles a una fecha YYYY-MM-DD (excluye sábados, domingos y feriados de Perú).
 */
export function sumarDiasHabiles(
  fechaInicioISO: string,
  diasHabiles: number
): string {
  const [anio, mes, dia] = fechaInicioISO.split("-").map(Number);
  const cursor = new Date(anio, mes - 1, dia);
  let contados = 0;

  while (contados < diasHabiles) {
    cursor.setDate(cursor.getDate() + 1);
    const diaSemana = cursor.getDay(); // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6 && !esFeriadoPeru(cursor)) {
      contados++;
    }
  }

  return `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(
    cursor.getDate()
  )}`;
}

/**
 * Calcula cuántos días hábiles faltan (o han vencido en negativo) hasta una fecha límite.
 */
export function calcularDiasHabilesRestantes(fechaLimiteISO: string): number {
  const hoyISO = obtenerFechaHoyPeruISO();
  if (hoyISO === fechaLimiteISO) return 0;

  const [y1, m1, d1] = hoyISO.split("-").map(Number);
  const [y2, m2, d2] = fechaLimiteISO.split("-").map(Number);

  const inicio = new Date(y1, m1 - 1, d1);
  const fin = new Date(y2, m2 - 1, d2);
  const vencido = inicio > fin;

  const cursor = new Date(vencido ? fin : inicio);
  const objetivo = vencido ? inicio : fin;
  let dias = 0;

  while (cursor < objetivo) {
    cursor.setDate(cursor.getDate() + 1);
    const diaSemana = cursor.getDay();
    if (diaSemana !== 0 && diaSemana !== 6 && !esFeriadoPeru(cursor)) {
      dias++;
    }
  }

  return vencido ? -dias : dias;
}

/**
 * Formatea YYYY-MM-DD a formato legible en español peruano (ej. 14/12/2026).
 */
export function formatearFechaPE(fechaISO: string | Date | null): string {
  if (!fechaISO) return "-";
  if (fechaISO instanceof Date) {
    return new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(fechaISO);
  }
  const limpia = String(fechaISO).split("T")[0];
  const [anio, mes, dia] = limpia.split("-");
  if (!anio || !mes || !dia) return limpia;
  return `${dia}/${mes}/${anio}`;
}

/**
 * Formatea fecha y hora en zona horaria de Perú.
 */
export function formatearFechaHoraPE(fecha: Date | string | null): string {
  if (!fecha) return "-";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}