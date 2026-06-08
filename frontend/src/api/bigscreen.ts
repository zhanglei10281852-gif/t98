import request from "@/utils/request";

export interface BigScreenCoreMetrics {
  todayMeals: number;
  todayCompletedMeals: number;
  totalElderly: number;
  totalCanteens: number;
  monthSubsidyTotal: number;
}

export interface CanteenRealtimeItem {
  canteenId: string;
  canteenName: string;
  count: number;
  capacity: number;
}

export interface DailyTrendItem {
  date: string;
  count: number;
  subsidy: number;
}

export interface ElderlyCategoryItem {
  category: string;
  name: string;
  value: number;
}

export interface MealTypeStats {
  lunch: number;
  dinner: number;
}

export interface BigScreenData {
  coreMetrics: BigScreenCoreMetrics;
  canteenRealtime: CanteenRealtimeItem[];
  dailyTrend: DailyTrendItem[];
  elderlyCategoryStats: ElderlyCategoryItem[];
  mealTypeStats: MealTypeStats;
  updateTime: string;
}

export function getBigScreenData() {
  return request.get<any, BigScreenData>("/bigscreen");
}
