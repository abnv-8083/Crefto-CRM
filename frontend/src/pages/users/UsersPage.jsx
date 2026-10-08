import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../../api';
import { Plus, Edit3, Trash2, Users, ToggleLeft, ToggleRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Card, Button, Badge, StatusBadge, Avatar, Pagination, PageHeader, EmptyState,
  Modal, Input, Select, formatDate, ConfirmDialog, Skeleton
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ROLES = ['manager', 'developer', 'sales_rep'];
const ROLE_LABELS = {
  manager: 'Manager', developer: 'Developer', sales_rep: 'Sales Rep'
};

const UserForm = ({ user, onSubmit, onClose, loading }) => {
  const [f, setF] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '',
    email: user?.email || '', role: user?.role || 'sales_rep',
    phone: user?.phone || '', password: '',
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); const d = { ...f }; if (!d.password) delete d.password; onSubmit(d); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" required value={f.firstName} onChange={(e) => setF(p => ({ ...p, firstName: e.target.value }))} />
        <Input label="Last Name" required value={f.lastName} onChange={(e) => setF(p => ({ ...p, lastName: e.target.value }))} />
        <Input label="Email" type="email" required value={f.email} onChange={(e) => setF(p => ({ ...p, email: e.target.value }))} />
        <Input label="Phone" value={f.phone} onChange={(e) => setF(p => ({ ...p, phone: e.target.value }))} />
        <Select label="Role" required value={f.role} onChange={(e) => setF(p => ({ ...p, role: e.target.value }))}>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </Select>
        <Input label={user ? 'New Password (optional)' : 'Password (optional)'} type="password" value={f.password}
          onChange={(e) => setF(p => ({ ...p, password: e.target.value }))}
          placeholder={user ? 'Leave blank to keep' : 'Leave blank to generate & email'} />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{user ? 'Update' : 'Create User'}</Button>
      </div>
    </form>
  );
};

const UsersPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getAll({ page, limit: 20 });
      setUsers(data.data); setTotal(data.total); setPages(data.pages);
    } catch { toast.error('Failed to load users'); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      const { data } = await usersAPI.create(formData);
      if (data.emailSent) {
        toast.success(data.message || `Credentials emailed to ${data.data?.email}`);
      } else if (data.tempPassword) {
        // SMTP not configured — show the generated password so the manager can share it
        toast(`Email not configured — share manually. ${data.data?.email} → ${data.tempPassword}`,
          { icon: '⚠️', duration: 12000 });
      } else {
        toast.success(data.message || 'User created');
      }
      setShowModal(false); loadData();
    }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };
  const handleApprove = async (u) => {
    try {
      const { data } = await usersAPI.approve(u._id);
      toast.success(data.message || `${u.firstName} approved`);
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to approve'); }
  };
  const handleReject = async (u) => {
    try {
      const { data } = await usersAPI.reject(u._id);
      toast.success(data.message || 'Registration rejected');
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to reject'); }
  };
  const handleUpdate = async (data) => {
    setFormLoading(true);
    try { await usersAPI.update(editing._id, data); toast.success('User updated'); setEditing(null); loadData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };
  const handleDelete = async () => {
    try { await usersAPI.delete(deleteConfirm._id); toast.success('User deleted'); setDeleteConfirm(null); loadData(); }
    catch { toast.error('Failed'); }
  };
  const handleToggle = async (u) => {
    try { await usersAPI.toggleStatus(u._id); toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`); loadData(); }
    catch { toast.error('Failed'); }
  };

  const roleColors = {
    manager: 'purple', developer: 'info', sales_rep: 'success'
  };

  const pendingCount = users.filter(u => u.approvalStatus === 'pending').length;

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${total} team members`}
        actions={<Button onClick={() => setShowModal(true)} icon={Plus}>Add User</Button>} />

      {/* Pending approvals */}
      {pendingCount > 0 && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{pendingCount}</strong> {pendingCount === 1 ? 'user is' : 'users are'} awaiting approval — they cannot log in until you approve {pendingCount === 1 ? 'them' : 'them'}.
          </p>
        </div>
      )}

      <Card padding="">
        {loading ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          : users.length === 0 ? <EmptyState icon={Users} title="No users" description="Add your team members — credentials are emailed to them." action={() => setShowModal(true)} actionLabel="Add User" />
          : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                    {['User', 'Role', 'Status', 'Approval', 'Leads', 'Deals', 'Last Active', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                              <div className="relative">
                              <Avatar name={`${u.firstName} ${u.lastName}`} />
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-1 ring-white ${u.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant={roleColors[u.role] || 'default'}>{ROLE_LABELS[u.role]}</Badge></td>
                        <td className="px-4 py-3">
                          <Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            u.approvalStatus === 'approved' ? 'success'
                            : u.approvalStatus === 'rejected' ? 'danger'
                            : 'warning'
                          }>
                            {u.approvalStatus === 'approved' ? 'Approved'
                              : u.approvalStatus === 'rejected' ? 'Rejected'
                              : 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{u.leadsCount || 0}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{u.dealsCount || 0}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{u.lastActiveAt ? formatDate(u.lastActiveAt) : 'Never'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {u.approvalStatus === 'pending' && (
                              <>
                                <button onClick={() => handleApprove(u)} title="Approve — lets them log in"
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600 transition-colors">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleReject(u)} title="Reject registration"
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {u._id !== currentUser?._id && (
                              <button onClick={() => handleToggle(u)}
                                title={u.isActive ? 'Deactivate user' : 'Activate user'}
                                className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-amber-50 text-amber-500 hover:text-amber-600' : 'hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600'}`}>
                                {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                            )}
                            <button onClick={() => setEditing(u)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
                            {u._id !== currentUser?._id && (
                              <button onClick={() => setDeleteConfirm(u)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
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
        title={editing ? `Edit ${editing.firstName} ${editing.lastName}` : 'Add Team Member'} size="md">
        <UserForm user={editing} onSubmit={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }} loading={formLoading} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete User" message={`Delete "${deleteConfirm?.firstName} ${deleteConfirm?.lastName}"? Their data will remain but they'll lose access.`} />
    </div>
  );
};

export default UsersPage;
