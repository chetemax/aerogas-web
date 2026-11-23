import { pool } from "../../lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function AdminDashboard() {
  // LECTURA (READ): Consultar todas las estaciones ordenadas de menor a mayor (ASC)
  const [rows] = await pool.query("SELECT id, nombre, ciudad, direccion FROM estaciones ORDER BY id ASC");
  const estaciones = rows as any[];

  // ELIMINACIÓN (DELETE): Server Action para borrar
  async function eliminarEstacion(formData: FormData) {
    "use server";
    const id = formData.get("id");
    
    // Al eliminar la estación, MySQL borrará automáticamente sus relaciones de servicios
    await pool.query("DELETE FROM estaciones WHERE id = ?", [id]);
    
    revalidatePath("/");
    revalidatePath("/admin");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl p-8 border border-gray-200">
        
        {/* NUEVO MENÚ DE NAVEGACIÓN UNIFICADO */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-aerogas-blue">Panel de Control</h1>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="px-4 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              🌎 Ver Web
            </Link>
            {/* NUEVO BOTÓN PARA CONFIGURACIÓN WEB */}
            <Link href="/admin/configuracion" className="px-4 py-2 text-sm text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors font-bold shadow-md">
              ⚙️ Web
            </Link>
            {/* NUEVO BOTÓN PARA RECURSOS HUMANOS */}
            <Link href="/admin/postulantes" className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-800 transition-colors font-bold shadow-md">
              👥 Postulantes
            </Link>
            
            <Link href="/admin/cotizaciones" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-800 transition-colors font-bold shadow-md">
              📥 Cotizaciones
            </Link>

            <Link href="/admin/flota" className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-800 transition-colors font-bold shadow-md">
              🚛 Flota (Cisternas)
            </Link>
            
            {/* NUEVO BOTÓN PARA AEROMARKET */}
            <Link
              href="/admin/aeromarket"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors font-bold shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              AeroMarket
            </Link>

            {/* NUEVO BOTÓN PARA LIBRO DE RECLAMACIONES */}
            <Link
              href="/admin/reclamaciones"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-indigo-700 rounded-md hover:bg-indigo-800 transition-colors font-bold shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Reclamaciones
            </Link>

            <Link href="/admin/nuevo" className="px-4 py-2 text-sm text-white bg-aerogas-red rounded-md hover:bg-red-700 transition-colors font-bold shadow-md">
              + Nueva Estación
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-aerogas-blue">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estaciones.map((estacion) => (
                <tr key={estacion.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">#{estacion.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{estacion.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{estacion.ciudad}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-center gap-4">
                    
                    {/* Botón Editar */}
                    <Link 
                      href={`/admin/editar/${estacion.id}`} 
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md transition-colors"
                    >
                      Editar
                    </Link>

                    {/* Botón Eliminar */}
                    <form action={eliminarEstacion}>
                      <input type="hidden" name="id" value={estacion.id} />
                      <button 
                        type="submit" 
                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </form>

                  </td>
                </tr>
              ))}
              {estaciones.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-medium">
                    No hay estaciones registradas. Haz clic en "Nueva Estación" para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}