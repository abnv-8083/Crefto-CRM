import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { quotationsAPI, customersAPI, productsAPI, usersAPI } from '../../api';
import { Plus, FileText, Edit3, Trash2, Send } from 'lucide-react';
import {
  Card, Button, Badge, StatusBadge, Avatar, Pagination, PageHeader, EmptyState,
  Modal, Input, Select, Textarea, formatCurrency, formatDate, ConfirmDialog, Skeleton
} from '../../components/ui';
import toast from 'react-hot-toast';

const QuotationsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  // Quotation form state
  const [qForm, setQForm] = useState({
    title: '', customer: '', validUntil: '',
    notes: '', termsAndConditions: '',
    items: [{ product: '', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }],
  });

  useEffect(() => { if (searchParams.get('action') === 'new') setShowModal(true); }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, cRes, pRes] = await Promise.all([
        quotationsAPI.getAll({ page, limit: 20 }),
        customersAPI.getAll({ limit: 200 }),
        productsAPI.getAll({ limit: 200 }),
      ]);
      setQuotations(qRes.data.data); setTotal(qRes.data.total); setPages(qRes.data.pages);
      setCustomers(cRes.data.data); setProducts(pRes.data.data);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const addItem = () => setQForm(p => ({ ...p, items: [...p.items, { product: '', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }] }));
  const removeItem = (i) => setQForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const updateItem = (index, field, value) => {
    setQForm(p => {
      const items = [...p.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'product') {
        const prod = products.find(pr => pr._id === value);
        if (prod) { items[index].unitPrice = prod.price; items[index].taxRate = prod.taxRate; items[index].description = prod.description; }
      }
      return { ...p, items };
    });
  };

  const getItemTotal = (item) => {
    const subtotal = (item.quantity || 1) * (item.unitPrice || 0);
    const discount = subtotal * ((item.discount || 0) / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * ((item.taxRate || 0) / 100);
    return afterDiscount + tax;
  };

  const getGrandTotal = () => qForm.items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await quotationsAPI.create(qForm);
      toast.success('Quotation created');
      setShowModal(false);
      setQForm({ title: '', customer: '', validUntil: '', notes: '', termsAndConditions: '', items: [{ product: '', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }] });
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try { await quotationsAPI.delete(deleteConfirm._id); toast.success('Deleted'); setDeleteConfirm(null); loadData(); }
    catch { toast.error('Failed'); }
  };

  const statusColors = { 'Draft': 'default', 'Sent': 'info', 'Accepted': 'success', 'Rejected': 'danger', 'Expired': 'default' };

  return (
    <div>
      <PageHeader title="Quotations" subtitle={`${total} quotations`}
        actions={<Button onClick={() => setShowModal(true)} icon={Plus}>New Quotation</Button>} />

      <Card padding="">
        {loading ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          : quotations.length === 0 ? <EmptyState icon={FileText} title="No quotations" description="Create professional quotations for customers." action={() => setShowModal(true)} actionLabel="New Quotation" />
          : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                    {['Quotation', 'Customer', 'Amount', 'Status', 'Valid Until', 'Created', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {quotations.map(q => (
                      <tr key={q._id} onClick={() => navigate(`/quotations/${q._id}`)}
                        className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{q.title}</p>
                          <p className="text-xs text-slate-400">{q.quotationId}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{q.customer?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatCurrency(q.total)}</td>
                        <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                        <td className="px-4 py-3 text-xs text-slate-400">{formatDate(q.validUntil)}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{formatDate(q.createdAt)}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={() => setDeleteConfirm(q)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Create Quotation Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Quotation" size="xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quotation Title" required value={qForm.title} onChange={(e) => setQForm(p => ({ ...p, title: e.target.value }))} placeholder="Q4 Enterprise Proposal" className="col-span-2" />
            <Select label="Customer" required value={qForm.customer} onChange={(e) => setQForm(p => ({ ...p, customer: e.target.value }))}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Input label="Valid Until" type="date" value={qForm.validUntil} onChange={(e) => setQForm(p => ({ ...p, validUntil: e.target.value }))} />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Line Items</h3>
              <Button variant="outline" size="sm" type="button" onClick={addItem} icon={Plus}>Add Item</Button>
            </div>
            <div className="space-y-3">
              {qForm.items.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-2">
                      <Select label="Product" value={item.product} onChange={(e) => updateItem(idx, 'product', e.target.value)}>
                        <option value="">Custom Item</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </Select>
                    </div>
                    <Input label="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description" />
                    <Input label="Qty" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))} />
                    <Input label="Unit Price" type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Total</label>
                      <div className="px-3 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl">
                        {formatCurrency(getItemTotal(item))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>Disc:</span>
                        <input type="number" value={item.discount} min="0" max="100"
                          onChange={(e) => updateItem(idx, 'discount', parseFloat(e.target.value))}
                          className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs" />
                        <span>%</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>Tax:</span>
                        <input type="number" value={item.taxRate} min="0"
                          onChange={(e) => updateItem(idx, 'taxRate', parseFloat(e.target.value))}
                          className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs" />
                        <span>%</span>
                      </div>
                    </div>
                    {qForm.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 p-3 bg-slate-50 rounded-xl">
              <div className="text-right">
                <p className="text-sm text-slate-500">Grand Total</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(getGrandTotal())}</p>
              </div>
            </div>
          </div>

          <Textarea label="Notes" value={qForm.notes} rows={2} onChange={(e) => setQForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />
          <Textarea label="Terms & Conditions" value={qForm.termsAndConditions} rows={2} onChange={(e) => setQForm(p => ({ ...p, termsAndConditions: e.target.value }))} />

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Create Quotation</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Quotation" message={`Delete "${deleteConfirm?.title}"?`} />
    </div>
  );
};

export default QuotationsPage;
