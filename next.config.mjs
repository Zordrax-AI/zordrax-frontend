/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // You’re already using the app/ directory, keep this enabled
    appDir: true,
  },
  // 🔥 IMPORTANT: make Next.js emit .next/standalone for the pipeline
  output: "standalone",
};

export default nextConfig;
