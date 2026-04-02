import { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Printer, Pencil, ArrowLeft } from 'lucide-react';
import { useInvoice } from '../hooks/useInvoices';
import { formatCurrency, formatDate } from '../utils/format';
import PaymentSection from '../components/invoice/PaymentSection';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cod: 'bg-amber-100 text-amber-700',
  partial: 'bg-purple-100 text-purple-700',
};

export default function InvoiceView() {
  const { id } = useParams();
  const { data: invoice, isLoading } = useInvoice(Number(id));
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!invoice) return <div className="text-center py-12 text-gray-500">Invoice not found</div>;

  return (
    <div>
      {/* Toolbar */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium uppercase ${statusColors[invoice.status]}`}>
              {invoice.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/invoices/${invoice.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            <Pencil size={15} /> Edit
          </Link>
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Invoice */}
      <div ref={printRef} data-print-area className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 md:p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row print:flex-row justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            {invoice.shop_logo && (
              <img src={invoice.shop_logo} alt={invoice.shop_name} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border border-gray-200 shrink-0" />
            )}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{invoice.shop_name}</h2>
              {invoice.shop_address && <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">{invoice.shop_address}</p>}
              {invoice.shop_phone && <p className="text-xs md:text-sm text-gray-500">{invoice.shop_phone}</p>}
              {invoice.shop_email && <p className="text-xs md:text-sm text-gray-500">{invoice.shop_email}</p>}
            </div>
          </div>
          <div className="md:text-right print:text-right whitespace-nowrap">
            <h3 className="text-base md:text-lg font-bold text-indigo-600">INVOICE</h3>
            <p className="text-sm text-gray-700 font-medium mt-1">{invoice.invoice_number}</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${statusColors[invoice.status]}`}>
              {invoice.status}
            </span>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Issue Date: {formatDate(invoice.issue_date)}</p>
            {invoice.due_date && <p className="text-xs md:text-sm text-gray-500">Due Date: {formatDate(invoice.due_date)}</p>}
            {invoice.payment_terms && <p className="text-xs md:text-sm text-gray-500">Terms: {invoice.payment_terms}</p>}
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
          <p className="text-sm font-medium text-gray-900">{invoice.customer_name}</p>
          {invoice.customer_address && <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{invoice.customer_address}</p>}
          {invoice.customer_email && <p className="text-xs md:text-sm text-gray-500">{invoice.customer_email}</p>}
          {invoice.customer_phone && <p className="text-xs md:text-sm text-gray-500">{invoice.customer_phone}</p>}
        </div>

        {/* Items - Desktop Table */}
        <table className="hidden md:table print:table w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 pr-2 font-medium text-gray-500">#</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500">Description</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500">Qty</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500">Unit Price</th>
              <th className="text-right py-2 pl-2 font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.id || i} className="border-b border-gray-100">
                <td className="py-3 pr-2 text-gray-400">{i + 1}</td>
                <td className="py-3 px-2 text-gray-900">{item.description}</td>
                <td className="py-3 px-2 text-right text-gray-600">{item.quantity}</td>
                <td className="py-3 px-2 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                <td className="py-3 pl-2 text-right font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Items - Mobile Cards */}
        <div className="md:hidden print:hidden space-y-3 mb-6">
          <div className="border-b-2 border-gray-200 pb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Items</p>
          </div>
          {invoice.items.map((item, i) => (
            <div key={item.id || i} className="border-b border-gray-100 pb-3">
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900">{i + 1}. {item.description}</p>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex justify-end">
          <div className="w-full md:max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
            )}
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Discount {invoice.discount_type === 'percentage' ? `(${invoice.discount_value}%)` : ''}
                </span>
                <span className="text-red-500">-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.delivery_fees > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fees</span>
                <span>{formatCurrency(invoice.delivery_fees)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-gray-200 pt-2">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
            </div>
            {(invoice.total_paid ?? 0) > 0 && (
              <>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-green-600">Paid</span>
                  <span className="font-medium text-green-600">{formatCurrency(invoice.total_paid ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={(invoice.remaining ?? 0) > 0 ? 'text-red-500' : 'text-green-600'}>
                    Remaining
                  </span>
                  <span className={`font-bold ${(invoice.remaining ?? 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {formatCurrency(invoice.remaining ?? 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Section (not printed) */}
      <PaymentSection
        invoiceId={invoice.id}
        invoiceTotal={invoice.total}
        payments={invoice.payments || []}
        totalPaid={invoice.total_paid || 0}
        remaining={invoice.remaining || invoice.total}
      />
    </div>
  );
}
