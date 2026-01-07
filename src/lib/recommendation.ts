export type RecommendationSnapshot = {
  id: string;
  created_at: string;

  ai: {
    cloud: string;
    warehouse: string;
    etl: string;
    bi: string;
    governance: string;
  };

  final: {
    cloud: string;
    warehouse: string;
    etl: string;
    bi: string;
    governance: string;
  };
};
