import { pool } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export default async function ConfiguracionWeb() {
  const [rows] = await pool.query("SELECT * FROM configuracion_web WHERE id = 1");
  const config = (rows as any[])[0];

  async function guardarConfiguracion(formData: FormData) {
    "use server";
    
    // Datos del Hero
    const titulo = formData.get("titulo") as string;
    const texto1 = formData.get("texto1") as string;
    const texto2 = formData.get("texto2") as string;
    const archivo_hero = formData.get("archivo_hero") as File;
    
    // Datos del Modal
    const modal_enlace = formData.get("modal_enlace") as string;
    const modal_activo = formData.get("modal_activo") === "on"; // Checkbox devuelve "on" si está marcado
    const archivo_modal = formData.get("archivo_modal") as File;

    // 1. Actualizamos todos los textos y el interruptor
    await pool.query(
      `UPDATE configuracion_web SET 
        hero_titulo = ?, hero_texto_1 = ?, hero_texto_2 = ?, 
        modal_enlace = ?, modal_activo = ? 
       WHERE id = 1`,
      [titulo, texto1, texto2, modal_enlace, modal_activo ? 1 : 0]
    );

    // 2. Si el administrador sube un nuevo video o fondo para el Hero
    if (archivo_hero && archivo_hero.size > 0) {
      const bytes = await archivo_hero.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-hero-${archivo_hero.name.replace(/\s/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      await writeFile(path.join(uploadDir, filename), buffer);
      
      const fileUrl = `/uploads/${filename}`;
      const tipo = archivo_hero.type.startsWith('video/') ? 'video' : 'imagen';

      await pool.query("UPDATE configuracion_web SET hero_multimedia_url = ?, hero_multimedia_tipo = ? WHERE id = 1", [fileUrl, tipo]);
    }

    // 3. Si el administrador sube un nuevo afiche para el Modal
    if (archivo_modal && archivo_modal.size > 0) {
      const bytes = await archivo_modal.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-modal-${archivo_modal.name.replace(/\s/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      await writeFile(path.join(uploadDir, filename), buffer);
      
      const fileUrl = `/uploads/${filename}`;
      await pool.query("UPDATE configuracion_web SET modal_imagen = ? WHERE id = 1", [fileUrl]);
    }
    
    revalidatePath("/");
    revalidatePath("/admin/configuracion");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-xl p-8 border border-gray-200">
        
        <div className="flex justify-between items-center mb-8 border-b pb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-aerogas-blue flex items-center gap-3">
            ⚙️ Configuración Global de la Web
          </h1>
          <Link href="/admin" className="px-5 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
            Volver al Panel
          </Link>
        </div>

        <form action={guardarConfiguracion} className="space-y-10">
          
          {/* SECCIÓN 1: HERO (FONDO PRINCIPAL) */}
          <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold text-aerogas-red mb-4">1. Cabecera Principal (Hero)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título Principal</label>
                <input type="text" name="titulo" required defaultValue={config.hero_titulo} className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-aerogas-red outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Párrafo 1 (Presentación)</label>
                <textarea name="texto1" rows={3} required defaultValue={config.hero_texto_1} className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-aerogas-red outline-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Párrafo 2 (Trayectoria)</label>
                <textarea name="texto2" rows={4} required defaultValue={config.hero_texto_2} className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-aerogas-red outline-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Archivo de Fondo (Video MP4 o Imagen)</label>
                {config.hero_multimedia_url && (
                  <p className="text-xs text-blue-600 mb-2 font-semibold">✓ Archivo actual configurado ({config.hero_multimedia_tipo})</p>
                )}
                <input type="file" name="archivo_hero" accept="image/*,video/mp4,video/webm" className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white cursor-pointer" />
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: MODAL PUBLICITARIO / RECLUTAMIENTO */}
          <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-aerogas-blue">2. Ventana Emergente (Modal Promocional)</h2>
              
              {/* INTERRUPTOR (TOGGLE) PARA ACTIVAR/DESACTIVAR */}
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="modal_activo" defaultChecked={!!config.modal_activo} className="sr-only" />
                  <div className="block bg-gray-300 w-14 h-8 rounded-full border-2 border-white shadow-inner"></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition shadow-md ${config.modal_activo ? 'transform translate-x-6 bg-green-500' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-bold text-gray-700">
                  {config.modal_activo ? '🟢 Activado' : '🔴 Apagado'}
                </div>
              </label>
            </div>

            <p className="text-sm text-gray-600 mb-6">Este anuncio aparecerá cuando los usuarios entren a la página web.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Enlace del botón (URL)</label>
                <p className="text-xs text-gray-500 mb-2">¿A dónde los llevará al hacer clic? (Ej: /unete-al-equipo o /promociones)</p>
                <input type="text" name="modal_enlace" required defaultValue={config.modal_enlace} className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-aerogas-red outline-none" />
                
                <div className="mt-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subir Afiche / Diseño (Imagen)</label>
                  <input type="file" name="archivo_modal" accept="image/*" className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white cursor-pointer" />
                </div>
              </div>

              {/* Vista previa del afiche actual */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                <span className="text-sm font-bold text-gray-500 mb-2">Vista Previa Actual</span>
                {config.modal_imagen ? (
                  <img src={config.modal_imagen} alt="Modal Promocional" className="max-h-48 object-contain rounded-md shadow-sm" />
                ) : (
                  <div className="text-gray-400 text-sm italic py-10">Ninguna imagen subida aún.</div>
                )}
              </div>
            </div>
          </section>

          <button type="submit" className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-4 px-4 rounded-md transition-colors shadow-lg mt-6 text-lg">
            Guardar Configuración General
          </button>
        </form>
      </div>
      
      {/* Estilos adicionales para el toggle del checkbox */}
      <style dangerouslySetInnerHTML={{__html: `
        input:checked ~ .dot {
          transform: translateX(1.5rem);
          background-color: #22c55e;
        }
        input:checked ~ .block {
          background-color: #dcfce7;
        }
      `}} />
    </main>
  );
}