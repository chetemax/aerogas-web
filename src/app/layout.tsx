import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://aerogas.com.pe"
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aerogas del Norte | Red de Estaciones de Servicio y Soluciones B2B",
    template: "%s | Aerogas del Norte",
  },
  description:
    "Red de más de 20 estaciones de servicio en el norte del Perú. Abastecimiento continuo de GLP, GNV, Diésel y Gasolinas, tiendas AeroMarket 24/7 y abastecimiento mayorista para flotas corporativas.",
  keywords: [
    "Aerogas del Norte",
    "estaciones de servicio Chiclayo",
    "grifos Lambayeque",
    "GLP",
    "GNV",
    "Diésel",
    "abastecimiento de combustible B2B",
    "flotas corporativas norte Perú",
    "AeroMarket",
  ],
  authors: [{ name: "Aerogas del Norte S.A.C." }],
  creator: "Aerogas del Norte S.A.C.",
  publisher: "Aerogas del Norte S.A.C.",
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: siteUrl,
    siteName: "Aerogas del Norte",
    title: "Aerogas del Norte | Red de Estaciones de Servicio y Soluciones B2B",
    description:
      "Encuentra nuestra estación más cercana en el norte del Perú. Combustible con galonaje exacto, tiendas AeroMarket y soluciones para flotas corporativas.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Aerogas del Norte - Red de Estaciones de Servicio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aerogas del Norte | Red de Estaciones de Servicio",
    description:
      "Más de 20 estaciones impulsando el transporte y la industria en el norte del Perú.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Datos estructurados corporativos para Google (JSON-LD)
  const jsonLdOrganizacion = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aerogas del Norte S.A.C.",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    taxID: "20458378747",
    email: "ventas@aerogas.com.pe",
    telephone: "+51-908-856-499",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Chiclayo",
      addressRegion: "Lambayeque",
      addressCountry: "PE",
    },
  };

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="bg-white text-gray-800 min-h-full flex flex-col"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdOrganizacion).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}