import { pool } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export default async function NuevaEstacionPage() {
  
  const [serviciosRows] = await pool.query("SELECT * FROM servicios ORDER BY id ASC");
  const serviciosDisponibles = serviciosRows as any[];

  async function agregarEstacion(formData: FormData) {
    "use server";
    
    const nombre = formData.get("nombre") as string;
    const direccion = formData.get("direccion") as string;
    const ciudad = formData.get("ciudad") as string;
    const mapa_url = formData.get("mapa_url") as string;
    const latitud = formData.get("latitud") as string;
    const longitud = formData.get("longitud") as string;
    
    // Capturando los nuevos campos
    const horario = formData.get("horario") as string;
    const telefono_estacion = formData.get("telefono_estacion") as string;
    const descripcion = formData.get("descripcion") as string;

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

    // Consulta INSERT actualizada con las 10 columnas (incluyendo latitud y longitud)
    const [result] = await pool.query(
      `INSERT INTO estaciones (nombre, direccion, ciudad, imagen, mapa_url, latitud, longitud, horario, telefono_estacion, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, direccion, ciudad, imagenUrl, mapa_url, latitud, longitud, horario, telefono_estacion, descripcion]
    );
    
    const insertId = (result as any).insertId;

    if (serviciosSeleccionados.length > 0) {
      const valoresPivote = serviciosSeleccionados.map((servicioId) => [insertId, Number(servicioId)]);
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
        
        <h2 className="text-lg font-bold text-gray-700 mb-6 border-b pb-2">Registrar Nueva Estación</h2>

        <form action={agregarEstacion} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Estación *</label>
              <input type="text" name="nombre" required placeholder="Ej: Estación Pimentel Sur" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Distrito *</label>
              <input type="text" name="ciudad" required placeholder="Ej: Nuevo Chimbote" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta *</label>
            <input type="text" name="direccion" required placeholder="Ej: Av. Pacífico 123" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horario de Atención *</label>
              <input type="text" name="horario" required defaultValue="Atención 24/7" placeholder="Ej: 6:00 am - 11:00 pm" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
              <input type="tel" name="telefono_estacion" placeholder="Ej: 074-123456" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Breve (Opcional)</label>
            <textarea name="descripcion" rows={3} placeholder="Ej: Estación con patio de maniobras amplio para cisternas..." className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de Google Maps *</label>
            <input type="url" name="mapa_url" required placeholder="https://maps.app.goo.gl/..." className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
          </div>

          {/* NUEVO: CAMPOS DE COORDENADAS PARA EL MAPA INTERACTIVO */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm font-medium text-aerogas-blue mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Coordenadas para el Mapa Interactivo
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Latitud</label>
                <input type="text" name="latitud" placeholder="Ej: -6.7713" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Longitud</label>
                <input type="text" name="longitud" placeholder="Ej: -79.8385" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-aerogas-red outline-none transition-all text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Disponibles</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border border-gray-300 rounded-md bg-gray-50">
              {serviciosDisponibles.map((servicio) => (
                <label key={servicio.id} className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="servicios" value={servicio.id} className="w-4 h-4 text-aerogas-red focus:ring-aerogas-red border-gray-300 rounded cursor-pointer" />
                  <span className="text-sm text-gray-700">{servicio.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fotografía del Grifo *</label>
            <input type="file" name="imagen" accept="image/*" required className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 transition-all cursor-pointer" />
          </div>

          <button type="submit" className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-md mt-4">
            Guardar Estación
          </button>
        </form>
      </div>
    </main>
  );
}