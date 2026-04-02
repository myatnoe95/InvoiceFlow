import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useShops } from '../../hooks/useShops';
import { useNextInvoiceNumber, useCreateInvoice, useUpdateInvoice } from '../../hooks/useInvoices';
import type { Invoice, InvoiceItem } from '../../types';
import { calcSubtotal, calcTax, calcDiscount, calcTotal } from '../../utils/calculations';
import { todayISO } from '../../utils/format';
import LineItemRow from './LineItemRow';
import InvoiceSummary from './InvoiceSummary';

const emptyItem: InvoiceItem = { description: '', quantity: 1, unit_price: 0, amount: 0, sort_order: 0 };

const paymentTermOptions = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 60', 'Custom'];

interface Props {
  invoice?: Invoice;
}

export default function InvoiceForm({ invoice }: Props) {
  const navigate = useNavigate();
  const { data: shops } = useShops();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [shopId, setShopId] = useState(invoice?.shop_id || 0);
  const [customerName, setCustomerName] = useState(invoice?.customer_name || '');
  const [customerEmail, setCustomerEmail] = useState(invoice?.customer_email || '');
  const [customerPhone, setCustomerPhone] = useState(invoice?.customer_phone || '');
  const [customerAddress, setCustomerAddress] = useState(invoice?.customer_address || '');
  const [issueDate, setIssueDate] = useState(invoice?.issue_date || todayISO());
  const [dueDate, setDueDate] = useState(invoice?.due_date || '');
  const [paymentTerms, setPaymentTerms] = useState(invoice?.payment_terms || '');
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [status, setStatus] = useState(invoice?.status || 'draft');
  const [taxRate, setTaxRate] = useState(invoice?.tax_rate || 0);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>(invoice?.discount_type || 'none');
  const [discountValue, setDiscountValue] = useState(invoice?.discount_value || 0);
  const [deliveryFees, setDeliveryFees] = useState(invoice?.delivery_fees || 0);
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.length ? invoice.items : [{ ...emptyItem }]
  );

  const { data: nextNumber } = useNextInvoiceNumber(shopId);

  const subtotal = calcSubtotal(items);
  const taxAmount = calcTax(subtotal, taxRate);
  const discountAmount = calcDiscount(subtotal, discountType, discountValue);
  const total = calcTotal(subtotal, taxAmount, discountAmount, deliveryFees);

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems(prev => [...prev, { ...emptyItem, sort_order: prev.length }]);
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      shop_id: shopId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      issue_date: issueDate,
      due_date: dueDate,
      tax_rate: taxRate,
      discount_type: discountType,
      discount_value: discountValue,
      delivery_fees: deliveryFees,
      notes,
      payment_terms: paymentTerms,
      status,
      items: items.map((item, i) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: i,
      })),
    };

    try {
      if (invoice) {
        await updateInvoice.mutateAsync({ id: invoice.id, ...data });
        toast.success('Invoice updated');
        navigate(`/invoices/${invoice.id}`);
      } else {
        const result = await createInvoice.mutateAsync(data);
        toast.success('Invoice created');
        navigate(`/invoices/${result.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save invoice');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shop & Invoice Number */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Invoice Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop *</label>
            <select
              required
              value={shopId}
              onChange={(e) => setShopId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>Select a shop</option>
              {shops?.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.prefix})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Number</label>
            <input
              type="text"
              readOnly
              value={invoice?.invoice_number || nextNumber?.invoice_number || 'Select a shop first'}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cod">COD</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Items</h2>

        {/* Desktop table */}
        <table className="hidden md:table w-full mb-3">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-2 text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
              <th className="text-right p-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Qty</th>
              <th className="text-right p-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Unit Price</th>
              <th className="text-right p-2 text-sm font-medium text-gray-500 dark:text-gray-400 w-28">Amount</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <LineItemRow key={i} item={item} index={i} onChange={updateItem} onRemove={removeItem} canRemove={items.length > 1} />
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3 mb-3">
          {items.map((item, i) => (
            <LineItemRow key={i} item={item} index={i} onChange={updateItem} onRemove={removeItem} canRemove={items.length > 1} />
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="max-w-md ml-auto">
          <InvoiceSummary
            subtotal={subtotal}
            taxRate={taxRate}
            taxAmount={taxAmount}
            discountType={discountType}
            discountValue={discountValue}
            discountAmount={discountAmount}
            deliveryFees={deliveryFees}
            total={total}
            onTaxRateChange={setTaxRate}
            onDiscountTypeChange={setDiscountType}
            onDiscountValueChange={setDiscountValue}
            onDeliveryFeesChange={setDeliveryFees}
          />
        </div>
      </div>

      {/* Dates, Payment Terms, Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date *</label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
            <select
              value={paymentTermOptions.includes(paymentTerms) ? paymentTerms : paymentTerms ? 'Custom' : ''}
              onChange={(e) => setPaymentTerms(e.target.value === 'Custom' ? '' : e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select terms</option>
              {paymentTermOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {(paymentTerms && !paymentTermOptions.slice(0, -1).includes(paymentTerms)) && (
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Custom payment terms"
              />
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Thank you for your business!"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createInvoice.isPending || updateInvoice.isPending}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {invoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}
