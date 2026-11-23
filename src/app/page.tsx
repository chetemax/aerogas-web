import Link from "next/link";
import BotonWhatsApp from "../components/BotonWhatsApp";
import ModalBienvenida from "../components/ModalBienvenida";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MensajeExito from "../components/MensajeExito";
import CarruselFlota from "../components/CarruselFlota";
import RedEstaciones from "../components/RedEstaciones";
import CamposAntiBot from "../components/CamposAntiBot";
import { pool } from "../lib/db";
import { verificarAntiBot } from "../lib/antibot";
import { revalidatePath } from "next/cache";

export default async function Home(props: {
  searchParams: Promise<{
    exito?: string;
    cotizar?: string;
    error_cotizacion?: string;
  }>;
}) {
  // 1. Consultar Configuración Web
  const [configRows] = await pool.query(
    "SELECT * FROM configuracion_web WHERE id = 1"
  );
  const config = (configRows as any[])[0];

  // 2. Consultar Estaciones (Incluyendo latitud y longitud)
  const [estacionesRows] = await pool.query(`
    SELECT 
      e.id, e.nombre, e.direccion, e.ciudad, e.imagen, e.mapa_url, e.latitud, e.longitud,
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
    latitud: row.latitud,
    longitud: row.longitud,
    servicios: row.servicios_str ? row.servicios_str.split(",") : [],
  }));

  // 3. Consultar Flota de Cisternas
  const [flotaRows] = await pool.query(
    "SELECT * FROM cisternas ORDER BY capacidad DESC"
  );
  const cisternas = flotaRows as any[];

  // 4. Control del Modal de Cotización
  const searchParams = await props.searchParams;
  const exito = searchParams?.exito === "true";
  const abrirCotizador = searchParams?.cotizar === "true";
  const errorCotizacion = searchParams?.error_cotizacion || "";
  const mostrarModal = exito || abrirCotizador;

  // 5. Guardar Cotización B2B (con protección anti-bots)
  async function enviarCotizacion(formData: FormData) {
    "use server";
    const { redirect } = await import("next/navigation");

    const checkBot = await verificarAntiBot(formData, {
      accion: "cotizacion_b2b",
      maxIntentos: 3,
      ventanaMinutos: 15,
      tiempoMinimoMs: 2500,
    });

    if (!checkBot.ok) {
      // Si cayó en el honeypot, descartamos en silencio sin guardar en BD
      if (checkBot.motivo === "honeypot") {
        redirect("/?exito=true");
      }
      redirect(
        `/?cotizar=true&error_cotizacion=${encodeURIComponent(
          checkBot.error || "No se pudo validar su solicitud."
        )}`
      );
    }

    const empresa = String(formData.get("empresa") || "").trim();
    const ruc = String(formData.get("ruc") || "").trim();
    const contacto = String(formData.get("contacto") || "").trim();
    const telefono = String(formData.get("telefono") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const mensaje = String(formData.get("mensaje") || "").trim();

    if (!empresa || !/^\d{11}$/.test(ruc) || !contacto || !telefono || !email) {
      redirect(
        `/?cotizar=true&error_cotizacion=${encodeURIComponent(
          "Por favor, complete correctamente todos los campos obligatorios y un RUC válido de 11 dígitos."
        )}`
      );
    }

    await pool.query(
      `INSERT INTO cotizaciones (empresa, ruc, contacto, telefono, email, mensaje) VALUES (?, ?, ?, ?, ?, ?)`,
      [empresa, ruc, contacto, telefono, email, mensaje]
    );

    revalidatePath("/");
    redirect("/?exito=true");
  }

  return (
    <main className="flex min-h-screen flex-col items-center w-full overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION DINÁMICO (VIDEO/IMAGEN) */}
      <section className="relative w-full flex flex-col justify-center items-center text-center py-32 px-4 overflow-hidden min-h-[85vh]">
        {/* Capa 1: Archivo Multimedia de Fondo */}
        {config.hero_multimedia_tipo === "video" && config.hero_multimedia_url ? (
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

        {/* Capa 2: Overlay Oscuro Base */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        {/* Capa 3: Contenido de Texto con Efecto Vidrio (Glassmorphism) */}
        <div className="relative z-20 max-w-5xl mx-auto flex flex-col items-center animate-fade-in-up bg-black/40 backdrop-blur-md p-8 md:p-14 rounded-3xl border border-white/10 shadow-2xl">
          <h1
            className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-xl"
            dangerouslySetInnerHTML={{
              __html: config.hero_titulo.replace(/className=/g, "class="),
            }}
          />

          <p
            className="text-lg md:text-2xl text-gray-100 mb-6 max-w-4xl font-medium leading-relaxed drop-shadow-lg"
            dangerouslySetInnerHTML={{
              __html: config.hero_texto_1
                .replace(/text-aerogas-blue/g, "text-blue-300")
                .replace(/className=/g, "class="),
            }}
          />

          <p
            className="text-base md:text-lg text-gray-300 mb-10 max-w-3xl font-light leading-relaxed drop-shadow-md"
            dangerouslySetInnerHTML={{
              __html: config.hero_texto_2.replace(/className=/g, "class="),
            }}
          />

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mt-4 w-full">
            <Link
              href="#estaciones"
              className="group flex items-center justify-center gap-3 bg-aerogas-red hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105"
            >
              <svg
                className="w-6 h-6 fill-current transition-transform group-hover:-translate-y-1"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Red de Estaciones
            </Link>

            <Link
              href="#flota"
              className="group flex items-center justify-center gap-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-aerogas-blue px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
              </svg>
              Soluciones B2B
            </Link>

            <Link
              href="/unete-al-equipo"
              className="group flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              Únete al Equipo
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN ESTACIONES: FILTROS + MAPA SINCRONIZADO + PAGINACIÓN */}
      <section
        id="estaciones"
        className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-aerogas-blue mb-4">
              Nuestra Red de Estaciones
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Encuentra el punto Aerogas más cercano a tu ruta. Abastecimiento
              continuo, tiendas de conveniencia y atención 24/7.
            </p>
          </div>

          <RedEstaciones estaciones={estaciones} />
        </div>
      </section>

      {/* SECCIÓN FLOTA Y B2B CON ÍCONOS PROFESIONALES */}
      <section
        id="flota"
        className="w-full bg-gray-50 py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-aerogas-blue mb-6">
              Soluciones para Flotas y Socios Corporativos
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
              En Aerogas del Norte entendemos que tu negocio no puede detenerse.
              Contamos con una moderna flota propia de cisternas para garantizar
              el abastecimiento ininterrumpido a todas nuestras estaciones y
              clientes corporativos directos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16 text-center">
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1">
              <svg
                className="w-16 h-16 mx-auto mb-5 text-aerogas-blue group-hover:text-aerogas-red transition-colors duration-300"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
              <h3 className="text-xl font-bold text-aerogas-blue mb-3">
                Abastecimiento Mayorista
              </h3>
              <p className="text-gray-500">
                Logística asegurada en cualquier punto de la región.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1">
              <svg
                className="w-16 h-16 mx-auto mb-5 text-aerogas-blue group-hover:text-aerogas-red transition-colors duration-300"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
              <h3 className="text-xl font-bold text-aerogas-blue mb-3">
                Control de Flotas
              </h3>
              <p className="text-gray-500">
                Galonaje exacto y monitoreo de consumo.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1">
              <svg
                className="w-16 h-16 mx-auto mb-5 text-aerogas-blue group-hover:text-aerogas-red transition-colors duration-300"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
              </svg>
              <h3 className="text-xl font-bold text-aerogas-blue mb-3">
                Crédito Corporativo
              </h3>
              <p className="text-gray-500">
                Planes financieros adaptados a tu empresa.
              </p>
            </div>
          </div>

          {cisternas.length > 0 && (
            <div className="mb-16">
              <CarruselFlota cisternas={cisternas} />
            </div>
          )}

          <div className="text-center">
            <Link
              href="/?cotizar=true"
              scroll={false}
              className="inline-block bg-aerogas-red text-white font-bold px-10 py-4 rounded-xl hover:bg-red-700 transition-transform transform hover:-translate-y-1 shadow-xl text-lg"
            >
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
            <Link
              href="/"
              scroll={false}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors"
            >
              ✕
            </Link>

            {exito ? (
              <MensajeExito />
            ) : (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-extrabold text-aerogas-blue mb-2">
                    Cotiza con Aerogas
                  </h2>
                  <p className="text-gray-600">
                    Déjanos los datos de tu empresa y un ejecutivo se comunicará
                    contigo.
                  </p>
                </div>

                {errorCotizacion && (
                  <div
                    role="alert"
                    className="mb-6 bg-red-50 border-l-4 border-aerogas-red text-red-800 p-4 rounded-r-lg text-sm font-semibold"
                  >
                    {errorCotizacion}
                  </div>
                )}

                <form action={enviarCotizacion} className="space-y-6 relative">
                  <CamposAntiBot />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nombre de la Empresa *
                      </label>
                      <input
                        type="text"
                        name="empresa"
                        required
                        placeholder="Ej: Transportes del Norte"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        RUC *
                      </label>
                      <input
                        type="text"
                        name="ruc"
                        required
                        maxLength={11}
                        pattern="\d{11}"
                        placeholder="Ej: 20123456789"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Persona de Contacto *
                      </label>
                      <input
                        type="text"
                        name="contacto"
                        required
                        placeholder="Ej: Juan Pérez"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Teléfono / Celular *
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        required
                        placeholder="Ej: 987654321"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Ej: logistica@empresa.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Detalles de la Solicitud (Opcional)
                    </label>
                    <textarea
                      name="mensaje"
                      rows={3}
                      placeholder="Indícanos el tamaño de tu flota, consumo mensual estimado..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-red outline-none transition-all"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-aerogas-red hover:bg-red-700 text-white font-bold py-4 px-4 rounded-lg transition-transform transform hover:-translate-y-1 shadow-lg text-lg cursor-pointer"
                  >
                    Enviar Solicitud
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE DE WHATSAPP GLOBAL */}
      <BotonWhatsApp />

      {/* MODAL INTELIGENTE DE PRIMERA VISITA */}
      <ModalBienvenida
        modalActivo={Boolean(config.modal_activo)}
        modalImagen={config.modal_imagen}
        modalEnlace={config.modal_enlace}
      />
    </main>
  );
}