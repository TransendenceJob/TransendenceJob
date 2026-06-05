export type StatsUser = {
  matches?: number;
  winRate?: string;
  kdRatio?: number;
  kills?: number;
  deaths?: number;
  [k: string]: unknown;
};