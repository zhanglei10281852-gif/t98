import dayjs from "dayjs";
import { Order } from "../models/Order";
import { Elderly, SubsidyCategory } from "../models/Elderly";
import { Canteen } from "../models/Canteen";
import {
  Report,
  ReportType,
  ICanteenMealStats,
  IMealTypeStats,
  ISubsidyCategoryStats,
} from "../models/Report";

export const SUBSIDY_CATEGORY_NAMES: Record<SubsidyCategory, string> = {
  low_income_full: "低保全额",
  low_income: "低收入",
  normal: "普通老人",
  senior_extra: "高龄额外",
};

export interface ReportPeriod {
  start: Date;
  end: Date;
  period: string;
}

export function getPeriodRange(
  reportType: ReportType,
  date: Date,
): ReportPeriod {
  const d = dayjs(date);

  switch (reportType) {
    case "daily": {
      const start = d.startOf("day").toDate();
      const end = d.endOf("day").toDate();
      return { start, end, period: d.format("YYYY-MM-DD") };
    }
    case "monthly": {
      const start = d.startOf("month").toDate();
      const end = d.endOf("month").toDate();
      return { start, end, period: d.format("YYYY-MM") };
    }
    case "quarterly": {
      const quarter = Math.floor(d.month() / 3);
      const start = d
        .month(quarter * 3)
        .startOf("month")
        .toDate();
      const end = d
        .month(quarter * 3 + 2)
        .endOf("month")
        .toDate();
      const year = d.year();
      const q = quarter + 1;
      return { start, end, period: `${year}-Q${q}` };
    }
    default:
      throw new Error("不支持的报表类型");
  }
}

export function getPreviousPeriod(
  reportType: ReportType,
  period: string,
): ReportPeriod {
  switch (reportType) {
    case "daily": {
      const d = dayjs(period).subtract(1, "day");
      return getPeriodRange("daily", d.toDate());
    }
    case "monthly": {
      const [year, month] = period.split("-").map(Number);
      const d = dayjs(`${year}-${month}-01`).subtract(1, "month");
      return getPeriodRange("monthly", d.toDate());
    }
    case "quarterly": {
      const [year, qStr] = period.split("-Q");
      const q = Number(qStr);
      const d = dayjs(`${year}-01-01`)
        .month((q - 1) * 3)
        .subtract(3, "month");
      return getPeriodRange("quarterly", d.toDate());
    }
    default:
      throw new Error("不支持的报表类型");
  }
}

export function getSamePeriodLastYear(
  reportType: ReportType,
  period: string,
): ReportPeriod {
  switch (reportType) {
    case "daily": {
      const d = dayjs(period).subtract(1, "year");
      return getPeriodRange("daily", d.toDate());
    }
    case "monthly": {
      const [year, month] = period.split("-").map(Number);
      const d = dayjs(`${year - 1}-${month}-01`);
      return getPeriodRange("monthly", d.toDate());
    }
    case "quarterly": {
      const [year, qStr] = period.split("-Q");
      const q = Number(qStr);
      const d = dayjs(`${Number(year) - 1}-01-01`).month((q - 1) * 3);
      return getPeriodRange("quarterly", d.toDate());
    }
    default:
      throw new Error("不支持的报表类型");
  }
}

export async function generateReportStats(
  reportType: ReportType,
  startDate: Date,
  endDate: Date,
): Promise<{
  totalOrders: number;
  mealPersonTimes: number;
  revenue: number;
  subsidyAmount: number;
  selfPayAmount: number;
  newElderlyCount: number;
  activeElderlyCount: number;
  totalElderlyCount: number;
  subsidyCoverageRate: number;
  averageDailyMeals?: number;
  canteenStats: ICanteenMealStats[];
  mealTypeStats: IMealTypeStats;
  subsidyCategoryStats: ISubsidyCategoryStats[];
}> {
  const orderFilter = {
    mealDate: { $gte: startDate, $lt: endDate },
    status: { $ne: "cancelled" },
  };

  const [orders, canteens, totalElderlyCount, newElderlyCount] =
    await Promise.all([
      Order.find(orderFilter).populate("elderlyId"),
      Canteen.find({ status: "active" }),
      Elderly.countDocuments({
        status: "active",
        createdAt: { $lte: endDate },
      }),
      Elderly.countDocuments({
        status: "active",
        createdAt: { $gte: startDate, $lte: endDate },
      }),
    ]);

  const totalOrders = orders.length;
  const mealPersonTimes = orders.length;
  const revenue = orders.reduce((sum, o) => sum + o.mealPrice, 0);
  const subsidyAmount = orders.reduce((sum, o) => sum + o.subsidyAmount, 0);
  const selfPayAmount = orders.reduce((sum, o) => sum + o.selfPayAmount, 0);

  const activeElderlySet = new Set(orders.map((o) => o.elderlyId?.toString()));
  const activeElderlyCount = activeElderlySet.size;

  const subsidyCoverageRate =
    mealPersonTimes > 0
      ? orders.filter((o) => o.subsidyAmount > 0).length / mealPersonTimes
      : 0;

  const canteenMap = new Map(canteens.map((c) => [c._id.toString(), c]));
  const canteenStats: ICanteenMealStats[] = canteens.map((canteen) => ({
    canteenId: canteen._id,
    canteenName: canteen.name,
    mealCount: 0,
    revenue: 0,
    subsidyAmount: 0,
    selfPayAmount: 0,
  }));

  const canteenStatsMap = new Map(
    canteenStats.map((s) => [s.canteenId.toString(), s]),
  );

  for (const order of orders) {
    const canteenId = order.canteenId.toString();
    const stats = canteenStatsMap.get(canteenId);
    if (stats) {
      stats.mealCount++;
      stats.revenue += order.mealPrice;
      stats.subsidyAmount += order.subsidyAmount;
      stats.selfPayAmount += order.selfPayAmount;
    }
  }

  canteenStats.sort((a, b) => b.mealCount - a.mealCount);

  const mealTypeStats: IMealTypeStats = {
    lunch: orders.filter((o) => o.mealType === "lunch").length,
    dinner: orders.filter((o) => o.mealType === "dinner").length,
  };

  const categoryMap = new Map<string, { count: number; amount: number }>();
  for (const order of orders) {
    const elderly = order.elderlyId as any;
    const category = elderly?.subsidyCategory || "normal";
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { count: 0, amount: 0 });
    }
    const cat = categoryMap.get(category)!;
    cat.count++;
    cat.amount += order.subsidyAmount;
  }

  const subsidyCategoryStats: ISubsidyCategoryStats[] = [];
  for (const [category, data] of categoryMap.entries()) {
    subsidyCategoryStats.push({
      category,
      categoryName:
        SUBSIDY_CATEGORY_NAMES[category as SubsidyCategory] || category,
      count: data.count,
      amount: data.amount,
    });
  }
  subsidyCategoryStats.sort((a, b) => b.count - a.count);

  let averageDailyMeals: number | undefined;
  if (reportType !== "daily") {
    const days = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
    averageDailyMeals = mealPersonTimes / days;
  }

  return {
    totalOrders,
    mealPersonTimes,
    revenue,
    subsidyAmount,
    selfPayAmount,
    newElderlyCount,
    activeElderlyCount,
    totalElderlyCount,
    subsidyCoverageRate,
    averageDailyMeals,
    canteenStats,
    mealTypeStats,
    subsidyCategoryStats,
  };
}

export function calculateComparison(
  current: Record<string, number>,
  previous: Record<string, number> | null,
): { changeRate: number | null; isAbnormal: boolean } {
  if (!previous) {
    return { changeRate: null, isAbnormal: false };
  }

  const result: Record<string, number | null> = {};
  let hasAbnormal = false;

  for (const key of Object.keys(current)) {
    const curr = current[key];
    const prev = previous[key];

    if (prev === undefined || prev === null || prev === 0) {
      result[key] = null;
    } else {
      const rate = ((curr - prev) / prev) * 100;
      result[key] = Math.round(rate * 100) / 100;
      if (Math.abs(rate) > 30) {
        hasAbnormal = true;
      }
    }
  }

  return { changeRate: result as any, isAbnormal: hasAbnormal };
}

export function getCompareMetrics(stats: any): Record<string, number> {
  return {
    totalOrders: stats.totalOrders,
    mealPersonTimes: stats.mealPersonTimes,
    revenue: stats.revenue,
    subsidyAmount: stats.subsidyAmount,
    selfPayAmount: stats.selfPayAmount,
    activeElderlyCount: stats.activeElderlyCount,
    newElderlyCount: stats.newElderlyCount,
  };
}

export const METRIC_LABELS: Record<string, string> = {
  totalOrders: "总订单数",
  mealPersonTimes: "就餐人次",
  revenue: "营业额",
  subsidyAmount: "补贴发放额",
  selfPayAmount: "自费金额",
  activeElderlyCount: "活跃老人数",
  newElderlyCount: "新增老人数",
};
