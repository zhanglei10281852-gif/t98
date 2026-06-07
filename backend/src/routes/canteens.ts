import { Router, Request, Response } from 'express';
import { Canteen } from '../models/Canteen';
import { authMiddleware, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const canteens = await Canteen.find().sort({ createdAt: 1 });
    res.json(canteens);
  } catch (error) {
    res.status(500).json({ message: '获取助餐点列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) {
      return res.status(404).json({ message: '助餐点不存在' });
    }
    res.json(canteen);
  } catch (error) {
    res.status(500).json({ message: '获取助餐点信息失败' });
  }
});

router.post('/', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const canteen = new Canteen(req.body);
    await canteen.save();
    res.status(201).json(canteen);
  } catch (error) {
    res.status(500).json({ message: '创建助餐点失败' });
  }
});

router.put('/:id', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const canteen = await Canteen.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!canteen) {
      return res.status(404).json({ message: '助餐点不存在' });
    }
    res.json(canteen);
  } catch (error) {
    res.status(500).json({ message: '更新助餐点失败' });
  }
});

router.delete('/:id', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const canteen = await Canteen.findByIdAndDelete(req.params.id);
    if (!canteen) {
      return res.status(404).json({ message: '助餐点不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除助餐点失败' });
  }
});

export default router;
