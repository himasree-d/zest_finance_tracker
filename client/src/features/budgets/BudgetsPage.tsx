import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Target, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../lib/utils';
import { budgetSchema } from '../../lib/validations';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { useSettingsStore } from '../../store/settingsStore';
import type { Budget, Transaction } from '../../types';
import type { z } from 'zod';

type FormValues = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const currency = useSettingsStore(state => state.settings?.currency ?? 'INR');
  const currencySymbol = new Intl.NumberFormat('en-IN', { style: 'currency', currency }).formatToParts(0).find(p => p.type === 'currency')?.value || '₹';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget & { sparkline?: any[], recentTransactions?: Transaction[] } | null>(null);

  const { data: budgets, loading, execute: fetchBudgets } = useApi(api.budgets.getAll);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: { color: '#3b82f6', icon: '💰', rollover: false }
  });

  const selectedColor = watch('color');

  const openAddModal = () => {
    setEditingId(null);
    reset({ color: '#3b82f6', icon: '💰', rollover: false });
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingId(b.id);
    reset({
      name: b.name,
      category: b.category,
      monthlyLimit: b.monthlyLimit,
      color: b.color,
      icon: b.icon,
      rollover: b.rollover,
    });
    setIsModalOpen(true);
  };

  const openDetailsModal = async (id: string) => {
    try {
      const details = await api.budgets.getOne(id);
      setSelectedBudget(details as any);
      setDetailsModalOpen(true);
    } catch {
      toast.error('Failed to load budget details');
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingId) {
        await api.budgets.update(editingId, values);
        toast.success('Budget updated');
      } else {
        await api.budgets.create(values);
        toast.success('Budget created');
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.budgets.delete(itemToDelete);
      toast.success('Budget deleted');
      setDeleteConfirmOpen(false);
      fetchBudgets();
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Budgets</h1>
          <p className="text-slate-400 mt-1">Set limits and track your monthly spending.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} /> New Budget
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} className="h-64" />)}
        </div>
      ) : !budgets || budgets.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center">
          <div className="h-20 w-20 bg-charcoal-700 rounded-full flex items-center justify-center mb-6">
            <Target size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No budgets created yet</h2>
          <p className="text-slate-400 mb-6 max-w-md">Creating budgets helps you track your spending across different categories and stay on top of your financial goals.</p>
          <button onClick={openAddModal} className="btn-primary">
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {budgets.map((budget: any) => {
            const isOver = budget.percentage >= 100;
            const isNear = budget.percentage >= 80 && !isOver;
            
            return (
              <div 
                key={budget.id} 
                className={`card-hover p-6 cursor-pointer relative overflow-hidden group border ${isOver ? 'border-rose-500/30' : 'border-charcoal-600'}`}
                onClick={() => openDetailsModal(budget.id)}
              >
                {/* Background glow based on budget color */}
                <div 
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-30"
                  style={{ backgroundColor: budget.color }}
                ></div>

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/5"
                      style={{ backgroundColor: `${budget.color}20`, color: budget.color }}
                    >
                      {budget.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{budget.name}</h3>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{budget.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => openEditModal(budget)} 
                      className="p-2 text-slate-400 hover:text-white hover:bg-charcoal-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => { setItemToDelete(budget.id); setDeleteConfirmOpen(true); }} 
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className={`text-2xl font-bold num ${isOver ? 'text-rose-400' : 'text-white'}`}>
                        {formatCurrency(budget.spent)}
                      </span>
                      <span className="text-slate-500 text-sm num ml-1">
                        / {formatCurrency(budget.monthlyLimit)}
                      </span>
                    </div>
                    {isOver && (
                      <span className="badge-rose animate-pulse">
                        <AlertCircle size={12} /> Overspent
                      </span>
                    )}
                    {isNear && (
                      <span className="badge-amber">Near Limit</span>
                    )}
                  </div>
                  
                  <div className="progress-track">
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: isOver ? '#f43f5e' : budget.color 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>{budget.percentage}% used</span>
                    <span>{formatCurrency(Math.max(0, budget.monthlyLimit - budget.spent))} left</span>
                  </div>
                </div>

                {budget.recentTransactions && budget.recentTransactions.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-charcoal-700/50">
                    <p className="text-xs text-slate-500 mb-3 uppercase font-medium">Recent Activity</p>
                    <div className="space-y-3">
                      {budget.recentTransactions.slice(0, 2).map((tx: any) => (
                        <div key={tx.id} className="flex justify-between items-center text-sm">
                          <span className="text-slate-300 truncate pr-4">{tx.name}</span>
                          <span className="text-white num whitespace-nowrap">-{formatCurrency(tx.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Budget' : 'Create Budget'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex gap-4">
            <div className="w-16 shrink-0">
              <label className="label">Icon</label>
              <input type="text" className={`input text-center text-xl ${errors.icon ? 'input-error' : ''}`} {...register('icon')} />
            </div>
            <div className="flex-1">
              <label className="label">Budget Name</label>
              <input type="text" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Groceries" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly Limit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{currencySymbol}</span>
                <input type="number" step="1" className={`input pl-8 num ${errors.monthlyLimit ? 'input-error' : ''}`} placeholder="0" {...register('monthlyLimit')} />
              </div>
              {errors.monthlyLimit && <p className="mt-1 text-xs text-rose-500">{errors.monthlyLimit.message}</p>}
            </div>
            <div>
              <label className="label">Category</label>
              <div className="relative">
                <input type="text" list="categories" className={`input ${errors.category ? 'input-error' : ''}`} placeholder="e.g. Food" {...register('category')} />
                <datalist id="categories">
                  <option value="Food" />
                  <option value="Transport" />
                  <option value="Entertainment" />
                  <option value="Shopping" />
                  <option value="Housing" />
                  <option value="Healthcare" />
                  <option value="Education" />
                  <option value="Utilities" />
                  <option value="Salary" />
                  <option value="Freelance" />
                  <option value="Investment" />
                  <option value="Other" />
                </datalist>
              </div>
              {errors.category && <p className="mt-1 text-xs text-rose-500">{errors.category.message}</p>}
            </div>
          </div>

          <div>
            <label className="label mb-2">Theme Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-charcoal-800 rounded-xl border border-charcoal-600">
            <input 
              type="checkbox" 
              id="rollover" 
              className="w-5 h-5 rounded bg-charcoal-900 border-charcoal-500 text-electric-500 focus:ring-electric-500/50"
              {...register('rollover')}
            />
            <div>
              <label htmlFor="rollover" className="text-sm font-medium text-white cursor-pointer block">Rollover unused funds</label>
              <p className="text-xs text-slate-400">Carry over any remaining budget to the next month.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-charcoal-700">
            <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Budget Details" maxWidth="max-w-2xl">
        {selectedBudget ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-charcoal-700 pb-6">
              <div 
                className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl border"
                style={{ backgroundColor: `${selectedBudget.color}20`, borderColor: `${selectedBudget.color}40`, color: selectedBudget.color }}
              >
                {selectedBudget.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedBudget.name}</h2>
                <span className="text-sm text-slate-400">{selectedBudget.category}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 bg-charcoal-800/50">
                <p className="text-sm text-slate-400 mb-1">Current Spend</p>
                <p className="text-2xl font-bold num text-white">{formatCurrency(selectedBudget.spent || 0)}</p>
                <div className="mt-2 text-xs text-slate-500 flex justify-between">
                  <span>Limit: {formatCurrency(selectedBudget.monthlyLimit)}</span>
                  <span>{(selectedBudget as any).percentage}%</span>
                </div>
              </div>
              <div className="card p-4 bg-charcoal-800/50">
                <p className="text-sm text-slate-400 mb-1">Remaining</p>
                <p className={`text-2xl font-bold num ${(selectedBudget as any).percentage! >= 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatCurrency(Math.max(0, selectedBudget.monthlyLimit - (selectedBudget.spent || 0)))}
                </p>
                <p className="mt-2 text-xs text-slate-500">{selectedBudget.rollover ? 'Rolls over next month' : 'Does not roll over'}</p>
              </div>
            </div>

            {selectedBudget.sparkline && selectedBudget.sparkline.length > 0 && (
              <div>
                <h3 className="section-title mb-4 text-sm uppercase">6-Month Trend</h3>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedBudget.sparkline.slice().reverse()}>
                      <YAxis domain={[0, 'auto']} hide />
                      <Line 
                        type="monotone" 
                        dataKey="spent" 
                        stroke={selectedBudget.color} 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#1d2433', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: selectedBudget.color, stroke: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div>
              <h3 className="section-title mb-4 text-sm uppercase flex justify-between">
                <span>Recent Transactions</span>
              </h3>
              <div className="divide-y divide-charcoal-700 border border-charcoal-700 rounded-xl overflow-hidden">
                {selectedBudget.recentTransactions && selectedBudget.recentTransactions.length > 0 ? (
                  selectedBudget.recentTransactions.map(tx => (
                    <div key={tx.id} className="p-3 bg-charcoal-800 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-white">{tx.name}</p>
                        <p className="text-xs text-slate-500">{formatDate(tx.date)}</p>
                      </div>
                      <span className="font-medium text-white num">-{formatCurrency(tx.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 bg-charcoal-800">No transactions this month.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? Existing transactions will no longer be linked to it."
        isDanger={true}
        confirmText="Delete"
      />
    </div>
  );
}
