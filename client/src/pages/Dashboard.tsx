import { Link } from 'react-router-dom';
import { Store, FileText, DollarSign, Clock } from 'lucide-react';
import { useDashboardStats } from '../hooks/useInvoices';
import { formatCurrency, formatDate } from '../utils/format';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cod: 'bg-amber-100 text-amber-700',
  partial: 'bg-purple-100 text-purple-700',
};

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!stats) return null;

  const cards = [
    { label: 'Total Shops', value: stats.shop_count, icon: Store, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Total Invoices', value: stats.invoice_count, icon: FileText, color: 'bg-blue-50 text-blue-600' },
    { label: 'Revenue (Paid)', value: formatCurrency(stats.total_revenue), icon: DollarSign, color: 'bg-green-50 text-green-600' },
    {
      label: 'Pending',
      value: stats.status_counts.find(s => s.status === 'draft')?.count ?? 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
          <Link to="/invoices" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all
          </Link>
        </div>
        {stats.recent_invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No invoices yet.{' '}
            <Link to="/invoices/new" className="text-indigo-600 hover:underline">Create one</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-3 font-medium text-gray-500">Invoice #</th>
                  <th className="text-left p-3 font-medium text-gray-500">Shop</th>
                  <th className="text-left p-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left p-3 font-medium text-gray-500">Date</th>
                  <th className="text-right p-3 font-medium text-gray-500">Total</th>
                  <th className="text-center p-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_invoices.map((inv) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
