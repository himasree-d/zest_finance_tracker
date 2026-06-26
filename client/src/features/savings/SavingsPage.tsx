import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, PiggyBank, Trash2, Edit2, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { formatCurrency, getDaysUntil } from '../../lib/utils';
import { savingsPotSchema, potTransactionSchema } from '../../lib/validations';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import SkeletonCard from '../../components/ui/SkeletonCard';
import CircularProgress from '../../components/ui/CircularProgress';
import { useSettingsStore } from '../../store/settingsStore';
import type { SavingsPot } from '../../types';
import type { z } from 'zod';

type PotFormValues = z.infer<typeof savingsPotSchema>;
type TxFormValues = z.infer<typeof potTransactionSchema>;

export default function SavingsPage() {
  const currency = useSettingsStore(state => state.settings?.currency ?? 'INR');
  const currencySymbol = new Intl.NumberFormat('en-IN', { style: 'currency', currency }).formatToParts(0).find(p => p.type === 'currency')?.value || '₹';

  const [isPotModalOpen, setIsPotModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'ADD' | 'WITHDRAW'>('ADD');
  const [selectedPot, setSelectedPot] = useState<SavingsPot | null>(null);

  const { data: pots, loading, execute: fetchPots } = useApi(api.savings.getAll);

  useEffect(() => {
    fetchPots();
  }, [fetchPots]);

  const { register: registerPot, handleSubmit: handlePotSubmit, reset: resetPot, setValue: setPotValue, watch: watchPot, formState: { errors: potErrors, isSubmitting: isPotSubmitting } } = useForm<PotFormValues>({
    resolver: zodResolver(savingsPotSchema) as any,
    defaultValues: { color: '#3b82f6', icon: '🏦' }
  });

  const selectedColor = watchPot('color');

  const { register: registerTx, handleSubmit: handleTxSubmit, reset: resetTx, formState: { errors: txErrors, isSubmitting: isTxSubmitting } } = useForm<TxFormValues>({
    resolver: zodResolver(potTransactionSchema) as any,
  });

  const openAddPotModal = () => {
    setEditingId(null);
    resetPot({ color: '#3b82f6', icon: '🏦' });
    setIsPotModalOpen(true);
  };

  const openEditPotModal = (p: SavingsPot) => {
    setEditingId(p.id);
    resetPot({
      name: p.name,
      targetAmount: p.targetAmount,
      targetDate: p.targetDate ? new Date(p.targetDate).toISOString().split('T')[0] : null,
      color: p.color,
      icon: p.icon,
    });
    setIsPotModalOpen(true);
  };

  const openTxModal = (pot: SavingsPot, type: 'ADD' | 'WITHDRAW') => {
    setSelectedPot(pot);
    setTxType(type);
    resetTx({ type });
    setIsTxModalOpen(true);
  };

  const onPotSubmit = async (values: PotFormValues) => {
    try {
      if (editingId) {
        await api.savings.update(editingId, values);
        toast.success('Pot updated');
      } else {
        await api.savings.create(values);
        toast.success('Pot created');
      }
      setIsPotModalOpen(false);
      fetchPots();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const onTxSubmit = async (values: TxFormValues) => {
    if (!selectedPot) return;
    try {
      await api.savings.addTransaction(selectedPot.id, values);
      toast.success(values.type === 'ADD' ? 'Funds added' : 'Funds withdrawn');
      setIsTxModalOpen(false);
      fetchPots();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Transaction failed');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.savings.delete(itemToDelete);
      toast.success('Pot deleted');
      setDeleteConfirmOpen(false);
      fetchPots();
    } catch {
      toast.error('Failed to delete pot');
    }
  };

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

  const totalSaved = pots?.reduce((acc, p) => acc + Number(p.currentAmount), 0) || 0;
  const totalTarget = pots?.reduce((acc, p) => acc + Number(p.targetAmount), 0) || 0;
  const totalPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Savings Pots</h1>
          <p className="text-slate-400 mt-1">Set goals and watch your money grow.</p>
        </div>
        <button onClick={openAddPotModal} className="btn-primary">
          <Plus size={18} /> New Pot
        </button>
      </div>

      {!loading && pots && pots.length > 0 && (
        <div className="card p-6 bg-gradient-to-r from-charcoal-800 to-charcoal-900 border-l-4 border-l-electric-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Saved Across All Pots</p>
              <h2 className="text-4xl font-bold text-white num tracking-tight">
                {formatCurrency(totalSaved)}
                <span className="text-xl text-slate-500 font-normal ml-2">/ {formatCurrency(totalTarget)}</span>
              </h2>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-electric-400">{totalPercentage}% of total goal</span>
                <span className="text-slate-400">{formatCurrency(Math.max(0, totalTarget - totalSaved))} left</span>
              </div>
              <div className="progress-track h-3 bg-charcoal-700">
                <div 
                  className="progress-bar bg-electric-500 shadow-glow"
                  style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-80" />)}
        </div>
      ) : !pots || pots.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center">
          <div className="h-20 w-20 bg-charcoal-700 rounded-full flex items-center justify-center mb-6">
            <PiggyBank size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No savings pots yet</h2>
          <p className="text-slate-400 mb-6 max-w-md">Create pots for vacations, emergencies, or large purchases to track your progress visually.</p>
          <button onClick={openAddPotModal} className="btn-primary">
            Create Your First Pot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pots.map((pot: any) => {
            const percentage = Math.round((pot.currentAmount / pot.targetAmount) * 100);
            const isCompleted = percentage >= 100;
            const daysLeft = pot.targetDate ? getDaysUntil(pot.targetDate) : null;
            
            return (
              <div key={pot.id} className="card p-6 flex flex-col sm:flex-row gap-8 relative overflow-hidden">
                {isCompleted && (
                  <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                    GOAL REACHED
                  </div>
                )}
                
                <div className="shrink-0 flex flex-col items-center">
                  <CircularProgress percentage={percentage} color={pot.color} size={140} strokeWidth={10}>
                    <div className="text-4xl mb-1">{pot.icon}</div>
                    <div className="text-xl font-bold num text-white">{percentage}%</div>
                  </CircularProgress>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white pr-24">{pot.name}</h3>
                    </div>
                    
                    <div className="mt-4 space-y-1">
                      <p className="text-slate-400 text-sm">Saved</p>
                      <p className={`text-2xl font-bold num ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                        {formatCurrency(pot.currentAmount)}
                      </p>
                      <p className="text-slate-500 text-sm num">Target: {formatCurrency(pot.targetAmount)}</p>
                    </div>

                    {daysLeft !== null && !isCompleted && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400 bg-charcoal-800 py-1.5 px-3 rounded-lg w-fit">
                        <Calendar size={14} className="text-electric-400" />
                        {daysLeft < 0 ? (
                          <span className="text-rose-400">Target date missed by {Math.abs(daysLeft)} days</span>
                        ) : (
                          <span>{daysLeft} days left to reach goal</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button 
                      onClick={() => openTxModal(pot, 'ADD')} 
                      className="btn-secondary flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 focus:ring-emerald-500"
                    >
                      <ArrowDownRight size={16} /> Add
                    </button>
                    <button 
                      onClick={() => openTxModal(pot, 'WITHDRAW')} 
                      className="btn-secondary flex-1 py-2 hover:text-white"
                      disabled={pot.currentAmount <= 0}
                    >
                      <ArrowUpRight size={16} /> Withdraw
                    </button>
                    <button onClick={() => openEditPotModal(pot)} className="btn-icon">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => { setItemToDelete(pot.id); setDeleteConfirmOpen(true); }} className="btn-icon hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Pot Modal */}
      <Modal isOpen={isPotModalOpen} onClose={() => setIsPotModalOpen(false)} title={editingId ? 'Edit Pot' : 'Create Savings Pot'}>
        <form onSubmit={handlePotSubmit(onPotSubmit)} className="space-y-5">
          <div className="flex gap-4">
            <div className="w-16 shrink-0">
              <label className="label">Icon</label>
              <input type="text" className={`input text-center text-xl ${potErrors.icon ? 'input-error' : ''}`} {...registerPot('icon')} />
            </div>
            <div className="flex-1">
              <label className="label">Goal Name</label>
              <input type="text" className={`input ${potErrors.name ? 'input-error' : ''}`} placeholder="e.g. Vacation Fund" {...registerPot('name')} />
              {potErrors.name && <p className="mt-1 text-xs text-rose-500">{potErrors.name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{currencySymbol}</span>
                <input type="number" step="1" className={`input pl-8 num ${potErrors.targetAmount ? 'input-error' : ''}`} placeholder="0" {...registerPot('targetAmount')} />
              </div>
              {potErrors.targetAmount && <p className="mt-1 text-xs text-rose-500">{potErrors.targetAmount.message}</p>}
            </div>
            <div>
              <label className="label">Target Date (Optional)</label>
              <input type="date" className="input" {...registerPot('targetDate')} />
            </div>
          </div>

          <div>
            <label className="label mb-2">Theme Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPotValue('color', c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-charcoal-700">
            <button type="button" className="btn-ghost" onClick={() => setIsPotModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isPotSubmitting}>
              {isPotSubmitting ? 'Saving...' : 'Save Pot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Withdraw Funds Modal */}
      <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title={`${txType === 'ADD' ? 'Add Funds to' : 'Withdraw from'} ${selectedPot?.name}`}>
        {selectedPot && (
          <form onSubmit={handleTxSubmit(onTxSubmit)} className="space-y-5">
            <div className="bg-charcoal-800 p-4 rounded-xl flex justify-between items-center mb-6">
              <span className="text-slate-400">Current Balance:</span>
              <span className="text-xl font-bold num text-white">{formatCurrency(selectedPot.currentAmount)}</span>
            </div>

            <input type="hidden" {...registerTx('type')} value={txType} />
            
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{currencySymbol}</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className={`input pl-8 num text-lg ${txErrors.amount ? 'input-error' : ''}`} 
                  placeholder="0.00" 
                  autoFocus
                  {...registerTx('amount')} 
                />
              </div>
              {txErrors.amount && <p className="mt-1 text-xs text-rose-500">{txErrors.amount.message}</p>}
              {txType === 'WITHDRAW' && (
                <p className="mt-1 text-xs text-amber-400">Maximum withdrawal: {formatCurrency(selectedPot.currentAmount)}</p>
              )}
            </div>

            <div>
              <label className="label">Note (Optional)</label>
              <input type="text" className="input" placeholder="e.g. Birthday money" {...registerTx('note')} />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-charcoal-700">
              <button type="button" className="btn-ghost" onClick={() => setIsTxModalOpen(false)}>Cancel</button>
              <button 
                type="submit" 
                className={`btn-primary ${txType === 'ADD' ? 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500' : ''}`} 
                disabled={isTxSubmitting}
              >
                {isTxSubmitting ? 'Processing...' : txType === 'ADD' ? 'Add Funds' : 'Withdraw Funds'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Savings Pot"
        message="Are you sure you want to delete this pot? The money saved will be released back into your general balance. This cannot be undone."
        isDanger={true}
        confirmText="Delete"
      />
    </div>
  );
}
