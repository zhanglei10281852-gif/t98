import mongoose from 'mongoose';

export interface ICanteen extends mongoose.Document {
  name: string;
  address: string;
  phone: string;
  dailyCapacity: number;
  businessHours: {
    lunch: string;
    dinner: string;
  };
  status: 'active' | 'inactive';
}

const canteenSchema = new mongoose.Schema<ICanteen>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  dailyCapacity: { type: Number, required: true, min: 0 },
  businessHours: {
    lunch: { type: String, required: true },
    dinner: { type: String, required: true },
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

export const Canteen = mongoose.model<ICanteen>('Canteen', canteenSchema);
