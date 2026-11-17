import { pool } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function CotizacionesPage() {
  // LECTURA: Consultar cotizaciones, ordenando por fecha de creación (las más nuevas primero)
  const [rows] = await pool.query("SELECT * FROM cotizaciones ORDER BY creado_en DESC");
  const cotizaciones = rows as any[];

  // ACCIÓN 1: Marcar como Atendido
  async function marcarAtendido(formData: FormData) {
    "use server";
    const id = formData.get("id");
    await pool.query("UPDATE cotizaciones SET estado = 'Atendido' WHERE id = ?", [id]);
    revalidatePath("/admin/cotizaciones");
  }

  // ACCIÓN 2: Eliminar cotización
  async function eliminarCotizacion(formData: FormData) {
    "use server";
    const id = formData.get("id");
    await pool.query("DELETE FROM cotizaciones WHERE id = ?", [id]);
    revalidatePath("/admin/cotizaciones");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl p-8 border border-gray-200">
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-aerogas-blue flex items-center gap-3">
            📥 Bandeja de Solicitudes Corporativas
          </h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline font-medium font-semibold border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
            Volver a Estaciones
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-aerogas-blue">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Empresa / RUC</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Contacto</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Mensaje</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cotizaciones.map((c) => {
                // Formatear la fecha para que sea legible (DD/MM/YYYY)
                const fecha = new Date(c.creado_en).toLocaleDateString("es-PE", {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                });

                const esPendiente = c.estado === 'Pendiente';

                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${esPendiente ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">{fecha}</td>
                    
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-gray-900">{c.empresa}</div>
                      <div className="text-xs text-gray-500">RUC: {c.ruc}</div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-800">{c.contacto}</div>
                      <div className="text-xs text-gray-500">📞 {c.telefono}</div>
                      <div className="text-xs text-gray-500">✉️ {c.email}</div>
                    </td>
                    
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate" title={c.mensaje}>
                      {c.mensaje || <span className="italic text-gray-400">Sin detalles adicionales</span>}
                    </td>
                    
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        esPendiente ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex justify-center gap-2">
                      {/* Botón Atender (solo si está Pendiente) */}
                      {esPendiente && (
                        <form action={marcarAtendido}>
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md transition-colors cursor-pointer border border-green-200 hover:bg-green-100">
                            ✔ Atender
                          </button>
                        </form>
                      )}

                      {/* Botón Eliminar */}
                      <form action={eliminarCotizacion}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md transition-colors cursor-pointer border border-red-200 hover:bg-red-100">
                          🗑️
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              
              {cotizaciones.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No hay solicitudes de cotización por el momento.
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