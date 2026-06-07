import mongoose from 'mongoose';

export interface IMonthlySubsidyQuota extends mongoose.Document {
  month: string;
  totalQuota: number;
  usedAmount: number;
  remainingAmount: number;
  status: 'active' | 'exhausted';
}

const monthlySubsidyQuotaSchema = new mongoose.Schema<IMonthlySubsidyQuota>({
  month: { type: String, required: true, unique: true },
  totalQuota: { type: Number, required: true, default: 100000 },
  usedAmount: { type: Number, required: true, default: 0 },
  remainingAmount: { type: Number, required: true, default: 100000 },
  status: { type: String, enum: ['active', 'exhausted'], default: 'active' },
}, { timestamps: true });

export const MonthlySubsidyQuota = mongoose.model<IMonthlySubsidyQuota>('MonthlySubsidyQuota', monthlySubsidyQuotaSchema);
