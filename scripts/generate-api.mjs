import { execSync } from "node:child_process";

const base = process.env.NEXT_PUBLIC_AGENT_BASE_URL || "http://localhost:8010";
const url = `${base.replace(/\/$/, "")}/openapi.json`;
execSync(`npx openapi-typescript ${url} --output src/generated/api.ts`, { stdio: "inherit" });