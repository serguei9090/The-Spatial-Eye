import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // ESLint and type-checking are enforced by Biome + tsc in pre-commit hooks
  // (lefthook). Disabling the redundant next build pass keeps Docker builds fast
  // and avoids false-positive failures from stricter @typescript-eslint rules.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  async rewrites() {
    return [
      {
        source: "/ws/:path*",
        destination: "http://127.0.0.1:8000/ws/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/diagnostics/:path*",
        destination: "http://127.0.0.1:8000/diagnostics/:path*",
      },
    ];
  },
};

export default nextConfig;
