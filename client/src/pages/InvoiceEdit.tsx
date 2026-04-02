import { useParams } from 'react-router-dom';
import { useInvoice } from '../hooks/useInvoices';
import InvoiceForm from '../components/invoice/InvoiceForm';

export default function InvoiceEdit() {
  const { id } = useParams();
  const { data: invoice, isLoading } = useInvoice(Number(id));

  if (isLoading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (!invoice) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Invoice not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Invoice {invoice.invoice_number}</h1>
      <InvoiceForm invoice={invoice} />
    </div>
  );
}
