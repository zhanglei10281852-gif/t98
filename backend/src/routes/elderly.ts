import { Router, Request, Response } from 'express';
import { Elderly } from '../models/Elderly';
import { authMiddleware, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles('admin', 'worker'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      keyword = '',
      community = '',
      subsidyCategory = '',
    } = req.query;

    const query: any = {};
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { idCard: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (community) query.community = community;
    if (subsidyCategory) query.subsidyCategory = subsidyCategory;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    const [total, list] = await Promise.all([
      Elderly.countDocuments(query),
      Elderly.find(query)
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
    res.status(500).json({ message: '获取老人列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const elderly = await Elderly.findById(req.params.id).populate('canteenId', 'name');
    if (!elderly) {
      return res.status(404).json({ message: '老人信息不存在' });
    }
    res.json(elderly);
  } catch (error) {
    res.status(500).json({ message: '获取老人信息失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const elderly = new Elderly(req.body);
    await elderly.save();
    await elderly.populate('canteenId', 'name');
    res.status(201).json(elderly);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '身份证号已存在' });
    }
    res.status(500).json({ message: '创建老人信息失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const elderly = await Elderly.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('canteenId', 'name');

    if (!elderly) {
      return res.status(404).json({ message: '老人信息不存在' });
    }
    res.json(elderly);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '身份证号已存在' });
    }
    res.status(500).json({ message: '更新老人信息失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const elderly = await Elderly.findByIdAndDelete(req.params.id);
    if (!elderly) {
      return res.status(404).json({ message: '老人信息不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除老人信息失败' });
  }
});

export default router;
