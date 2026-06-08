import { Router, Request, Response } from "express";
import dayjs from "dayjs";
import { Order } from "../models/Order";
import { Elderly, SubsidyCategory } from "../models/Elderly";
import { Canteen } from "../models/Canteen";
import { SubsidyRecord } from "../models/SubsidyRecord";
import { getMonthKey } from "../utils/subsidy";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const today = dayjs();
    const todayStart = today.startOf("day").toDate();
    const todayEnd = today.endOf("day").toDate();

    const [
      todayOrders,
      totalElderly,
      totalCanteens,
      monthSubsidy,
      canteenRealtime,
      dailyTrend,
      elderlyCategoryStats,
      mealTypeStats,
    ] = await Promise.all([
      Order.countDocuments({
        mealDate: { $gte: todayStart, $lt: todayEnd },
        status: { $ne: "cancelled" },
      }),
      Elderly.countDocuments({ status: "active" }),
      Canteen.countDocuments({ status: "active" }),
      SubsidyRecord.aggregate([
        { $match: { month: getMonthKey(today.toDate()) } },
        { $group: { _id: null, total: { $sum: "$totalSubsidy" } } },
      ]),
      getCanteenRealtime(todayStart, todayEnd),
      getDailyTrend(30),
      getElderlyCategoryStats(),
      getMealTypeStats(todayStart, todayEnd),
    ]);

    const monthSubsidyTotal = monthSubsidy[0]?.total || 0;

    const todayCompleted = await Order.countDocuments({
      mealDate: { $gte: todayStart, $lt: todayEnd },
      status: "completed",
    });

    res.json({
      coreMetrics: {
        todayMeals: todayOrders,
        todayCompletedMeals: todayCompleted,
        totalElderly,
        totalCanteens,
        monthSubsidyTotal: Number(monthSubsidyTotal.toFixed(2)),
      },
      canteenRealtime,
      dailyTrend,
      elderlyCategoryStats,
      mealTypeStats,
      updateTime: new Date(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "获取大屏数据失败" });
  }
});

async function getCanteenRealtime(startDate: Date, endDate: Date) {
  const canteens = await Canteen.find({ status: "active" });

  const orders = await Order.aggregate([
    {
      $match: {
        mealDate: { $gte: startDate, $lt: endDate },
        status: { $ne: "cancelled" },
      },
    },
    { $group: { _id: "$canteenId", count: { $sum: 1 } } },
  ]);

  const orderMap = new Map(orders.map((o: any) => [o._id.toString(), o.count]));

  return canteens
    .map((canteen) => ({
      canteenId: canteen._id,
      canteenName: canteen.name,
      count: orderMap.get(canteen._id.toString()) || 0,
      capacity: canteen.dailyCapacity,
    }))
    .sort((a, b) => b.count - a.count);
}

async function getDailyTrend(days: number) {
  const result: Array<{ date: string; count: number; subsidy: number }> = [];
  const today = dayjs();

  for (let i = days - 1; i >= 0; i--) {
    const date = today.subtract(i, "day");
    const dayStart = date.startOf("day").toDate();
    const dayEnd = date.endOf("day").toDate();

    const [orders, subsidy] = await Promise.all([
      Order.countDocuments({
        mealDate: { $gte: dayStart, $lt: dayEnd },
        status: { $ne: "cancelled" },
      }),
      Order.aggregate([
        {
          $match: {
            mealDate: { $gte: dayStart, $lt: dayEnd },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$subsidyAmount" } } },
      ]),
    ]);

    result.push({
      date: date.format("MM-DD"),
      count: orders,
      subsidy: Number((subsidy[0]?.total || 0).toFixed(2)),
    });
  }

  return result;
}

async function getElderlyCategoryStats() {
  const categories = await Elderly.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$subsidyCategory", count: { $sum: 1 } } },
  ]);

  const categoryNames: Record<SubsidyCategory, string> = {
    low_income_full: "低保全额",
    low_income: "低收入",
    normal: "普通老人",
    senior_extra: "高龄额外",
  };

  return categories.map((c: any) => ({
    category: c._id,
    name: categoryNames[c._id as SubsidyCategory] || c._id,
    value: c.count,
  }));
}

async function getMealTypeStats(startDate: Date, endDate: Date) {
  const stats = await Order.aggregate([
    {
      $match: {
        mealDate: { $gte: startDate, $lt: endDate },
        status: { $ne: "cancelled" },
      },
    },
    { $group: { _id: "$mealType", count: { $sum: 1 } } },
  ]);

  const result = {
    lunch: 0,
    dinner: 0,
  };

  for (const s of stats) {
    if (s._id === "lunch") result.lunch = s.count;
    if (s._id === "dinner") result.dinner = s.count;
  }

  return result;
}

export default router;
