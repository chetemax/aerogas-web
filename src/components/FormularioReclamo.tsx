"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registrarReclamo } from "../app/libro-de-reclamaciones/actions";
import CamposAntiBot from "./CamposAntiBot";

export type OpcionSede = {
  key: string;
  grupo: "Estaciones de Servicio" | "Tiendas AeroMarket" | "Atención Corporativa";
  nombre: string;
  direccion: string;
};

export default function FormularioReclamo({
  sedes,
  fechaHoyTexto,
}: {
  sedes: OpcionSede[];
  fechaHoyTexto: string;
}) {
  const router = useRouter();

  const [sedeKey, setSedeKey] = useState<string>(sedes[0]?.key || "web");
  const [tipoDocumento, setTipoDocumento] = useState<string>("DNI");
  const [esMenor, setEsMenor] = useState<boolean>(false);
  const [tipoBien, setTipoBien] = useState<"PRODUCTO" | "SERVICIO">("PRODUCTO");
  const [tipoRegistro, setTipoRegistro] = useState<"RECLAMO" | "QUEJA">("RECLAMO");

  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const sedeActual = sedes.find((s) => s.key === sedeKey);

  const estaciones = sedes.filter((s) => s.grupo === "Estaciones de Servicio");
  const markets = sedes.filter((s) => s.grupo === "Tiendas AeroMarket");
  const corporativas = sedes.filter((s) => s.grupo === "Atención Corporativa");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setEnviando(true);

    try {
      const formData = new FormData(e.currentTarget);
      const resultado = await registrarReclamo(formData);

      if (!resultado.ok) {
        setErrorMsg(
          resultado.error || "No se pudo registrar la hoja de reclamación."
        );
        setEnviando(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (resultado.redirectUrl) {
        router.push(resultado.redirectUrl);
      }
    } catch (err) {
      setErrorMsg("Error de conexión con el servidor. Intente nuevamente.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 relative">
      {/* CAMPOS ANTI-BOT INVISIBLES */}
      <CamposAntiBot />

      {/* MENSAJE DE ERROR */}
      {errorMsg && (
        <div
          role="alert"
          className="bg-red-50 border-l-4 border-aerogas-red text-red-800 p-4 rounded-r-lg shadow-sm flex items-start gap-3"
        >
          <svg
            className="w-5 h-5 text-aerogas-red shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="M12 9v2m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18.5h16.7a1 1 0 00.86-1.64l-7.5-13a1 1 0 00-1.72 0z"
            />
          </svg>
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* CABECERA LEGAL DEL PROVEEDOR */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="block text-xs font-bold uppercase text-gray-500">
            Razón Social
          </span>
          <span className="font-extrabold text-aerogas-blue">
            AEROGAS DEL NORTE S.A.C.
          </span>
        </div>
        <div>
          <span className="block text-xs font-bold uppercase text-gray-500">
            RUC
          </span>
          <span className="font-extrabold text-aerogas-blue">20458378747</span>
        </div>
        <div>
          <span className="block text-xs font-bold uppercase text-gray-500">
            Fecha de Registro
          </span>
          <span className="font-extrabold text-aerogas-blue">
            {fechaHoyTexto}
          </span>
        </div>
      </div>

      {/* SECCIÓN 1: ESTABLECIMIENTO / SEDE */}
      <section className="space-y-4">
        <div className="border-b border-gray-200 pb-2">
          <h2 className="text-lg font-extrabold text-aerogas-blue">
            1. Identificación del Establecimiento
          </h2>
          <p className="text-xs text-gray-500">
            Indique la estación de servicio, tienda AeroMarket o canal donde ocurrió el hecho.
          </p>
        </div>

        <div>
          <label
            htmlFor="sede_key"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Establecimiento / Sede *
          </label>
          <select
            id="sede_key"
            name="sede_key"
            required
            value={sedeKey}
            onChange={(e) => setSedeKey(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
          >
            {estaciones.length > 0 && (
              <optgroup label="Estaciones de Servicio Aerogas">
                {estaciones.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.nombre} — {s.direccion}
                  </option>
                ))}
              </optgroup>
            )}
            {markets.length > 0 && (
              <optgroup label="Tiendas de Conveniencia AeroMarket">
                {markets.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.nombre} — {s.direccion}
                  </option>
                ))}
              </optgroup>
            )}
            {corporativas.length > 0 && (
              <optgroup label="Atención Corporativa / Canal Web">
                {corporativas.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.nombre}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {sedeActual && (
            <p className="mt-2 text-xs text-gray-600 bg-blue-50/70 border border-blue-100 rounded-md px-3 py-2">
              <strong className="text-aerogas-blue">Dirección del establecimiento:</strong>{" "}
              {sedeActual.direccion}
            </p>
          )}
        </div>
      </section>

      {/* SECCIÓN 2: IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE */}
      <section className="space-y-4">
        <div className="border-b border-gray-200 pb-2">
          <h2 className="text-lg font-extrabold text-aerogas-blue">
            2. Identificación del Consumidor Reclamante
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tipo de Documento *
            </label>
            <select
              name="tipo_documento"
              required
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
            >
              <option value="DNI">DNI</option>
              <option value="CE">Carné de Extranjería</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="RUC">RUC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Número de Documento *
            </label>
            <input
              type="text"
              name="numero_documento"
              required
              maxLength={tipoDocumento === "DNI" ? 8 : tipoDocumento === "RUC" ? 11 : 20}
              pattern={
                tipoDocumento === "DNI"
                  ? "\\d{8}"
                  : tipoDocumento === "RUC"
                  ? "\\d{11}"
                  : undefined
              }
              placeholder={
                tipoDocumento === "DNI"
                  ? "8 dígitos"
                  : tipoDocumento === "RUC"
                  ? "11 dígitos"
                  : "Número de documento"
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Teléfono / Celular *
            </label>
            <input
              type="tel"
              name="telefono"
              required
              placeholder="Ej: 987654321"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombres y Apellidos (o Razón Social) *
            </label>
            <input
              type="text"
              name="nombres_apellidos"
              required
              placeholder="Ej: Juan Carlos Pérez López"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="Aquí enviaremos copia de su constancia"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Domicilio Actual *
          </label>
          <input
            type="text"
            name="domicilio"
            required
            placeholder="Dirección, distrito y provincia"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
          />
        </div>

        {/* BLOQUE OBLIGATORIO PARA MENORES DE EDAD */}
        <div className="pt-2">
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="es_menor"
              checked={esMenor}
              onChange={(e) => setEsMenor(e.target.checked)}
              className="w-4 h-4 text-aerogas-red border-gray-300 rounded focus:ring-aerogas-red cursor-pointer"
            />
            <span className="text-sm font-bold text-gray-800">
              El consumidor reclamante es menor de edad
            </span>
          </label>

          {esMenor && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-4">
              <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                Datos Obligatorios del Padre, Madre o Apoderado (D.S. N° 011-2011-PCM)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombres y Apellidos del Padre / Madre / Apoderado *
                  </label>
                  <input
                    type="text"
                    name="apoderado_nombre"
                    required={esMenor}
                    className="w-full border border-orange-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    DNI / Documento del Apoderado *
                  </label>
                  <input
                    type="text"
                    name="apoderado_documento"
                    required={esMenor}
                    className="w-full border border-orange-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Teléfono del Apoderado *
                  </label>
                  <input
                    type="tel"
                    name="apoderado_telefono"
                    required={esMenor}
                    className="w-full border border-orange-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Correo Electrónico del Apoderado *
                  </label>
                  <input
                    type="email"
                    name="apoderado_email"
                    required={esMenor}
                    className="w-full border border-orange-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN 3: IDENTIFICACIÓN DEL BIEN CONTRATADO */}
      <section className="space-y-4">
        <div className="border-b border-gray-200 pb-2">
          <h2 className="text-lg font-extrabold text-aerogas-blue">
            3. Identificación del Bien Contratado
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <span className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Bien *
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="tipo_bien"
                  value="PRODUCTO"
                  checked={tipoBien === "PRODUCTO"}
                  onChange={() => setTipoBien("PRODUCTO")}
                  className="text-aerogas-blue focus:ring-aerogas-blue"
                />
                Producto
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="tipo_bien"
                  value="SERVICIO"
                  checked={tipoBien === "SERVICIO"}
                  onChange={() => setTipoBien("SERVICIO")}
                  className="text-aerogas-blue focus:ring-aerogas-blue"
                />
                Servicio
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Monto Reclamado (S/)
            </label>
            <input
              type="number"
              name="monto_reclamado"
              step="0.01"
              min="0"
              defaultValue="0.00"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              N° Boleta / Factura (Opcional)
            </label>
            <input
              type="text"
              name="comprobante_pago"
              placeholder="Ej: B001-00012345"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Descripción del Producto o Servicio *
          </label>
          <textarea
            name="descripcion_bien"
            rows={2}
            required
            placeholder="Ej: Abastecimiento de Gasohol Premium / Compra en AeroMarket / Servicio de lavado..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
          />
        </div>
      </section>

      {/* SECCIÓN 4: DETALLE DE LA RECLAMACIÓN Y PEDIDO */}
      <section className="space-y-4">
        <div className="border-b border-gray-200 pb-2">
          <h2 className="text-lg font-extrabold text-aerogas-blue">
            4. Detalle de la Reclamación y Pedido del Consumidor
          </h2>
        </div>

        {/* DEFINICIONES OFICIALES DE RECLAMO VS QUEJA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
              tipoRegistro === "RECLAMO"
                ? "border-aerogas-blue bg-blue-50/70 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <input
                type="radio"
                name="tipo_registro"
                value="RECLAMO"
                checked={tipoRegistro === "RECLAMO"}
                onChange={() => setTipoRegistro("RECLAMO")}
                className="w-4 h-4 text-aerogas-blue"
              />
              <span className="font-extrabold text-aerogas-blue text-sm uppercase">
                Reclamo
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed pl-6">
              Disconformidad relacionada a los productos o servicios contratados (ej. combustible, productos de AeroMarket, facturación).
            </p>
          </label>

          <label
            className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
              tipoRegistro === "QUEJA"
                ? "border-aerogas-blue bg-blue-50/70 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <input
                type="radio"
                name="tipo_registro"
                value="QUEJA"
                checked={tipoRegistro === "QUEJA"}
                onChange={() => setTipoRegistro("QUEJA")}
                className="w-4 h-4 text-aerogas-blue"
              />
              <span className="font-extrabold text-aerogas-blue text-sm uppercase">
                Queja
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed pl-6">
              Disconformidad no relacionada a los productos o servicios; o malestar o descontento respecto a la atención al público.
            </p>
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Detalle de los Hechos *
          </label>
          <textarea
            name="detalle"
            rows={4}
            required
            placeholder="Describa de forma clara lo sucedido, indicando fecha aproximada, isla/surtidor o área involucrada..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Pedido Concreto del Consumidor *
          </label>
          <textarea
            name="pedido_consumidor"
            rows={3}
            required
            placeholder="Indique qué solución o acción solicita por parte de la empresa..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-aerogas-blue outline-none"
          />
        </div>
      </section>

      {/* AVISOS LEGALES OBLIGATORIOS INDECOPI */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3 text-xs text-gray-600 leading-relaxed">
        <p>
          <strong>Nota Legal 1:</strong> La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el <strong>INDECOPI</strong>.
        </p>
        <p>
          <strong>Nota Legal 2:</strong> El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a <strong>quince (15) días hábiles improrrogables</strong> (Ley N° 31435 y D.S. N° 101-2022-PCM).
        </p>

        <div className="pt-2 border-t border-gray-200">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="acepta_terminos"
              required
              className="w-4 h-4 mt-0.5 text-aerogas-red border-gray-300 rounded focus:ring-aerogas-red cursor-pointer shrink-0"
            />
            <span className="text-xs text-gray-700 font-medium">
              Declaro ser el titular del reclamo o queja (o su apoderado legal), confirmo que los datos consignados son verídicos y autorizo el tratamiento de mis datos personales por parte de <strong>Aerogas del Norte S.A.C.</strong> exclusivamente para la atención y respuesta del presente registro, conforme a la Ley N° 29733 (Ley de Protección de Datos Personales). *
            </span>
          </label>
        </div>
      </div>

      {/* BOTÓN DE ENVÍO */}
      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-aerogas-red hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl text-base shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {enviando ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Registrando Hoja de Reclamación...
          </>
        ) : (
          "Registrar Hoja de Reclamación"
        )}
      </button>
    </form>
  );
}