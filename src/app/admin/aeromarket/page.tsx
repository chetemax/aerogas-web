import { pool } from "../../../lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export default async function AdminAeroMarket(props: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const searchParams = await props.searchParams;
  const guardado = searchParams?.guardado;

  // 1. Consultar configuración general de AeroMarket
  const [configRows] = await pool.query(
    "SELECT * FROM aeromarket_config WHERE id = 1"
  );
  const config = (configRows as any[])[0] || {
    titulo: "AeroMarket",
    subtitulo: "Tu parada de conveniencia en el camino",
    descripcion: "",
    banner_url: "",
    catalogo_pdf_url: "",
  };

  // 2. Consultar promociones (activas primero, luego las más recientes)
  const [promosRows] = await pool.query(
    "SELECT * FROM aeromarket_promos ORDER BY activo DESC, fecha_creacion DESC"
  );
  const promos = promosRows as any[];

  // ACCIÓN 1: Guardar configuración de portada y catálogo PDF
  async function guardarConfiguracion(formData: FormData) {
    "use server";

    const titulo = formData.get("titulo") as string;
    const subtitulo = formData.get("subtitulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const bannerFile = formData.get("banner") as File;
    const catalogoFile = formData.get("catalogo_pdf") as File;

    // Consultamos las rutas actuales para no sobrescribir si no se sube un archivo nuevo
    const [actualRows] = await pool.query(
      "SELECT banner_url, catalogo_pdf_url FROM aeromarket_config WHERE id = 1"
    );
    const actual = (actualRows as any[])[0] || {
      banner_url: "",
      catalogo_pdf_url: "",
    };

    let bannerUrl = actual.banner_url || "";
    let catalogoUrl = actual.catalogo_pdf_url || "";

    const uploadDir = path.join(process.cwd(), "public/uploads/aeromarket");

    // Guardar imagen de portada si se subió una nueva
    if (bannerFile && bannerFile.size > 0) {
      const bytes = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cleanName = bannerFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const filename = `${Date.now()}-banner-${cleanName}`;
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {}
      await writeFile(path.join(uploadDir, filename), buffer);
      bannerUrl = `/uploads/aeromarket/${filename}`;
    }

    // Guardar catálogo PDF si se subió uno nuevo
    if (catalogoFile && catalogoFile.size > 0) {
      const bytes = await catalogoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cleanName = catalogoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const filename = `${Date.now()}-catalogo-${cleanName}`;
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {}
      await writeFile(path.join(uploadDir, filename), buffer);
      catalogoUrl = `/uploads/aeromarket/${filename}`;
    }

    await pool.query(
      `UPDATE aeromarket_config 
       SET titulo = ?, subtitulo = ?, descripcion = ?, banner_url = ?, catalogo_pdf_url = ? 
       WHERE id = 1`,
      [titulo, subtitulo, descripcion, bannerUrl, catalogoUrl]
    );

    revalidatePath("/aeromarket");
    revalidatePath("/admin/aeromarket");
    redirect("/admin/aeromarket?guardado=config");
  }

  // ACCIÓN 2: Quitar el catálogo PDF (oculta el botón en la web pública)
  async function quitarCatalogo() {
    "use server";
    await pool.query(
      "UPDATE aeromarket_config SET catalogo_pdf_url = '' WHERE id = 1"
    );
    revalidatePath("/aeromarket");
    revalidatePath("/admin/aeromarket");
    redirect("/admin/aeromarket?guardado=catalogo_eliminado");
  }

  // ACCIÓN 3: Crear una nueva promoción
  async function crearPromo(formData: FormData) {
    "use server";

    const titulo = formData.get("titulo") as string;
    const descripcion = (formData.get("descripcion") as string) || "";
    const categoria = (formData.get("categoria") as string) || "Combos";
    const etiqueta = (formData.get("etiqueta") as string) || "";
    const precio_promo = (formData.get("precio_promo") as string) || "";
    const fechaFinRaw = (formData.get("fecha_fin") as string) || "";
    const fecha_fin = fechaFinRaw.trim() !== "" ? fechaFinRaw : null;
    const imagenFile = formData.get("imagen") as File;

    let imagenUrl = "";

    if (imagenFile && imagenFile.size > 0) {
      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cleanName = imagenFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const filename = `${Date.now()}-promo-${cleanName}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/aeromarket");
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {}
      await writeFile(path.join(uploadDir, filename), buffer);
      imagenUrl = `/uploads/aeromarket/${filename}`;
    }

    await pool.query(
      `INSERT INTO aeromarket_promos 
       (titulo, descripcion, categoria, etiqueta, precio_promo, imagen_url, fecha_fin, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        titulo,
        descripcion,
        categoria,
        etiqueta,
        precio_promo,
        imagenUrl,
        fecha_fin,
      ]
    );

    revalidatePath("/aeromarket");
    revalidatePath("/admin/aeromarket");
    redirect("/admin/aeromarket?guardado=promo");
  }

  // ACCIÓN 4: Activar o pausar una promoción sin borrarla
  async function cambiarEstadoPromo(formData: FormData) {
    "use server";
    const id = formData.get("id");
    const estadoActual = Number(formData.get("activo"));
    const nuevoEstado = estadoActual === 1 ? 0 : 1;

    await pool.query("UPDATE aeromarket_promos SET activo = ? WHERE id = ?", [
      nuevoEstado,
      id,
    ]);

    revalidatePath("/aeromarket");
    revalidatePath("/admin/aeromarket");
  }

  // ACCIÓN 5: Eliminar promoción permanentemente
  async function eliminarPromo(formData: FormData) {
    "use server";
    const id = formData.get("id");
    await pool.query("DELETE FROM aeromarket_promos WHERE id = ?", [id]);

    revalidatePath("/aeromarket");
    revalidatePath("/admin/aeromarket");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ENCABEZADO */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-aerogas-red/10 text-aerogas-red flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-aerogas-blue">
                Gestión de AeroMarket
              </h1>
              <p className="text-sm text-gray-500">
                Administra la portada, catálogo digital y promociones vigentes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/aeromarket"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-aerogas-blue font-semibold border border-blue-200 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Ver AeroMarket
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 font-semibold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Volver al Panel
            </Link>
          </div>
        </div>

        {/* ALERTA DE CONFIRMACIÓN */}
        {guardado && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 text-green-800 text-sm font-semibold">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>
                {guardado === "config" && "Configuración de AeroMarket actualizada correctamente."}
                {guardado === "promo" && "Nueva promoción publicada correctamente."}
                {guardado === "catalogo_eliminado" && "Catálogo PDF retirado de la vista pública."}
              </span>
            </div>
            <Link
              href="/admin/aeromarket"
              className="text-xs font-bold text-green-700 hover:underline"
            >
              Cerrar
            </Link>
          </div>
        )}

        {/* BLOQUE 1: CONFIGURACIÓN DE PORTADA Y CATÁLOGO */}
        <section className="bg-white rounded-xl shadow-md p-6 sm:p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-aerogas-blue mb-6 pb-3 border-b border-gray-200">
            1. Portada y Catálogo Digital
          </h2>

          <form action={guardarConfiguracion} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Título Principal *
                </label>
                <input
                  type="text"
                  name="titulo"
                  required
                  defaultValue={config.titulo}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-aerogas-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Subtítulo / Eslogan *
                </label>
                <input
                  type="text"
                  name="subtitulo"
                  required
                  defaultValue={config.subtitulo}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-aerogas-blue outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Descripción de AeroMarket *
              </label>
              <textarea
                name="descripcion"
                rows={3}
                required
                defaultValue={config.descripcion}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-aerogas-blue outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subir Banner */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Imagen de Banner Principal (Opcional)
                </label>
                <input
                  type="file"
                  name="banner"
                  accept="image/*"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 cursor-pointer"
                />
                {config.banner_url ? (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={config.banner_url}
                      alt="Banner actual"
                      className="w-24 h-14 object-cover rounded border border-gray-300"
                    />
                    <span className="text-xs text-gray-500">
                      Banner activo actual. Sube una imagen nueva solo si deseas reemplazarlo.
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    Recomendado: imagen horizontal (ej. 1920x700 px) del interior o fachada del market.
                  </p>
                )}
              </div>

              {/* Subir Catálogo PDF */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catálogo de Productos en PDF (Opcional)
                </label>
                <input
                  type="file"
                  name="catalogo_pdf"
                  accept=".pdf"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-aerogas-red file:text-white hover:file:bg-red-700 cursor-pointer"
                />
                {config.catalogo_pdf_url ? (
                  <div className="mt-3 flex items-center justify-between gap-2 bg-white px-3 py-2 rounded border border-gray-200">
                    <a
                      href={config.catalogo_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-aerogas-blue hover:underline truncate"
                    >
                      Ver catálogo PDF actual
                    </a>
                    <span className="text-xs text-green-600 font-semibold">Activo</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    Si no subes un PDF, el botón de catálogo permanecerá oculto automáticamente en la web.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="submit"
                className="bg-aerogas-blue hover:bg-blue-900 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-md cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </form>

          {/* Botón separado para retirar catálogo PDF si existe */}
          {config.catalogo_pdf_url && (
            <form action={quitarCatalogo} className="mt-4 pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
              >
                Quitar catálogo PDF actual (ocultar botón en la página pública)
              </button>
            </form>
          )}
        </section>

        {/* BLOQUE 2: GESTOR DE PROMOCIONES */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* FORMULARIO NUEVA PROMOCIÓN */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 border border-gray-200 lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-aerogas-red mb-5 pb-3 border-b border-gray-200">
              2. Nueva Promoción
            </h2>

            <form action={crearPromo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Título de la Promo *
                </label>
                <input
                  type="text"
                  name="titulo"
                  required
                  placeholder="Ej: Combo Café + Empanada"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-red outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-aerogas-red outline-none"
                  >
                    <option value="Combos">Combos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Cafetería">Cafetería</option>
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Automotriz">Automotriz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Etiqueta (Opcional)
                  </label>
                  <input
                    type="text"
                    name="etiqueta"
                    placeholder="Ej: 2x1, Super Promo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-red outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Precio (Opcional)
                  </label>
                  <input
                    type="text"
                    name="precio_promo"
                    placeholder="Ej: S/ 6.50"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Válido hasta (Opcional)
                  </label>
                  <input
                    type="date"
                    name="fecha_fin"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-red outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Descripción Breve (Opcional)
                </label>
                <textarea
                  name="descripcion"
                  rows={2}
                  placeholder="Ej: Válido en todos los AeroMarket hasta agotar stock."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-red outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Imagen / Flyer de la Promo *
                </label>
                <input
                  type="file"
                  name="imagen"
                  accept="image/*"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md cursor-pointer"
              >
                Publicar Promoción
              </button>
            </form>
          </div>

          {/* LISTA DE PROMOCIONES EXISTENTES */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-aerogas-blue">
                Promociones Registradas ({promos.length})
              </h2>
              <span className="text-xs font-semibold text-gray-500">
                Activas: {promos.filter((p) => p.activo === 1).length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-aerogas-blue">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-white uppercase">
                      Promoción
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-white uppercase">
                      Detalles
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-white uppercase">
                      Estado
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-white uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {promos.map((promo) => (
                    <tr
                      key={promo.id}
                      className={promo.activo === 1 ? "hover:bg-gray-50" : "bg-gray-50/70 opacity-75"}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={promo.imagen_url}
                            alt={promo.titulo}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {promo.titulo}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <span className="text-[11px] font-bold bg-blue-50 text-aerogas-blue px-2 py-0.5 rounded-full border border-blue-100">
                                {promo.categoria}
                              </span>
                              {promo.etiqueta && (
                                <span className="text-[11px] font-bold bg-red-50 text-aerogas-red px-2 py-0.5 rounded-full border border-red-100">
                                  {promo.etiqueta}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-600 space-y-1">
                        {promo.precio_promo && (
                          <p className="font-extrabold text-aerogas-blue text-sm">
                            {promo.precio_promo}
                          </p>
                        )}
                        {promo.fecha_fin ? (
                          <p>
                            Hasta:{" "}
                            <span className="font-semibold text-gray-800">
                              {new Date(promo.fecha_fin).toLocaleDateString("es-PE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </p>
                        ) : (
                          <p className="text-gray-400">Sin fecha límite</p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                            promo.activo === 1
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {promo.activo === 1 ? "Visible" : "Pausada"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <form action={cambiarEstadoPromo}>
                            <input type="hidden" name="id" value={promo.id} />
                            <input type="hidden" name="activo" value={promo.activo} />
                            <button
                              type="submit"
                              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                                promo.activo === 1
                                  ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                                  : "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                              }`}
                            >
                              {promo.activo === 1 ? "Pausar" : "Activar"}
                            </button>
                          </form>

                          <form action={eliminarPromo}>
                            <input type="hidden" name="id" value={promo.id} />
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-md text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {promos.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-gray-500 text-sm"
                      >
                        Aún no has publicado promociones de AeroMarket. Usa el formulario de la izquierda para crear la primera.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}