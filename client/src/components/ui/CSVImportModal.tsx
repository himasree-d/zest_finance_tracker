import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { UploadCloud, AlertCircle, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { api } from '../../lib/api';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [mappings, setMappings] = useState({ date: '', amount: '', name: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Failed to parse CSV file. Ensure it is formatted correctly.');
          return;
        }
        if (results.meta.fields && results.meta.fields.length > 0) {
          setHeaders(results.meta.fields);
          setData(results.data);
          
          // Auto-guess mappings
          const guessMapping = (keywords: string[]) => {
            return results.meta.fields!.find(h => keywords.some(k => h.toLowerCase().includes(k))) || '';
          };
          
          setMappings({
            date: guessMapping(['date', 'time', 'posted']),
            amount: guessMapping(['amount', 'value', 'price', 'cost']),
            name: guessMapping(['description', 'merchant', 'name', 'payee', 'details']),
          });
        }
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      }
    });
  };

  const handleImport = async () => {
    if (!mappings.date || !mappings.amount || !mappings.name) {
      setError('Please map all required fields (Date, Amount, Description).');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const payload = data.map(row => {
        // Basic cleanup of amount (remove currency symbols, commas)
        const rawAmount = String(row[mappings.amount] || '0').replace(/[^0-9.-]+/g, "");
        let amount = parseFloat(rawAmount);
        
        // Some bank statements show expenses as negative. In our app, expenses are positive, income is positive but typed differently.
        // Let's assume negative is expense, positive is income, or user can fix it later. For now, absolute value and we assume expense unless it looks like income.
        // To be safe, let's keep the sign, or if it's purely a credit card statement, everything is an expense.
        // Let's default to EXPENSE and take absolute value.
        const type = amount < 0 ? 'EXPENSE' : 'INCOME';
        amount = Math.abs(amount);

        return {
          date: new Date(row[mappings.date]).toISOString(),
          amount: amount,
          name: row[mappings.name] || 'Imported Transaction',
          merchant: row[mappings.name] || 'Imported Transaction',
          type: type,
          category: 'Other', // Default category
        };
      }).filter(t => !isNaN(t.amount) && t.amount > 0 && !isNaN(new Date(t.date).getTime()));

      if (payload.length === 0) {
        throw new Error('No valid transactions found to import. Check your mappings.');
      }

      await api.transactions.bulkCreate(payload);
      toast.success(`Successfully imported ${payload.length} transactions`);
      handleClose();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to import transactions');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setHeaders([]);
    setData([]);
    setMappings({ date: '', amount: '', name: '' });
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Bank Statement" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {!file ? (
          <div 
            className="border-2 border-dashed border-charcoal-600 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-charcoal-800/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={48} className="text-electric-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Click to upload CSV file</h3>
            <p className="text-sm text-slate-400">Upload your bank statement exported in .csv format.</p>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-charcoal-800 rounded-xl border border-charcoal-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Check size={20} />
                </div>
                <div>
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-400">{data.length} rows found</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="p-2 hover:bg-charcoal-700 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-rose-400">{error}</p>
              </div>
            )}

            {headers.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300">Map CSV Columns</h4>
                <p className="text-xs text-slate-500 mb-4">Select which column from your CSV corresponds to the required fields.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Date Field</label>
                    <select 
                      className="input" 
                      value={mappings.date} 
                      onChange={(e) => setMappings({...mappings, date: e.target.value})}
                    >
                      <option value="">Select column...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Amount Field</label>
                    <select 
                      className="input" 
                      value={mappings.amount} 
                      onChange={(e) => setMappings({...mappings, amount: e.target.value})}
                    >
                      <option value="">Select column...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Description / Name</label>
                    <select 
                      className="input" 
                      value={mappings.name} 
                      onChange={(e) => setMappings({...mappings, name: e.target.value})}
                    >
                      <option value="">Select column...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-charcoal-700 flex justify-end gap-3">
              <button type="button" className="btn-ghost" onClick={handleClose}>Cancel</button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleImport}
                disabled={isUploading || !mappings.date || !mappings.amount || !mappings.name}
              >
                {isUploading ? 'Importing...' : 'Import Transactions'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
