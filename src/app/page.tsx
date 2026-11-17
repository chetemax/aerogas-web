import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MensajeExito from "../components/MensajeExito";
import { pool } from "../lib/db";
import { revalidatePath } from "next/cache";

export default async function Home(props: { searchParams: Promise<{ exito?: string, cotizar?: string }> }) {
  
  const [rows] = await pool.query(`
    SELECT 
      e.id, e.nombre, e.direccion, e.ciudad, e.imagen, e.mapa_url,
      GROUP_CONCAT(s.nombre SEPARATOR ',') as servicios_str
    FROM estaciones e
    LEFT JOIN estacion_servicios es ON e.id = es.estacion_id
    LEFT JOIN servicios s ON es.servicio_id = s.id
    WHERE e.activo = 1
    GROUP BY e.id
    ORDER BY e.id ASC;
  `);

  const estaciones = (rows as any[]).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion,
    ciudad: row.ciudad,
    imagen: row.imagen,
    mapa_url: row.mapa_url,
    servicios: row.servicios_str ? row.servicios_str.split(',') : [],
  }));

  // Leemos los parámetros para saber si debemos abrir la ventana flotante
  const searchParams = await props.searchParams;
  const exito = searchParams?.exito === "true";
  const abrirCotizador = searchParams?.cotizar === "true";
  const mostrarModal = exito || abrirCotizador;

  async function enviarCotizacion(formData: FormData) {
    "use server";
    const empresa = formData.get("empresa") as string;
    const ruc = formData.get("ruc") as string;
    const contacto = formData.get("contacto") as string;
    const telefono = formData.get("telefono") as string;
    const email = formData.get("email") as string;
    const mensaje = formData.get("mensaje") as string;

    await pool.query(
      `INSERT INTO cotizaciones (empresa, ruc, contacto, telefono, email, mensaje) VALUES (?, ?, ?, ?, ?, ?)`,
      [empresa, ruc, contacto, telefono, email, mensaje]
    );

    const { redirect } = await import("next/navigation");
    revalidatePath("/");
    // Al guardar, recargamos el modal pero en modo "éxito"
    redirect("/?exito=true");
  }

  return (
    <main className="flex min-h-screen flex-col items-center w-full overflow-x-hidden">
      <Navbar />

      <section className="w-full bg-aerogas-gray flex flex-col justify-center items-center text-center py-24 px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-aerogas-blue mb-6 max-w-4xl leading-tight">
          Energía que impulsa el desarrollo del <span className="text-aerogas-red">Norte</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl font-medium">
          Más de 20 estaciones de servicio ofreciendo combustibles, GLP y GNV con el peso exacto, seguridad y la logística que tu flota necesita.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="#estaciones" className="bg-aerogas-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-transform transform hover:-translate-y-1">
            📍 Encuentra tu Estación
          </Link>
          <Link href="#flota" className="bg-white border-2 border-aerogas-blue text-aerogas-blue hover:bg-aerogas-blue hover:text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-colors">
            💼 Soluciones Corporativas
          </Link>
        </div>
      </section>

      <section id="estaciones" className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-aerogas-blue mb-4">Nuestra Red de Estaciones</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Encuentra el punto Aerogas más cercano a tu ruta. Abastecimiento continuo, tiendas de conveniencia y atención 24/7.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {estaciones.map((estacion) => (
              <div key={estacion.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden">
                <div className="w-full h-48 bg-gray-200 relative">
                  <img src={estacion.imagen} alt={`Fotografía de ${estacion.nombre}`} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-aerogas-blue mb-2">{estacion.nombre}</h3>
                  <p className="text-gray-500 mb-4 flex items-start gap-2">
                    <span className="text-aerogas-red">📍</span> {estacion.direccion}, {estacion.ciudad}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {estacion.servicios.map((servicio: string, index: number) => (
                      <span key={index} className="bg-aerogas-gray text-aerogas-blue text-xs font-bold px-3 py-1 rounded-full border border-gray-300">
                        {servicio}
                      </span>
                    ))}
                  </div>
                  <a href={estacion.mapa_url} target="_blank" rel="noopener noreferrer" className="w-full bg-aerogas-blue hover:bg-blue-900 text-white font-semibold py-3 rounded-lg transition-colors mt-auto text-center inline-block">
                    Ver en Mapa
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="flota" className="w-full bg-aerogas-blue text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Soluciones para Flotas y Socios Corporativos</h2>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              En Aerogas del Norte entendemos que tu negocio no puede detenerse. Contamos con una moderna flota de cisternas para garantizar el abastecimiento ininterrumpido de todas nuestras estaciones y clientes corporativos.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3"><span className="bg-aerogas-red p-2 rounded-full">✅</span><span className="font-semibold">Abastecimiento mayorista garantizado.</span></li>
              <li className="flex items-center gap-3"><span className="bg-aerogas-red p-2 rounded-full">✅</span><span className="font-semibold">Control de consumo exacto para flotas.</span></li>
              <li className="flex items-center gap-3"><span className="bg-aerogas-red p-2 rounded-full">✅</span><span className="font-semibold">Líneas de crédito corporativo disponibles.</span></li>
            </ul>
            
            {/* BOTÓN ACTUALIZADO: Abre el modal sin hacer scroll */}
            <Link href="/?cotizar=true" scroll={false} className="inline-block bg-white text-aerogas-blue font-bold px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
              Solicitar Cotización B2B
            </Link>
          </div>
          <div className="w-full h-80 lg:h-full min-h-[400px] bg-gray-300 rounded-xl overflow-hidden relative shadow-2xl">
            <img src="https://placehold.co/800x600/DF1B23/FFFFFF?text=Foto+de+Cisternas+Aerogas" alt="Flota de Cisternas Aerogas" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <Footer />

      {/* =========================================
          VENTANA EMERGENTE (MODAL DE COTIZACIÓN) 
          ========================================= */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto relative p-8">
            
            {/* Botón Cerrar */}
            <Link href="/" scroll={false} className="absolute top-4 right-4 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors">
              ✕
            </Link>

            {exito ? (
              <MensajeExito />
            ) : (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-extrabold text-aerogas-blue mb-2">Cotiza con Aerogas</h2>
                  <p className="text-gray-600">Déjanos los datos de tu empresa y un ejecutivo se comunicará contigo.</p>
                </div>
                
                <form action={enviarCotizacion} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Empresa *</label>
                      <input type="text" name="empresa" required placeholder="Ej: Transportes del Norte" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">RUC *</label>
                      <input type="text" name="ruc" required maxLength={11} pattern="\d{11}" placeholder="Ej: 20123456789" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Persona de Contacto *</label>
                      <input type="text" name="contacto" required placeholder="Ej: Juan Pérez" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono / Celular *</label>
                      <input type="tel" name="telefono" required placeholder="Ej: 987654321" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico *</label>
                    <input type="email" name="email" required placeholder="Ej: logistica@empresa.com" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Detalles de la Solicitud (Opcional)</label>
                    <textarea name="mensaje" rows={3} placeholder="Indícanos el tamaño de tu flota, consumo mensual estimado..." className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"></textarea>
                  </div>

                  <button type="submit" className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-4 px-4 rounded-lg transition-transform transform hover:-translate-y-1 shadow-lg text-lg">
                    Enviar Solicitud
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}