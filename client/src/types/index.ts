export interface Shop {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  prefix: string;
  logo_url?: string;
  invoice_count?: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
}

export interface Invoice {
  id: number;
  shop_id: number;
  shop_name?: string;
  shop_prefix?: string;
  shop_address?: string;
  shop_phone?: string;
  shop_email?: string;
  shop_logo?: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  delivery_fees: number;
  total: number;
  notes?: string;
  payment_terms?: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'cod' | 'overdue';
  items: InvoiceItem[];
  payments?: Payment[];
  total_paid?: number;
  remaining?: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  method: string;
  amount: number;
  note?: string;
  paid_at: string;
}

export interface DashboardStats {
  shop_count: number;
  invoice_count: number;
  status_counts: { status: string; count: number; total_amount: number }[];
  total_revenue: number;
  recent_invoices: Invoice[];
}
