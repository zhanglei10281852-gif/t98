import request from "@/utils/request";

export interface CanteenRankingItem {
  canteenId: string;
  canteenName: string;
  mealCount: number;
  revenue: number;
  subsidyAmount: number;
  selfPayAmount: number;
  subsidyEfficiency: number;
  satisfaction: number;
}

export interface RankingData {
  rankings: CanteenRankingItem[];
  mealRanking: CanteenRankingItem[];
  revenueRanking: CanteenRankingItem[];
  satisfactionRanking: CanteenRankingItem[];
  subsidyEfficiencyRanking: CanteenRankingItem[];
  redList: {
    mealCount: CanteenRankingItem[];
    revenue: CanteenRankingItem[];
    satisfaction: CanteenRankingItem[];
    subsidyEfficiency: CanteenRankingItem[];
  };
  blackList: {
    mealCount: CanteenRankingItem[];
    revenue: CanteenRankingItem[];
    satisfaction: CanteenRankingItem[];
    subsidyEfficiency: CanteenRankingItem[];
  };
  period: {
    startDate: string;
    endDate: string;
    type: string;
  };
}

export function getCanteenRanking(type: string, period?: string) {
  return request.get<any, RankingData>("/ranking/canteens", {
    params: { type, period },
  });
}
