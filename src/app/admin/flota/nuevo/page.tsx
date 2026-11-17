import { pool } from "../../../../lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export default function NuevaCisternaPage() {
  async function agregarCisterna(formData: FormData) {
    "use server";
    
    const tracto = formData.get("tracto") as string;
    const tanque = formData.get("tanque") as string;
    const marca = formData.get("marca") as string;
    const compartimientos = Number(formData.get("compartimientos"));
    const capacidad = Number(formData.get("capacidad"));
    const imagenFile = formData.get("imagen") as File;
    
    let imagenUrl = "https://placehold.co/600x400/162865/FFFFFF?text=Foto+Cisterna";

    if (imagenFile && imagenFile.size > 0) {
      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-cisterna-${imagenFile.name.replace(/\s/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      await writeFile(path.join(uploadDir, filename), buffer);
      imagenUrl = `/uploads/${filename}`;
    }

    await pool.query(
      `INSERT INTO cisternas (tracto, tanque, marca, compartimientos, capacidad, imagen) VALUES (?, ?, ?, ?, ?, ?)`,
      [tracto, tanque || '-', marca, compartimientos, capacidad, imagenUrl]
    );

    revalidatePath("/admin/flota");
    revalidatePath("/");
    redirect("/admin/flota");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 border border-gray-200 my-8">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold text-aerogas-blue">Agregar Cisterna</h1>
          <Link href="/admin/flota" className="text-sm text-blue-600 hover:underline">Volver a la Flota</Link>
        </div>

        <form action={agregarCisterna} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa del Tracto *</label>
              <input type="text" name="tracto" required placeholder="Ej: AVT-922" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-aerogas-red" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa del Tanque</label>
              <input type="text" name="tanque" placeholder="Ej: AEK-997 (Opcional)" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-aerogas-red" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca del Vehículo *</label>
            <input type="text" name="marca" required placeholder="Ej: VOLKSWAGEN" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-aerogas-red" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compartimientos *</label>
              <input type="number" name="compartimientos" required min="1" placeholder="Ej: 5" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-aerogas-red" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Total (Galones) *</label>
              <input type="number" name="capacidad" required min="1000" placeholder="Ej: 9000" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-aerogas-red" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fotografía del Camión *</label>
            <input type="file" name="imagen" accept="image/*" required className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 cursor-pointer" />
          </div>

          <button type="submit" className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-md mt-4">
            Guardar Unidad
          </button>
        </form>
      </div>
    </main>
  );
}