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
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-aerogas-red shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>Oficina Central: Chiclayo, Lambayeque, Perú</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-aerogas-red shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span>Correo: ventas@aerogas.com.pe</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-aerogas-red shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span>Teléfono: (+51) 908-856-499</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-aerogas-red shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              <span>Horario Administrativo: Lun - Vie 8:00am a 6:00pm</span>
            </li>
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
        <p>© {new Date().getFullYear()} Aerogas del Norte S.A.C. - RUC: 20458378747. Todos los derechos reservados.</p>
        <p className="mt-2 md:mt-0">Desarrollado para Aerogas del Norte</p>
      </div>
    </footer>
  );
}