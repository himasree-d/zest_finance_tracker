import { Response } from 'express';
import Groq from 'groq-sdk';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import type { AuthRequest } from '../middleware/authenticate';

const MOCK_INSIGHTS = {
  monthlySummary: "You've been managing your finances well this month. Your total spending is slightly below your average, primarily due to reduced expenses in shopping and entertainment. However, your dining out expenses have seen a noticeable uptick. Continuing this overall trend will help you reach your savings goals faster.",
  anomalies: [
    { category: "Dining", currentAmount: 450, averageAmount: 200, percentageChange: 125, message: "You spent 125% more on dining this month vs your 3-month average." }
  ],
  suggestions: [
    { title: "Optimize Subscriptions", description: "You have 3 active streaming subscriptions. Consider rotating them to save money.", potentialSavings: 30 },
    { title: "Grocery Shopping", description: "Buying in bulk for non-perishables could reduce your monthly grocery bill by 10%.", potentialSavings: 45 }
  ],
  streaks: [
    { type: "Budget", description: "You've stayed under your 'Transport' budget for 3 months in a row!", count: 3 }
  ]
};

export async function getInsights(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === 'your-groq-api-key') {
    res.json(MOCK_INSIGHTS);
    return;
  }

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const recentTransactions = await Transaction.find({
    userId, type: 'EXPENSE', date: { $gte: threeMonthsAgo },
  });

  // Compute category stats
  const categoryStats: Record<string, { current: number; historical: number[] }> = {};
  for (const t of recentTransactions) {
    const isCurrentMonth = t.date >= startOfMonth;
    if (!categoryStats[t.category]) categoryStats[t.category] = { current: 0, historical: [] };
    if (isCurrentMonth) categoryStats[t.category].current += t.amount;
    else categoryStats[t.category].historical.push(t.amount);
  }

  // Detect anomalies (>50% above 3-month average)
  const anomalies = [];
  for (const [cat, stats] of Object.entries(categoryStats)) {
    if (stats.historical.length > 0 && stats.current > 0) {
      const totalHistorical = stats.historical.reduce((a, b) => a + b, 0);
      const avg = totalHistorical / 3;
      if (avg > 0 && stats.current > avg * 1.5) {
        const percentageChange = Math.round(((stats.current - avg) / avg) * 100);
        anomalies.push({ category: cat, currentAmount: stats.current, averageAmount: Math.round(avg), percentageChange, message: `You spent ${percentageChange}% more on ${cat} this month vs your historical average.` });
      }
    }
  }

  // Generate summary with Groq
  try {
    const groq = new Groq({ apiKey });
    const currentCategories = Object.fromEntries(Object.entries(categoryStats).map(([k, v]) => [k, v.current]));

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'You are an expert financial advisor AI for a personal finance app called Zest. Be concise, encouraging, and insightful.',
        },
        {
          role: 'user',
          content: `Analyze this user's spending data and provide a short, encouraging 3-4 sentence summary of their current month's financial health. Focus on trends and positive reinforcement.

Data:
- Current month categories: ${JSON.stringify(currentCategories)}
- Spending anomalies: ${JSON.stringify(anomalies.map(a => a.category))}

Return ONLY the summary text, no conversational filler.`,
        },
      ],
    });

    const monthlySummary = completion.choices[0]?.message?.content ?? MOCK_INSIGHTS.monthlySummary;

    res.json({ monthlySummary, anomalies, suggestions: MOCK_INSIGHTS.suggestions, streaks: MOCK_INSIGHTS.streaks });
  } catch (error) {
    console.error('Groq API Error:', error);
    res.json(MOCK_INSIGHTS);
  }
}
