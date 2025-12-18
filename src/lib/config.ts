export function getBackendBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_AGENT_BASE_URL;
  return env ?? "";
}
