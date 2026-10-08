import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { followUpsAPI, leadsAPI, customersAPI, usersAPI } from '../../api';
import { Plus, Phone, Calendar, Edit3, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import {
  Card, Button, Badge, StatusBadge, Avatar, Pagination, PageHeader, EmptyState,
  Modal, Input, Select, Textarea, formatDate, ConfirmDialog, Skeleton, Tabs
} from '../../components/ui';
import toast from 'react-hot-toast';

const FollowUpForm = ({ followUp, onSubmit, onClose, users, loading }) => {
  const [f, setF] = useState({
    title: followUp?.title || '', notes: followUp?.notes || '',
    scheduledAt: followUp?.scheduledAt ? new Date(followUp.scheduledAt).toISOString().slice(0, 16) : '',
    type: followUp?.type || 'Call',
    assignedTo: followUp?.assignedTo?._id || followUp?.assignedTo || '',
    status: followUp?.status || 'Pending',
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4">
      <Input label="Follow-up Title" required value={f.title} onChange={(e) => setF(p => ({ ...p, title: e.target.value }))} placeholder="Call with prospect..." />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Type" value={f.type} onChange={(e) => setF(p => ({ ...p, type: e.target.value }))}>
          {['Call', 'Email', 'Meeting', 'WhatsApp', 'Other'].map(t => <option key={t}>{t}</option>)}
        </Select>
        <Select label="Status" value={f.status} onChange={(e) => setF(p => ({ ...p, status: e.target.value }))}>
          {['Pending', 'Completed', 'Rescheduled', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </Select>
        <Input label="Scheduled Date & Time" type="datetime-local" required value={f.scheduledAt} onChange={(e) => setF(p => ({ ...p, scheduledAt: e.target.value }))} className="col-span-2" />
        <Select label="Assigned To" value={f.assignedTo} onChange={(e) => setF(p => ({ ...p, assignedTo: e.target.value }))} className="col-span-2">
          <option value="">Unassigned</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
        </Select>
      </div>
      <Textarea label="Notes" value={f.notes} rows={3} onChange={(e) => setF(p => ({ ...p, notes: e.target.value }))} />
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{followUp ? 'Update' : 'Schedule Follow-up'}</Button>
      </div>
    </form>
  );
};

const FollowUpsPage = () => {
  const [searchParams] = useSearchParams();
  const [followUps, setFollowUps] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [period, setPeriod] = useState('upcoming');

  useEffect(() => { if (searchParams.get('action') === 'new') setShowModal(true); }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, uRes] = await Promise.all([followUpsAPI.getAll({ page, limit: 20, period }), usersAPI.getAll()]);
      setFollowUps(fRes.data.data); setTotal(fRes.data.total); setPages(fRes.data.pages);
      setUsers(uRes.data.data);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [page, period]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try { await followUpsAPI.create(data); toast.success('Follow-up scheduled'); setShowModal(false); loadData(); }
    catch { toast.error('Failed'); } finally { setFormLoading(false); }
  };
  const handleUpdate = async (data) => {
    setFormLoading(true);
    try { await followUpsAPI.update(editing._id, data); toast.success('Updated'); setEditing(null); loadData(); }
    catch { toast.error('Failed'); } finally { setFormLoading(false); }
  };
  const handleDelete = async () => {
    try { await followUpsAPI.delete(deleteConfirm._id); toast.success('Deleted'); setDeleteConfirm(null); loadData(); }
    catch { toast.error('Failed'); }
  };
  const handleComplete = async (fu) => {
    try { await followUpsAPI.update(fu._id, { status: 'Completed' }); toast.success('Follow-up completed!'); loadData(); }
    catch { toast.error('Failed'); }
  };

  const typeIcons = { Call: '📞', Email: '📧', Meeting: '🤝', WhatsApp: '💬', Other: '📝' };

  const tabs = [
    { value: 'upcoming', label: 'Upcoming', icon: Clock },
    { value: 'today', label: 'Today', icon: Calendar },
    { value: 'overdue', label: 'Overdue', icon: AlertTriangle },
    { value: 'all', label: 'All' },
  ];

  return (
    <div>
      <PageHeader title="Follow-ups" subtitle={`${total} follow-ups`}
        actions={<Button onClick={() => setShowModal(true)} icon={Plus}>Schedule Follow-up</Button>} />

      <div className="mb-4">
        <Tabs tabs={tabs} activeTab={period} onChange={setPeriod} variant="button" />
      </div>

      <Card padding="">
        {loading ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          : followUps.length === 0 ? <EmptyState icon={Phone} title="No follow-ups" description={`No ${period} follow-ups`} action={() => setShowModal(true)} actionLabel="Schedule One" />
          : (
            <>
              <div className="divide-y divide-slate-50">
                {followUps.map(fu => {
                  const isOverdue = fu.status === 'Overdue' || (new Date(fu.scheduledAt) < new Date() && fu.status === 'Pending');
                  return (
                    <div key={fu._id} className={`relative px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/40' : ''}`}>
                      {isOverdue && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-400 rounded-r-full" />}
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
                        {typeIcons[fu.type] || '📌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{fu.title}</p>
                            {fu.notes && <p className="text-xs text-slate-400 mt-0.5">{fu.notes}</p>}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(fu.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {fu.assignedTo && (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <Avatar name={`${fu.assignedTo.firstName} ${fu.assignedTo.lastName}`} size="xs" />
                                  {fu.assignedTo.firstName}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={fu.status} />
                            {fu.status === 'Pending' && (
                              <button onClick={() => handleComplete(fu)}
                                className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 active:scale-95 transition-all">
                                <CheckCircle className="w-3.5 h-3.5" /> Done
                              </button>
                            )}
                            <button onClick={() => setEditing(fu)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteConfirm(fu)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination page={page} pages={pages} total={total} limit={20} onPageChange={setPage} />
            </>
          )}
      </Card>

      <Modal isOpen={showModal || !!editing} onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Edit Follow-up' : 'Schedule Follow-up'} size="md">
        <FollowUpForm followUp={editing} onSubmit={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }} users={users} loading={formLoading} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Follow-up" message={`Delete "${deleteConfirm?.title}"?`} />
    </div>
  );
};

export default FollowUpsPage;
