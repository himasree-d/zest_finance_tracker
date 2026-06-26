import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date;
  note?: string;
  merchant?: string;
  budgetId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  note: { type: String },
  merchant: { type: String },
  budgetId: { type: Schema.Types.ObjectId, ref: 'Budget' },
}, { timestamps: true });

TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, budgetId: 1 });
TransactionSchema.index({ userId: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
