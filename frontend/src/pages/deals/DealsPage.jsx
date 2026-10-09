import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dealsAPI, customersAPI, usersAPI } from '../../api';
import { Plus, Edit3, Trash2, DollarSign, Calendar, Handshake, TrendingUp } from 'lucide-react';
import {
  Card, Button, Badge, StatusBadge, Avatar, PageHeader, EmptyState, Modal,
  Input, Select, Textarea, formatCurrency, formatDate, ConfirmDialog, Skeleton, StatCard, StatCardSkeleton
} from '../../components/ui';
import toast from 'react-hot-toast';

const STAGES = ['New', 'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_CONFIG = {
  'New':         { color: 'bg-slate-50 border-slate-200',   header: 'bg-slate-100',    dot: 'bg-slate-400' },
  'Qualification': { color: 'bg-indigo-50 border-indigo-200', header: 'bg-indigo-100',  dot: 'bg-indigo-500' },
  'Discovery':   { color: 'bg-blue-50 border-blue-200',     header: 'bg-blue-100',     dot: 'bg-blue-500' },
  'Proposal':    { color: 'bg-purple-50 border-purple-200', header: 'bg-purple-100',   dot: 'bg-purple-500' },
  'Negotiation': { color: 'bg-amber-50 border-amber-200',   header: 'bg-amber-100',    dot: 'bg-amber-500' },
  'Closed Won':  { color: 'bg-emerald-50 border-emerald-200', header: 'bg-emerald-100', dot: 'bg-emerald-500' },
  'Closed Lost': { color: 'bg-red-50 border-red-200',       header: 'bg-red-100',      dot: 'bg-red-500' },
};

const DealCard = ({ deal, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0 mr-2">
        <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{deal.name}</p>
        {deal.customer && <p className="text-xs text-slate-400 mt-0.5 truncate">{deal.customer.name}</p>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onEdit(deal); }}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3 h-3" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(deal); }}
          className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>

    <div className="text-xl font-bold text-slate-900 mb-3">{formatCurrency(deal.value)}</div>

    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Probability</span>
        <span className="text-xs font-semibold text-slate-600">{deal.probability}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${deal.probability}%` }} />
      </div>
    </div>

    {deal.expectedClosingDate && (
      <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
        <Calendar className="w-3 h-3" />
        <span>{formatDate(deal.expectedClosingDate)}</span>
      </div>
    )}

    {deal.assignedTo && (
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
        <Avatar name={`${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`} size="xs" />
        <span className="text-xs text-slate-500">{deal.assignedTo.firstName} {deal.assignedTo.lastName}</span>
      </div>
    )}
  </div>
);

const KanbanColumn = ({ stage, deals, onEdit, onDelete, onMoveStage, config }) => {
  const stageTotal = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className={`min-w-72 rounded-2xl border-2 ${config.color} flex flex-col max-h-[calc(100vh-280px)]`}>
      <div className={`${config.header} rounded-xl p-3 flex-shrink-0`}>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h3 className="text-sm font-bold text-slate-700">{stage}</h3>
          <span className="ml-auto text-xs bg-white/70 rounded-full px-2 py-0.5 font-semibold text-slate-500">
            {deals.length}
          </span>
        </div>
        <p className="text-base font-bold text-slate-700 pl-4">{formatCurrency(stageTotal)}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {deals.map(deal => (
          <DealCard key={deal._id} deal={deal} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {deals.length === 0 && (
          <div className="py-8 text-center"><p className="text-xs text-slate-300">No deals</p></div>
        )}
      </div>
    </div>
  );
};

const DealForm = ({ deal, onSubmit, onClose, customers, users, loading }) => {
  const [f, setF] = useState({
    name: deal?.name || '',
    customer: deal?.customer?._id || deal?.customer || '',
    value: deal?.value || '',
    probability: deal?.probability || 50,
    stage: deal?.stage || 'New',
    assignedTo: deal?.assignedTo?._id || deal?.assignedTo || '',
    expectedClosingDate: deal?.expectedClosingDate ? deal.expectedClosingDate.slice(0, 10) : '',
    source: deal?.source || '',
    notes: deal?.notes || '',
    lostReason: deal?.lostReason || '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, value: parseFloat(f.value) || 0, probability: parseInt(f.probability), assignedTo: f.assignedTo || null, customer: f.customer || null }); }} className="space-y-4">
      <Input label="Deal Name" required value={f.name} onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Enterprise License Q4" />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Customer" value={f.customer} onChange={(e) => setF(p => ({ ...p, customer: e.target.value }))}>
          <option value="">No Customer</option>
          {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Select label="Stage" value={f.stage} onChange={(e) => setF(p => ({ ...p, stage: e.target.value }))}>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </Select>
        <Input label="Deal Value ($)" type="number" value={f.value} onChange={(e) => setF(p => ({ ...p, value: e.target.value }))} placeholder="10000" />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Probability: {f.probability}%</label>
          <input type="range" min="0" max="100" value={f.probability} onChange={(e) => setF(p => ({ ...p, probability: e.target.value }))} className="w-full accent-indigo-600" />
        </div>
        <Select label="Assigned To" value={f.assignedTo} onChange={(e) => setF(p => ({ ...p, assignedTo: e.target.value }))}>
          <option value="">Unassigned</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
        </Select>
        <Input label="Expected Close Date" type="date" value={f.expectedClosingDate} onChange={(e) => setF(p => ({ ...p, expectedClosingDate: e.target.value }))} />
        <Input label="Source" value={f.source} onChange={(e) => setF(p => ({ ...p, source: e.target.value }))} placeholder="Website, Referral..." className="col-span-2" />
      </div>
      {f.stage === 'Closed Lost' && (
        <Input label="Lost Reason" value={f.lostReason} onChange={(e) => setF(p => ({ ...p, lostReason: e.target.value }))} placeholder="Why was this deal lost?" />
      )}
      <Textarea label="Notes" value={f.notes} rows={3} onChange={(e) => setF(p => ({ ...p, notes: e.target.value }))} />
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{deal ? 'Update Deal' : 'Create Deal'}</Button>
      </div>
    </form>
  );
};

const DealsPage = () => {
  const [searchParams] = useSearchParams();
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { if (searchParams.get('action') === 'new') setShowModal(true); }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, cRes, uRes] = await Promise.all([
        dealsAPI.getAll({ limit: 100 }),
        customersAPI.getAll({ limit: 100 }),
        usersAPI.getAll()
      ]);
      setDeals(dRes.data.data);
      setStats(dRes.data.stats || []);
      setCustomers(cRes.data.data);
      setUsers(uRes.data.data);
    } catch { toast.error('Failed to load deals'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try { await dealsAPI.create(data); toast.success('Deal created'); setShowModal(false); loadData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try { await dealsAPI.update(editingDeal._id, data); toast.success('Deal updated'); setEditingDeal(null); loadData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try { await dealsAPI.delete(deleteConfirm._id); toast.success('Deal deleted'); setDeleteConfirm(null); loadData(); }
    catch { toast.error('Failed to delete'); }
  };

  // Group deals by stage
  const dealsByStage = STAGES.reduce((acc, s) => {
    acc[s] = deals.filter(d => d.stage === s);
    return acc;
  }, {});

  // Summary stats
  const totalPipeline = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const wonRevenue = deals.filter(d => d.stage === 'Closed Won').reduce((s, d) => s + d.value, 0);
  const weightedPipeline = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage))
    .reduce((s, d) => s + (d.value * d.probability / 100), 0);
  const conversionRate = deals.length ? Math.round((deals.filter(d => d.stage === 'Closed Won').length / deals.length) * 100) : 0;

  return (
    <div>
      <PageHeader title="Sales Pipeline" subtitle={`${deals.length} total deals`}
        actions={<Button onClick={() => setShowModal(true)} icon={Plus}>New Deal</Button>} />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {loading ? [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />) : (
          <>
            <StatCard title="Total Pipeline" value={formatCurrency(totalPipeline)} icon={TrendingUp} color="indigo" />
            <StatCard title="Weighted Pipeline" value={formatCurrency(weightedPipeline)} icon={DollarSign} color="blue" />
            <StatCard title="Won Revenue" value={formatCurrency(wonRevenue)} icon={TrendingUp} color="green" />
            <StatCard title="Conversion Rate" value={`${conversionRate}%`} icon={Handshake} color="purple" />
          </>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => <Skeleton key={s} className="w-72 h-80 rounded-2xl flex-shrink-0" />)}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={dealsByStage[stage] || []}
                config={STAGE_CONFIG[stage]}
                onEdit={setEditingDeal}
                onDelete={setDeleteConfirm}
              />
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showModal || !!editingDeal} onClose={() => { setShowModal(false); setEditingDeal(null); }}
        title={editingDeal ? `Edit Deal — ${editingDeal.name}` : 'New Deal'} size="lg">
        <DealForm deal={editingDeal} onSubmit={editingDeal ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditingDeal(null); }}
          customers={customers} users={users} loading={formLoading} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Deal" message={`Delete "${deleteConfirm?.name}"? This cannot be undone.`} />
    </div>
  );
};

export default DealsPage;
