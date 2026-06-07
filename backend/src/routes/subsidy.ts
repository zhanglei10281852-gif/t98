import { Router, Request, Response } from 'express';
import { SubsidyRecord } from '../models/SubsidyRecord';
import { MonthlySubsidyQuota } from '../models/MonthlySubsidyQuota';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { getMonthKey } from '../utils/subsidy';
import { config } from '../config';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles('admin', 'worker'));

router.get('/monthly-summary', async (req: Request, res: Response) => {
  try {
    const { month = '', page = '1', pageSize = '10' } = req.query;

    const targetMonth = month as string || getMonthKey(new Date());

    const quota = await MonthlySubsidyQuota.findOne({ month: targetMonth });

    const records = await SubsidyRecord.aggregate([
      { $match: { month: targetMonth } },
      {
        $group: {
          _id: '$elderlyId',
          mealCount: { $sum: 1 },
          totalSubsidy: { $sum: '$totalSubsidy' },
          totalSelfPay: { $sum: '$selfPayAmount' },
          totalMealPrice: { $sum: '$mealPrice' },
        },
      },
      {
        $lookup: {
          from: 'elderlies',
          localField: '_id',
          foreignField: '_id',
          as: 'elderly',
        },
      },
      { $unwind: '$elderly' },
      {
        $project: {
          elderlyId: '$_id',
          name: '$elderly.name',
          idCard: '$elderly.idCard',
          community: '$elderly.community',
          subsidyCategory: '$elderly.subsidyCategory',
          mealCount: 1,
          totalSubsidy: 1,
          totalSelfPay: 1,
          totalMealPrice: 1,
        },
      },
      { $sort: { mealCount: -1 } },
    ]);

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;
    const paginatedRecords = records.slice(skip, skip + size);

    res.json({
      month: targetMonth,
      quota: quota || {
        month: targetMonth,
        totalQuota: config.monthlySubsidyQuota,
        usedAmount: 0,
        remainingAmount: config.monthlySubsidyQuota,
        status: 'active',
      },
      total: records.length,
      list: paginatedRecords,
      page: pageNum,
      pageSize: size,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取月度补贴汇总失败' });
  }
});

router.get('/quota', async (req: Request, res: Response) => {
  try {
    const { month = '' } = req.query;
    const targetMonth = month as string || getMonthKey(new Date());

    let quota = await MonthlySubsidyQuota.findOne({ month: targetMonth });
    if (!quota) {
      quota = {
        month: targetMonth,
        totalQuota: config.monthlySubsidyQuota,
        usedAmount: 0,
        remainingAmount: config.monthlySubsidyQuota,
        status: 'active',
      } as any;
    }

    res.json(quota);
  } catch (error) {
    res.status(500).json({ message: '获取补贴额度失败' });
  }
});

router.get('/category-stats', async (req: Request, res: Response) => {
  try {
    const { month = '' } = req.query;
    const targetMonth = month as string || getMonthKey(new Date());

    const stats = await SubsidyRecord.aggregate([
      { $match: { month: targetMonth } },
      {
        $group: {
          _id: '$subsidyCategory',
          count: { $sum: 1 },
          totalSubsidy: { $sum: '$totalSubsidy' },
        },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          totalSubsidy: 1,
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: '获取补贴分类统计失败' });
  }
});

router.get('/export-csv', async (req: Request, res: Response) => {
  try {
    const { month = '' } = req.query;
    const targetMonth = month as string || getMonthKey(new Date());

    const records = await SubsidyRecord.aggregate([
      { $match: { month: targetMonth } },
      {
        $group: {
          _id: '$elderlyId',
          mealCount: { $sum: 1 },
          totalSubsidy: { $sum: '$totalSubsidy' },
          totalSelfPay: { $sum: '$selfPayAmount' },
        },
      },
      {
        $lookup: {
          from: 'elderlies',
          localField: '_id',
          foreignField: '_id',
          as: 'elderly',
        },
      },
      { $unwind: '$elderly' },
      {
        $project: {
          name: '$elderly.name',
          idCard: '$elderly.idCard',
          community: '$elderly.community',
          subsidyCategory: '$elderly.subsidyCategory',
          mealCount: 1,
          totalSubsidy: 1,
          totalSelfPay: 1,
        },
      },
      { $sort: { mealCount: -1 } },
    ]);

    const categoryMap: Record<string, string> = {
      low_income_full: '低保户全额补贴',
      low_income: '低收入补贴',
      normal: '普通老人补贴',
      senior_extra: '高龄补贴',
    };

    const header = '姓名,身份证号,所属社区,补贴类别,用餐次数,补贴总额(元),自付总额(元)\n';
    const rows = records.map((r: any) => [
      r.name,
      r.idCard,
      r.community,
      categoryMap[r.subsidyCategory] || r.subsidyCategory,
      r.mealCount,
      r.totalSubsidy.toFixed(2),
      r.totalSelfPay.toFixed(2),
    ].join(','));

    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="subsidy-summary-${targetMonth}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ message: '导出CSV失败' });
  }
});

export default router;
