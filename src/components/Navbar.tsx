"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const esInicio = pathname === "/";
  const esAeroMarket = pathname === "/aeromarket";

  return (
    <header className="w-full bg-aerogas-blue text-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* LOGOTIPO */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="Logotipo Aerogas"
                className="h-14 w-auto object-contain drop-shadow-md"
              />
            </Link>
          </div>

          {/* MENÚ DE ESCRITORIO */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm lg:text-base">
            <Link
              href="/"
              className={`transition-colors font-semibold tracking-wide ${
                esInicio
                  ? "text-white border-b-2 border-aerogas-red pb-1"
                  : "text-gray-200 hover:text-aerogas-red"
              }`}
            >
              Inicio
            </Link>

            <Link
              href="/#estaciones"
              className="text-gray-200 hover:text-aerogas-red transition-colors font-semibold tracking-wide"
            >
              Red de Estaciones
            </Link>

            <Link
              href="/aeromarket"
              className={`inline-flex items-center gap-1.5 transition-colors font-bold tracking-wide ${
                esAeroMarket
                  ? "text-white bg-aerogas-red/90 px-3.5 py-1.5 rounded-lg shadow-sm"
                  : "text-white hover:text-aerogas-red"
              }`}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              AeroMarket
            </Link>

            <Link
              href="/#flota"
              className="text-gray-200 hover:text-aerogas-red transition-colors font-semibold tracking-wide"
            >
              Logística B2B
            </Link>

            <Link
              href="https://consulta.efacturas.pe/aerogasdelnorte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 hover:text-aerogas-red transition-colors font-semibold tracking-wide"
            >
              Comprobante Electrónico
            </Link>
          </nav>

          {/* BOTÓN CTA ESCRITORIO */}
          <div className="hidden md:flex">
            <Link
              href="#contacto"
              className="bg-aerogas-red hover:bg-red-700 text-white px-5 py-2.5 rounded-md font-bold text-sm transition-all shadow-md hover:shadow-lg"
            >
              Atención al Cliente
            </Link>
          </div>

          {/* BOTÓN MENÚ MÓVIL */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMenuAbierto(!menuAbierto)}
              aria-label="Abrir menú de navegación"
              className="p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {menuAbierto ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      {menuAbierto && (
        <div className="md:hidden bg-aerogas-blue border-t border-white/10 px-4 pt-3 pb-5 space-y-2 shadow-xl">
          <Link
            href="/"
            onClick={() => setMenuAbierto(false)}
            className={`block px-3 py-2.5 rounded-lg font-semibold ${
              esInicio ? "bg-white/15 text-white" : "text-gray-200 hover:bg-white/10"
            }`}
          >
            Inicio
          </Link>
          <Link
            href="/#estaciones"
            onClick={() => setMenuAbierto(false)}
            className="block px-3 py-2.5 rounded-lg font-semibold text-gray-200 hover:bg-white/10"
          >
            Red de Estaciones
          </Link>
          <Link
            href="/aeromarket"
            onClick={() => setMenuAbierto(false)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold ${
              esAeroMarket
                ? "bg-aerogas-red text-white"
                : "text-white hover:bg-white/10"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            AeroMarket
          </Link>
          <Link
            href="/#flota"
            onClick={() => setMenuAbierto(false)}
            className="block px-3 py-2.5 rounded-lg font-semibold text-gray-200 hover:bg-white/10"
          >
            Logística B2B
          </Link>
          <Link
            href="https://consulta.efacturas.pe/aerogasdelnorte"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuAbierto(false)}
            className="block px-3 py-2.5 rounded-lg font-semibold text-gray-200 hover:bg-white/10"
          >
            Comprobante Electrónico
          </Link>
          <div className="pt-2">
            <Link
              href="#contacto"
              onClick={() => setMenuAbierto(false)}
              className="block w-full text-center bg-aerogas-red hover:bg-red-700 text-white px-4 py-3 rounded-lg font-bold transition-colors shadow-md"
            >
              Atención al Cliente
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}