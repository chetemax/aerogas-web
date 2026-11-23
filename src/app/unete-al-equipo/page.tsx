import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BotonWhatsApp from "../../components/BotonWhatsApp";
import CamposAntiBot from "../../components/CamposAntiBot";
import { pool } from "../../lib/db";
import { verificarAntiBot, validarArchivoSubido } from "../../lib/antibot";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UneteAlEquipo(props: {
  searchParams: Promise<{ exito?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const exito = searchParams?.exito === "true";
  const errorMsg = searchParams?.error || "";

  async function enviarPostulacion(formData: FormData) {
    "use server";

    // 1. Capa Anti-Bots (antes de guardar archivos o escribir en MySQL)
    const checkBot = await verificarAntiBot(formData, {
      accion: "postulacion_empleo",
      maxIntentos: 3,
      ventanaMinutos: 15,
      tiempoMinimoMs: 2500,
    });

    if (!checkBot.ok) {
      if (checkBot.motivo === "honeypot") {
        redirect("/unete-al-equipo?exito=true");
      }
      redirect(
        `/unete-al-equipo?error=${encodeURIComponent(
          checkBot.error || "No se pudo validar tu postulación."
        )}#formulario`
      );
    }

    // 2. Validar campos obligatorios
    const nombre = String(formData.get("nombre") || "").trim();
    const telefono = String(formData.get("telefono") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const puesto = String(formData.get("puesto") || "").trim();
    const archivoCV = formData.get("cv") as File | null;

    if (!nombre || !telefono || !email || !puesto) {
      redirect(
        `/unete-al-equipo?error=${encodeURIComponent(
          "Por favor, completa todos los campos obligatorios."
        )}#formulario`
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      redirect(
        `/unete-al-equipo?error=${encodeURIComponent(
          "Por favor, ingresa un correo electrónico válido."
        )}#formulario`
      );
    }

    // 3. Validar peso (máx. 5 MB) y formato real del CV (PDF o Word)
    const validacionCV = await validarArchivoSubido(archivoCV, {
      maxMB: 5,
      tiposPermitidos: ["pdf", "word"],
      obligatorio: true,
    });

    if (!validacionCV.ok || !validacionCV.buffer || !validacionCV.nombreSeguro) {
      redirect(
        `/unete-al-equipo?error=${encodeURIComponent(
          validacionCV.error || "El archivo de currículum no es válido."
        )}#formulario`
      );
    }

    // 4. Guardar archivo validado en disco
    const filename = `${Date.now()}-CV-${validacionCV.nombreSeguro}`;
    const uploadDir = path.join(process.cwd(), "public/uploads/cvs");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    await writeFile(path.join(uploadDir, filename), validacionCV.buffer);
    const cvUrl = `/uploads/cvs/${filename}`;

    // 5. Insertar en la base de datos
    await pool.query(
      `INSERT INTO postulantes (nombre, telefono, email, puesto, cv_url) VALUES (?, ?, ?, ?, ?)`,
      [nombre, telefono, email, puesto, cvUrl]
    );

    redirect("/unete-al-equipo?exito=true");
  }

  return (
    <main className="flex min-h-screen flex-col items-center w-full bg-gray-50">
      <Navbar />

      {/* Cabecera Principal */}
      <section className="w-full bg-aerogas-blue text-white py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/bg-estacion.jpg')] opacity-20 bg-cover bg-center"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Trabaja con Nosotros
          </h1>
          <p className="text-xl md:text-2xl font-light text-blue-100">
            En Aerogas del Norte buscamos talento con mucha energía y pasión por lo que hacen.
          </p>
          <p className="mt-4 text-lg font-bold text-aerogas-red bg-white inline-block px-6 py-2 rounded-full shadow-lg">
            ¡Tú puedes ser un nuevo miembro de nuestro equipo!
          </p>
        </div>
      </section>

      {/* Sección de Cultura y Beneficios */}
      <section className="w-full max-w-5xl mx-auto py-16 px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-aerogas-blue mb-6">
            Potenciamos tu talento
          </h2>
          <ul className="space-y-4 text-gray-700 text-lg">
            <li className="flex items-start gap-3">
              <span className="text-aerogas-red text-xl">»</span>
              Llenos de energía y pasión en todo lo que hacen.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-aerogas-red text-xl">»</span>
              Que vivan nuestra cultura y trabajen como un solo equipo.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-aerogas-red text-xl">»</span>
              Que estén motivados a dar siempre más y actúen con estándares de excelencia.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-aerogas-red text-xl">»</span>
              Que se apasionen con brindar experiencias extraordinarias a nuestros clientes.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-aerogas-red text-xl">»</span>
              Que compartan nuestro compromiso de generar un impacto positivo.
            </li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center flex flex-col justify-center items-center h-full">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            ¿Quieres conocer todos los beneficios que tenemos para ti?
          </h3>
          <p className="text-gray-500 mb-8">
            Postula ahora y da el primer paso hacia tu crecimiento profesional en la red de estaciones líder del Norte.
          </p>
          <a
            href="#formulario"
            className="bg-aerogas-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:-translate-y-1"
          >
            Postular Aquí
          </a>
        </div>
      </section>

      {/* Formulario de Postulación */}
      <section id="formulario" className="w-full bg-white py-20 px-4 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          {exito ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-8 rounded-r-lg shadow-sm text-center animate-fade-in">
              <span className="text-5xl mb-4 block">🎉</span>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                ¡Postulación Enviada con Éxito!
              </h2>
              <p className="text-green-700 mb-6">
                Hemos recibido tu currículum correctamente. Nuestro equipo de Recursos Humanos lo revisará y se pondrá en contacto contigo si tu perfil se ajusta a nuestras vacantes.
              </p>
              <Link
                href="/"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-aerogas-blue mb-3">
                  Envíanos tu CV
                </h2>
                <p className="text-gray-500">
                  Completa tus datos y adjunta tu currículum actualizado en formato PDF o Word.
                </p>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="mb-6 bg-red-50 border-l-4 border-aerogas-red text-red-800 p-4 rounded-r-lg text-sm font-semibold"
                >
                  {errorMsg}
                </div>
              )}

              <form action={enviarPostulacion} className="space-y-6 relative">
                {/* CAMPOS ANTI-BOT INVISIBLES */}
                <CamposAntiBot />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      required
                      placeholder="Ej: Juan Pérez"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-blue outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Teléfono / Celular *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      required
                      placeholder="Ej: 987654321"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-blue outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Ej: juan@correo.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-blue outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Puesto de Interés *
                    </label>
                    <select
                      name="puesto"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-aerogas-blue outline-none transition-all bg-white"
                    >
                      <option value="Cajero(a) / Atención al Cliente">
                        Cajero(a) / Atención al Cliente
                      </option>
                      <option value="Despachador(a) de Combustible">
                        Despachador(a) de Combustible
                      </option>
                      <option value="Administración / Contabilidad">
                        Administración / Contabilidad
                      </option>
                      <option value="Conductor de Flota (Cisterna)">
                        Conductor de Flota (Cisterna)
                      </option>
                      <option value="Mantenimiento / Operaciones">
                        Mantenimiento / Operaciones
                      </option>
                      <option value="Otro">Otro puesto</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Adjuntar Currículum (PDF o Word) *
                  </label>
                  <input
                    type="file"
                    name="cv"
                    required
                    accept=".pdf,.doc,.docx"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-aerogas-blue file:text-white hover:file:bg-blue-900 cursor-pointer transition-all text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Formatos permitidos: PDF, DOC o DOCX. Tamaño máximo: 5 MB.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-aerogas-blue hover:bg-blue-900 text-white font-bold py-4 px-4 rounded-lg transition-transform transform hover:-translate-y-1 shadow-xl text-lg mt-4 cursor-pointer"
                >
                  Enviar Postulación
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      <BotonWhatsApp />
      <Footer />
    </main>
  );
}