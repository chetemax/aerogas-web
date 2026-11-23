"use client";

import { useState } from "react";
import Link from "next/link";

type ItemFaq = {
  pregunta: string;
  respuesta: string;
  enlaceTexto?: string;
  enlaceHref?: string;
  externo?: boolean;
};

const PREGUNTAS_FRECUENTES: ItemFaq[] = [
  {
    pregunta: "¿Cómo descargo mi boleta o factura electrónica?",
    respuesta:
      "Puedes consultar y descargar tus comprobantes electrónicos en cualquier momento desde nuestro Portal de Facturación Electrónica ingresando el RUC o DNI, serie, correlativo y monto de tu operación.",
    enlaceTexto: "Ir al Portal de Facturación Electrónica",
    enlaceHref: "https://consulta.efacturas.pe/aerogasdelnorte",
    externo: true,
  },
  {
    pregunta: "¿Qué medios de pago aceptan en las estaciones y en AeroMarket?",
    respuesta:
      "Aceptamos efectivo, tarjetas de crédito y débito (Visa y Mastercard) y billeteras digitales como Yape y Plin. Para clientes corporativos con convenio vigente también contamos con líneas de crédito y facturación consolidada.",
  },
  {
    pregunta: "¿Cómo puedo solicitar una cuenta corporativa o abastecimiento para mi flota?",
    respuesta:
      "Atendemos a empresas de transporte, agroindustria, construcción y distribución con control exacto de galonaje, precios preferenciales y crédito corporativo. Solo necesitas enviar tu RUC y consumo mensual estimado mediante nuestro cotizador B2B y un ejecutivo te contactará.",
    enlaceTexto: "Solicitar Cotización B2B",
    enlaceHref: "/?cotizar=true",
  },
  {
    pregunta: "¿Cuál es el horario de atención de las estaciones de servicio?",
    respuesta:
      "La gran mayoría de nuestras estaciones y tiendas AeroMarket atienden las 24 horas del día, los 7 días de la semana. Puedes verificar el horario específico y los servicios disponibles de cada sede ingresando a su ficha en nuestra Red de Estaciones.",
    enlaceTexto: "Explorar Red de Estaciones",
    enlaceHref: "/#estaciones",
  },
  {
    pregunta: "¿Todas las estaciones cuentan con tienda AeroMarket?",
    respuesta:
      "Contamos con tiendas de conveniencia AeroMarket en sedes estratégicas de nuestra red, con bebidas heladas, café, snacks y promociones vigentes. Puedes ver la lista actualizada de sedes con AeroMarket o usar el filtro 'Market' en el mapa.",
    enlaceTexto: "Ver Promociones y Sedes AeroMarket",
    enlaceHref: "/aeromarket",
  },
  {
    pregunta: "¿Dónde puedo registrar un reclamo, queja o sugerencia formal?",
    respuesta:
      "Ponemos a tu disposición nuestro Libro de Reclamaciones Virtual las 24 horas, conforme a la Ley N° 29571 (INDECOPI). Al registrar tu hoja recibirás constancia inmediata imprimible y copia en tu correo, con respuesta en un máximo de 15 días hábiles improrrogables.",
    enlaceTexto: "Acceder al Libro de Reclamaciones",
    enlaceHref: "/libro-de-reclamaciones",
  },
];

export default function SeccionFaq() {
  const [indiceAbierto, setIndiceAbierto] = useState<number | null>(0);

  const toggleItem = (indice: number) => {
    setIndiceAbierto((actual) => (actual === indice ? null : indice));
  };

  return (
    <section
      id="preguntas-frecuentes"
      className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-200"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-aerogas-red mb-2">
            Centro de Ayuda
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-aerogas-blue mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Respuestas rápidas sobre comprobantes electrónicos, medios de pago, convenios corporativos y atención en nuestras estaciones.
          </p>
        </div>

        <div className="space-y-3">
          {PREGUNTAS_FRECUENTES.map((item, idx) => {
            const abierto = indiceAbierto === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all overflow-hidden ${
                  abierto
                    ? "border-aerogas-blue bg-blue-50/30 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  aria-expanded={abierto}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left cursor-pointer"
                >
                  <span
                    className={`font-bold text-sm sm:text-base transition-colors ${
                      abierto ? "text-aerogas-blue" : "text-gray-800"
                    }`}
                  >
                    {item.pregunta}
                  </span>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      abierto
                        ? "bg-aerogas-blue text-white rotate-180"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>

                {abierto && (
                  <div className="px-5 sm:px-6 pb-5 pt-0 text-sm text-gray-600 leading-relaxed space-y-3">
                    <p>{item.respuesta}</p>
                    {item.enlaceHref && item.enlaceTexto && (
                      <div>
                        {item.externo ? (
                          <a
                            href={item.enlaceHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-aerogas-red hover:underline"
                          >
                            {item.enlaceTexto}
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        ) : (
                          <Link
                            href={item.enlaceHref}
                            scroll={!item.enlaceHref.includes("cotizar=true")}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-aerogas-red hover:underline"
                          >
                            {item.enlaceTexto} →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}