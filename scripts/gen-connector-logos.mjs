import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "public", "connectors");
fs.mkdirSync(OUT_DIR, { recursive: true });

/**
 * Slugs MUST match catalog.ts logoSlug values.
 * Add/remove freely — rerun script to regenerate.
 */
const connectors = [
  { slug: "google-sheets", label: "GS" },
  { slug: "google-analytics-4", label: "GA" },
  { slug: "hubspot", label: "HS" },
  { slug: "stripe", label: "ST" },
  { slug: "salesforce", label: "SF" },
  { slug: "shopify", label: "SH" },

  { slug: "postgres", label: "PG" },
  { slug: "mysql", label: "MY" },
  { slug: "mssql", label: "MS" },
  { slug: "azure-sql", label: "AZ" },
  { slug: "oracle", label: "OR" },
  { slug: "snowflake", label: "SN" },
  { slug: "bigquery", label: "BQ" },
  { slug: "redshift", label: "RS" },
  { slug: "databricks", label: "DB" },

  { slug: "s3", label: "S3" },
  { slug: "gcs", label: "GC" },
  { slug: "azure-blob", label: "AB" },

  { slug: "airbyte", label: "AB" },
  { slug: "fivetran", label: "FT" },
  { slug: "stitch", label: "ST" },

  { slug: "slack", label: "SL" },
  { slug: "zendesk", label: "ZD" },
  { slug: "jira", label: "JR" },
  { slug: "github", label: "GH" },

  { slug: "mailchimp", label: "MC" },
  { slug: "google-ads", label: "AD" },
  { slug: "facebook-ads", label: "FA" },

  { slug: "mixpanel", label: "MX" },
  { slug: "segment", label: "SG" },
  { slug: "amplitude", label: "AM" },
  { slug: "intercom", label: "IC" },
  { slug: "quickbooks", label: "QB" },
  { slug: "xero", label: "XR" },
];

function hashToHue(str) {
  // deterministic 0..359 hue from string
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function svgFor(slug, label) {
  const hue = hashToHue(slug);
  const bg1 = `hsl(${hue} 85% 55%)`;
  const bg2 = `hsl(${(hue + 28) % 360} 85% 45%)`;
  const ring = `hsl(${hue} 70% 40% / 0.18)`;

  // Square icon, rounded, subtle shadow & gradient. Looks good on white UI.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="16" y1="12" x2="80" y2="84" gradientUnits="userSpaceOnUse">
      <stop stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.10"/>
    </filter>
  </defs>

  <rect x="10" y="10" width="76" height="76" rx="18" fill="url(#g)" filter="url(#shadow)"/>
  <rect x="10" y="10" width="76" height="76" rx="18" fill="none" stroke="${ring}" stroke-width="2"/>

  <text x="48" y="55"
    text-anchor="middle"
    font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
    font-size="${label.length >= 3 ? 22 : 26}"
    font-weight="800"
    letter-spacing="0.5"
    fill="white">${label}</text>
</svg>`;
}

let written = 0;
for (const c of connectors) {
  const file = path.join(OUT_DIR, `${c.slug}.svg`);
  fs.writeFileSync(file, svgFor(c.slug, c.label), "utf8");
  written++;
}
console.log(`✅ Generated ${written} connector logos in ${OUT_DIR}`);
