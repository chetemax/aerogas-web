export const ADMIN_COOKIE_NAME = "aerogas_admin_session";

async function generarFirma(texto: string, secreto: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(texto));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function crearTokenSesionAdmin(): Promise<string> {
  const user = process.env.ADMIN_USER || "";
  const pass = process.env.ADMIN_PASSWORD || "";
  if (!user || !pass) return "";
  return generarFirma(`aerogas_admin:${user}`, pass);
}

export async function verificarTokenSesionAdmin(
  tokenRecibido: string | undefined
): Promise<boolean> {
  if (!tokenRecibido) return false;
  const esperado = await crearTokenSesionAdmin();
  if (!esperado || tokenRecibido.length !== esperado.length) return false;

  let diff = 0;
  for (let i = 0; i < esperado.length; i++) {
    diff |= esperado.charCodeAt(i) ^ tokenRecibido.charCodeAt(i);
  }
  return diff === 0;
}