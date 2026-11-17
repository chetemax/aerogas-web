import { pool } from "../../../../lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarEstacionPage({ params }: Props) {
  const { id } = await params;

  const [estacionRows] = await pool.query("SELECT * FROM estaciones WHERE id = ?", [id]);
  const estacionData = estacionRows as any[];
  
  if (estacionData.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Estación no encontrada</h1>
        <Link href="/admin" className="text-blue-600 underline">Volver al Panel</Link>
      </div>
    );
  }
  
  const estacion = estacionData[0];

  const [serviciosRows] = await pool.query("SELECT * FROM servicios ORDER BY id ASC");
  const serviciosDisponibles = serviciosRows as any[];

  const [serviciosEstacionRows] = await pool.query("SELECT servicio_id FROM estacion_servicios WHERE estacion_id = ?", [id]);
  const serviciosActuales = (serviciosEstacionRows as any[]).map(row => row.servicio_id);

  async function actualizarEstacion(formData: FormData) {
    "use server";
    
    const nombre = formData.get("nombre") as string;
    const direccion = formData.get("direccion") as string;
    const ciudad = formData.get("ciudad") as string;
    const mapa_url = formData.get("mapa_url") as string;
    
    // Capturando nuevos campos
    const horario = formData.get("horario") as string;
    const telefono_estacion = formData.get("telefono_estacion") as string;
    const descripcion = formData.get("descripcion") as string;
    
    const imagenFile = formData.get("imagen") as File;
    const serviciosSeleccionados = formData.getAll("servicios"); 
    
    let imagenUrl = estacion.imagen;

    if (imagenFile && imagenFile.size > 0) {
      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${imagenFile.name.replace(/\s/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      
      imagenUrl = `/uploads/${filename}`;
    }

    // Consulta UPDATE actualizada
    await pool.query(
      `UPDATE estaciones SET nombre = ?, direccion = ?, ciudad = ?, imagen = ?, mapa_url = ?, horario = ?, telefono_estacion = ?, descripcion = ? WHERE id = ?`,
      [nombre, direccion, ciudad, imagenUrl, mapa_url, horario, telefono_estacion, descripcion, id]
    );

    await pool.query(`DELETE FROM estacion_servicios WHERE estacion_id = ?`, [id]);

    if (serviciosSeleccionados.length > 0) {
      const valoresPivote = serviciosSeleccionados.map((servicioId) => [id, Number(servicioId)]);
      await pool.query(
        `INSERT INTO estacion_servicios (estacion_id, servicio_id) VALUES ?`,
        [valoresPivote] 
      );
    }

    revalidatePath("/");
    revalidatePath("/admin");
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 border border-gray-200 my-8">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold text-aerogas-blue">Panel Aerogas</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline font-medium">Volver a la Tabla</Link>
        </div>
        
        <h2 className="text-lg font-bold text-gray-700 mb-6 border-b pb-2">Editando: {estacion.nombre}</h2>

        <form action={actualizarEstacion} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Estación *</label>
              <input type="text" name="nombre" required defaultValue={estacion.nombre} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Distrito *</label>
              <input type="text" name="ciudad" required defaultValue={estacion.ciudad} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta *</label>
            <input type="text" name="direccion" required defaultValue={estacion.direccion} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horario de Atención *</label>
              <input type="text" name="horario" required defaultValue={estacion.horario} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
              <input type="tel" name="telefono_estacion" defaultValue={estacion.telefono_estacion} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Breve (Opcional)</label>
            <textarea name="descripcion" rows={3} defaultValue={estacion.descripcion} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de Google Maps *</label>
            <input type="url" name="mapa_url" required defaultValue={estacion.mapa_url} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Disponibles</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border border-gray-300 rounded-md bg-gray-50">
              {serviciosDisponibles.map((servicio) => (
                <label key={servicio.id} className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="servicios" value={servicio.id} defaultChecked={serviciosActuales.includes(servicio.id)} className="w-4 h-4 text-aerogas-red focus:ring-aerogas-red border-gray-300 rounded cursor-pointer" />
                  <span className="text-sm text-gray-700">{servicio.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actualizar Fotografía (Opcional)</label>
            <input type="file" name="imagen" accept="image/*" className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 transition-all cursor-pointer" />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-md mt-4">
            Guardar Cambios
          </button>
        </form>
      </div>
    </main>
  );
}