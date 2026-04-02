import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Invoice } from '../types';
import { formatCurrency, formatDate } from './format';

interface ExportRow {
  'Invoice #': string;
  Shop: string;
  Customer: string;
  'Issue Date': string;
  'Due Date': string;
  Status: string;
  Subtotal: number;
  Tax: number;
  Discount: number;
  'Delivery Fees': number;
  Total: number;
  'Payment Terms': string;
  Notes: string;
}

function mapInvoices(invoices: Invoice[]): ExportRow[] {
  return invoices.map((inv) => ({
    'Invoice #': inv.invoice_number,
    Shop: inv.shop_name || '',
    Customer: inv.customer_name,
    'Issue Date': inv.issue_date,
    'Due Date': inv.due_date || '',
    Status: inv.status.toUpperCase(),
    Subtotal: inv.subtotal,
    Tax: inv.tax_amount,
    Discount: inv.discount_amount,
    'Delivery Fees': inv.delivery_fees || 0,
    Total: inv.total,
    'Payment Terms': inv.payment_terms || '',
    Notes: inv.notes || '',
  }));
}

export function exportToExcel(invoices: Invoice[], filename: string = 'invoices') {
  const data = mapInvoices(invoices);
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...data.map((row) => String((row as any)[key]).length)) + 2,
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

export function exportToCSV(invoices: Invoice[], filename: string = 'invoices') {
  const data = mapInvoices(invoices);
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}
