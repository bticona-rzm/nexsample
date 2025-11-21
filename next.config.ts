import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Ignorar errores de tipos y linter durante el build
  typescript: {
    ignoreBuildErrors: true, // ⛔ Evita que el build se detenga por errores TS
  },
  eslint: {
    ignoreDuringBuilds: true, // ⛔ Ignora ESLint durante el build
  },

  webpack(config, { dev }) {
    // ⚙️ Evita que Next.js reinicie cuando cambian archivos grandes en /datasets
    if (dev) {
      config.watchOptions = {
        ignored: [
          "**/node_modules/**",
          "**/datasets/**", // ⬅️ Ignora todo dentro de D:/datasets
        ],
      };
    }

    // 🧩 Alias personalizados (mantén tus rutas absolutas con "@")
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
