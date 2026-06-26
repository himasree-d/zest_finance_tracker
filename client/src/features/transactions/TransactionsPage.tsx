import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, Search, Download, Trash2, Edit2, 
  ChevronLeft, ChevronRight, CheckSquare, Square, UploadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../lib/utils';
import { transactionSchema } from '../../lib/validations';
import { useSettingsStore } from '../../store/settingsStore';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import CSVImportModal from '../../components/ui/CSVImportModal';
import type { Transaction, Budget } from '../../types';
import type { z } from 'zod';

type FormValues = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const currency = useSettingsStore(state => state.settings?.currency ?? 'INR');
  const currencySymbol = new Intl.NumberFormat('en-IN', { style: 'currency', currency }).formatToParts(0).find(p => p.type === 'currency')?.value || '₹';

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const { data, loading, execute } = useApi(api.transactions.getAll);
  const { execute: exportCsv, loading: exporting } = useApi(api.transactions.exportCSV);

  const fetchTransactions = useCallback(() => {
    execute({ page, pageSize, search, type: typeFilter ? (typeFilter as any) : undefined });
  }, [execute, page, pageSize, search, typeFilter]);

  useEffect(() => {
    fetchTransactions();
    api.budgets.getAll().then(setBudgets).catch(console.error);
  }, [fetchTransactions]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: { type: 'EXPENSE', date: new Date().toISOString().split('T')[0] }
  });

  const openAddModal = () => {
    setEditingId(null);
    reset({ type: 'EXPENSE', date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingId(tx.id);
    reset({
      name: tx.name,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: new Date(tx.date).toISOString().split('T')[0],
      note: tx.note || '',
      merchant: tx.merchant || '',
      budgetId: tx.budgetId || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = { ...values, budgetId: values.budgetId || undefined };
      if (editingId) {
        await api.transactions.update(editingId, payload);
        toast.success('Transaction updated');
      } else {
        await api.transactions.create(payload);
        toast.success('Transaction created');
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.transactions.delete(itemToDelete);
      toast.success('Transaction deleted');
      setDeleteConfirmOpen(false);
      fetchTransactions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await api.transactions.bulkDelete(Array.from(selectedIds));
      toast.success(`${selectedIds.size} transactions deleted`);
      setSelectedIds(new Set());
      fetchTransactions();
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportCsv({ search, type: typeFilter as any });
      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Export downloaded');
      }
    } catch {
      toast.error('Export failed');
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (data && selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else if (data) {
      setSelectedIds(new Set(data.data.map(t => t.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-slate-400 mt-1">Manage your income and expenses.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
            <UploadCloud size={18} /> <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-secondary">
            <Download size={18} /> <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={openAddModal} className="btn-primary">
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-charcoal-700 bg-charcoal-800/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="input pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-3 items-center">
            {selectedIds.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="btn-danger py-1.5 px-3 text-xs"
              >
                <Trash2 size={14} className="mr-1" /> Delete Selected ({selectedIds.size})
              </button>
            )}
            <select 
              className="input py-2 pl-3 pr-8 w-auto text-sm"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
            <select 
              className="input py-2 pl-3 pr-8 w-auto text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-charcoal-700 rounded animate-pulse"></div>)}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-charcoal-800/80 border-b border-charcoal-700">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-300">
                      {data && selectedIds.size === data.data.length && data.data.length > 0 
                        ? <CheckSquare size={18} className="text-electric-500" /> 
                        : <Square size={18} />}
                    </button>
                  </th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-700">
                {data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((tx) => (
                    <tr key={tx.id} className={`table-row-hover ${selectedIds.has(tx.id) ? 'bg-electric-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(tx.id)} className="text-slate-500">
                          {selectedIds.has(tx.id) 
                            ? <CheckSquare size={18} className="text-electric-500" /> 
                            : <Square size={18} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{tx.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-charcoal-700 text-xs">
                          {tx.category}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium num whitespace-nowrap ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditModal(tx)} className="text-slate-400 hover:text-electric-400 p-1 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => { setItemToDelete(tx.id); setDeleteConfirmOpen(true); }} 
                            className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-charcoal-700 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Showing <span className="font-medium text-slate-200">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-slate-200">{Math.min(page * pageSize, data.total)}</span> of <span className="font-medium text-slate-200">{data.total}</span> entries
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="btn-icon"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} 
                disabled={page === data.totalPages}
                className="btn-icon"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Type</label>
              <select className={`input ${errors.type ? 'input-error' : ''}`} {...register('type')}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Date</label>
              <input type="date" className={`input ${errors.date ? 'input-error' : ''}`} {...register('date')} />
              {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Description / Name</label>
            <input type="text" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Weekly Groceries" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{currencySymbol}</span>
                <input type="number" step="0.01" className={`input pl-8 num ${errors.amount ? 'input-error' : ''}`} placeholder="0.00" {...register('amount')} />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
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
            <label className="label">Link to Budget (Optional)</label>
            <select className="input" {...register('budgetId')}>
              <option value="">None</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Notes (Optional)</label>
            <textarea className="input resize-none h-20" placeholder="Add details..." {...register('note')}></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-charcoal-700 mt-6">
            <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        isDanger={true}
        confirmText="Delete"
      />

      {/* CSV Import Modal */}
      <CSVImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => { setPage(1); fetchTransactions(); }} 
      />
    </div>
  );
}
