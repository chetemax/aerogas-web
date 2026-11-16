import { pool } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export default async function NuevaEstacionPage() {
  
  // Consultamos los servicios disponibles en MySQL para crear los checkboxes dinámicamente
  const [serviciosRows] = await pool.query("SELECT * FROM servicios ORDER BY id ASC");
  const serviciosDisponibles = serviciosRows as any[];

  async function agregarEstacion(formData: FormData) {
    "use server";
    
    const nombre = formData.get("nombre") as string;
    const direccion = formData.get("direccion") as string;
    const ciudad = formData.get("ciudad") as string;
    const mapa_url = formData.get("mapa_url") as string;
    const imagenFile = formData.get("imagen") as File;
    
    const serviciosSeleccionados = formData.getAll("servicios"); 
    
    let imagenUrl = "https://placehold.co/600x400/162865/FFFFFF?text=Sin+Imagen";

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

    const [result] = await pool.query(
      `INSERT INTO estaciones (nombre, direccion, ciudad, imagen, mapa_url) VALUES (?, ?, ?, ?, ?)`,
      [nombre, direccion, ciudad, imagenUrl, mapa_url]
    );
    
    const insertId = (result as any).insertId;

    if (serviciosSeleccionados.length > 0) {
      const valoresPivote = serviciosSeleccionados.map((servicioId) => [insertId, Number(servicioId)]);
      
      await pool.query(
        `INSERT INTO estacion_servicios (estacion_id, servicio_id) VALUES ?`,
        [valoresPivote] 
      );
    }

    // Actualizamos la memoria caché de ambas páginas
    revalidatePath("/");
    revalidatePath("/admin");
    
    // REDIRECCIÓN CORREGIDA: Volver al Dashboard
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-200 my-8">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold text-aerogas-blue">Panel Aerogas</h1>
          {/* ENLACE CORREGIDO: Volver a la Tabla */}
          <Link href="/admin" className="text-sm text-blue-600 hover:underline font-medium">Volver a la Tabla</Link>
        </div>
        
        <h2 className="text-lg font-bold text-gray-700 mb-6 border-b pb-2">Registrar Nueva Estación</h2>

        <form action={agregarEstacion} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Estación</label>
            <input type="text" name="nombre" required placeholder="Ej: Estación Pimentel Sur" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta</label>
            <input type="text" name="direccion" required placeholder="Ej: Av. Pacífico 123" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Distrito</label>
            <input type="text" name="ciudad" required placeholder="Ej: Nuevo Chimbote" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de Google Maps</label>
            <input type="url" name="mapa_url" required placeholder="https://maps.app.goo.gl/..." className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
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
                    className="w-4 h-4 text-aerogas-red focus:ring-aerogas-red border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{servicio.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fotografía del Grifo</label>
            <input 
              type="file" 
              name="imagen" 
              accept="image/*" 
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 transition-all cursor-pointer"
            />
          </div>

          <button type="submit" className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-md mt-4">
            Guardar Estación
          </button>
        </form>
      </div>
    </main>
  );
}