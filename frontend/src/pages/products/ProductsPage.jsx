import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '../../api';
import { Plus, Search, Edit3, Trash2, Package } from 'lucide-react';
import {
  Card, Button, Badge, Pagination, PageHeader, EmptyState, Modal,
  Input, Select, Textarea, formatCurrency, formatDate, ConfirmDialog, Skeleton
} from '../../components/ui';
import toast from 'react-hot-toast';

const ProductForm = ({ product, onSubmit, onClose, loading }) => {
  const [f, setF] = useState({
    name: product?.name || '', code: product?.code || '', description: product?.description || '',
    category: product?.category || '', price: product?.price || '', currency: product?.currency || 'USD',
    unit: product?.unit || 'Unit', taxRate: product?.taxRate || 0,
    discount: product?.discount || 0, minQuantity: product?.minQuantity || 1,
    stock: product?.stock || 0, isActive: product?.isActive ?? true,
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Product Name" required value={f.name} onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} placeholder="Enterprise License" />
        <Input label="Product Code" value={f.code} onChange={(e) => setF(p => ({ ...p, code: e.target.value }))} placeholder="PROD-001" />
        <Textarea label="Description" value={f.description} rows={2} onChange={(e) => setF(p => ({ ...p, description: e.target.value }))} className="col-span-2" />
        <Input label="Category" value={f.category} onChange={(e) => setF(p => ({ ...p, category: e.target.value }))} placeholder="Software, Service..." />
        <Input label="Unit" value={f.unit} onChange={(e) => setF(p => ({ ...p, unit: e.target.value }))} placeholder="Unit, Month, Hour..." />
        <Input label="Price" type="number" required value={f.price} onChange={(e) => setF(p => ({ ...p, price: e.target.value }))} placeholder="99.99" />
        <Input label="Tax Rate (%)" type="number" value={f.taxRate} onChange={(e) => setF(p => ({ ...p, taxRate: e.target.value }))} placeholder="18" />
        <Input label="Stock" type="number" value={f.stock} onChange={(e) => setF(p => ({ ...p, stock: e.target.value }))} />
        <Input label="Min Quantity" type="number" value={f.minQuantity} onChange={(e) => setF(p => ({ ...p, minQuantity: e.target.value }))} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="active" checked={f.isActive} onChange={(e) => setF(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
        <label htmlFor="active" className="text-sm font-medium text-slate-700">Active</label>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{product ? 'Update' : 'Create Product'}</Button>
      </div>
    </form>
  );
};

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsAPI.getAll({ page, search, limit: 20 });
      setProducts(data.data); setTotal(data.total); setPages(data.pages);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (searchParams.get('action') === 'new') setShowModal(true); }, [searchParams]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try { await productsAPI.create(data); toast.success('Product created'); setShowModal(false); loadData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };
  const handleUpdate = async (data) => {
    setFormLoading(true);
    try { await productsAPI.update(editing._id, data); toast.success('Updated'); setEditing(null); loadData(); }
    catch { toast.error('Failed'); } finally { setFormLoading(false); }
  };
  const handleDelete = async () => {
    try { await productsAPI.delete(deleteConfirm._id); toast.success('Deleted'); setDeleteConfirm(null); loadData(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <PageHeader title="Products & Services" subtitle={`${total} items`}
        actions={<Button onClick={() => setShowModal(true)} icon={Plus}>New Product</Button>} />
      <Card padding="p-4" className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50" />
        </div>
      </Card>
      <Card padding="">
        {loading ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          : products.length === 0 ? <EmptyState icon={Package} title="No products" description="Add products to include in quotations." action={() => setShowModal(true)} actionLabel="Add Product" />
          : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                    {['Product', 'Category', 'Price', 'Tax', 'Stock', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{p.name}</p>
                              <p className="text-xs text-slate-400">{p.code} • {p.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{p.category || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatCurrency(p.price, p.currency)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{p.taxRate}%</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{p.stock}</td>
                        <td className="px-4 py-3">
                          <Badge variant={p.isActive ? 'success' : 'default'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pages} total={total} limit={20} onPageChange={setPage} />
            </>
          )}
      </Card>
      <Modal isOpen={showModal || !!editing} onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Edit Product' : 'New Product'} size="lg">
        <ProductForm product={editing} onSubmit={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }} loading={formLoading} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Product" message={`Delete "${deleteConfirm?.name}"?`} />
    </div>
  );
};

export default ProductsPage;
