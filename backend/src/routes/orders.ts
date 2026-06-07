import { Router, Request, Response } from 'express';
import dayjs from 'dayjs';
import { Order, OrderStatus, MealType } from '../models/Order';
import { Elderly } from '../models/Elderly';
import { Canteen } from '../models/Canteen';
import { SubsidyRecord } from '../models/SubsidyRecord';
import { MonthlySubsidyQuota } from '../models/MonthlySubsidyQuota';
import { authMiddleware, requireRoles } from '../middleware/auth';
import {
  calculateSubsidy,
  MEAL_PRICES,
  generateOrderNo,
  getMonthKey,
} from '../utils/subsidy';
import { config } from '../config';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      status = '',
      canteenId = '',
      startDate = '',
      endDate = '',
      mealType = '',
    } = req.query;

    const query: any = {};

    if (req.user?.role === 'canteen') {
      query.canteenId = req.user.canteenId;
    } else if (canteenId) {
      query.canteenId = canteenId;
    }

    if (status) query.status = status;
    if (mealType) query.mealType = mealType;

    if (startDate || endDate) {
      query.mealDate = {};
      if (startDate) query.mealDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = dayjs(endDate as string).add(1, 'day').toDate();
        query.mealDate.$lt = end;
      }
    }

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    const [total, list] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate('elderlyId', 'name age phone subsidyCategory')
        .populate('canteenId', 'name')
        .skip(skip)
        .limit(size)
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      total,
      list,
      page: pageNum,
      pageSize: size,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取订单列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('elderlyId')
      .populate('canteenId', 'name');

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (req.user?.role === 'canteen' && order.canteenId.toString() !== req.user.canteenId?.toString()) {
      return res.status(403).json({ message: '无权查看此订单' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: '获取订单详情失败' });
  }
});

router.post('/', requireRoles('admin', 'worker'), async (req: Request, res: Response) => {
  try {
    const {
      elderlyId,
      canteenId,
      mealDate,
      mealType,
      mealStandard,
      remark = '',
      deliveryType = 'pickup',
    } = req.body;

    const elderly = await Elderly.findById(elderlyId);
    if (!elderly) {
      return res.status(404).json({ message: '老人信息不存在' });
    }

    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(404).json({ message: '助餐点不存在' });
    }

    const mealPrice = MEAL_PRICES[mealStandard];
    if (!mealPrice) {
      return res.status(400).json({ message: '无效的餐标' });
    }

    const mealDateObj = new Date(mealDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (mealDateObj < tomorrow) {
      return res.status(400).json({ message: '只能预订次日及以后的餐食' });
    }

    const dayStart = new Date(mealDateObj);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingOrders = await Order.countDocuments({
      canteenId,
      mealDate: { $gte: dayStart, $lt: dayEnd },
      mealType,
      status: { $ne: 'cancelled' },
    });

    if (existingOrders >= canteen.dailyCapacity) {
      return res.status(400).json({ message: '该助餐点当日此餐次已达最大供餐能力' });
    }

    const subsidy = calculateSubsidy(elderly, mealPrice);

    const monthKey = getMonthKey(mealDateObj);
    let quota = await MonthlySubsidyQuota.findOne({ month: monthKey });
    if (!quota) {
      quota = new MonthlySubsidyQuota({
        month: monthKey,
        totalQuota: config.monthlySubsidyQuota,
        usedAmount: 0,
        remainingAmount: config.monthlySubsidyQuota,
      });
    }

    const orderNo = generateOrderNo();

    const order = new Order({
      orderNo,
      elderlyId,
      canteenId,
      mealDate: mealDateObj,
      mealType,
      mealStandard,
      mealPrice,
      remark,
      deliveryType,
      subsidyAmount: subsidy.totalSubsidy,
      selfPayAmount: subsidy.selfPayAmount,
      createdBy: req.user?._id,
    });

    await order.save();
    await order.populate('elderlyId', 'name age phone');
    await order.populate('canteenId', 'name');

    res.status(201).json(order);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || '创建订单失败' });
  }
});

router.patch('/:id/status', requireRoles('admin', 'canteen'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses: OrderStatus[] = ['ordered', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: '无效的订单状态' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (req.user?.role === 'canteen' && order.canteenId.toString() !== req.user.canteenId?.toString()) {
      return res.status(403).json({ message: '无权操作此订单' });
    }

    order.status = status;

    if (status === 'confirmed') {
      order.confirmedAt = new Date();
    }

    if (status === 'completed') {
      order.completedAt = new Date();

      const elderly = await Elderly.findById(order.elderlyId);
      if (elderly) {
        const subsidy = calculateSubsidy(elderly, order.mealPrice);
        const monthKey = getMonthKey(order.mealDate);

        const existingRecord = await SubsidyRecord.findOne({ orderId: order._id });
        if (!existingRecord) {
          const subsidyRecord = new SubsidyRecord({
            orderId: order._id,
            elderlyId: order.elderlyId,
            canteenId: order.canteenId,
            mealDate: order.mealDate,
            subsidyCategory: elderly.subsidyCategory,
            baseSubsidy: subsidy.baseSubsidy,
            seniorSubsidy: subsidy.seniorSubsidy,
            totalSubsidy: subsidy.totalSubsidy,
            mealPrice: order.mealPrice,
            selfPayAmount: subsidy.selfPayAmount,
            month: monthKey,
            settled: true,
          });
          await subsidyRecord.save();

          let quota = await MonthlySubsidyQuota.findOne({ month: monthKey });
          if (!quota) {
            quota = new MonthlySubsidyQuota({
              month: monthKey,
              totalQuota: config.monthlySubsidyQuota,
              usedAmount: 0,
              remainingAmount: config.monthlySubsidyQuota,
            });
          }

          quota.usedAmount += subsidy.totalSubsidy;
          quota.remainingAmount = quota.totalQuota - quota.usedAmount;
          if (quota.remainingAmount <= 0) {
            quota.status = 'exhausted';
            quota.remainingAmount = 0;
          }
          await quota.save();
        }
      }
    }

    await order.save();
    await order.populate('elderlyId', 'name age phone');
    await order.populate('canteenId', 'name');

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '更新订单状态失败' });
  }
});

router.patch('/:id/delivery', requireRoles('admin', 'canteen'), async (req: Request, res: Response) => {
  try {
    const { volunteerName, estimatedTime } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (req.user?.role === 'canteen' && order.canteenId.toString() !== req.user.canteenId?.toString()) {
      return res.status(403).json({ message: '无权操作此订单' });
    }

    order.deliveryType = 'delivery';
    order.deliveryInfo = {
      volunteerName,
      estimatedTime,
    };

    await order.save();
    await order.populate('elderlyId', 'name age phone');
    await order.populate('canteenId', 'name');

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: '设置配送信息失败' });
  }
});

router.delete('/:id', requireRoles('admin', 'worker'), async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: '订单已取消' });
  } catch (error) {
    res.status(500).json({ message: '取消订单失败' });
  }
});

export default router;
