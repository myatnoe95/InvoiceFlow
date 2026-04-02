import { Trash2 } from 'lucide-react';
import type { InvoiceItem } from '../../types';
import { formatCurrency } from '../../utils/format';

interface Props {
  item: InvoiceItem;
  index: number;
  onChange: (index: number, field: keyof InvoiceItem, value: string | number) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export default function LineItemRow({ item, index, onChange, onRemove, canRemove }: Props) {
  return (
    <>
      {/* Desktop row */}
      <tr className="hidden md:table-row border-b border-gray-100">
        <td className="p-2">
          <input
            type="text"
            required
            value={item.description}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Item description"
          />
        </td>
        <td className="p-2 w-24">
          <input
            type="number"
            required
            min="0.01"
            step="any"
            value={item.quantity || ''}
            onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </td>
        <td className="p-2 w-32">
          <input
            type="number"
            required
            min="0"
            step="any"
            value={item.unit_price || ''}
            onChange={(e) => onChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </td>
        <td className="p-2 w-28 text-right text-sm font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
        <td className="p-2 w-10">
          {canRemove && (
            <button type="button" onClick={() => onRemove(index)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          )}
        </td>
      </tr>

      {/* Mobile card */}
      <div className="md:hidden bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
          {canRemove && (
            <button type="button" onClick={() => onRemove(index)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <input
          type="text"
          required
          value={item.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Description"
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500">Qty</label>
            <input
              type="number"
              required
              min="0.01"
              step="any"
              value={item.quantity || ''}
              onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Price</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              value={item.unit_price || ''}
              onChange={(e) => onChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Amount</label>
            <p className="px-2 py-1.5 text-sm font-medium">{formatCurrency(item.quantity * item.unit_price)}</p>
          </div>
        </div>
      </div>
    </>
  );
}
