import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contacto" className="w-full bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-gray-700 pb-8">
        <div>
          <img 
            src="/logo.png" 
            alt="Logotipo Aerogas" 
            className="h-14 w-auto mb-4 object-contain" 
          />
          <p className="text-sm text-gray-400">
            Más de 20 estaciones impulsando el transporte y la industria en el norte del Perú con los más altos estándares de seguridad y peso exacto.
          </p>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Atención al Cliente</h3>
          <ul className="space-y-2 text-sm">
            <li>📍 Oficina Central: Chiclayo, Lambayeque, Perú</li>
            <li>✉️ Correo: atencionalcliente@aerogasdelnorte.pe</li>
            <li>📞 Teléfono: (074) 123-456</li>
            <li>🕒 Horario Administrativo: Lun - Vie 8:00am a 6:00pm</li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Enlaces Rápidos</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="https://consulta.efacturas.pe/aerogasdelnorte" target="_blank" className="hover:text-aerogas-red transition-colors">Portal de Facturación Electrónica</Link></li>
            <li><Link href="#estaciones" className="hover:text-aerogas-red transition-colors">Ver Mapa de Estaciones</Link></li>
            <li><Link href="#flota" className="hover:text-aerogas-red transition-colors">Servicios B2B</Link></li>
            <li><a href="#" className="hover:text-aerogas-red transition-colors">Libro de Reclamaciones</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center">
        <p>© {new Date().getFullYear()} Aerogas del Norte S.A.C. - RUC: 20123456789. Todos los derechos reservados.</p>
        <p className="mt-2 md:mt-0">Desarrollado para Aerogas del Norte</p>
      </div>
    </footer>
  );
}