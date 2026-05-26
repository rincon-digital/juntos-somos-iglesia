import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://jsioficial.com"),

  title: {
    default: "Juntos Somos Iglesia | Pr. Ageu Da Rosa",
    template: "%s | Juntos Somos Iglesia",
  },
  description:
    "Comunidad cristiana bajo la guía del Pastor Ageu Da Rosa. Un espacio moderno de fe, unión y transformación.",
  keywords: [
    "Iglesia",
    "Ageu Da Rosa",
    "Juntos Somos Iglesia",
    "Comunidad Cristiana",
    "Fe",
    "Next.js Iglesia",
  ],
  authors: [{ name: "Ageu Da Rosa" }],
  creator: "Creative Studio",
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://www.juntossomosiglesia.com",
    title: "Juntos Somos Iglesia",
    description: "Una experiencia de fe moderna y minimalista.",
    siteName: "Juntos Somos Iglesia",
    images: [
      {
        url: "/og-image.webp", // Ruta relativa que Next.js ahora resolverá con metadataBase
        width: 1200,
        height: 630,
        alt: "Juntos Somos Iglesia Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Juntos Somos Iglesia",
    description: "Comunidad guiada por el Pastor Ageu Da Rosa.",
    images: ["/og-image.webp"],
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
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-[#f5f5f5] selection:bg-white selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
