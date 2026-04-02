import { formatCurrency } from '../../utils/format';

interface Props {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  deliveryFees: number;
  total: number;
  onTaxRateChange: (rate: number) => void;
  onDiscountTypeChange: (type: 'none' | 'percentage' | 'fixed') => void;
  onDiscountValueChange: (value: number) => void;
  onDeliveryFeesChange: (fees: number) => void;
}

export default function InvoiceSummary({
  subtotal, taxRate, taxAmount, discountType, discountValue, discountAmount,
  deliveryFees, total,
  onTaxRateChange, onDiscountTypeChange, onDiscountValueChange, onDeliveryFeesChange,
}: Props) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex items-center justify-between text-sm gap-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Tax</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={taxRate || ''}
            onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-gray-500">%</span>
        </div>
        <span className="font-medium text-green-600">+{formatCurrency(taxAmount)}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-600">Discount</span>
          <select
            value={discountType}
            onChange={(e) => onDiscountTypeChange(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="none">None</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
          {discountType !== 'none' && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                step="any"
                value={discountValue || ''}
                onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-gray-500">{discountType === 'percentage' ? '%' : 'MMK'}</span>
            </div>
          )}
        </div>
        {discountAmount > 0 && (
          <span className="font-medium text-red-500">-{formatCurrency(discountAmount)}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm gap-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Delivery Fees</span>
          <input
            type="number"
            min="0"
            step="any"
            value={deliveryFees || ''}
            onChange={(e) => onDeliveryFeesChange(parseFloat(e.target.value) || 0)}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        {deliveryFees > 0 && (
          <span className="font-medium text-blue-600">+{formatCurrency(deliveryFees)}</span>
        )}
      </div>

      <div className="border-t border-gray-200 pt-3 flex justify-between">
        <span className="text-base font-semibold text-gray-900">Total</span>
        <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
