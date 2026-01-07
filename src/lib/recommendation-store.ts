import { RecommendationSnapshot } from "./recommendation";

const KEY = "zordrax:last-recommendation";

export function saveRecommendationSnapshot(snapshot: RecommendationSnapshot) {
  localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export function loadRecommendationSnapshot(): RecommendationSnapshot | null {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}
