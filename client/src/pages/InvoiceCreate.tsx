import InvoiceForm from '../components/invoice/InvoiceForm';

export default function InvoiceCreate() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Create Invoice</h1>
      <InvoiceForm />
    </div>
  );
}
