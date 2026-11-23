"use client";

import { useEffect, useState } from "react";

export default function CamposAntiBot() {
  const [loadedAt, setLoadedAt] = useState<string>("");

  useEffect(() => {
    setLoadedAt(String(Date.now()));
  }, []);

  return (
    <>
      {/* Timestamp de carga del formulario */}
      <input type="hidden" name="form_loaded_at" value={loadedAt} readOnly />

      {/* Campo Honeypot invisible para usuarios humanos */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden opacity-0 pointer-events-none"
      >
        <label htmlFor="sitio_web_empresa">Sitio web de la empresa</label>
        <input
          id="sitio_web_empresa"
          type="text"
          name="sitio_web_empresa"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
    </>
  );
}