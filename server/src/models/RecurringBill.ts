import mongoose, { Schema, Document } from 'mongoose';

export interface IRecurringBill extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  category: string;
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  nextDueDate: Date;
  lastPaidDate?: Date;
  icon?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringBillSchema = new Schema<IRecurringBill>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  frequency: { type: String, enum: ['WEEKLY', 'MONTHLY', 'YEARLY'], required: true },
  nextDueDate: { type: Date, required: true },
  lastPaidDate: { type: Date },
  icon: { type: String },
  color: { type: String, default: '#3b82f6' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

RecurringBillSchema.index({ userId: 1, nextDueDate: 1 });

export const RecurringBill = mongoose.model<IRecurringBill>('RecurringBill', RecurringBillSchema);
