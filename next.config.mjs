/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep experimental empty to avoid invalid flags in Next.js 15
  experimental: {},

  // Required for Azure Web App deployment
  output: "standalone",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
