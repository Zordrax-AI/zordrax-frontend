export type WizardStep =
  | "connect-data"
  | "tables"
  | "data-checks"
  | "metrics-intent"
  | "recommendations"
  | "deploy"
  | "run";

export function getRequirementSetId(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): string | null {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get("requirement_set_id");
  }
  const v = searchParams["requirement_set_id"];
  if (Array.isArray(v)) return v[0] || null;
  return v || null;
}

export function wizardHref(step: WizardStep, requirementSetId?: string | null) {
  const base = `/portal/onboarding/mozart/${step}`;
  if (!requirementSetId) return base;
  const qs = new URLSearchParams({ requirement_set_id: requirementSetId });
  return `${base}?${qs.toString()}`;
}
