import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { BRAND } from "./lib/tournament";
import { THEME_COLORS, themeInitScript } from "./lib/theme";
import { RegisterSW } from "./components/RegisterSW";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-derio", display: "swap" });
const description = "Torneos de fútbol base · CD Derio";

export const metadata: Metadata = {
  metadataBase: new URL("https://derio-cup.vercel.app"),
  title: BRAND,
  description,
  applicationName: BRAND,
  openGraph: { title: BRAND, description, url: "/", siteName: BRAND, images: [{ url: "/icon-512.png", width: 512, height: 512, alt: BRAND }], type: "website" },
  twitter: { card: "summary", title: BRAND, description, images: ["/icon-512.png"] },
  appleWebApp: { capable: true, title: BRAND, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false, email: false, address: false },
  other: { "mobile-web-app-capable": "yes" },
  icons: { icon: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }, { url: "/icon-512.png", type: "image/png", sizes: "512x512" }], shortcut: "/icon-192.png", apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  manifest: "/manifest.webmanifest",
};

// Sin maximumScale/userScalable: el usuario puede ampliar el texto (accesibilidad).
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: THEME_COLORS.light }, { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark }],
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head><link rel="preload" href="/logo-derio-cup.webp" as="image" type="image/webp" /><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className={montserrat.variable}><div id="scroller" className="scroller">{children}</div><RegisterSW /></body>
    </html>
  );
}
