import { Router, Request, Response } from 'express';
import dayjs from 'dayjs';
import { Order } from '../models/Order';
import { Elderly } from '../models/Elderly';
import { SubsidyRecord } from '../models/SubsidyRecord';
import { MonthlySubsidyQuota } from '../models/MonthlySubsidyQuota';
import { Canteen } from '../models/Canteen';
import { authMiddleware } from '../middleware/auth';
import { getMonthKey } from '../utils/subsidy';
import { config } from '../config';

const router = Router();

router.use(authMiddleware);

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonth = getMonthKey(today);

    let canteenFilter: any = {};
    if (req.user?.role === 'canteen') {
      canteenFilter.canteenId = req.user.canteenId;
    }

    const [
      todayOrders,
      totalElderly,
      totalCanteens,
      monthSubsidy,
      monthQuota,
      canteenOrders,
      dailyTrend,
    ] = await Promise.all([
      Order.countDocuments({
        ...canteenFilter,
        mealDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' },
      }),
      Elderly.countDocuments({ status: 'active' }),
      Canteen.countDocuments({ status: 'active' }),
      SubsidyRecord.aggregate([
        { $match: { month: currentMonth, ...(canteenFilter.canteenId ? { canteenId: canteenFilter.canteenId } : {}) } },
        { $group: { _id: null, total: { $sum: '$totalSubsidy' }, count: { $sum: 1 } } },
      ]),
      MonthlySubsidyQuota.findOne({ month: currentMonth }),
      Order.aggregate([
        { $match: { mealDate: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' }, ...canteenFilter } },
        { $group: { _id: '$canteenId', count: { $sum: 1 } } },
        { $lookup: { from: 'canteens', localField: '_id', foreignField: '_id', as: 'canteen' } },
        { $unwind: '$canteen' },
        { $project: { canteenName: '$canteen.name', count: 1 } },
      ]),
      getDailyTrend(canteenFilter),
    ]);

    const subsidyTotal = monthSubsidy[0]?.total || 0;
    const subsidyCount = monthSubsidy[0]?.count || 0;
    const quota = monthQuota || {
      totalQuota: config.monthlySubsidyQuota,
      usedAmount: subsidyTotal,
      remainingAmount: config.monthlySubsidyQuota - subsidyTotal,
    };

    res.json({
      todayOrders,
      totalElderly,
      totalCanteens,
      monthSubsidyTotal: subsidyTotal,
      monthSubsidyCount: subsidyCount,
      monthQuota: {
        totalQuota: quota.totalQuota,
        usedAmount: quota.usedAmount || 0,
        remainingAmount: quota.remainingAmount !== undefined ? quota.remainingAmount : quota.totalQuota - (quota.usedAmount || 0),
      },
      canteenOrders: canteenOrders.sort((a: any, b: any) => b.count - a.count),
      dailyTrend,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取统计数据失败' });
  }
});

async function getDailyTrend(canteenFilter: any): Promise<any[]> {
  const days: Array<{ date: string; count: number }> = [];
  const today = dayjs();

  for (let i = 29; i >= 0; i--) {
    const date = today.subtract(i, 'day');
    const dayStart = date.startOf('day').toDate();
    const dayEnd = date.endOf('day').toDate();

    const count = await Order.countDocuments({
      ...canteenFilter,
      mealDate: { $gte: dayStart, $lt: dayEnd },
      status: { $ne: 'cancelled' },
    });

    days.push({
      date: date.format('YYYY-MM-DD'),
      count,
    });
  }

  return days;
}

export default router;
