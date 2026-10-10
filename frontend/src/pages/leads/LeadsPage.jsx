import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { leadsAPI, usersAPI } from '../../api';
import {
  Plus, Search, Filter, Download, Upload, LayoutGrid, List,
  MoreVertical, Target, RefreshCw, Trash2, UserPlus, Edit3, X
} from 'lucide-react';
import {
  Card, Button, Badge, StatusBadge, ScoreBadge, Avatar, Table, Pagination,
  PageHeader, EmptyState, Modal, Input, Select, Textarea, FilterBar,
  formatCurrency, formatDate, ConfirmDialog, Skeleton
} from '../../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];
const LEAD_SOURCES = ['Website', 'Google', 'Facebook', 'Instagram', 'WhatsApp', 'Referral', 'Cold Call', 'Email', 'Advertisement', 'Other'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Real Estate', 'Education', 'Retail', 'Manufacturing', 'Logistics', 'Media', 'Other'];

const STAGE_COLORS = {
  'New': 'bg-indigo-50 border-indigo-200',
  'Contacted': 'bg-sky-50 border-sky-200',
  'Qualified': 'bg-emerald-50 border-emerald-200',
  'Proposal Sent': 'bg-amber-50 border-amber-200',
  'Negotiation': 'bg-orange-50 border-orange-200',
  'Converted': 'bg-green-50 border-green-200',
  'Lost': 'bg-slate-50 border-slate-200',
};

// Lead form component
const LeadForm = ({ lead, onSubmit, onClose, users, loading, user }) => {
  const [formData, setFormData] = useState({
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    company: lead?.company || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    alternatePhone: lead?.alternatePhone || '',
    website: lead?.website || '',
    industry: lead?.industry || '',
    location: lead?.location || '',
    source: lead?.source || 'Website',
    status: lead?.status || 'New',
    score: lead?.score || 50,
    assignedTo: lead?.assignedTo?._id || lead?.assignedTo || '',
    expectedValue: lead?.expectedValue || '',
    notes: lead?.notes || '',
    nextFollowUpDate: lead?.nextFollowUpDate ? lead.nextFollowUpDate.slice(0, 10) : '',
    tags: lead?.tags?.join(', ') || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      expectedValue: parseFloat(formData.expectedValue) || 0,
      score: parseInt(formData.score) || 0,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      assignedTo: formData.assignedTo || null,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" required value={formData.firstName}
          onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))} placeholder="John" />
        <Input label="Last Name" required value={formData.lastName}
          onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Company" value={formData.company}
          onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))} placeholder="Acme Corp" />
        <Input label="Email" type="email" value={formData.email}
          onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="john@acme.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone" value={formData.phone}
          onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555-0100" />
        <Input label="Alternate Phone" value={formData.alternatePhone}
          onChange={(e) => setFormData(p => ({ ...p, alternatePhone: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Lead Source" value={formData.source}
          onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}>
          {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
        </Select>
        <Select label="Status" value={formData.status}
          onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}>
          {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Industry" value={formData.industry}
          onChange={(e) => setFormData(p => ({ ...p, industry: e.target.value }))}>
          <option value="">Select Industry</option>
          {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
        </Select>
        {user?.role !== 'sales_rep' && (
          <Select label="Assigned To" value={formData.assignedTo}
            onChange={(e) => setFormData(p => ({ ...p, assignedTo: e.target.value }))}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
          </Select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Expected Value ($)" type="number" value={formData.expectedValue}
          onChange={(e) => setFormData(p => ({ ...p, expectedValue: e.target.value }))} placeholder="5000" />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Lead Score: {formData.score}</label>
          <input type="range" min="0" max="100" value={formData.score}
            onChange={(e) => setFormData(p => ({ ...p, score: e.target.value }))}
            className="w-full accent-indigo-600" />
        </div>
      </div>
      <Input label="Next Follow-up Date" type="date" value={formData.nextFollowUpDate}
        onChange={(e) => setFormData(p => ({ ...p, nextFollowUpDate: e.target.value }))} />
      <Input label="Tags" value={formData.tags}
        onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))}
        placeholder="tag1, tag2, tag3" />
      <Textarea label="Notes" value={formData.notes} rows={3}
        onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
        placeholder="Additional notes about this lead..." />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit" loading={loading}>{lead ? 'Update Lead' : 'Create Lead'}</Button>
      </div>
    </form>
  );
};

// Kanban card component
const KanbanCard = ({ lead, onEdit, onDelete, onClick }) => (
  <div
    onClick={() => onClick(lead)}
    className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
  >
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">
            {lead.firstName} {lead.lastName}
          </p>
          {lead.company && <p className="text-xs text-slate-400">{lead.company}</p>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <div className="space-y-1.5 mt-3">
      {lead.expectedValue > 0 && (
        <p className="text-sm font-semibold text-indigo-600">{formatCurrency(lead.expectedValue)}</p>
      )}
      {lead.email && <p className="text-xs text-slate-400 truncate">{lead.email}</p>}
      <div className="flex items-center justify-between pt-1">
        <ScoreBadge score={lead.score} />
        {lead.assignedTo && (
          <span className="text-xs text-slate-400">
            {lead.assignedTo.firstName}
          </span>
        )}
      </div>
    </div>
  </div>
);

// Kanban column
const KanbanColumn = ({ status, leads, onEdit, onDelete, onCardClick, color }) => (
  <div className={`min-w-72 rounded-2xl border-2 ${color} p-3`}>
    <div className="flex items-center justify-between mb-3 px-1">
      <h3 className="text-sm font-semibold text-slate-700">{status}</h3>
      <span className="text-xs bg-white rounded-full px-2 py-0.5 font-semibold text-slate-500 border border-slate-200">
        {leads.length}
      </span>
    </div>
    <div className="space-y-2.5">
      {leads.map(lead => (
        <KanbanCard key={lead._id} lead={lead} onEdit={onEdit} onDelete={onDelete} onClick={onCardClick} />
      ))}
      {leads.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-400">No leads</p>
        </div>
      )}
    </div>
  </div>
);

const LeadsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [view, setView] = useState('table'); // 'table' | 'kanban'
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [filters, setFilters] = useState({
    search: '', status: '', source: '', assignedTo: ''
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') setShowModal(true);
  }, [searchParams]);

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await usersAPI.getAll();
      setUsers(data.data);
    } catch {}
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await leadsAPI.getAll({
        page, limit: 20,
        ...filters,
      });
      setLeads(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await leadsAPI.create(formData);
      toast.success('Lead created successfully');
      setShowModal(false);
      loadLeads();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setFormLoading(true);
    try {
      await leadsAPI.update(editingLead._id, formData);
      toast.success('Lead updated');
      setEditingLead(null);
      loadLeads();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await leadsAPI.delete(deleteConfirm._id);
      toast.success('Lead deleted');
      setDeleteConfirm(null);
      loadLeads();
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (!selectedLeads.length) return;
    try {
      await leadsAPI.bulkUpdate({ ids: selectedLeads, updates: { status } });
      toast.success(`${selectedLeads.length} leads updated`);
      setSelectedLeads([]);
      loadLeads();
    } catch {
      toast.error('Bulk update failed');
    }
  };

  // Group leads by status for kanban
  const kanbanGroups = LEAD_STATUSES.reduce((acc, status) => {
    acc[status] = leads.filter(l => l.status === status);
    return acc;
  }, {});

  const columns = [
    {
      key: 'lead', header: 'Lead', render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.firstName} ${row.lastName}`} size="sm" />
          <div>
            <p className="font-medium text-slate-800">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'company', header: 'Company', render: (row) => <span className="text-slate-600">{row.company || '—'}</span> },
    { key: 'source', header: 'Source', render: (row) => <Badge variant="default">{row.source}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'score', header: 'Score', render: (row) => <ScoreBadge score={row.score} /> },
    { key: 'expectedValue', header: 'Value', render: (row) => <span className="font-semibold text-slate-700">{formatCurrency(row.expectedValue)}</span> },
    {
      key: 'assignedTo', header: 'Assigned', render: (row) => row.assignedTo ? (
        <div className="flex items-center gap-2">
          <Avatar name={`${row.assignedTo.firstName} ${row.assignedTo.lastName}`} size="xs" />
          <span className="text-sm">{row.assignedTo.firstName}</span>
        </div>
      ) : <span className="text-slate-300">—</span>
    },
    { key: 'createdAt', header: 'Created', render: (row) => <span className="text-slate-400 text-xs">{formatDate(row.createdAt)}</span> },
    {
      key: 'actions', header: '', render: (row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditingLead(row)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${total} total leads`}
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download}>Export</Button>
            <Button variant="outline" size="sm" icon={Upload}>Import</Button>
            <Button onClick={() => setShowModal(true)} icon={Plus}>New Lead</Button>
          </>
        }
      />

      {/* Filter Bar */}
      <Card padding="p-4" className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
            />
          </div>
          <select value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.source} onChange={(e) => setFilters(p => ({ ...p, source: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
            <option value="">All Sources</option>
            {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
          {filters.search || filters.status || filters.source ? (
            <button onClick={() => setFilters({ search: '', status: '', source: '', assignedTo: '' })}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          ) : null}
          <div className="ml-auto flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setView('table')}
              className={`p-1.5 rounded-lg transition-all ${view === 'table' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView('kanban')}
              className={`p-1.5 rounded-lg transition-all ${view === 'kanban' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedLeads.length > 0 && (
          <div className="mt-3 p-3 bg-indigo-50 rounded-xl flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-slate-600">{selectedLeads.length} selected</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs text-slate-500">Change status:</span>
            {['Contacted', 'Qualified', 'Lost'].map(s => (
              <button key={s} onClick={() => handleBulkStatusChange(s)}
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-600">
                → {s}
              </button>
            ))}
            <button onClick={() => setSelectedLeads([])} className="text-xs text-slate-400 hover:text-slate-600 ml-auto">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </Card>

      {/* Table view */}
      {view === 'table' && (
        <Card padding="">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : leads.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No leads found"
              description="Start by adding your first lead or adjusting your filters."
              action={() => setShowModal(true)}
              actionLabel="Add Lead"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="w-10 px-4 py-3">
                        <input type="checkbox"
                          checked={selectedLeads.length === leads.length && leads.length > 0}
                          onChange={(e) => setSelectedLeads(e.target.checked ? leads.map(l => l._id) : [])}
                          className="rounded" />
                      </th>
                      {columns.map(col => (
                        <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead._id}
                        onClick={() => navigate(`/leads/${lead._id}`)}
                        className={`border-b border-slate-50 cursor-pointer transition-colors ${
                          selectedLeads.includes(lead._id) ? 'bg-indigo-50' : 'hover:bg-slate-50/80'
                        }`}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox"
                            checked={selectedLeads.includes(lead._id)}
                            onChange={(e) => setSelectedLeads(p => e.target.checked ? [...p, lead._id] : p.filter(id => id !== lead._id))}
                            className="rounded" />
                        </td>
                        {columns.map(col => (
                          <td key={col.key} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                            {col.render ? col.render(lead) : lead[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pages} total={total} limit={20} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {LEAD_STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                leads={kanbanGroups[status] || []}
                color={STAGE_COLORS[status]}
                onEdit={setEditingLead}
                onDelete={setDeleteConfirm}
                onCardClick={(lead) => navigate(`/leads/${lead._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal || !!editingLead}
        onClose={() => { setShowModal(false); setEditingLead(null); }}
        title={editingLead ? `Edit Lead — ${editingLead.firstName} ${editingLead.lastName}` : 'New Lead'}
        size="lg"
      >
        <LeadForm
          lead={editingLead}
          onSubmit={editingLead ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditingLead(null); }}
          users={users}
          loading={formLoading}
          user={user}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${deleteConfirm?.firstName} ${deleteConfirm?.lastName}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default LeadsPage;
