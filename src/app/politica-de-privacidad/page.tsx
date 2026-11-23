import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BotonWhatsApp from "../../components/BotonWhatsApp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de Privacidad y tratamiento de datos personales de Aerogas del Norte S.A.C. conforme a la Ley N° 29733.",
};

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-100 w-full overflow-x-hidden">
      <Navbar />

      <div className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* CABECERA */}
          <div className="bg-aerogas-blue text-white rounded-t-2xl p-6 sm:p-8 border-b-4 border-aerogas-red shadow-md">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Ley N° 29733 — Protección de Datos Personales
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Política de Privacidad y Tratamiento de Datos Personales
            </h1>
            <p className="text-sm text-blue-100 mt-3 leading-relaxed">
              Última actualización: Noviembre 2026 — AEROGAS DEL NORTE S.A.C. (RUC: 20458378747)
            </p>
          </div>

          {/* CONTENIDO LEGAL */}
          <article className="bg-white rounded-b-2xl shadow-xl border border-t-0 border-gray-200 p-6 sm:p-10 space-y-8 text-sm text-gray-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-aerogas-blue border-b border-gray-200 pb-2">
                1. Identidad y Domicilio del Titular del Banco de Datos
              </h2>
              <p>
                <strong>AEROGAS DEL NORTE S.A.C.</strong>, identificada con{" "}
                <strong>RUC N° 20458378747</strong> y domicilio administrativo en la ciudad de{" "}
                <strong>Chiclayo, departamento de Lambayeque, Perú</strong> (en adelante,{" "}
                <strong>“AEROGAS”</strong>), garantiza la seguridad, reserva y confidencialidad de los datos personales proporcionados por sus clientes, usuarios, socios comerciales y postulantes a través de su sitio web oficial y sus canales digitales, en estricto cumplimiento de la{" "}
                <strong>Ley N° 29733</strong> (Ley de Protección de Datos Personales) y su Reglamento vigente.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-aerogas-blue border-b border-gray-200 pb-2">
                2. Datos Personales Recopilados y Finalidad del Tratamiento
              </h2>
              <p>
                Los datos personales ingresados voluntariamente en nuestros formularios web son tratados única y exclusivamente para las siguientes finalidades legítimas:
              </p>

              <div className="space-y-3 pl-1">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="font-bold text-aerogas-blue mb-1">
                    a) Libro de Reclamaciones Virtual
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Recopilamos nombres y apellidos, documento de identidad (DNI, CE, Pasaporte o RUC), domicilio, teléfono, correo electrónico, datos del apoderado (en caso de menores de edad) y detalle del hecho. La finalidad es registrar, tramitar, responder dentro del plazo legal de quince (15) días hábiles improrrogables y conservar el sustento conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) y el D.S. N° 011-2011-PCM.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="font-bold text-aerogas-blue mb-1">
                    b) Solicitudes de Cotización B2B y Flotas Corporativas
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Recopilamos razón social, RUC, nombre de la persona de contacto, teléfono, correo electrónico y requerimientos operativos. La finalidad es evaluar solicitudes comerciales, remitir propuestas de abastecimiento mayorista o crédito corporativo y coordinar la atención comercial solicitada.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="font-bold text-aerogas-blue mb-1">
                    c) Postulaciones Laborales (“Únete al Equipo”)
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Recopilamos nombre completo, teléfono, correo electrónico, puesto de interés y el currículum vitae adjunto (PDF o Word). La finalidad exclusiva es evaluar el perfil del candidato dentro de los procesos de reclutamiento y selección de personal de AEROGAS y sus tiendas de conveniencia AeroMarket.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-aerogas-blue border-b border-gray-200 pb-2">
                3. Carácter Obligatorio y Veracidad de la Información
              </h2>
              <p>
                Los campos marcados con asterisco (*) en cada formulario son indispensables para atender la solicitud, emitir la constancia legal o evaluar la postulación. El titular de los datos declara que la información proporcionada es veraz, completa y actualizada. La negativa a brindar los datos obligatorios impedirá procesar el requerimiento correspondiente.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-aerogas-blue border-b border-gray-200 pb-2">
                4. Plazo de Conservación
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>
                  <strong>Libro de Reclamaciones:</strong> Se conservan por un plazo mínimo obligatorio de <strong>dos (2) años</strong> desde la fecha de registro, en cumplimiento de la normativa de INDECOPI, y durante el tiempo adicional requerido por disposiciones legales o administrativas.
                </li>
                <li>
                  <strong>Cotizaciones B2B:</strong> Se conservan durante la vigencia de la evaluación comercial o relación contractual y hasta que el titular solicite su cancelación.
                </li>
                <li>
                  <strong>Postulaciones Laborales:</strong> Los currículums se mantienen por un periodo máximo de doce (12) meses para futuras vacantes acordes al perfil, salvo solicitud previa de eliminación.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-aerogas-blue border-b border-gray-200 pb-2">
                5. Transferencia y Confidencialidad de los Datos
              </h2>
              <p>
                AEROGAS <strong>no vende, alquila ni cede</strong> sus datos personales a terceros con fines publicitarios. La información únicamente podrá ser compartida con:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>
                  Autoridades administrativas o judiciales competentes (como INDECOPI, OSINERGMIN o SUNAT) cuando exista mandato legal expreso.
                </li>
                <li>
                  Proveedores estrictamente necesarios para la operatividad técnica del portal (alojamiento web y servidor de correo corporativo para el envío de constancias), quienes operan bajo deber de confidencialidad.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-aerogas-blue border-b border-gray-200 pb-2">
                6. Medidas de Seguridad y Uso de Cookies
              </h2>
              <p>
                Adoptamos medidas técnicas, organizativas y legales razonables para proteger los datos contra pérdida, acceso no autorizado, alteración o uso indebido, incluyendo controles de acceso administrativo, validación de archivos y protección contra envíos automatizados.
              </p>
              <p>
                Nuestro sitio web emplea únicamente cookies técnicas esenciales para el funcionamiento seguro de sus sesiones y navegación. No utilizamos cookies invasivas de rastreo publicitario de terceros.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-aerogas-blue border-b border-gray-200 pb-2">
                7. Ejercicio de Derechos ARCO
              </h2>
              <p>
                Como titular de sus datos personales, usted puede ejercer en cualquier momento sus derechos de{" "}
                <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong>, así como revocar su consentimiento, mediante una solicitud dirigida a:
              </p>
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
                <p>
                  <strong className="text-aerogas-blue">Correo electrónico:</strong>{" "}
                  <a
                    href="mailto:ventas@aerogas.com.pe?subject=Solicitud%20Derechos%20ARCO%20-%20Ley%2029733"
                    className="text-aerogas-red font-bold hover:underline"
                  >
                    ventas@aerogas.com.pe
                  </a>{" "}
                  (indicando en el asunto: <em>“Derechos ARCO - Ley 29733”</em>)
                </p>
                <p>
                  <strong className="text-aerogas-blue">Atención presencial:</strong>{" "}
                  Oficina Central de Aerogas del Norte S.A.C., Chiclayo, Lambayeque (Lunes a Viernes de 8:00 a. m. a 6:00 p. m.).
                </p>
                <p className="text-xs text-gray-600 pt-1">
                  La solicitud deberá incluir nombres y apellidos completos, copia o número de documento de identidad, detalle preciso del derecho que desea ejercer y un correo electrónico de respuesta.
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-aerogas-blue border-b border-gray-200 pb-2">
                8. Modificaciones a la Política de Privacidad
              </h2>
              <p>
                AEROGAS se reserva el derecho de actualizar la presente Política de Privacidad para adaptarla a cambios normativos o mejoras operativas del sitio web. Cualquier actualización entrará en vigencia desde su publicación en esta misma sección.
              </p>
            </section>

            <div className="pt-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-aerogas-blue hover:bg-blue-900 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Volver al Inicio
              </Link>
              <Link
                href="/libro-de-reclamaciones"
                className="text-sm font-bold text-aerogas-red hover:underline"
              >
                Ir al Libro de Reclamaciones Virtual →
              </Link>
            </div>
          </article>
        </div>
      </div>

      <BotonWhatsApp />
      <Footer />
    </main>
  );
}