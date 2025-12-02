/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep experimental empty for now to avoid Next 15 warnings
  experimental: {},

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
