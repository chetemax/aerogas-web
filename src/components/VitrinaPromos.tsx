"use client";

import { useMemo, useState } from "react";

export type PromoAeroMarket = {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  etiqueta: string;
  precio_promo: string;
  imagen_url: string;
  fecha_fin: string | null;
};

function formatearFecha(fechaIso: string | null) {
  if (!fechaIso) return null;
  const [anio, mes, dia] = fechaIso.split("-");
  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const mesTexto = meses[Number(mes) - 1] || mes;
  return `${dia} ${mesTexto} ${anio}`;
}

export default function VitrinaPromos({
  promos,
  catalogoPdfUrl,
}: {
  promos: PromoAeroMarket[];
  catalogoPdfUrl?: string;
}) {
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todas");
  const [promoAmpliada, setPromoAmpliada] = useState<PromoAeroMarket | null>(null);

  const categorias = useMemo(() => {
    const mapa = new Map<string, number>();
    promos.forEach((p) => {
      const cat = (p.categoria || "Combos").trim();
      mapa.set(cat, (mapa.get(cat) || 0) + 1);
    });
    return Array.from(mapa.entries()).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }));
  }, [promos]);

  const promosFiltradas = useMemo(() => {
    if (categoriaActiva === "Todas") return promos;
    return promos.filter((p) => p.categoria === categoriaActiva);
  }, [promos, categoriaActiva]);

  return (
    <div>
      {/* CABECERA DE VITRINA Y BOTÓN OPCIONAL DE CATÁLOGO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
        <div className="text-center md:text-left">
          <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-aerogas-red mb-2">
            Ofertas Vigentes
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-aerogas-blue">
            Promociones AeroMarket
          </h2>
        </div>

        {catalogoPdfUrl && (
          <a
            href={catalogoPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-aerogas-red hover:bg-red-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Ver Catálogo de Productos (PDF)
          </a>
        )}
      </div>

      {/* FILTROS POR CATEGORÍA */}
      {categorias.length > 1 && (
        <div className="flex flex-wrap justify-center md:justify-start gap-2.5 mb-10">
          <button
            type="button"
            onClick={() => setCategoriaActiva("Todas")}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer ${
              categoriaActiva === "Todas"
                ? "bg-aerogas-blue text-white border-aerogas-blue shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-aerogas-blue hover:text-aerogas-blue"
            }`}
          >
            <span>Todas</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                categoriaActiva === "Todas"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {promos.length}
            </span>
          </button>

          {categorias.map((cat) => {
            const activo = categoriaActiva === cat.nombre;
            return (
              <button
                key={cat.nombre}
                type="button"
                onClick={() => setCategoriaActiva(cat.nombre)}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer ${
                  activo
                    ? "bg-aerogas-blue text-white border-aerogas-blue shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:border-aerogas-blue hover:text-aerogas-blue"
                }`}
              >
                <span>{cat.nombre}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activo
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {cat.cantidad}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* GRILLA DE PROMOCIONES */}
      {promosFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promosFiltradas.map((promo) => (
            <article
              key={promo.id}
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Imagen / Flyer interactivo */}
              <div
                onClick={() => setPromoAmpliada(promo)}
                className="relative w-full h-64 bg-gray-100 overflow-hidden cursor-pointer"
                title="Haz clic para ampliar el flyer"
              >
                <img
                  src={promo.imagen_url}
                  alt={promo.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Etiqueta promocional */}
                {promo.etiqueta && (
                  <span className="absolute top-3 left-3 bg-aerogas-red text-white text-xs font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-full shadow-md">
                    {promo.etiqueta}
                  </span>
                )}

                {/* Precio destacado */}
                {promo.precio_promo && (
                  <span className="absolute bottom-3 right-3 bg-aerogas-blue text-white text-base font-extrabold px-4 py-1.5 rounded-xl shadow-lg border border-white/20">
                    {promo.precio_promo}
                  </span>
                )}

                {/* Indicador sutil de ampliar */}
                <div className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-6 flex flex-col flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-aerogas-red mb-1">
                  {promo.categoria}
                </span>
                <h3 className="text-xl font-bold text-aerogas-blue mb-2">
                  {promo.titulo}
                </h3>

                {promo.descripcion && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {promo.descripcion}
                  </p>
                )}

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <svg className="w-4 h-4 text-aerogas-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {promo.fecha_fin
                      ? `Válido hasta ${formatearFecha(promo.fecha_fin)}`
                      : "Promoción vigente"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPromoAmpliada(promo)}
                    className="font-bold text-aerogas-blue hover:text-aerogas-red transition-colors cursor-pointer"
                  >
                    Ampliar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <h3 className="text-lg font-bold text-aerogas-blue mb-1">
            Próximamente nuevas promociones
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Visítanos en cualquiera de nuestros AeroMarket y descubre nuestras ofertas diarias en bebidas, café y snacks.
          </p>
        </div>
      )}

      {/* MODAL PARA VER EL FLYER EN GRANDE */}
      {promoAmpliada && (
        <div
          onClick={() => setPromoAmpliada(null)}
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-fade-in-up"
          >
            <button
              type="button"
              onClick={() => setPromoAmpliada(null)}
              aria-label="Cerrar vista previa"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-aerogas-red text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="bg-gray-900 flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={promoAmpliada.imagen_url}
                alt={promoAmpliada.titulo}
                className="w-full h-full max-h-[65vh] object-contain"
              />
            </div>

            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase text-aerogas-red">
                    {promoAmpliada.categoria}
                  </span>
                  {promoAmpliada.etiqueta && (
                    <span className="text-xs font-bold bg-red-50 text-aerogas-red px-2 py-0.5 rounded-full">
                      {promoAmpliada.etiqueta}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-aerogas-blue">
                  {promoAmpliada.titulo}
                </h3>
                {promoAmpliada.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">
                    {promoAmpliada.descripcion}
                  </p>
                )}
              </div>

              {promoAmpliada.precio_promo && (
                <div className="bg-aerogas-blue text-white font-extrabold text-xl px-5 py-2.5 rounded-xl shrink-0 text-center">
                  {promoAmpliada.precio_promo}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}