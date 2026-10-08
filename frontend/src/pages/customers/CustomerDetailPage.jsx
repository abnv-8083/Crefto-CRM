import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersAPI } from '../../api';
import { ArrowLeft, Edit3, Trash2, Phone, Mail, MapPin, Building2, Calendar, DollarSign, Activity, Plus } from 'lucide-react';
import { Card, Button, Badge, StatusBadge, Avatar, formatCurrency, formatDate, timeAgo, ActivityIcon, ConfirmDialog, Skeleton, Tabs } from '../../components/ui';
import toast from 'react-hot-toast';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await customersAPI.getOne(id);
        setCustomer(res.data.data.customer);
        setActivities(res.data.data.activities);
        setDeals(res.data.data.deals);
        setTasks(res.data.data.tasks);
      } catch { navigate('/customers'); } finally { setLoading(false); }
    };
    load();
  }, [id, navigate]);

  const handleDelete = async () => {
    try { await customersAPI.delete(id); toast.success('Customer deleted'); navigate('/customers'); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-80" /></div>;
  if (!customer) return null;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'deals', label: `Deals (${deals.length})` },
    { key: 'activities', label: `Activities (${activities.length})` },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customers')} className="p-2 rounded-xl hover:bg-white border border-slate-200 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">{customer.customerId}</p>
            <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={Edit3}>Edit</Button>
          <button onClick={() => setDeleteConfirm(true)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(customer.totalRevenue), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Deals', value: customer.totalDeals, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Open Deals', value: deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Tasks', value: tasks.filter(t => t.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={tabs.map(t => ({ value: t.key, label: t.label }))}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="button"
        />
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <h3 className="font-semibold text-slate-800 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Mail, label: 'Email', value: customer.email },
                { icon: Phone, label: 'Phone', value: customer.phone },
                { icon: Building2, label: 'Company', value: customer.company },
                { icon: Building2, label: 'Industry', value: customer.industry },
                { icon: MapPin, label: 'City', value: `${customer.city}${customer.country ? ', ' + customer.country : ''}` },
                { icon: Calendar, label: 'Customer Since', value: formatDate(customer.customerSince) },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-medium text-slate-700">{value}</p></div>
                </div>
              ) : null)}
            </div>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-600">{customer.notes}</p>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-slate-800 mb-3">Assigned To</h3>
              {customer.assignedTo ? (
                <div className="flex items-center gap-3">
                  <Avatar name={`${customer.assignedTo.firstName} ${customer.assignedTo.lastName}`} />
                  <div>
                    <p className="font-medium text-slate-800">{customer.assignedTo.firstName} {customer.assignedTo.lastName}</p>
                    <p className="text-xs text-slate-400">{customer.assignedTo.email}</p>
                  </div>
                </div>
              ) : <p className="text-sm text-slate-400">Not assigned</p>}
            </Card>
            <Card>
              <h3 className="font-semibold text-slate-800 mb-3">Details</h3>
              <dl className="space-y-2">
                {[
                  ['Customer ID', customer.customerId],
                  ['Type', customer.customerType],
                  ['Status', <StatusBadge status={customer.status} />],
                  ['Last Contact', formatDate(customer.lastContact)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className="text-xs font-medium text-slate-700">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'deals' && (
        <Card padding="">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-800">Deals</h3></div>
          {deals.length === 0 ? (
            <div className="py-10 text-center"><p className="text-slate-400 text-sm">No deals yet</p></div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                {['Deal', 'Value', 'Stage', 'Rep', 'Expected Close'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {deals.map(d => (
                  <tr key={d._id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => navigate('/deals')}>
                    <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{formatCurrency(d.value)}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.stage} /></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{d.assignedTo?.firstName} {d.assignedTo?.lastName}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(d.expectedClosingDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {activeTab === 'activities' && (
        <Card padding="">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-800">Activity Timeline</h3></div>
          {activities.length === 0 ? (
            <div className="py-10 text-center"><p className="text-slate-400 text-sm">No activities logged</p></div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              {activities.map(a => (
                <div key={a._id} className="flex gap-4">
                  <ActivityIcon type={a.type} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.performedBy?.firstName} • {timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'tasks' && (
        <Card padding="">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-800">Tasks</h3></div>
          {tasks.length === 0 ? (
            <div className="py-10 text-center"><p className="text-slate-400 text-sm">No tasks</p></div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                {['Task', 'Priority', 'Status', 'Due Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                    <td className="px-4 py-3"><Badge variant={t.priority === 'Urgent' ? 'danger' : t.priority === 'High' ? 'warning' : 'default'}>{t.priority}</Badge></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(t.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <ConfirmDialog isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={handleDelete}
        title="Delete Customer" message={`Delete "${customer.name}"?`} />
    </div>
  );
};

export default CustomerDetailPage;
