"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

type EstacionMapa = {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  imagen: string;
  latitud: string;
  longitud: string;
};

// Componente auxiliar que mueve y ajusta el zoom del mapa al cambiar el filtro
function ControladorMapa({
  useMap,
  L,
  estacionesValidas,
  claveVista,
}: {
  useMap: any;
  L: any;
  estacionesValidas: EstacionMapa[];
  claveVista: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || estacionesValidas.length === 0) return;

    if (estacionesValidas.length === 1) {
      const lat = parseFloat(String(estacionesValidas[0].latitud).replace(",", "."));
      const lon = parseFloat(String(estacionesValidas[0].longitud).replace(",", "."));
      map.flyTo([lat, lon], 15, { duration: 1.2 });
    } else {
      const puntos = estacionesValidas.map((e) => [
        parseFloat(String(e.latitud).replace(",", ".")),
        parseFloat(String(e.longitud).replace(",", ".")),
      ]);
      const bounds = L.latLngBounds(puntos);
      map.flyToBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
        duration: 1.2,
      });
    }
  }, [map, L, claveVista]);

  return null;
}

export default function MapaEstaciones({ estaciones }: { estaciones: EstacionMapa[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [leafletLib, setLeafletLib] = useState<any>(null);
  const [reactLeaflet, setReactLeaflet] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    Promise.all([import("leaflet"), import("react-leaflet")]).then(([L, RL]) => {
      setLeafletLib(L.default || L);
      setReactLeaflet(RL);
    });
  }, []);

  // Filtramos solo estaciones con coordenadas numéricas válidas
  const estacionesEnMapa = estaciones.filter((e) => {
    if (!e.latitud || !e.longitud) return false;
    const lat = parseFloat(String(e.latitud).replace(",", "."));
    const lon = parseFloat(String(e.longitud).replace(",", "."));
    return !isNaN(lat) && !isNaN(lon);
  });

  if (!isMounted || !leafletLib || !reactLeaflet) {
    return (
      <div className="w-full h-[500px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500 font-bold">Cargando mapa interactivo...</p>
      </div>
    );
  }

  if (estacionesEnMapa.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500 font-medium">
          No hay estaciones con coordenadas registradas para esta zona.
        </p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap } = reactLeaflet;
  const L = leafletLib;

  const iconoAerogas = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const centroLat = parseFloat(String(estacionesEnMapa[0].latitud).replace(",", "."));
  const centroLon = parseFloat(String(estacionesEnMapa[0].longitud).replace(",", "."));

  // Clave única para que el mapa solo se mueva cuando cambia el filtro de estaciones
  const claveVista = estacionesEnMapa
    .map((e) => `${e.id}:${e.latitud},${e.longitud}`)
    .join("|");

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
      <MapContainer
        center={[centroLat, centroLon]}
        zoom={12}
        scrollWheelZoom={true} // Zoom con la rueda del mouse ACTIVADO
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ControladorMapa
          useMap={useMap}
          L={L}
          estacionesValidas={estacionesEnMapa}
          claveVista={claveVista}
        />

        {estacionesEnMapa.map((estacion: EstacionMapa) => (
          <Marker
            key={estacion.id}
            position={[
              parseFloat(String(estacion.latitud).replace(",", ".")),
              parseFloat(String(estacion.longitud).replace(",", ".")),
            ]}
            icon={iconoAerogas}
          >
            <Popup>
              <div className="text-center min-w-[200px] p-1">
                <img
                  src={estacion.imagen}
                  alt={estacion.nombre}
                  className="w-full h-28 object-cover rounded-md mb-3"
                />
                <h3 className="font-bold text-[#162865] text-sm mb-1">
                  {estacion.nombre}
                </h3>
                <p className="text-xs text-gray-500 mb-3 leading-tight">
                  {estacion.direccion}, {estacion.ciudad}
                </p>
                <a
                  href={`/estacion/${estacion.id}`}
                  className="block w-full bg-[#E5192C] text-white py-2 rounded-md text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  Ver Detalles
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}