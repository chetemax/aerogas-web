import { pool } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function FlotaDashboard() {
  const [rows] = await pool.query("SELECT * FROM cisternas ORDER BY id DESC");
  const cisternas = rows as any[];

  async function eliminarCisterna(formData: FormData) {
    "use server";
    const id = formData.get("id");
    await pool.query("DELETE FROM cisternas WHERE id = ?", [id]);
    revalidatePath("/admin/flota");
    revalidatePath("/");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl p-8 border border-gray-200">
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-aerogas-blue flex items-center gap-3">
            🚛 Gestión de Flota (Cisternas)
          </h1>
          <div className="flex gap-4">
            <Link href="/admin" className="px-5 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              Volver a Estaciones
            </Link>
            <Link href="/admin/flota/nuevo" className="px-5 py-2 text-sm text-white bg-aerogas-red rounded-md hover:bg-red-700 transition-colors font-bold shadow-md">
              + Agregar Cisterna
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-aerogas-blue">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Vehículo (Tracto / Tanque)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Marca</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">Capacidad</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cisternas.map((cisterna) => (
                <tr key={cisterna.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">Tracto: {cisterna.tracto}</div>
                    <div className="text-sm text-gray-500">Tanque: {cisterna.tanque}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{cisterna.marca}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-aerogas-blue">{cisterna.capacidad} Galones</div>
                    <div className="text-xs text-gray-500">{cisterna.compartimientos} Compartimientos</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-center">
                    <form action={eliminarCisterna}>
                      <input type="hidden" name="id" value={cisterna.id} />
                      <button type="submit" className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md border border-red-200 hover:bg-red-100">
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {cisternas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-medium">No hay cisternas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}