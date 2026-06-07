import express from 'express';
import cors from 'cors';
import { config } from './config';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import elderlyRoutes from './routes/elderly';
import canteenRoutes from './routes/canteens';
import orderRoutes from './routes/orders';
import subsidyRoutes from './routes/subsidy';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '老年人助餐服务平台 API 运行正常' });
});

app.use('/api/auth', authRoutes);
app.use('/api/elderly', elderlyRoutes);
app.use('/api/canteens', canteenRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subsidy', subsidyRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message || '服务器内部错误' });
});

const startServer = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`服务器运行在 http://localhost:${config.port}`);
  });
};

startServer();
