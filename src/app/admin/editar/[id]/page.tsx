import { pool } from "../../../../lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// En Next.js 15+, los params dinámicos se deben tratar como una Promesa
type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarEstacionPage({ params }: Props) {
  // 1. Obtener el ID de la URL
  const { id } = await params;

  // 2. Buscar la estación actual en la base de datos
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

  // 3. Traer el catálogo de servicios y los que esta estación ya tiene asignados
  const [serviciosRows] = await pool.query("SELECT * FROM servicios ORDER BY id ASC");
  const serviciosDisponibles = serviciosRows as any[];

  const [serviciosEstacionRows] = await pool.query("SELECT servicio_id FROM estacion_servicios WHERE estacion_id = ?", [id]);
  const serviciosActuales = (serviciosEstacionRows as any[]).map(row => row.servicio_id);

  // 4. Server Action para procesar la actualización
  async function actualizarEstacion(formData: FormData) {
    "use server";
    
    const nombre = formData.get("nombre") as string;
    const direccion = formData.get("direccion") as string;
    const ciudad = formData.get("ciudad") as string;
    const mapa_url = formData.get("mapa_url") as string;
    const imagenFile = formData.get("imagen") as File;
    const serviciosSeleccionados = formData.getAll("servicios"); 
    
    // Por defecto, mantenemos la imagen que ya tenía guardada en la base de datos
    let imagenUrl = estacion.imagen;

    // Si el usuario seleccionó una imagen NUEVA, la guardamos y sobreescribimos la variable
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

    // A. Actualizamos los datos principales en la tabla estaciones
    await pool.query(
      `UPDATE estaciones SET nombre = ?, direccion = ?, ciudad = ?, imagen = ?, mapa_url = ? WHERE id = ?`,
      [nombre, direccion, ciudad, imagenUrl, mapa_url, id]
    );

    // B. Actualizamos la tabla pivote (Borramos las relaciones viejas e insertamos las nuevas)
    await pool.query(`DELETE FROM estacion_servicios WHERE estacion_id = ?`, [id]);

    if (serviciosSeleccionados.length > 0) {
      const valoresPivote = serviciosSeleccionados.map((servicioId) => [id, Number(servicioId)]);
      await pool.query(
        `INSERT INTO estacion_servicios (estacion_id, servicio_id) VALUES ?`,
        [valoresPivote] 
      );
    }

    // C. Limpiar caché y redirigir
    revalidatePath("/");
    revalidatePath("/admin");
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-200 my-8">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold text-aerogas-blue">Panel Aerogas</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline font-medium">Volver a la Tabla</Link>
        </div>
        
        <h2 className="text-lg font-bold text-gray-700 mb-6 border-b pb-2">Editando: {estacion.nombre}</h2>

        <form action={actualizarEstacion} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Estación</label>
            {/* Usamos defaultValue para pre-llenar los inputs con los datos de MySQL */}
            <input type="text" name="nombre" required defaultValue={estacion.nombre} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta</label>
            <input type="text" name="direccion" required defaultValue={estacion.direccion} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Distrito</label>
            <input type="text" name="ciudad" required defaultValue={estacion.ciudad} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de Google Maps</label>
            <input type="url" name="mapa_url" required defaultValue={estacion.mapa_url} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Disponibles</label>
            <div className="grid grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md bg-gray-50">
              {serviciosDisponibles.map((servicio) => (
                <label key={servicio.id} className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="servicios" 
                    value={servicio.id}
                    // defaultChecked evalúa si el ID del servicio está en el arreglo de servicios actuales
                    defaultChecked={serviciosActuales.includes(servicio.id)}
                    className="w-4 h-4 text-aerogas-red focus:ring-aerogas-red border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{servicio.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actualizar Fotografía (Opcional)</label>
            <p className="text-xs text-gray-500 mb-2">Si dejas este campo vacío, se mantendrá la foto actual.</p>
            <input 
              type="file" 
              name="imagen" 
              accept="image/*" 
              // A diferencia de "Nuevo", aquí el required NO está puesto
              className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 transition-all cursor-pointer"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-md mt-4">
            Guardar Cambios
          </button>
        </form>
      </div>
    </main>
  );
}