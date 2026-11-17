"use client";

import { useState } from "react";

export default function CarruselFlota({ cisternas }: { cisternas: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!cisternas || cisternas.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === cisternas.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? cisternas.length - 1 : prev - 1));
  };

  const current = cisternas[currentIndex];

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
      
      {/* Lado Izquierdo: Fotografía */}
      <div className="md:w-1/2 h-72 md:h-auto relative bg-gray-200 flex items-center justify-center group">
        <img 
          src={current.imagen} 
          alt={`Cisterna ${current.marca}`} 
          className="w-full h-full object-cover transition-transform duration-500" 
        />
        
        {/* Flechas de Navegación (aparecen más notorias al pasar el mouse) */}
        <button 
          onClick={prevSlide} 
          className="absolute left-4 bg-white/70 hover:bg-white text-aerogas-blue p-3 rounded-full shadow-lg font-bold text-xl transition-all opacity-80 hover:opacity-100 hover:scale-110"
        >
          ❮
        </button>
        <button 
          onClick={nextSlide} 
          className="absolute right-4 bg-white/70 hover:bg-white text-aerogas-blue p-3 rounded-full shadow-lg font-bold text-xl transition-all opacity-80 hover:opacity-100 hover:scale-110"
        >
          ❯
        </button>
      </div>

      {/* Lado Derecho: Especificaciones Técnicas */}
      <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-aerogas-blue text-white relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-aerogas-red opacity-10 rounded-bl-full pointer-events-none"></div>
        
        <h3 className="text-sm font-semibold text-gray-300 tracking-widest uppercase mb-1">Unidad de Transporte</h3>
        <h2 className="text-3xl font-extrabold mb-6 text-white uppercase tracking-wider">
          {current.marca}
        </h2>
        
        <ul className="space-y-4 mb-8">
          <li className="flex justify-between items-center border-b border-blue-800/50 pb-2">
            <span className="text-blue-200">Placa Tracto:</span> 
            <span className="font-semibold text-lg">{current.tracto}</span>
          </li>
          <li className="flex justify-between items-center border-b border-blue-800/50 pb-2">
            <span className="text-blue-200">Placa Tanque:</span> 
            <span className="font-semibold text-lg">{current.tanque}</span>
          </li>
          <li className="flex justify-between items-center border-b border-blue-800/50 pb-2">
            <span className="text-blue-200">Compartimientos:</span> 
            <span className="font-semibold text-lg">{current.compartimientos}</span>
          </li>
          <li className="flex justify-between items-center border-b border-blue-800/50 pb-2">
            <span className="text-blue-200">Capacidad Total:</span> 
            <span className="font-extrabold text-aerogas-red text-2xl">{current.capacidad} Gal.</span>
          </li>
        </ul>

        {/* Puntos indicadores inferiores */}
        <div className="flex justify-center gap-2 mt-auto pt-4">
          {cisternas.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${idx === currentIndex ? 'w-6 h-2 bg-aerogas-red' : 'w-2 h-2 bg-blue-400 hover:bg-blue-300'}`}
              aria-label={`Ir a cisterna ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}