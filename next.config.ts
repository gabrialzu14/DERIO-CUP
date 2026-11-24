import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Escudos: originales de 1024 px; se sirven al tamaño justo para cada pantalla, en WebP calidad 100.
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/manifest.webmanifest", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
      { source: "/(escudos|patrocinadores)/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
    ];
  },
  images: { qualities: [100], formats: ["image/webp"], imageSizes: [48, 64, 96, 128, 192, 256, 384] },
};

export default nextConfig;
