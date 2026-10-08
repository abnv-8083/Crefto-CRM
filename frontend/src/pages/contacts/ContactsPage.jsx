import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { contactsAPI, customersAPI, usersAPI } from '../../api';
import { Plus, Search, Edit3, Trash2, Contact } from 'lucide-react';
import { Card, Button, Avatar, Pagination, PageHeader, EmptyState, Modal, Input, Select, Textarea, formatDate, ConfirmDialog, Skeleton } from '../../components/ui';
import toast from 'react-hot-toast';

const ContactForm = ({ contact, onSubmit, onClose, customers, loading }) => {
  const [f, setF] = useState({
    firstName: contact?.firstName || '', lastName: contact?.lastName || '',
    company: contact?.company || '', email: contact?.email || '',
    phone: contact?.phone || '', jobTitle: contact?.jobTitle || '',
    department: contact?.department || '', address: contact?.address || '',
    city: contact?.city || '', country: contact?.country || '',
    linkedCustomer: contact?.linkedCustomer?._id || contact?.linkedCustomer || '',
    notes: contact?.notes || '',
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" required value={f.firstName} onChange={(e) => setF(p => ({ ...p, firstName: e.target.value }))} />
        <Input label="Last Name" required value={f.lastName} onChange={(e) => setF(p => ({ ...p, lastName: e.target.value }))} />
        <Input label="Email" type="email" value={f.email} onChange={(e) => setF(p => ({ ...p, email: e.target.value }))} />
        <Input label="Phone" value={f.phone} onChange={(e) => setF(p => ({ ...p, phone: e.target.value }))} />
        <Input label="Company" value={f.company} onChange={(e) => setF(p => ({ ...p, company: e.target.value }))} />
        <Input label="Job Title" value={f.jobTitle} onChange={(e) => setF(p => ({ ...p, jobTitle: e.target.value }))} />
        <Input label="Department" value={f.department} onChange={(e) => setF(p => ({ ...p, department: e.target.value }))} />
        <Select label="Linked Customer" value={f.linkedCustomer} onChange={(e) => setF(p => ({ ...p, linkedCustomer: e.target.value }))}>
          <option value="">No Customer</option>
          {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Input label="City" value={f.city} onChange={(e) => setF(p => ({ ...p, city: e.target.value }))} />
        <Input label="Country" value={f.country} onChange={(e) => setF(p => ({ ...p, country: e.target.value }))} />
        <Textarea label="Notes" value={f.notes} rows={3} onChange={(e) => setF(p => ({ ...p, notes: e.target.value }))} className="col-span-2" />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{contact ? 'Update' : 'Create Contact'}</Button>
      </div>
    </form>
  );
};

const ContactsPage = () => {
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { if (searchParams.get('action') === 'new') setShowModal(true); }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, custRes] = await Promise.all([contactsAPI.getAll({ page, search }), customersAPI.getAll({ limit: 200 })]);
      setContacts(cRes.data.data); setTotal(cRes.data.total); setPages(cRes.data.pages);
      setCustomers(custRes.data.data);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try { await contactsAPI.create(data); toast.success('Contact created'); setShowModal(false); loadData(); }
    catch { toast.error('Failed'); } finally { setFormLoading(false); }
  };
  const handleUpdate = async (data) => {
    setFormLoading(true);
    try { await contactsAPI.update(editing._id, data); toast.success('Contact updated'); setEditing(null); loadData(); }
    catch { toast.error('Failed'); } finally { setFormLoading(false); }
  };
  const handleDelete = async () => {
    try { await contactsAPI.delete(deleteConfirm._id); toast.success('Deleted'); setDeleteConfirm(null); loadData(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${total} contacts`}
        actions={<Button onClick={() => setShowModal(true)} icon={Plus}>New Contact</Button>} />
      <Card padding="p-4" className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50" />
        </div>
      </Card>
      <Card padding="">
        {loading ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          : contacts.length === 0 ? <EmptyState icon={Contact} title="No contacts" description="Add your first contact." action={() => setShowModal(true)} actionLabel="Add Contact" />
          : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                    {['Name', 'Company', 'Job Title', 'Email', 'Phone', 'Linked To', 'Created', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {contacts.map(c => (
                      <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={`${c.firstName} ${c.lastName}`} size="sm" />
                            <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{c.firstName} {c.lastName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{c.company || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{c.jobTitle || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{c.email || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{c.phone || '—'}</td>
                        <td className="px-4 py-3 text-sm text-indigo-600 hover:underline cursor-pointer">{c.linkedCustomer?.name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setEditing(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
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
      <Modal isOpen={showModal || !!editing} onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Edit Contact' : 'New Contact'} size="lg">
        <ContactForm contact={editing} onSubmit={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }} customers={customers} loading={formLoading} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Contact" message={`Delete "${deleteConfirm?.firstName} ${deleteConfirm?.lastName}"?`} />
    </div>
  );
};

export default ContactsPage;
