import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://aerogas.com.pe"
  ).replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/libro-de-reclamaciones/constancia/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}