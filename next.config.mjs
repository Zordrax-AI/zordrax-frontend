import fs from "fs";
import path from "path";

// Next.js sometimes skips emitting the client-reference manifest file for route
// groups that use parentheses, which causes a late lstat/ENOENT during the
// tracing/copy step on both Vercel and Windows. This plugin eagerly creates an
// empty file so the trace step always succeeds. Safe because the file is a
// build artefact, not loaded at runtime.
const ensurePortalManifestPlugin = {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("EnsurePortalManifest", () => {
      const outDir = compiler.options?.output?.path;
      if (!outDir) return;
      const manifestDir = path.join(outDir, "app", "(portal)");
      const manifestPath = path.join(manifestDir, "page_client-reference-manifest.js");
      try {
        fs.mkdirSync(manifestDir, { recursive: true });
        if (!fs.existsSync(manifestPath)) {
          fs.writeFileSync(manifestPath, "module.exports = {};\n", "utf8");
        }
      } catch {
        // If the filesystem is read-only or any other issue occurs, fall back silently;
        // worst case we see the original ENOENT, but typical builds proceed.
      }
    });
  },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output remains disabled due to tracing issues with App Router paths containing parentheses.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(ensurePortalManifestPlugin);
    }
    return config;
  },
};

export default nextConfig;
