import { useState } from 'react';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAddPayment, useDeletePayment } from '../../hooks/useInvoices';
import type { Payment } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

const paymentMethods = ['Cash', 'Bank Transfer', 'KBZPay', 'WavePay', 'COD', 'AYAPay', 'Other'];

interface Props {
  invoiceId: number;
  invoiceTotal: number;
  payments: Payment[];
  totalPaid: number;
  remaining: number;
}

export default function PaymentSection({ invoiceId, invoiceTotal, payments, totalPaid, remaining }: Props) {
  const addPayment = useAddPayment();
  const deletePayment = useDeletePayment();

  const [showForm, setShowForm] = useState(false);
  const [method, setMethod] = useState('Cash');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    try {
      await addPayment.mutateAsync({
        invoiceId,
        method,
        amount: Number(amount),
        note: note || undefined,
        paid_at: paidAt,
      });
      toast.success('Payment recorded');
      setShowForm(false);
      setAmount('');
      setNote('');
      setMethod('Cash');
    } catch {
      toast.error('Failed to add payment');
    }
  }

  async function handleDelete(paymentId: number) {
    if (!confirm('Delete this payment record?')) return;
    try {
      await deletePayment.mutateAsync({ invoiceId, paymentId });
      toast.success('Payment removed');
    } catch {
      toast.error('Failed to remove payment');
    }
  }

  return (
    <div className="no-print bg-white rounded-xl border border-gray-200 p-4 sm:p-6 md:p-10 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard size={20} className="text-gray-400" /> Payments
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus size={16} /> Add Payment
          </button>
        )}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-semibold">{formatCurrency(invoiceTotal)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600">Paid</p>
          <p className="text-sm font-semibold text-green-700">{formatCurrency(totalPaid)}</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${remaining > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className={`text-xs ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>Remaining</p>
          <p className={`text-sm font-semibold ${remaining > 0 ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(remaining)}</p>
        </div>
      </div>

      {/* Payment list */}
      {payments.length > 0 && (
        <div className="space-y-2 mb-4">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded">
                    {p.method}
                  </span>
                  <span className="text-sm font-semibold">{formatCurrency(p.amount)}</span>
                  <span className="text-xs text-gray-400">{formatDate(p.paid_at)}</span>
                </div>
                {p.note && <p className="text-xs text-gray-500 mt-0.5 truncate">{p.note}</p>}
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 shrink-0 ml-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {payments.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-3">No payments recorded yet.</p>
      )}

      {/* Add payment form */}
      {showForm && (
        <form onSubmit={handleAdd} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                placeholder={remaining > 0 ? `Max: ${remaining.toLocaleString()}` : '0'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Deposit, COD balance"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addPayment.isPending}
              className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Record Payment
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
