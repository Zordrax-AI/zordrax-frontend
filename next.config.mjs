/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is disabled due to tracing issues with App Router paths containing parentheses.
  // Enable selectively once the tracing bug is resolved.
};

export default nextConfig;
