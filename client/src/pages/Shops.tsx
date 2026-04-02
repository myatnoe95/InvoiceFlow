import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Store, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useShops, useCreateShop, useUpdateShop, useDeleteShop } from '../hooks/useShops';
import type { Shop } from '../types';
import Modal from '../components/ui/Modal';

const emptyForm = { name: '', address: '', phone: '', email: '', prefix: '' };

export default function Shops() {
  const { data: shops, isLoading } = useShops();
  const createShop = useCreateShop();
  const updateShop = useUpdateShop();
  const deleteShop = useDeleteShop();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
    setModalOpen(true);
  }

  function openEdit(shop: Shop) {
    setEditing(shop);
    setForm({ name: shop.name, address: shop.address || '', phone: shop.phone || '', email: shop.email || '', prefix: shop.prefix });
    setLogoFile(null);
    setLogoPreview(shop.logo_url || null);
    setModalOpen(true);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('prefix', form.prefix);
    formData.append('address', form.address);
    formData.append('phone', form.phone);
    formData.append('email', form.email);
    if (logoFile) formData.append('logo', logoFile);

    try {
      if (editing) {
        await updateShop.mutateAsync({ id: editing.id, data: formData });
        toast.success('Shop updated');
      } else {
        await createShop.mutateAsync(formData);
        toast.success('Shop created');
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save shop');
    }
  }

  async function handleDelete(shop: Shop) {
    if (!confirm(`Delete "${shop.name}"? This will also delete all its invoices.`)) return;
    try {
      await deleteShop.mutateAsync(shop.id);
      toast.success('Shop deleted');
    } catch {
      toast.error('Failed to delete shop');
    }
  }

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Add Shop
        </button>
      </div>

      {shops?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Store size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">No shops yet. Add your first shop to get started.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Add Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops?.map((shop) => (
            <div key={shop.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt={shop.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Store size={18} className="text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-mono rounded">
                      {shop.prefix}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(shop)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(shop)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {shop.address && <p className="text-sm text-gray-500 mb-1">{shop.address}</p>}
              {shop.phone && <p className="text-sm text-gray-500 mb-1">{shop.phone}</p>}
              {shop.email && <p className="text-sm text-gray-500 mb-1">{shop.email}</p>}
              <p className="text-sm text-gray-400 mt-3">{shop.invoice_count || 0} invoices</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Shop' : 'Add Shop'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Logo</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Store size={24} className="text-gray-300" />
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >
                  <Upload size={14} /> {logoPreview ? 'Change' : 'Upload'}
                </button>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="My Shop"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prefix * <span className="text-gray-400">(for invoice numbers)</span></label>
            <input
              type="text"
              required
              maxLength={10}
              value={form.prefix}
              onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="SHOP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createShop.isPending || updateShop.isPending} className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
