import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Check, Search, Calendar, Trash2, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../lib/utils';
import { recurringBillSchema } from '../../lib/validations';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useSettingsStore } from '../../store/settingsStore';

import type { RecurringBill } from '../../types';
import type { z } from 'zod';

type FormValues = z.infer<typeof recurringBillSchema>;

export default function BillsPage() {
  const currency = useSettingsStore(state => state.settings?.currency ?? 'INR');
  const currencySymbol = new Intl.NumberFormat('en-IN', { style: 'currency', currency }).formatToParts(0).find(p => p.type === 'currency')?.value || '₹';

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data: bills, loading, execute: fetchBills } = useApi(api.bills.getAll);
  const { execute: markPaid, loading: markingPaid } = useApi(api.bills.markPaid);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(recurringBillSchema) as any,
    defaultValues: { frequency: 'MONTHLY', color: '#8b5cf6' }
  });

  const selectedColor = watch('color');

  const openAddModal = () => {
    setEditingId(null);
    reset({ frequency: 'MONTHLY', color: '#8b5cf6', nextDueDate: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const openEditModal = (b: RecurringBill) => {
    setEditingId(b.id);
    reset({
      name: b.name,
      amount: b.amount,
      category: b.category,
      frequency: b.frequency,
      nextDueDate: new Date(b.nextDueDate).toISOString().split('T')[0],
      icon: b.icon,
      color: b.color,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingId) {
        await api.bills.update(editingId, values);
        toast.success('Bill updated');
      } else {
        await api.bills.create(values);
        toast.success('Bill created');
      }
      setIsModalOpen(false);
      fetchBills();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.bills.delete(itemToDelete);
      toast.success('Bill deleted');
      setDeleteConfirmOpen(false);
      fetchBills();
    } catch {
      toast.error('Failed to delete bill');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid(id);
      toast.success('Marked as paid!');
      fetchBills();
    } catch {
      toast.error('Failed to mark as paid');
    }
  };

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

  const filteredBills = bills?.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())) || [];
  
  const totalMonthly = bills?.reduce((sum, b) => {
    if (b.frequency === 'MONTHLY') return sum + b.amount;
    if (b.frequency === 'WEEKLY') return sum + (b.amount * 4.33);
    if (b.frequency === 'YEARLY') return sum + (b.amount / 12);
    return sum;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Recurring Bills</h1>
          <p className="text-slate-400 mt-1">Never miss a payment again.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} /> Add Bill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 col-span-1 md:col-span-1 bg-charcoal-800 border-charcoal-600">
          <h2 className="text-slate-400 text-sm font-medium mb-2">Total Monthly Cost</h2>
          <p className="text-4xl font-bold text-white num">{formatCurrency(totalMonthly)}</p>
          <div className="mt-4 pt-4 border-t border-charcoal-700 text-sm text-slate-400 flex justify-between">
            <span>Active Subscriptions</span>
            <span className="font-medium text-white">{bills?.length || 0}</span>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 flex flex-col justify-end">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
            <input 
              type="text" 
              placeholder="Search bills by name or category..." 
              className="input pl-12 py-3 w-full bg-charcoal-800 border-charcoal-600 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-charcoal-700 rounded-xl animate-pulse"></div>)}
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-charcoal-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No bills found</h3>
            <p className="text-slate-400 max-w-sm mx-auto">Add your recurring bills to track when they are due and how much they cost.</p>
          </div>
        ) : (
          <div className="divide-y divide-charcoal-700/50">
            {filteredBills.map((bill) => {
              const isOverdue = bill.status === 'OVERDUE';
              const isDueSoon = bill.status === 'DUE_SOON';
              const isPaid = bill.status === 'PAID';
              
              return (
                <div key={bill.id} className="p-4 sm:p-6 hover:bg-charcoal-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-[300px]">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                      style={{ backgroundColor: `${bill.color}15`, borderColor: `${bill.color}30`, color: bill.color }}
                    >
                      {bill.icon || bill.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{bill.name}</h3>
                      <div className="flex items-center text-sm text-slate-400 mt-1">
                        <span>{bill.category}</span>
                        <span className="mx-2">•</span>
                        <span className="uppercase text-xs font-medium tracking-wide">{bill.frequency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
                    <div className="text-left md:text-right">
                      <p className="text-xl font-bold num text-white">{formatCurrency(bill.amount)}</p>
                      <div className="flex items-center mt-1">
                        {isPaid ? (
                          <span className="text-emerald-400 text-xs flex items-center font-medium">
                            <CheckCircle2 size={12} className="mr-1" /> Paid
                          </span>
                        ) : isOverdue ? (
                          <span className="text-rose-400 text-xs flex items-center font-medium animate-pulse">
                            <AlertCircle size={12} className="mr-1" /> {Math.abs(bill.daysUntilDue!)} days overdue
                          </span>
                        ) : (
                          <span className={`text-xs font-medium ${isDueSoon ? 'text-amber-400' : 'text-slate-400'}`}>
                            Due {formatDate(bill.nextDueDate)}
                            {isDueSoon && ` (${bill.daysUntilDue} days left)`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-charcoal-700 pl-6 shrink-0">
                      <button
                        onClick={() => handleMarkPaid(bill.id)}
                        disabled={markingPaid || isPaid}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isPaid 
                            ? 'bg-emerald-500/10 text-emerald-500 cursor-not-allowed' 
                            : 'bg-charcoal-700 hover:bg-emerald-500 hover:text-white text-slate-400'
                        }`}
                        title={isPaid ? "Already paid this period" : "Mark as Paid"}
                      >
                        <Check size={18} />
                      </button>
                      <button onClick={() => openEditModal(bill as any)} className="w-10 h-10 rounded-full flex items-center justify-center bg-charcoal-700 hover:bg-charcoal-600 text-slate-400 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { setItemToDelete(bill.id); setDeleteConfirmOpen(true); }} className="w-10 h-10 rounded-full flex items-center justify-center bg-charcoal-700 hover:bg-rose-500 hover:text-white text-slate-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Bill' : 'Add Bill'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Bill Name</label>
            <input type="text" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Netflix Subscription" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{currencySymbol}</span>
                <input type="number" step="0.01" className={`input pl-8 num ${errors.amount ? 'input-error' : ''}`} placeholder="0.00" {...register('amount')} />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="label">Category</label>
              <div className="relative">
                <input type="text" list="bill-categories" className={`input ${errors.category ? 'input-error' : ''}`} placeholder="e.g. Entertainment" {...register('category')} />
                <datalist id="bill-categories">
                  <option value="Housing" />
                  <option value="Utilities" />
                  <option value="Subscriptions" />
                  <option value="Insurance" />
                  <option value="Debt" />
                  <option value="Other" />
                </datalist>
              </div>
              {errors.category && <p className="mt-1 text-xs text-rose-500">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Frequency</label>
              <select className={`input ${errors.frequency ? 'input-error' : ''}`} {...register('frequency')}>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label">Next Due Date</label>
              <input type="date" className={`input ${errors.nextDueDate ? 'input-error' : ''}`} {...register('nextDueDate')} />
              {errors.nextDueDate && <p className="mt-1 text-xs text-rose-500">{errors.nextDueDate.message}</p>}
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

          <div className="pt-4 flex justify-end gap-3 border-t border-charcoal-700 mt-6">
            <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Bill'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Bill"
        message="Are you sure you want to delete this bill? You will no longer receive reminders for it."
        isDanger={true}
        confirmText="Delete"
      />
    </div>
  );
}
