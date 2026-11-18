"use client";

import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

type Estacion = {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  imagen: string;
  latitud: string;
  longitud: string;
};

export default function MapaEstaciones({ estaciones }: { estaciones: Estacion[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [leafletLib, setLeafletLib] = useState<any>(null);
  const [reactLeaflet, setReactLeaflet] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    // Truco para Next.js: Cargamos las librerías del mapa SOLO en el navegador del cliente
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([L, RL]) => {
      setLeafletLib(L.default || L);
      setReactLeaflet(RL);
    });
  }, []);

  const estacionesEnMapa = estaciones.filter(e => e.latitud && e.longitud);

  // Pantalla de carga mientras el mapa se inicializa seguro en el cliente
  if (!isMounted || !leafletLib || !reactLeaflet) {
    return (
      <div className="w-full h-[500px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500 font-bold">Cargando mapa interactivo...</p>
      </div>
    );
  }

  if (estacionesEnMapa.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500 font-medium">No hay estaciones con coordenadas para mostrar en el mapa.</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = reactLeaflet;
  const L = leafletLib;

  // Icono corporativo
  const iconoAerogas = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const centroLat = parseFloat(estacionesEnMapa[0].latitud);
  const centroLon = parseFloat(estacionesEnMapa[0].longitud);

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
      <MapContainer 
        center={[centroLat, centroLon]} 
        zoom={12} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {estacionesEnMapa.map((estacion: Estacion) => (
          <Marker 
            key={estacion.id} 
            position={[parseFloat(estacion.latitud), parseFloat(estacion.longitud)]} 
            icon={iconoAerogas}
          >
            <Popup>
              <div className="text-center min-w-[200px] p-1">
                <img src={estacion.imagen} alt={estacion.nombre} className="w-full h-28 object-cover rounded-md mb-3" />
                <h3 className="font-bold text-[#162865] text-sm mb-1">{estacion.nombre}</h3>
                <p className="text-xs text-gray-500 mb-3 leading-tight">{estacion.direccion}, {estacion.ciudad}</p>
                <a href={`/estacion/${estacion.id}`} className="block w-full bg-[#E5192C] text-white py-2 rounded-md text-xs font-bold hover:bg-red-700 transition-colors">
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