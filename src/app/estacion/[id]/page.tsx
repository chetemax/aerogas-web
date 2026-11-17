import { pool } from "../../../lib/db";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DetalleEstacionPage({ params }: Props) {
  const { id } = await params;

  // 1. Consultar los datos de la estación
  const [estacionRows] = await pool.query("SELECT * FROM estaciones WHERE id = ?", [id]);
  const estacionData = estacionRows as any[];

  if (estacionData.length === 0) {
    notFound(); // Si ponen un ID que no existe, muestra la página 404 de Next.js
  }

  const estacion = estacionData[0];

  // 2. Consultar solo los servicios que tiene esta estación específica
  const [serviciosRows] = await pool.query(`
    SELECT s.nombre 
    FROM servicios s
    JOIN estacion_servicios es ON s.id = es.servicio_id
    WHERE es.estacion_id = ?
  `, [id]);
  
  const servicios = (serviciosRows as any[]).map(row => row.nombre);

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section de la Estación */}
      <section className="w-full bg-aerogas-blue text-white pt-24 pb-32 px-4 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex-1">
            <Link href="/#estaciones" className="text-gray-300 hover:text-white mb-6 inline-block transition-colors">
              ← Volver a todas las estaciones
            </Link>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{estacion.nombre}</h1>
            <p className="text-xl text-gray-200 mb-2 flex items-center gap-2">
              <span className="text-aerogas-red text-2xl">📍</span> {estacion.direccion}, {estacion.ciudad}
            </p>
          </div>
        </div>
      </section>

      {/* Contenido Principal flotante */}
      <section className="w-full px-4 -mt-20 mb-20 z-20 relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Foto y Descripción (Ocupa 2 espacios) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="w-full h-80 md:h-96 bg-gray-200 relative">
                <img 
                  src={estacion.imagen} 
                  alt={`Estación ${estacion.nombre}`} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-aerogas-blue mb-4">Sobre esta estación</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {estacion.descripcion ? estacion.descripcion : "Estación de servicio Aerogas equipada con los más altos estándares de seguridad y atención, lista para abastecer a tu flota o vehículo particular con la calidad que nos caracteriza."}
                </p>
              </div>
            </div>

            {/* Bloque de Servicios */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-aerogas-blue mb-6">Servicios Disponibles</h2>
              <div className="flex flex-wrap gap-3">
                {servicios.length > 0 ? (
                  servicios.map((servicio, index) => (
                    <span key={index} className="bg-blue-50 text-aerogas-blue font-bold px-4 py-2 rounded-lg border border-blue-100 text-sm flex items-center gap-2">
                      ✅ {servicio}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No hay servicios específicos listados para esta estación.</p>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Información (Ocupa 1 espacio) */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 top-8 sticky">
              <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Información Operativa</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Horario de Atención</p>
                  <p className="text-lg font-bold text-aerogas-blue flex items-center gap-2">
                    🕒 {estacion.horario}
                  </p>
                </div>

                {estacion.telefono_estacion && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Teléfono Directo</p>
                    <a href={`tel:${estacion.telefono_estacion}`} className="text-lg font-bold text-aerogas-blue hover:text-aerogas-red transition-colors flex items-center gap-2">
                      📞 {estacion.telefono_estacion}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t">
                <a 
                  href={estacion.mapa_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full flex justify-center items-center gap-2 bg-aerogas-red hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  🗺️ ¿Cómo llegar?
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}