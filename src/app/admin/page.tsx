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
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-aerogas-blue">Panel de Control de Estaciones</h1>
          <div className="flex gap-4">
            <Link href="/" className="px-5 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              🌎 Ver Web Pública
            </Link>
            {/* NUEVO BOTÓN: Acceso a la Bandeja de Cotizaciones */}
            <Link href="/admin/cotizaciones" className="px-5 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-800 transition-colors font-bold shadow-md">
              📥 Bandeja B2B
            </Link>
            <Link href="/admin/nuevo" className="px-5 py-2 text-sm text-white bg-aerogas-red rounded-md hover:bg-red-700 transition-colors font-bold shadow-md">
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