import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La base demo se abre con una ruta armada en tiempo de ejecución: hay que incluirla a mano en el servidor.
  outputFileTracingIncludes: {
    "/*": ["./demo/akuma.db"],
  },
};

export default nextConfig;
