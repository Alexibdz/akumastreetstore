import type { Metadata } from "next";
import { Archivo, Dela_Gothic_One, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Dela Gothic One trae los glifos japoneses del kanji 悪魔: next/font los descarga todos
// y el navegador baja solo los tramos que usa la página.
const dela = Dela_Gothic_One({ weight: "400", subsets: ["latin"], variable: "--font-dela" });
// Archivo y JetBrains Mono son variables: un solo archivo cubre todos los pesos (400 a 900)
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "Akuma Street · Tienda anime", template: "%s · Akuma Street" },
  description: "Merch anime sin filtro: mangas, figuras, ropa, Hot Wheels, posters y accesorios.",
  openGraph: { siteName: "Akuma Street", locale: "es_AR", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${dela.variable} ${archivo.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
