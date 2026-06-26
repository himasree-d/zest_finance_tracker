import mongoose, { Schema, Document } from 'mongoose';

export interface IPotTransaction {
  _id: mongoose.Types.ObjectId;
  amount: number;
  type: 'ADD' | 'WITHDRAW';
  note?: string;
  createdAt: Date;
}

export interface ISavingsPot extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  color: string;
  icon: string;
  potTransactions: IPotTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const PotTransactionSchema = new Schema<IPotTransaction>({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['ADD', 'WITHDRAW'], required: true },
  note: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

const SavingsPotSchema = new Schema<ISavingsPot>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  targetDate: { type: Date },
  color: { type: String, default: '#3b82f6' },
  icon: { type: String, default: '🏦' },
  potTransactions: { type: [PotTransactionSchema], default: [] },
}, { timestamps: true });

SavingsPotSchema.index({ userId: 1, createdAt: -1 });

export const SavingsPot = mongoose.model<ISavingsPot>('SavingsPot', SavingsPotSchema);
