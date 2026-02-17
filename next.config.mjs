const isWin = process.platform === "win32";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isWin ? {} : { output: "standalone" }),
};

export default nextConfig;
