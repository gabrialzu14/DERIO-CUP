import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Escudos: originales de 1024 px; se sirven reducidos y en WebP.
  images: { qualities: [90], formats: ["image/webp"] },
};

export default nextConfig;
