import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },

  // ESLint and type-checking are enforced by Biome + tsc in pre-commit hooks
  // (lefthook). Disabling the redundant next build pass keeps Docker builds fast
  // and avoids false-positive failures from stricter @typescript-eslint rules.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
