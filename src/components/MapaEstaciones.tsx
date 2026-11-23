"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

export type EstacionMapa = {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  imagen: string;
  mapa_url?: string;
  latitud: string;
  longitud: string;
  distanciaKm?: number | null;
};

export type UbicacionUsuario = {
  lat: number;
  lon: number;
};

function formatearDistancia(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

// Componente auxiliar que mueve y ajusta el zoom del mapa al cambiar el filtro o el GPS
function ControladorMapa({
  useMap,
  L,
  estacionesValidas,
  ubicacionUsuario,
  estacionDestacadaId,
  claveVista,
}: {
  useMap: any;
  L: any;
  estacionesValidas: EstacionMapa[];
  ubicacionUsuario?: UbicacionUsuario | null;
  estacionDestacadaId?: number | null;
  claveVista: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || estacionesValidas.length === 0) return;

    // Si el GPS está activo, encuadra al usuario + la estación más cercana
    if (ubicacionUsuario && estacionDestacadaId) {
      const masCercana = estacionesValidas.find(
        (e) => e.id === estacionDestacadaId
      );
      if (masCercana) {
        const lat = parseFloat(String(masCercana.latitud).replace(",", "."));
        const lon = parseFloat(String(masCercana.longitud).replace(",", "."));
        const bounds = L.latLngBounds([
          [ubicacionUsuario.lat, ubicacionUsuario.lon],
          [lat, lon],
        ]);
        map.flyToBounds(bounds, {
          padding: [65, 65],
          maxZoom: 15,
          duration: 1.2,
        });
        return;
      }
    }

    if (estacionesValidas.length === 1) {
      const lat = parseFloat(
        String(estacionesValidas[0].latitud).replace(",", ".")
      );
      const lon = parseFloat(
        String(estacionesValidas[0].longitud).replace(",", ".")
      );
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

export default function MapaEstaciones({
  estaciones,
  ubicacionUsuario = null,
  estacionDestacadaId = null,
}: {
  estaciones: EstacionMapa[];
  ubicacionUsuario?: UbicacionUsuario | null;
  estacionDestacadaId?: number | null;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [leafletLib, setLeafletLib] = useState<any>(null);
  const [reactLeaflet, setReactLeaflet] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([L, RL]) => {
        setLeafletLib(L.default || L);
        setReactLeaflet(RL);
      }
    );
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
      <div className="w-full h-[380px] bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 px-4 text-center">
        <p className="text-gray-500 font-medium">
          No hay estaciones con coordenadas registradas para los filtros seleccionados.
        </p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } =
    reactLeaflet;
  const L = leafletLib;

  const iconoAerogas = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const centroLat = parseFloat(
    String(estacionesEnMapa[0].latitud).replace(",", ".")
  );
  const centroLon = parseFloat(
    String(estacionesEnMapa[0].longitud).replace(",", ".")
  );

  // Clave única para mover el mapa cuando cambia el filtro o la ubicación GPS
  const claveUsuario = ubicacionUsuario
    ? `u:${ubicacionUsuario.lat.toFixed(4)},${ubicacionUsuario.lon.toFixed(4)}:${
        estacionDestacadaId || ""
      }`
    : "u:none";

  const claveVista =
    claveUsuario +
    "|" +
    estacionesEnMapa
      .map((e) => `${e.id}:${e.latitud},${e.longitud}`)
      .join("|");

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
      <MapContainer
        center={[centroLat, centroLon]}
        zoom={12}
        scrollWheelZoom={true}
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
          ubicacionUsuario={ubicacionUsuario}
          estacionDestacadaId={estacionDestacadaId}
          claveVista={claveVista}
        />

        {/* MARCADOR DE UBICACIÓN DEL USUARIO (PUNTO AZUL GPS) */}
        {ubicacionUsuario && (
          <>
            <CircleMarker
              center={[ubicacionUsuario.lat, ubicacionUsuario.lon]}
              radius={18}
              pathOptions={{
                color: "#2563eb",
                weight: 1,
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
              }}
            />
            <CircleMarker
              center={[ubicacionUsuario.lat, ubicacionUsuario.lon]}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#2563eb",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="text-center font-bold text-xs text-[#162865] px-1">
                  Tu ubicación actual
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* MARCADORES DE ESTACIONES */}
        {estacionesEnMapa.map((estacion: EstacionMapa) => {
          const lat = parseFloat(String(estacion.latitud).replace(",", "."));
          const lon = parseFloat(String(estacion.longitud).replace(",", "."));
          const urlRuta = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

          return (
            <Marker
              key={estacion.id}
              position={[lat, lon]}
              icon={iconoAerogas}
            >
              <Popup>
                <div className="text-center min-w-[210px] p-1">
                  <img
                    src={estacion.imagen}
                    alt={estacion.nombre}
                    className="w-full h-28 object-cover rounded-md mb-2.5"
                  />

                  {typeof estacion.distanciaKm === "number" && (
                    <span className="inline-block bg-green-100 text-green-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mb-1.5">
                      A {formatearDistancia(estacion.distanciaKm)} de ti
                    </span>
                  )}

                  <h3 className="font-bold text-[#162865] text-sm mb-1">
                    {estacion.nombre}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 leading-tight">
                    {estacion.direccion}, {estacion.ciudad}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={`/estacion/${estacion.id}`}
                      className="block w-full bg-[#162865] text-white py-2 rounded-md text-xs font-bold hover:bg-blue-900 transition-colors"
                    >
                      Detalles
                    </a>
                    <a
                      href={urlRuta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-[#E5192C] text-white py-2 rounded-md text-xs font-bold hover:bg-red-700 transition-colors"
                    >
                      Cómo llegar
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}