import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { EVENT } from "./lib/tournament";
import { THEME_COLORS, themeInitScript } from "./lib/theme";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-derio", display: "swap" });
const description = `${EVENT.category} • ${EVENT.dateLabel}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://derio-cup.vercel.app"),
  title: EVENT.name,
  description,
  applicationName: EVENT.name,
  openGraph: { title: EVENT.name, description, url: "/", siteName: EVENT.name, images: [{ url: "/icon-512.png", width: 512, height: 512, alt: EVENT.name }], type: "website" },
  twitter: { card: "summary", title: EVENT.name, description, images: ["/icon-512.png"] },
  appleWebApp: { capable: true, title: EVENT.name, statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }, { url: "/icon-512.png", type: "image/png", sizes: "512x512" }], shortcut: "/icon-192.png", apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  manifest: "/manifest.webmanifest",
};

// Sin maximumScale/userScalable: el usuario puede ampliar el texto (accesibilidad).
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: THEME_COLORS.light }, { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className={montserrat.variable}>{children}</body>
    </html>
  );
}
