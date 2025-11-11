import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: ".next",
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    turbo: {
      resolveAlias: {
        "@/*": "./src/*",
      },
    },
  },
};

export default nextConfig;
