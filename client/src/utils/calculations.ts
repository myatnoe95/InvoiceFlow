import type { InvoiceItem } from '../types';

export function calcSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export function calcTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

export function calcDiscount(
  subtotal: number,
  type: 'none' | 'percentage' | 'fixed',
  value: number
): number {
  if (type === 'percentage') return subtotal * (value / 100);
  if (type === 'fixed') return value;
  return 0;
}

export function calcTotal(subtotal: number, taxAmount: number, discountAmount: number, deliveryFees: number = 0): number {
  return subtotal + taxAmount - discountAmount + deliveryFees;
}
