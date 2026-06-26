import { Response } from 'express';
import mongoose from 'mongoose';
import { SavingsPot } from '../models/SavingsPot';
import { Notification } from '../models/Notification';
import { savingsPotSchema, potTransactionSchema } from '../lib/schemas';
import { HttpError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/authenticate';

export async function getPots(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const pots = await SavingsPot.find({ userId }).sort({ createdAt: -1 });

  res.json(pots.map(p => ({
    id: p._id.toString(), name: p.name, targetAmount: p.targetAmount, currentAmount: p.currentAmount,
    targetDate: p.targetDate, color: p.color, icon: p.icon, createdAt: p.createdAt,
    potTransactions: p.potTransactions.slice(0, 5).map(pt => ({
      id: pt._id.toString(), amount: pt.amount, type: pt.type, note: pt.note, createdAt: pt.createdAt,
    })),
  })));
}

export async function createPot(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const body = savingsPotSchema.parse(req.body);
  const pot = await SavingsPot.create({
    ...body, userId,
    targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
  });
  res.status(201).json({ id: pot._id.toString(), name: pot.name, targetAmount: pot.targetAmount, currentAmount: pot.currentAmount, targetDate: pot.targetDate, color: pot.color, icon: pot.icon, potTransactions: [] });
}

export async function updatePot(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;
  const body = savingsPotSchema.partial().parse(req.body);

  const existing = await SavingsPot.findById(id);
  if (!existing || existing.userId.toString() !== userId) throw new HttpError('Pot not found', 404);

  const updates: Record<string, unknown> = { ...body };
  if (body.targetDate !== undefined) updates.targetDate = body.targetDate ? new Date(body.targetDate) : null;

  const updated = await SavingsPot.findByIdAndUpdate(id, updates, { new: true });
  if (!updated) throw new HttpError('Pot not found', 404);
  res.json({ id: updated._id.toString(), name: updated.name, targetAmount: updated.targetAmount, currentAmount: updated.currentAmount, targetDate: updated.targetDate, color: updated.color, icon: updated.icon });
}

export async function deletePot(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await SavingsPot.findById(id);
  if (!existing || existing.userId.toString() !== userId) throw new HttpError('Pot not found', 404);

  await SavingsPot.findByIdAndDelete(id);
  res.json({ message: 'Pot deleted' });
}

export async function addPotTransaction(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;
  const body = potTransactionSchema.parse(req.body);

  const pot = await SavingsPot.findById(id);
  if (!pot || pot.userId.toString() !== userId) throw new HttpError('Pot not found', 404);

  const currentAmount = pot.currentAmount;
  if (body.type === 'WITHDRAW' && body.amount > currentAmount) {
    throw new HttpError('Cannot withdraw more than current amount', 400);
  }

  const newAmount = body.type === 'ADD' ? currentAmount + body.amount : currentAmount - body.amount;
  const newTx = { _id: new mongoose.Types.ObjectId(), amount: body.amount, type: body.type, note: body.note, createdAt: new Date() };

  const updated = await SavingsPot.findByIdAndUpdate(
    id,
    { $set: { currentAmount: newAmount }, $push: { potTransactions: { $each: [newTx], $position: 0 } } },
    { new: true }
  );
  if (!updated) throw new HttpError('Pot not found', 404);

  // Check if goal reached
  if (body.type === 'ADD' && newAmount >= pot.targetAmount && currentAmount < pot.targetAmount) {
    await Notification.create({
      userId: pot.userId, type: 'POT_GOAL_REACHED',
      title: 'Goal Reached!',
      message: `You have reached your savings goal for ${pot.name}!`,
    });
  }

  res.status(201).json({
    transaction: { id: newTx._id.toString(), amount: newTx.amount, type: newTx.type, note: newTx.note, createdAt: newTx.createdAt },
    pot: { id: updated._id.toString(), name: updated.name, targetAmount: updated.targetAmount, currentAmount: updated.currentAmount },
  });
}
