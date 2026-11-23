import type { Metadata } from "next";
import { pool } from "../../../lib/db";
import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import BotonWhatsApp from "../../../components/BotonWhatsApp";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function obtenerEstacionYServicios(id: string) {
  const [estacionRows] = await pool.query(
    "SELECT * FROM estaciones WHERE id = ? LIMIT 1",
    [id]
  );
  const estacion = (estacionRows as any[])[0];
  if (!estacion) return null;

  const [serviciosRows] = await pool.query(
    `SELECT s.nombre FROM servicios s
     INNER JOIN estacion_servicios es ON s.id = es.servicio_id
     WHERE es.estacion_id = ?`,
    [id]
  );
  const servicios = (serviciosRows as any[]).map((row) => row.nombre);

  return { estacion, servicios };
}

// Metadatos dinámicos y vista previa de WhatsApp / redes por cada estación
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const datos = await obtenerEstacionYServicios(id);

  if (!datos) {
    return {
      title: "Estación no encontrada",
      robots: { index: false, follow: false },
    };
  }

  const { estacion, servicios } = datos;
  const textoServicios =
    servicios.length > 0 ? ` Servicios: ${servicios.join(", ")}.` : "";
  const titulo = `${estacion.nombre} — ${estacion.ciudad}`;
  const descripcion = `Estación de servicio Aerogas ${estacion.nombre} ubicada en ${estacion.direccion}, ${estacion.ciudad}.${textoServicios} Atención ${
    estacion.horario || "24/7"
  }.`;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: `${titulo} | Aerogas del Norte`,
      description: descripcion,
      type: "website",
      locale: "es_PE",
      images: estacion.imagen
        ? [
            {
              url: estacion.imagen,
              alt: `Fotografía de ${estacion.nombre}`,
            },
          ]
        : undefined,
    },
  };
}

export default async function EstacionDetalle({ params }: PageProps) {
  const { id } = await params;
  const datos = await obtenerEstacionYServicios(id);

  if (!datos) {
    notFound();
  }

  const { estacion, servicios } = datos;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://aerogas.com.pe"
  ).replace(/\/$/, "");

  const lat = estacion.latitud
    ? parseFloat(String(estacion.latitud).replace(",", "."))
    : NaN;
  const lon = estacion.longitud
    ? parseFloat(String(estacion.longitud).replace(",", "."))
    : NaN;
  const tieneCoords = !isNaN(lat) && !isNaN(lon);

  const urlMapa =
    estacion.mapa_url ||
    (tieneCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
      : "#");

  // Esquema JSON-LD oficial de Estación de Servicio para Google SEO Local
  const jsonLdEstacion = {
    "@context": "https://schema.org",
    "@type": "GasStation",
    name: `Aerogas del Norte — ${estacion.nombre}`,
    image: estacion.imagen?.startsWith("http")
      ? estacion.imagen
      : `${siteUrl}${estacion.imagen || "/logo.png"}`,
    url: `${siteUrl}/estacion/${estacion.id}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: estacion.direccion,
      addressLocality: estacion.ciudad,
      addressCountry: "PE",
    },
    ...(tieneCoords
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: lat,
            longitude: lon,
          },
        }
      : {}),
    openingHours: estacion.horario || "Mo-Su 00:00-23:59",
  };

  return (
    <main className="flex min-h-screen flex-col items-center w-full bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdEstacion).replace(/</g, "\\u003c"),
        }}
      />

      <Navbar />

      {/* Franja azul de fondo (Detalle de diseño) */}
      <div className="w-full bg-aerogas-blue h-32 md:h-48 absolute top-20 left-0 z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto w-full px-4 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        
        {/* COLUMNA IZQUIERDA: Imagen, Descripción y Servicios */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
            <div className="w-full h-64 md:h-96 relative bg-gray-200">
              <img
                src={estacion.imagen}
                alt={`Estación ${estacion.nombre}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 md:p-8">
              <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-aerogas-red mb-1">
                {estacion.ciudad} — Estación de Servicio
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-aerogas-blue mb-4">
                {estacion.nombre}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Estación de servicio {estacion.nombre} equipada con los más altos estándares de seguridad y atención, lista para abastecer a tu flota o vehículo particular con la calidad que nos caracteriza. Ubicada estratégicamente en {estacion.direccion}, {estacion.ciudad}.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-aerogas-blue mb-6">
              Servicios Disponibles
            </h2>
            <div className="flex flex-wrap gap-3">
              {servicios.map((servicio, index) => (
                <div
                  key={index}
                  className="flex items-center bg-blue-50 border border-blue-100 rounded-md px-4 py-2 text-sm font-bold text-aerogas-blue shadow-sm"
                >
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  {servicio}
                </div>
              ))}
              {servicios.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No hay servicios registrados.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Información Operativa */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 border border-gray-100 sticky top-28">
            <h2 className="text-xl font-bold text-aerogas-blue mb-6 border-b border-gray-200 pb-4">
              Información Operativa
            </h2>

            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">
                Horario de Atención
              </p>
              <div className="flex items-center text-gray-800 font-bold text-lg mt-2">
                <svg
                  className="w-6 h-6 text-aerogas-red mr-2 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {estacion.horario || "Atención 24/7"}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <a
                href={urlMapa}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center bg-aerogas-red hover:bg-red-700 text-white font-bold py-4 px-4 rounded-lg transition-transform transform hover:-translate-y-1 shadow-lg text-lg"
              >
                <svg
                  className="w-6 h-6 mr-2 fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                ¿Cómo llegar?
              </a>
            </div>
          </div>
        </div>

      </div>

      <BotonWhatsApp />
      <Footer />
    </main>
  );
}