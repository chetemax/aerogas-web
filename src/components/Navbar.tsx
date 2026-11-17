import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full bg-aerogas-blue text-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Logotipo Aerogas" 
                className="h-14 w-auto object-contain drop-shadow-md" 
              />
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="hover:text-aerogas-red transition-colors font-semibold tracking-wide">Inicio</Link>
            <Link href="#estaciones" className="hover:text-aerogas-red transition-colors font-semibold tracking-wide">Red de Estaciones</Link>
            <Link href="#flota" className="hover:text-aerogas-red transition-colors font-semibold tracking-wide">Logística B2B</Link>
            <Link href="https://consulta.efacturas.pe/aerogasdelnorte" target="_blank" className="hover:text-aerogas-red transition-colors font-semibold tracking-wide">Comprobante Electrónico</Link>
          </nav>
          <div className="hidden md:flex">
            <Link href="#contacto" className="bg-aerogas-red hover:bg-red-700 text-white px-6 py-2 rounded-md font-bold transition-all shadow-md hover:shadow-lg">
              Atención al Cliente
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}