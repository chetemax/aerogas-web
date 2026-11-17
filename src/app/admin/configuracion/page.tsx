import { pool } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export default async function ConfiguracionWeb() {
  // LECTURA: Extraemos la fila maestra (ID = 1)
  const [rows] = await pool.query("SELECT * FROM configuracion_web WHERE id = 1");
  const config = (rows as any[])[0];

  async function guardarConfiguracion(formData: FormData) {
    "use server";
    const titulo = formData.get("titulo") as string;
    const texto1 = formData.get("texto1") as string;
    const texto2 = formData.get("texto2") as string;
    const archivo = formData.get("archivo") as File;

    let query = "UPDATE configuracion_web SET hero_titulo = ?, hero_texto_1 = ?, hero_texto_2 = ? WHERE id = 1";
    let params: any[] = [titulo, texto1, texto2];

    // Si el usuario sube un archivo nuevo, lo procesamos
    if (archivo && archivo.size > 0) {
      const bytes = await archivo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-hero-${archivo.name.replace(/\s/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      await writeFile(path.join(uploadDir, filename), buffer);
      
      const fileUrl = `/uploads/${filename}`;
      // Lógica automática: evalúa el MIME type para saber si es video o imagen
      const tipo = archivo.type.startsWith('video/') ? 'video' : 'imagen';

      query = "UPDATE configuracion_web SET hero_titulo = ?, hero_texto_1 = ?, hero_texto_2 = ?, hero_multimedia_url = ?, hero_multimedia_tipo = ? WHERE id = 1";
      params = [titulo, texto1, texto2, fileUrl, tipo];
    }

    await pool.query(query, params);
    
    // Forzamos a Next.js a actualizar la web pública y este panel
    revalidatePath("/");
    revalidatePath("/admin/configuracion");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 border border-gray-200">
        
        <div className="flex justify-between items-center mb-8 border-b pb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-aerogas-blue flex items-center gap-3">
            ⚙️ Configuración de la Web
          </h1>
          <Link href="/admin" className="px-5 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
            Volver al Panel
          </Link>
        </div>

        <form action={guardarConfiguracion} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Título Principal (Hero) *</label>
            <p className="text-xs text-gray-500 mb-2">Puedes mantener las etiquetas HTML integradas para respetar los colores Aerogas.</p>
            <input type="text" name="titulo" required defaultValue={config.hero_titulo} className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-aerogas-red outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Párrafo 1 (Presentación corporativa) *</label>
            <textarea name="texto1" rows={3} required defaultValue={config.hero_texto_1} className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-aerogas-red outline-none"></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Párrafo 2 (Trayectoria y experiencia) *</label>
            <textarea name="texto2" rows={4} required defaultValue={config.hero_texto_2} className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-aerogas-red outline-none"></textarea>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-6">
            <h3 className="text-lg font-bold text-aerogas-blue mb-4">Fondo Multimedia (Imagen o Video)</h3>
            
            {config.hero_multimedia_url && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-2">Fondo actual configurado ({config.hero_multimedia_tipo}):</p>
                {config.hero_multimedia_tipo === 'video' ? (
                  <video src={config.hero_multimedia_url} className="w-full max-w-md rounded-lg shadow-md border border-gray-200" controls muted />
                ) : (
                  <img src={config.hero_multimedia_url} alt="Fondo" className="w-full max-w-md rounded-lg shadow-md border border-gray-200" />
                )}
              </div>
            )}

            <label className="block text-sm font-bold text-gray-700 mb-2">Subir nuevo archivo de fondo</label>
            <p className="text-xs text-gray-500 mb-3">Recomendado: Video en MP4 corto (max 10MB) o imagen JPG horizontal. Si no subes nada, se conservará el actual.</p>
            <input type="file" name="archivo" accept="image/*,video/mp4,video/webm" className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 cursor-pointer transition-all" />
          </div>

          <button type="submit" className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-4 px-4 rounded-md transition-colors shadow-lg mt-6 text-lg">
            Guardar Configuración
          </button>
        </form>
      </div>
    </main>
  );
}