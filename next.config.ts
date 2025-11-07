import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: (process.env.NEXT_OUTPUT as "export" | "standalone" | undefined) ?? "export",
};

export default nextConfig;
