import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BotonWhatsApp from "../../components/BotonWhatsApp";
import VitrinaPromos, { PromoAeroMarket } from "../../components/VitrinaPromos";
import { pool } from "../../lib/db";

export const metadata: Metadata = {
  title: "AeroMarket — Tiendas de Conveniencia y Promociones",
  description:
    "Descubre las promociones vigentes de AeroMarket: bebidas heladas, café, snacks y atención 24/7 en nuestras estaciones de servicio Aerogas del Norte.",
};

export const dynamic = "force-dynamic";

export default async function AeroMarketPage() {
  // 1. Configuración administrable de AeroMarket
  const [configRows] = await pool.query(
    "SELECT * FROM aeromarket_config WHERE id = 1"
  );
  const config = (configRows as any[])[0] || {
    titulo: "AeroMarket",
    subtitulo: "Tu parada de conveniencia en el camino",
    descripcion:
      "Encuentra bebidas heladas, snacks, café y productos esenciales con atención rápida, espacios seguros y pagos digitales mientras abasteces tu vehículo.",
    banner_url: "",
    catalogo_pdf_url: "",
  };

  // 2. Promociones activas y vigentes (oculta automáticamente las vencidas)
  const [promosRows] = await pool.query(`
    SELECT id, titulo, descripcion, categoria, etiqueta, precio_promo, imagen_url, fecha_fin
    FROM aeromarket_promos
    WHERE activo = 1 AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
    ORDER BY fecha_creacion DESC
  `);

  const promos: PromoAeroMarket[] = (promosRows as any[]).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion || "",
    categoria: row.categoria || "Combos",
    etiqueta: row.etiqueta || "",
    precio_promo: row.precio_promo || "",
    imagen_url: row.imagen_url,
    fecha_fin: row.fecha_fin
      ? new Date(row.fecha_fin).toISOString().split("T")[0]
      : null,
  }));

  // 3. Estaciones de Aerogas que cuentan con el servicio Market
  const [estacionesRows] = await pool.query(`
    SELECT DISTINCT e.id, e.nombre, e.direccion, e.ciudad, e.imagen, e.mapa_url, e.horario
    FROM estaciones e
    INNER JOIN estacion_servicios es ON e.id = es.estacion_id
    INNER JOIN servicios s ON es.servicio_id = s.id
    WHERE e.activo = 1 AND LOWER(s.nombre) LIKE '%market%'
    ORDER BY e.id ASC
  `);
  const estacionesMarket = estacionesRows as any[];

  return (
    <main className="flex min-h-screen flex-col items-center w-full bg-white overflow-x-hidden">
      <Navbar />

      {/* HERO DE AEROMARKET */}
      <section className="relative w-full min-h-[68vh] flex items-center justify-center py-24 px-4 overflow-hidden">
        {config.banner_url ? (
          <img
            src={config.banner_url}
            alt={config.titulo}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-aerogas-blue via-blue-950 to-slate-900 z-0" />
        )}

        {/* Overlay oscuro para contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/50 to-black/40 z-10" />

        {/* Tarjeta Glassmorphism */}
        <div className="relative z-20 max-w-4xl mx-auto text-center bg-black/45 backdrop-blur-md border border-white/15 rounded-3xl p-8 md:p-14 shadow-2xl animate-fade-in-up">
          <span className="inline-flex items-center gap-2 bg-aerogas-red text-white text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Tiendas de Conveniencia
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
            {config.titulo}
          </h1>

          <p className="text-xl md:text-2xl text-blue-200 font-semibold mb-5">
            {config.subtitulo}
          </p>

          <p className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed mb-8 font-light">
            {config.descripcion}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
            <a
              href="#promociones"
              className="inline-flex items-center justify-center gap-2.5 bg-aerogas-red hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl shadow-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Ver Promociones
            </a>

            <a
              href="#ubicaciones"
              className="inline-flex items-center justify-center gap-2.5 bg-transparent border-2 border-white text-white hover:bg-white hover:text-aerogas-blue font-bold px-8 py-4 rounded-xl shadow-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Ubicar un AeroMarket
            </a>
          </div>
        </div>
      </section>

      {/* EXPERIENCIA Y BENEFICIOS AEROMARKET */}
      <section className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-aerogas-blue mb-3">
              Todo lo que necesitas en tu ruta
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Diseñados para hacer de tu parada una experiencia cómoda, ágil y segura en cada viaje.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Beneficio 1 */}
            <div className="group bg-white p-7 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-aerogas-blue group-hover:bg-aerogas-red group-hover:text-white flex items-center justify-center mb-5 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-aerogas-blue mb-2">
                Atención 24/7
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Abiertos a cualquier hora del día o de la noche para acompañarte en cada trayecto.
              </p>
            </div>

            {/* Beneficio 2 */}
            <div className="group bg-white p-7 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-aerogas-blue group-hover:bg-aerogas-red group-hover:text-white flex items-center justify-center mb-5 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-4h2m4 0h2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-aerogas-blue mb-2">
                Bebidas Heladas y Café
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Gaseosas, agua, energizantes bien fríos y café recién pasado para recargar energías.
              </p>
            </div>

            {/* Beneficio 3 */}
            <div className="group bg-white p-7 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-aerogas-blue group-hover:bg-aerogas-red group-hover:text-white flex items-center justify-center mb-5 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-aerogas-blue mb-2">
                Snacks y Abarrotes
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Amplio surtido de snacks, alimentos listos para llevar y artículos básicos de viaje.
              </p>
            </div>

            {/* Beneficio 4 */}
            <div className="group bg-white p-7 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-aerogas-blue group-hover:bg-aerogas-red group-hover:text-white flex items-center justify-center mb-5 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-aerogas-blue mb-2">
                Pagos Rápidos y Seguros
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Aceptamos efectivo, tarjetas de crédito/débito, Yape y Plin en espacios iluminados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN VITRINA DE PROMOCIONES */}
      <section id="promociones" className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <VitrinaPromos
            promos={promos}
            catalogoPdfUrl={config.catalogo_pdf_url}
          />
        </div>
      </section>

      {/* SECCIÓN ESTACIONES CON SERVICIO AEROMARKET */}
      <section
        id="ubicaciones"
        className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-200"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-aerogas-red mb-2">
              Red de Tiendas
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-aerogas-blue mb-3">
              Encuentra tu AeroMarket más cercano
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Estas estaciones de servicio Aerogas del Norte cuentan con tienda AeroMarket disponible para ti.
            </p>
          </div>

          {estacionesMarket.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {estacionesMarket.map((estacion) => (
                <div
                  key={estacion.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden"
                >
                  <div className="w-full h-44 bg-gray-200 relative">
                    <img
                      src={estacion.imagen}
                      alt={estacion.nombre}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-aerogas-blue/90 text-white text-xs font-bold px-3 py-1 rounded-full">
                      AeroMarket Disponible
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-aerogas-blue mb-2">
                      {estacion.nombre}
                    </h3>

                    <p className="text-sm text-gray-500 mb-3 flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-aerogas-red shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span>
                        {estacion.direccion}, {estacion.ciudad}
                      </span>
                    </p>

                    <p className="text-xs font-semibold text-gray-600 mb-5 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-aerogas-blue shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {estacion.horario || "Atención 24/7"}
                    </p>

                    <div className="mt-auto grid grid-cols-2 gap-3">
                      <Link
                        href={`/estacion/${estacion.id}`}
                        className="text-center bg-aerogas-blue hover:bg-blue-900 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                      >
                        Ver Estación
                      </Link>
                      {estacion.mapa_url && (
                        <a
                          href={estacion.mapa_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center bg-gray-100 hover:bg-aerogas-red hover:text-white text-aerogas-blue text-sm font-semibold py-2.5 rounded-lg transition-colors border border-gray-200"
                        >
                          Cómo llegar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
              Marca el servicio <strong>Market</strong> en tus estaciones desde el panel de administración para que aparezcan aquí automáticamente.
            </div>
          )}
        </div>
      </section>

      <BotonWhatsApp />
      <Footer />
    </main>
  );
}