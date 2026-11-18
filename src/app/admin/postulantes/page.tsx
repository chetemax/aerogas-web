import { pool } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function PostulantesDashboard() {
  // Consultamos los postulantes ordenados desde el más reciente
  const [rows] = await pool.query("SELECT * FROM postulantes ORDER BY fecha_postulacion DESC");
  const postulantes = rows as any[];

  // Acción para eliminar un CV si ya no es necesario
  async function eliminarPostulante(formData: FormData) {
    "use server";
    const id = formData.get("id");
    await pool.query("DELETE FROM postulantes WHERE id = ?", [id]);
    revalidatePath("/admin/postulantes");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl p-8 border border-gray-200">
        
        {/* ENCABEZADO CON MENÚ DE NAVEGACIÓN */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-aerogas-blue flex items-center gap-3">
            👥 Bandeja de Recursos Humanos
          </h1>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="px-4 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              🌎 Ver Web
            </Link>
            <Link href="/admin" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-800 transition-colors font-bold shadow-md">
              ⛽ Estaciones
            </Link>
            <Link href="/admin/cotizaciones" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-800 transition-colors font-bold shadow-md">
              📥 Cotizaciones B2B
            </Link>
          </div>
        </div>

        {/* TABLA DE CANDIDATOS */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-aerogas-blue">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Candidato / Puesto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Currículum (CV)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {postulantes.map((postulante) => (
                <tr key={postulante.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {new Date(postulante.fecha_postulacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{postulante.nombre}</div>
                    <div className="text-xs font-semibold text-aerogas-red mt-1 px-2 py-1 bg-red-50 rounded-md inline-block">
                      {postulante.puesto}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-2">
                      <span>📞</span> <a href={`tel:${postulante.telefono}`} className="hover:text-blue-600 hover:underline">{postulante.telefono}</a>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <span>✉️</span> <a href={`mailto:${postulante.email}`} className="hover:text-blue-600 hover:underline">{postulante.email}</a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {postulante.cv_url ? (
                      <a 
                        href={postulante.cv_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-100 text-green-700 hover:bg-green-200 font-bold px-4 py-2 rounded-md transition-colors"
                      >
                        📄 Ver / Descargar PDF
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Sin archivo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <form action={eliminarPostulante}>
                      <input type="hidden" name="id" value={postulante.id} />
                      <button type="submit" className="text-red-600 hover:text-white hover:bg-red-600 border border-red-200 px-3 py-1 rounded-md transition-colors">
                        Descartar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {postulantes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium text-lg">
                    Aún no hay postulaciones recibidas.
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