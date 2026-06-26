import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'BILL_DUE' | 'BUDGET_ALERT' | 'POT_GOAL_REACHED' | 'GENERAL';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['BILL_DUE', 'BUDGET_ALERT', 'POT_GOAL_REACHED', 'GENERAL'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
