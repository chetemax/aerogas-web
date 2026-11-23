import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BotonWhatsApp from "../../components/BotonWhatsApp";
import { pool } from "../../lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros — Red de Estaciones y Soluciones B2B",
  description:
    "Conoce a Aerogas del Norte S.A.C.: más de 20 estaciones, flota cisterna propia, galonaje exacto y cumplimiento OSINERGMIN en el norte del Perú.",
};
export const dynamic = "force-dynamic";

export default async function NosotrosPage() {
  // Cifras reales en tiempo real desde MySQL
  const [estCountRows] = await pool.query(
    "SELECT COUNT(*) AS total, COUNT(DISTINCT TRIM(ciudad)) AS ciudades FROM estaciones WHERE activo = 1"
  );
  const estStats = (estCountRows as any[])[0] || { total: 20, ciudades: 1 };

  const [flotaCountRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM cisternas"
  );
  const totalCisternas = Number((flotaCountRows as any[])[0]?.total || 0);

  const [marketCountRows] = await pool.query(`
    SELECT COUNT(DISTINCT e.id) AS total
    FROM estaciones e
    INNER JOIN estacion_servicios es ON e.id = es.estacion_id
    INNER JOIN servicios s ON es.servicio_id = s.id
    WHERE e.activo = 1 AND LOWER(s.nombre) LIKE '%market%'
  `);
  const totalMarkets = Number((marketCountRows as any[])[0]?.total || 0);

  const totalEstaciones = Number(estStats.total || 0);
  const totalCiudades = Number(estStats.ciudades || 0);

  return (
    <main className="min-h-screen flex flex-col bg-white w-full overflow-x-hidden">
      <Navbar />

      {/* HERO CORPORATIVO */}
      <section className="w-full bg-gradient-to-br from-aerogas-blue via-blue-950 to-slate-900 text-white pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-block bg-aerogas-red text-white text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 shadow-md">
            Aerogas del Norte S.A.C. — RUC 20458378747
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Energía confiable que impulsa el norte del Perú
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed font-light">
            Somos una red de estaciones de servicio, abastecimiento mayorista y tiendas de conveniencia comprometida con el despacho exacto, la seguridad operativa y la continuidad del transporte y la industria regional.
          </p>
        </div>
      </section>

      {/* INDICADORES REALES DE RESPALDO */}
      <section className="w-full bg-gray-50 border-b border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-3xl md:text-4xl font-extrabold text-aerogas-blue">
              {totalEstaciones > 0 ? totalEstaciones : "20+"}
            </p>
            <p className="text-xs sm:text-sm font-bold text-gray-600 mt-1 uppercase tracking-wide">
              Estaciones Activas
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-3xl md:text-4xl font-extrabold text-aerogas-red">
              {totalCiudades > 0 ? totalCiudades : "Norte"}
            </p>
            <p className="text-xs sm:text-sm font-bold text-gray-600 mt-1 uppercase tracking-wide">
              {totalCiudades === 1 ? "Ciudad Estratégica" : "Ciudades con Cobertura"}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-3xl md:text-4xl font-extrabold text-aerogas-blue">
              {totalCisternas > 0 ? totalCisternas : "Propia"}
            </p>
            <p className="text-xs sm:text-sm font-bold text-gray-600 mt-1 uppercase tracking-wide">
              {totalCisternas > 0 ? "Unidades Cisterna Propias" : "Flota Cisterna Propia"}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-3xl md:text-4xl font-extrabold text-aerogas-red">
              24/7
            </p>
            <p className="text-xs sm:text-sm font-bold text-gray-600 mt-1 uppercase tracking-wide">
              Operación Continua
            </p>
          </div>
        </div>
      </section>

      {/* QUIÉNES SOMOS + RESUMEN B2B */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-extrabold uppercase tracking-widest text-aerogas-red">
              Quiénes Somos
            </span>
            <h2 className="text-3xl font-extrabold text-aerogas-blue leading-tight">
              Socios estratégicos para el transporte, la agroindustria y cada conductor
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Desde nuestra oficina central en <strong>Chiclayo, Lambayeque</strong>, gestionamos una red integral de estaciones de servicio diseñada para atender tanto al conductor diario como a las flotas pesadas y empresas más exigentes del norte peruano.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Contar con una <strong>flota propia de cisternas</strong> nos permite controlar la trazabilidad del combustible desde la planta hasta el surtidor, garantizando stock permanente, combustibles que cumplen especificaciones técnicas y tiempos de respuesta confiables para clientes mayoristas.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Complementamos la experiencia en ruta con{" "}
              <Link
                href="/aeromarket"
                className="font-bold text-aerogas-blue hover:text-aerogas-red underline"
              >
                AeroMarket
              </Link>
              {totalMarkets > 0
                ? ` (${totalMarkets} tiendas integradas en nuestra red)`
                : ""}
              , ofreciendo paradas seguras con bebidas, cafetería, snacks y atención ágil.
            </p>
          </div>

          {/* TARJETA DE RESPALDO CORPORATIVO */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 space-y-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-aerogas-blue border-b border-gray-200 pb-3">
              ¿Por qué las empresas confían en Aerogas?
            </h3>

            <ul className="space-y-4 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-aerogas-blue text-white flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <strong className="text-aerogas-blue block">Peso y galonaje exacto</strong>
                  Surtidores calibrados periódicamente bajo controles metrológicos rigurosos.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-aerogas-blue text-white flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <strong className="text-aerogas-blue block">Cumplimiento normativo OSINERGMIN</strong>
                  Operación supervisada bajo estándares de seguridad industrial, ambiental y despacho de hidrocarburos.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-aerogas-blue text-white flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <strong className="text-aerogas-blue block">Facturación electrónica inmediata</strong>
                  Comprobantes disponibles en línea las 24 horas para facilitar el control contable de tu empresa.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-aerogas-blue text-white flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <strong className="text-aerogas-blue block">Atención comercial dedicada B2B</strong>
                  Líneas de crédito corporativo, abastecimiento directo con cisterna y reportes de consumo para flotas.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* MISIÓN Y VISIÓN */}
      <section className="w-full bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 border-y border-gray-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-aerogas-blue flex items-center justify-center mb-5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-aerogas-blue mb-3">
              Nuestra Misión
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Brindar abastecimiento continuo de combustibles de alta calidad y servicios complementarios de conveniencia con peso exacto, atención oportuna y estrictos protocolos de seguridad, generando confianza duradera en conductores y socios corporativos del norte del país.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-aerogas-red flex items-center justify-center mb-5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-aerogas-blue mb-3">
              Nuestra Visión
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Consolidarnos como la red líder y más confiable de estaciones de servicio y distribución mayorista en el norte del Perú, destacando por nuestra eficiencia logística, innovación en control de flotas y excelencia en la experiencia del cliente.
            </p>
          </div>
        </div>
      </section>

      {/* BLOQUE CTA B2B FINAL */}
      <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-aerogas-blue rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl border-b-4 border-aerogas-red">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
            ¿Buscas un proveedor confiable para tu empresa o flota?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8 text-sm sm:text-base leading-relaxed">
            Solicita una cotización personalizada para abastecimiento mayorista, crédito corporativo o convenios de flota en toda nuestra red de estaciones.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/?cotizar=true"
              className="bg-aerogas-red hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all hover:scale-105"
            >
              Solicitar Cotización B2B
            </Link>
            <Link
              href="/#estaciones"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-aerogas-blue font-bold px-8 py-3.5 rounded-xl transition-all"
            >
              Ver Red de Estaciones
            </Link>
          </div>
        </div>
      </section>

      <BotonWhatsApp />
      <Footer />
    </main>
  );
}