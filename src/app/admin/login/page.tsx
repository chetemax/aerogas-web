import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ADMIN_COOKIE_NAME,
  crearTokenSesionAdmin,
} from "../../../lib/adminAuth";

export default async function AdminLoginPage(props: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const searchParams = await props.searchParams;
  const errorMsg = searchParams?.error || "";
  const destino =
    searchParams?.next && searchParams.next.startsWith("/admin")
      ? searchParams.next
      : "/admin";

  async function iniciarSesion(formData: FormData) {
    "use server";

    const usuario = String(formData.get("usuario") || "").trim();
    const clave = String(formData.get("clave") || "");
    const nextUrl = String(formData.get("next") || "/admin");

    const userEnv = process.env.ADMIN_USER || "";
    const passEnv = process.env.ADMIN_PASSWORD || "";

    if (!userEnv || !passEnv) {
      redirect(
        `/admin/login?error=${encodeURIComponent(
          "Faltan configurar ADMIN_USER y ADMIN_PASSWORD en .env.local."
        )}`
      );
    }

    if (usuario !== userEnv || clave !== passEnv) {
      redirect(
        `/admin/login?error=${encodeURIComponent(
          "Usuario o contraseña incorrectos."
        )}&next=${encodeURIComponent(nextUrl)}`
      );
    }

    const token = await crearTokenSesionAdmin();
    const cookieStore = await cookies();

    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas de sesión
    });

    const rutaSegura = nextUrl.startsWith("/admin") ? nextUrl : "/admin";
    redirect(rutaSegura);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-aerogas-blue via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-aerogas-blue text-white p-6 text-center border-b-4 border-aerogas-red">
          <img
            src="/logo.png"
            alt="Aerogas del Norte"
            className="h-14 w-auto mx-auto mb-3 object-contain"
          />
          <h1 className="text-xl font-extrabold tracking-tight">
            Panel Administrativo
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Acceso restringido — Aerogas del Norte S.A.C.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 bg-red-50 border-l-4 border-aerogas-red text-red-800 p-3.5 rounded-r-lg text-sm font-semibold"
            >
              {errorMsg}
            </div>
          )}

          <form action={iniciarSesion} className="space-y-5">
            <input type="hidden" name="next" value={destino} />

            <div>
              <label
                htmlFor="usuario"
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                name="usuario"
                required
                autoComplete="username"
                placeholder="Ingresa tu usuario"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="clave"
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <input
                id="clave"
                type="password"
                name="clave"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-3.5 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              Ingresar al Panel
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-gray-500 hover:text-aerogas-blue transition-colors"
            >
              ← Volver al sitio web público
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}