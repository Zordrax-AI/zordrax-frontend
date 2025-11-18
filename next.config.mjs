/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output so Azure can run `node server.js`
  output: "standalone",
};

export default nextConfig;
