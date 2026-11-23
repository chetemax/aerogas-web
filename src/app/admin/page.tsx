import { pool } from "../../lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { cerrarSesionAdmin } from "./logout/actions";
import TablaEstacionesAdmin, {
  EstacionAdmin,
} from "../../components/TablaEstacionesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [rows] = await pool.query(
    "SELECT id, nombre, ciudad, direccion FROM estaciones ORDER BY id ASC"
  );
  const estaciones = rows as EstacionAdmin[];

  async function eliminarEstacion(formData: FormData) {
    "use server";
    const id = formData.get("id");
    await pool.query("DELETE FROM estaciones WHERE id = ?", [id]);
    revalidatePath("/");
    revalidatePath("/admin");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl p-5 sm:p-8 border border-gray-200 space-y-6">
        {/* FILA SUPERIOR: TÍTULO + VER WEB + CERRAR SESIÓN */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-aerogas-blue">
              Panel de Control
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Administración general de estaciones, AeroMarket, B2B y Libro de Reclamaciones
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/"
              className="flex-1 sm:flex-initial text-center px-4 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ver Web
            </Link>

            <form action={cerrarSesionAdmin} className="flex-1 sm:flex-initial">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-red-700 bg-red-50 hover:bg-aerogas-red hover:text-white border border-red-200 rounded-lg font-bold transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>

        {/* BARRA DE MÓDULOS (GRILLA RESPONSIVA EN CELULAR, FILA EN ESCRITORIO) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5">
          <Link
            href="/admin/configuracion"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors font-bold shadow-sm"
          >
            Config. Web
          </Link>

          <Link
            href="/admin/postulantes"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors font-bold shadow-sm"
          >
            Postulantes
          </Link>

          <Link
            href="/admin/cotizaciones"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm"
          >
            Cotizaciones
          </Link>

          <Link
            href="/admin/flota"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors font-bold shadow-sm"
          >
            Flota (Cisternas)
          </Link>

          <Link
            href="/admin/aeromarket"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors font-bold shadow-sm"
          >
            AeroMarket
          </Link>

          <Link
            href="/admin/reclamaciones"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors font-bold shadow-sm"
          >
            Reclamaciones
          </Link>

          <Link
            href="/admin/nuevo"
            className="col-span-2 sm:col-span-1 sm:ml-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm text-white bg-aerogas-red rounded-lg hover:bg-red-700 transition-colors font-bold shadow-md"
          >
            + Nueva Estación
          </Link>
        </div>

        {/* TABLA CON BUSCADOR, FILTRO POR CIUDAD Y PAGINACIÓN */}
        <TablaEstacionesAdmin
          estaciones={estaciones}
          eliminarEstacion={eliminarEstacion}
        />
      </div>
    </main>
  );
}