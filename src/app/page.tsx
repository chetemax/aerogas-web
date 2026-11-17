import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MensajeExito from "../components/MensajeExito";
import CarruselFlota from "../components/CarruselFlota";
import { pool } from "../lib/db";
import { revalidatePath } from "next/cache";

export default async function Home(props: { searchParams: Promise<{ exito?: string, cotizar?: string }> }) {
  
  // 1. Consultar Configuración Web (¡NUEVO!)
  const [configRows] = await pool.query("SELECT * FROM configuracion_web WHERE id = 1");
  const config = (configRows as any[])[0];

  // 2. Consultar Estaciones
  const [estacionesRows] = await pool.query(`
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

  const estaciones = (estacionesRows as any[]).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion,
    ciudad: row.ciudad,
    imagen: row.imagen,
    mapa_url: row.mapa_url,
    servicios: row.servicios_str ? row.servicios_str.split(',') : [],
  }));

  // 3. Consultar Flota de Cisternas
  const [flotaRows] = await pool.query("SELECT * FROM cisternas ORDER BY capacidad DESC");
  const cisternas = flotaRows as any[];

  // 4. Control del Modal de Cotización
  const searchParams = await props.searchParams;
  const exito = searchParams?.exito === "true";
  const abrirCotizador = searchParams?.cotizar === "true";
  const mostrarModal = exito || abrirCotizador;

  // 5. Guardar Cotización
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
    redirect("/?exito=true");
  }

  return (
    <main className="flex min-h-screen flex-col items-center w-full overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION DINÁMICO (VIDEO/IMAGEN) */}
      <section className="relative w-full flex flex-col justify-center items-center text-center py-32 px-4 overflow-hidden min-h-[85vh]">
        
        {/* Capa 1: Archivo Multimedia de Fondo */}
        {config.hero_multimedia_tipo === 'video' && config.hero_multimedia_url ? (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover z-0"
          >
            <source src={config.hero_multimedia_url} type="video/mp4" />
          </video>
        ) : config.hero_multimedia_url ? (
          <img 
            src={config.hero_multimedia_url} 
            alt="Fondo Aerogas" 
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-aerogas-blue z-0"></div>
        )}

        {/* Capa 2: Overlay Oscuro (para que el texto blanco resalte perfectamente) */}
        <div className="absolute inset-0 bg-black/30 z-10"></div>

        {/* Capa 3: Contenido de Texto (Administrable) */}
        <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center animate-fade-in-up">
          <h1 
            className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg"
            dangerouslySetInnerHTML={{ __html: config.hero_titulo.replace(/className=/g, 'class=') }}
          />
          
          <p 
            className="text-lg md:text-xl text-gray-200 mb-4 max-w-3xl font-medium leading-relaxed drop-shadow-md"
            dangerouslySetInnerHTML={{ __html: config.hero_texto_1.replace(/className=/g, 'class=') }}
          />
          
          <p 
            className="text-md md:text-lg text-gray-300 mb-10 max-w-2xl font-normal leading-relaxed drop-shadow-md"
            dangerouslySetInnerHTML={{ __html: config.hero_texto_2.replace(/className=/g, 'class=') }}
          />

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="#estaciones" className="bg-aerogas-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-xl transition-transform transform hover:-translate-y-1">
              📍 Red de Estaciones
            </Link>
            <Link href="#flota" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-aerogas-blue px-8 py-4 rounded-lg font-bold text-lg shadow-xl transition-colors">
              💼 Soluciones B2B
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN ESTACIONES */}
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
                  
                  <Link href={`/estacion/${estacion.id}`} className="w-full bg-aerogas-blue hover:bg-blue-900 text-white font-semibold py-3 rounded-lg transition-colors mt-auto text-center inline-block">
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN FLOTA Y B2B */}
      <section id="flota" className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-aerogas-blue mb-6">Soluciones para Flotas y Socios Corporativos</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
              En Aerogas del Norte entendemos que tu negocio no puede detenerse. Contamos con una moderna flota propia de cisternas para garantizar el abastecimiento ininterrumpido a todas nuestras estaciones y clientes corporativos directos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8 text-center">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <span className="text-3xl mb-3 block">🚛</span>
              <h3 className="font-bold text-aerogas-blue mb-2">Abastecimiento Mayorista</h3>
              <p className="text-sm text-gray-500">Logística asegurada en cualquier punto de la región.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <span className="text-3xl mb-3 block">📊</span>
              <h3 className="font-bold text-aerogas-blue mb-2">Control de Flotas</h3>
              <p className="text-sm text-gray-500">Galonaje exacto y monitoreo de consumo.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <span className="text-3xl mb-3 block">🤝</span>
              <h3 className="font-bold text-aerogas-blue mb-2">Crédito Corporativo</h3>
              <p className="text-sm text-gray-500">Planes financieros adaptados a tu empresa.</p>
            </div>
          </div>

          {cisternas.length > 0 && (
            <div className="mb-16">
              <CarruselFlota cisternas={cisternas} />
            </div>
          )}

          <div className="text-center">
            <Link href="/?cotizar=true" scroll={false} className="inline-block bg-aerogas-red text-white font-bold px-10 py-4 rounded-xl hover:bg-red-700 transition-transform transform hover:-translate-y-1 shadow-xl text-lg">
              Solicitar Cotización B2B
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* MODAL DE COTIZACIÓN */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto relative p-8 animate-fade-in-up">
            
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