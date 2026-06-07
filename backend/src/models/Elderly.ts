import mongoose from 'mongoose';

export type SubsidyCategory = 'low_income_full' | 'low_income' | 'normal' | 'senior_extra';

export interface IElderly extends mongoose.Document {
  name: string;
  idCard: string;
  age: number;
  gender: 'male' | 'female';
  community: string;
  phone: string;
  address: string;
  subsidyCategory: SubsidyCategory;
  canteenId: mongoose.Types.ObjectId;
  hasSeniorSubsidy: boolean;
  status: 'active' | 'inactive';
}

const elderlySchema = new mongoose.Schema<IElderly>({
  name: { type: String, required: true },
  idCard: { type: String, required: true, unique: true },
  age: { type: Number, required: true, min: 0 },
  gender: { type: String, enum: ['male', 'female'], required: true },
  community: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  subsidyCategory: {
    type: String,
    enum: ['low_income_full', 'low_income', 'normal', 'senior_extra'],
    required: true,
  },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  hasSeniorSubsidy: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

export const Elderly = mongoose.model<IElderly>('Elderly', elderlySchema);
