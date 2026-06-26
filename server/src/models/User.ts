import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings {
  currency: string;
  theme: string;
  emailNotifications: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  settings: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>({
  currency: { type: String, default: 'INR' },
  theme: { type: String, default: 'dark' },
  emailNotifications: { type: Boolean, default: true },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String },
  settings: { type: UserSettingsSchema, default: () => ({}) },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
