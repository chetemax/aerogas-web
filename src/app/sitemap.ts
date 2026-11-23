import type { MetadataRoute } from "next";
import { pool } from "../lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://aerogas.com.pe"
  ).replace(/\/$/, "");

  const ahora = new Date();

  const rutasEstaticas: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/aeromarket`,
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/unete-al-equipo`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/libro-de-reclamaciones`,
      lastModified: ahora,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/politica-de-privacidad`,
      lastModified: ahora,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  let rutasEstaciones: MetadataRoute.Sitemap = [];

  try {
    const [rows] = await pool.query(
      "SELECT id FROM estaciones WHERE activo = 1 ORDER BY id ASC"
    );
    rutasEstaciones = (rows as any[]).map((est) => ({
      url: `${baseUrl}/estacion/${est.id}`,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.85,
    }));
  } catch (error) {
    console.error("Error generando rutas de estaciones en sitemap:", error);
  }

  return [...rutasEstaticas, ...rutasEstaciones];
}