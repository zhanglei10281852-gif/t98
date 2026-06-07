import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const token = (jwt as any).sign(
      { userId: user._id.toString(), role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        canteenId: user.canteenId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "登录失败" });
  }
});

router.get("/profile", authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "未授权" });
  }
  res.json({
    id: req.user._id,
    username: req.user.username,
    name: req.user.name,
    role: req.user.role,
    canteenId: req.user.canteenId,
  });
});

export default router;
