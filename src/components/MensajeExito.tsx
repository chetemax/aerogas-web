"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MensajeExito() {
  const router = useRouter();

  useEffect(() => {
    // A los 4 segundos, volvemos a la URL limpia "/", lo cual cerrará el Modal
    const timer = setTimeout(() => {
      router.replace("/", { scroll: false });
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-10 rounded-xl text-center shadow-sm">
      <span className="block text-5xl mb-4">✅</span>
      <h3 className="text-2xl font-bold mb-2 text-aerogas-blue">¡Solicitud Enviada con Éxito!</h3>
      <p className="font-medium">Hemos recibido los datos de tu empresa.</p>
      <p className="text-sm text-gray-500 mt-4 animate-pulse">Cerrando ventana automáticamente...</p>
    </div>
  );
}