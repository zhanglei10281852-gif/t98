import mongoose from 'mongoose';

export type ReportType = 'daily' | 'monthly' | 'quarterly';
export type ReportStatus = 'draft' | 'confirmed' | 'locked';

export interface ICanteenMealStats {
  canteenId: mongoose.Types.ObjectId;
  canteenName: string;
  mealCount: number;
  revenue: number;
  subsidyAmount: number;
  selfPayAmount: number;
}

export interface IMealTypeStats {
  lunch: number;
  dinner: number;
}

export interface ISubsidyCategoryStats {
  category: string;
  categoryName: string;
  count: number;
  amount: number;
}

export interface IReport extends mongoose.Document {
  reportType: ReportType;
  period: string;
  startDate: Date;
  endDate: Date;
  status: ReportStatus;
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
  compareData?: {
    mom: Record<string, number | null>;
    yoy: Record<string, number | null>;
    abnormalMetrics: string[];
  };
  adjustments: Record<string, number>;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  generatedAt: Date;
}

const canteenMealStatsSchema = new mongoose.Schema<ICanteenMealStats>({
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  canteenName: { type: String, required: true },
  mealCount: { type: Number, required: true, default: 0 },
  revenue: { type: Number, required: true, default: 0 },
  subsidyAmount: { type: Number, required: true, default: 0 },
  selfPayAmount: { type: Number, required: true, default: 0 },
});

const mealTypeStatsSchema = new mongoose.Schema<IMealTypeStats>({
  lunch: { type: Number, required: true, default: 0 },
  dinner: { type: Number, required: true, default: 0 },
});

const subsidyCategoryStatsSchema = new mongoose.Schema<ISubsidyCategoryStats>({
  category: { type: String, required: true },
  categoryName: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
});

const reportSchema = new mongoose.Schema<IReport>({
  reportType: { type: String, enum: ['daily', 'monthly', 'quarterly'], required: true, index: true },
  period: { type: String, required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'confirmed', 'locked'], default: 'draft' },
  totalOrders: { type: Number, required: true, default: 0 },
  mealPersonTimes: { type: Number, required: true, default: 0 },
  revenue: { type: Number, required: true, default: 0 },
  subsidyAmount: { type: Number, required: true, default: 0 },
  selfPayAmount: { type: Number, required: true, default: 0 },
  newElderlyCount: { type: Number, required: true, default: 0 },
  activeElderlyCount: { type: Number, required: true, default: 0 },
  totalElderlyCount: { type: Number, required: true, default: 0 },
  subsidyCoverageRate: { type: Number, required: true, default: 0 },
  averageDailyMeals: { type: Number },
  canteenStats: { type: [canteenMealStatsSchema], required: true, default: [] },
  mealTypeStats: { type: mealTypeStatsSchema, required: true },
  subsidyCategoryStats: { type: [subsidyCategoryStatsSchema], required: true, default: [] },
  compareData: {
    mom: { type: mongoose.Schema.Types.Mixed, default: {} },
    yoy: { type: mongoose.Schema.Types.Mixed, default: {} },
    abnormalMetrics: { type: [String], default: [] },
  },
  adjustments: { type: mongoose.Schema.Types.Mixed, default: {} },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

reportSchema.index({ reportType: 1, period: 1 }, { unique: true });

export const Report = mongoose.model<IReport>('Report', reportSchema);
