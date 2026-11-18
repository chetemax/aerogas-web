"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ModalBienvenida({ modalActivo, modalImagen, modalEnlace }: { modalActivo: boolean, modalImagen: string, modalEnlace: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verificamos si el modal está activo en la base de datos y si el usuario ya lo vio en esta sesión
    if (modalActivo && modalImagen) {
      const yaVisto = sessionStorage.getItem("aerogas_modal_visto");
      if (!yaVisto) {
        setIsOpen(true);
      }
    }
  }, [modalActivo, modalImagen]);

  const cerrarModal = () => {
    setIsOpen(false);
    sessionStorage.setItem("aerogas_modal_visto", "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
        
        {/* Botón de Cierre */}
        <button 
          onClick={cerrarModal}
          className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-red-600 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold transition-colors shadow-lg"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        {/* Contenido con enlace dinámico */}
        <Link href={modalEnlace} onClick={cerrarModal} className="block group">
          <div className="w-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <img 
              src={modalImagen} 
              alt="Anuncio Aerogas" 
              className="w-full h-auto max-h-[80vh] object-contain group-hover:scale-105 transition-transform duration-500" 
            />
          </div>
        </Link>
        
      </div>
    </div>
  );
}