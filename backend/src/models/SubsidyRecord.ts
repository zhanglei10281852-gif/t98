import mongoose from 'mongoose';

export interface ISubsidyRecord extends mongoose.Document {
  orderId: mongoose.Types.ObjectId;
  elderlyId: mongoose.Types.ObjectId;
  canteenId: mongoose.Types.ObjectId;
  mealDate: Date;
  subsidyCategory: string;
  baseSubsidy: number;
  seniorSubsidy: number;
  totalSubsidy: number;
  mealPrice: number;
  selfPayAmount: number;
  month: string;
  settled: boolean;
}

const subsidyRecordSchema = new mongoose.Schema<ISubsidyRecord>({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  elderlyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elderly', required: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  mealDate: { type: Date, required: true },
  subsidyCategory: { type: String, required: true },
  baseSubsidy: { type: Number, required: true, default: 0 },
  seniorSubsidy: { type: Number, required: true, default: 0 },
  totalSubsidy: { type: Number, required: true, default: 0 },
  mealPrice: { type: Number, required: true, default: 0 },
  selfPayAmount: { type: Number, required: true, default: 0 },
  month: { type: String, required: true },
  settled: { type: Boolean, default: true },
}, { timestamps: true });

subsidyRecordSchema.index({ month: 1, elderlyId: 1 });
subsidyRecordSchema.index({ month: 1, canteenId: 1 });

export const SubsidyRecord = mongoose.model<ISubsidyRecord>('SubsidyRecord', subsidyRecordSchema);
