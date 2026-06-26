import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  monthlyLimit: number;
  color: string;
  icon: string;
  rollover: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  monthlyLimit: { type: Number, required: true },
  color: { type: String, default: '#3b82f6' },
  icon: { type: String, default: '💰' },
  rollover: { type: Boolean, default: false },
}, { timestamps: true });

BudgetSchema.index({ userId: 1, createdAt: 1 });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
