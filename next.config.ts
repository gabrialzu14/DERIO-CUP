import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Escudos: originales de 1024 px; se sirven al tamaño justo para cada pantalla, en WebP calidad 100.
  images: { qualities: [100], formats: ["image/webp"], imageSizes: [48, 64, 96, 128, 192, 256, 384] },
};

export default nextConfig;
