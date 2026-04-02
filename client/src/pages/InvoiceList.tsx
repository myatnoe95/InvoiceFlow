import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Pencil, Eye, Download, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInvoices, useDeleteInvoice } from '../hooks/useInvoices';
import { useShops } from '../hooks/useShops';
import { formatCurrency, formatDate } from '../utils/format';
import { exportToExcel, exportToCSV } from '../utils/exportReport';
import api from '../api/client';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cod: 'bg-amber-100 text-amber-700',
  partial: 'bg-purple-100 text-purple-700',
};

const statuses = ['all', 'draft', 'sent', 'partial', 'paid', 'cod', 'overdue'];

export default function InvoiceList() {
  const [shopId, setShopId] = useState<number | undefined>();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: shops } = useShops();
  const { data, isLoading } = useInvoices({
    shop_id: shopId,
    status: status === 'all' ? undefined : status,
    search: search || undefined,
    page,
    limit: 20,
  });
  const deleteInvoice = useDeleteInvoice();
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  async function fetchAllForExport() {
    const params: any = { limit: 10000 };
    if (shopId) params.shop_id = shopId;
    if (status !== 'all') params.status = status;
    if (search) params.search = search;
    const res = await api.get('/invoices', { params });
    return res.data.invoices;
  }

  async function handleExport(format: 'excel' | 'csv') {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const invoices = await fetchAllForExport();
      if (!invoices.length) {
        toast.error('No invoices to export');
        return;
      }
      const dateSuffix = new Date().toISOString().split('T')[0];
      const filename = `invoices-${dateSuffix}`;
      if (format === 'excel') {
        exportToExcel(invoices, filename);
      } else {
        exportToCSV(invoices, filename);
      }
      toast.success(`Exported ${invoices.length} invoices`);
    } catch {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(id: number, number: string) {
    if (!confirm(`Delete invoice ${number}?`)) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success('Invoice deleted');
    } catch {
      toast.error('Failed to delete');
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={16} /> {exporting ? 'Exporting...' : 'Export'}
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                  <button
                    onClick={() => handleExport('excel')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" /> Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText size={16} className="text-blue-600" /> Export as CSV
                  </button>
                </div>
              </>
            )}
          </div>
          <Link
            to="/invoices/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <Plus size={16} /> New Invoice
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or invoice #..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={shopId || ''}
            onChange={(e) => { setShopId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Shops</option>
            {shops?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 mt-3 overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                status === s ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : !data?.invoices.length ? (
          <div className="p-8 text-center text-gray-500">
            No invoices found.{' '}
            <Link to="/invoices/new" className="text-indigo-600 hover:underline">Create one</Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 font-medium text-gray-500">Invoice #</th>
                    <th className="text-left p-3 font-medium text-gray-500">Shop</th>
                    <th className="text-left p-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left p-3 font-medium text-gray-500">Date</th>
                    <th className="text-right p-3 font-medium text-gray-500">Total</th>
                    <th className="text-center p-3 font-medium text-gray-500">Status</th>
                    <th className="text-right p-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3">
                        <Link to={`/invoices/${inv.id}`} className="text-indigo-600 hover:underline font-medium">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-600">{inv.shop_name}</td>
                      <td className="p-3 text-gray-600">{inv.customer_name}</td>
                      <td className="p-3 text-gray-600">{formatDate(inv.issue_date)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium uppercase ${statusColors[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <Link to={`/invoices/${inv.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                            <Eye size={15} />
                          </Link>
                          <Link to={`/invoices/${inv.id}/edit`} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                            <Pencil size={15} />
                          </Link>
                          <button onClick={() => handleDelete(inv.id, inv.invoice_number)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.invoices.map((inv) => (
                <div key={inv.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/invoices/${inv.id}`} className="text-indigo-600 font-medium text-sm">
                      {inv.invoice_number}
                    </Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${statusColors[inv.status]}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{inv.customer_name}</p>
                  <p className="text-xs text-gray-500">{inv.shop_name} &middot; {formatDate(inv.issue_date)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold">{formatCurrency(inv.total)}</span>
                    <div className="flex gap-1">
                      <Link to={`/invoices/${inv.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
                        <Eye size={15} />
                      </Link>
                      <Link to={`/invoices/${inv.id}/edit`} className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => handleDelete(inv.id, inv.invoice_number)} className="p-1.5 hover:bg-red-50 rounded text-gray-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {data.page} of {totalPages} ({data.total} total)
                </p>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
