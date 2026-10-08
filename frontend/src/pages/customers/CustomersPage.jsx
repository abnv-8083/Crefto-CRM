import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { customersAPI, usersAPI } from '../../api';
import { Plus, Search, Edit3, Trash2, UserCheck, X } from 'lucide-react';
import {
  Card, Button, StatusBadge, Avatar, Pagination, PageHeader, EmptyState,
  Modal, Input, Select, Textarea, formatCurrency, formatDate, ConfirmDialog, Skeleton, Badge
} from '../../components/ui';
import toast from 'react-hot-toast';

const CustomerForm = ({ customer, onSubmit, onClose, users, loading }) => {
  const [f, setF] = useState({
    name: customer?.name || '', company: customer?.company || '',
    email: customer?.email || '', phone: customer?.phone || '',
    address: customer?.address || '', city: customer?.city || '',
    state: customer?.state || '', country: customer?.country || '',
    industry: customer?.industry || '', customerType: customer?.customerType || 'Individual',
    assignedTo: customer?.assignedTo?._id || customer?.assignedTo || '',
    notes: customer?.notes || '', tags: customer?.tags?.join(', ') || '',
    status: customer?.status || 'active',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, tags: f.tags.split(',').map(t => t.trim()).filter(Boolean) }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" required value={f.name} onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" className="col-span-2" />
        <Input label="Company" value={f.company} onChange={(e) => setF(p => ({ ...p, company: e.target.value }))} />
        <Input label="Email" type="email" value={f.email} onChange={(e) => setF(p => ({ ...p, email: e.target.value }))} />
        <Input label="Phone" value={f.phone} onChange={(e) => setF(p => ({ ...p, phone: e.target.value }))} />
        <Select label="Type" value={f.customerType} onChange={(e) => setF(p => ({ ...p, customerType: e.target.value }))}>
          <option>Individual</option><option>Business</option>
        </Select>
        <Select label="Status" value={f.status} onChange={(e) => setF(p => ({ ...p, status: e.target.value }))}>
          <option value="active">Active</option><option value="inactive">Inactive</option><option value="churned">Churned</option>
        </Select>
        <Input label="Industry" value={f.industry} onChange={(e) => setF(p => ({ ...p, industry: e.target.value }))} />
        <Select label="Assigned To" value={f.assignedTo} onChange={(e) => setF(p => ({ ...p, assignedTo: e.target.value }))}>
          <option value="">Unassigned</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
        </Select>
        <Input label="City" value={f.city} onChange={(e) => setF(p => ({ ...p, city: e.target.value }))} />
        <Input label="Country" value={f.country} onChange={(e) => setF(p => ({ ...p, country: e.target.value }))} />
        <Textarea label="Notes" value={f.notes} rows={3} onChange={(e) => setF(p => ({ ...p, notes: e.target.value }))} className="col-span-2" />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{customer ? 'Update' : 'Create Customer'}</Button>
      </div>
    </form>
  );
};

const CustomersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { if (searchParams.get('action') === 'new') setShowModal(true); }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([customersAPI.getAll({ page, limit: 20, search }), usersAPI.getAll()]);
      setCustomers(cRes.data.data); setTotal(cRes.data.total); setPages(cRes.data.pages);
      setUsers(uRes.data.data);
    } catch { toast.error('Failed to load customers'); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try { await customersAPI.create(data); toast.success('Customer created'); setShowModal(false); loadData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try { await customersAPI.update(editingCustomer._id, data); toast.success('Customer updated'); setEditingCustomer(null); loadData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try { await customersAPI.delete(deleteConfirm._id); toast.success('Customer deleted'); setDeleteConfirm(null); loadData(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${total} total customers`}
        actions={<><Button onClick={() => setShowModal(true)} icon={Plus}>New Customer</Button></>} />

      <Card padding="p-4" className="mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50" />
          </div>
        </div>
      </Card>

      <Card padding="">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : customers.length === 0 ? (
          <EmptyState icon={UserCheck} title="No customers yet" description="Convert leads or add customers directly."
            action={() => setShowModal(true)} actionLabel="Add Customer" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Customer', 'Company', 'Type', 'Total Revenue', 'Total Deals', 'Assigned', 'Status', 'Since', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c._id} onClick={() => navigate(`/customers/${c._id}`)}
                      className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" />
                          <div><p className="font-medium text-slate-800">{c.name}</p><p className="text-xs text-slate-400">{c.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.company || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={c.customerType === 'Business' ? 'primary' : 'info'}>{c.customerType}</Badge></td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatCurrency(c.totalRevenue)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.totalDeals}</td>
                      <td className="px-4 py-3">
                        {c.assignedTo ? <div className="flex items-center gap-2"><Avatar name={`${c.assignedTo.firstName} ${c.assignedTo.lastName}`} size="xs" /><span className="text-sm">{c.assignedTo.firstName}</span></div> : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(c.customerSince)}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingCustomer(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteConfirm(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

      <Modal isOpen={showModal || !!editingCustomer} onClose={() => { setShowModal(false); setEditingCustomer(null); }}
        title={editingCustomer ? `Edit — ${editingCustomer.name}` : 'New Customer'} size="lg">
        <CustomerForm customer={editingCustomer} onSubmit={editingCustomer ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditingCustomer(null); }} users={users} loading={formLoading} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Customer" message={`Delete "${deleteConfirm?.name}"? All related data will remain.`} />
    </div>
  );
};

export default CustomersPage;
