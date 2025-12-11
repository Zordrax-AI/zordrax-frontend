export function getBackendBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;
  return env ?? "";
}
