import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: ".next",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      "https://zordrax-onboarding-agent-zordrax-analytica-dev.azurewebsites.net",
  },
};

export default nextConfig;
