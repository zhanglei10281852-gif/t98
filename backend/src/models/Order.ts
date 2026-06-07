import mongoose from 'mongoose';

export type MealType = 'lunch' | 'dinner';
export type MealStandard = 'A' | 'B' | 'C';
export type OrderStatus = 'ordered' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type DeliveryType = 'pickup' | 'delivery';

export interface IDeliveryInfo {
  volunteerName: string;
  estimatedTime: string;
  actualTime?: string;
}

export interface IOrder extends mongoose.Document {
  orderNo: string;
  elderlyId: mongoose.Types.ObjectId;
  canteenId: mongoose.Types.ObjectId;
  mealDate: Date;
  mealType: MealType;
  mealStandard: MealStandard;
  mealPrice: number;
  remark: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryInfo?: IDeliveryInfo;
  subsidyAmount: number;
  selfPayAmount: number;
  createdBy: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  completedAt?: Date;
}

const orderSchema = new mongoose.Schema<IOrder>({
  orderNo: { type: String, required: true, unique: true },
  elderlyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elderly', required: true },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  mealDate: { type: Date, required: true },
  mealType: { type: String, enum: ['lunch', 'dinner'], required: true },
  mealStandard: { type: String, enum: ['A', 'B', 'C'], required: true },
  mealPrice: { type: Number, required: true, min: 0 },
  remark: { type: String, default: '' },
  status: {
    type: String,
    enum: ['ordered', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'ordered',
  },
  deliveryType: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
  deliveryInfo: {
    volunteerName: String,
    estimatedTime: String,
    actualTime: String,
  },
  subsidyAmount: { type: Number, required: true, default: 0 },
  selfPayAmount: { type: Number, required: true, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedAt: Date,
  completedAt: Date,
}, { timestamps: true });

orderSchema.index({ canteenId: 1, mealDate: 1, mealType: 1, status: 1 });
orderSchema.index({ elderlyId: 1, mealDate: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
