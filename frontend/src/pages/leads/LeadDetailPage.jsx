import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsAPI, usersAPI } from '../../api';
import {
  ArrowLeft, Edit3, Trash2, Phone, Mail, Globe, Building2, MapPin,
  Calendar, Star, Tag, DollarSign, UserCheck, Activity, Plus,
  CheckSquare, MoreVertical, RefreshCw
} from 'lucide-react';
import {
  Card, Button, Badge, StatusBadge, ScoreBadge, Avatar, Modal, Input, Select, Textarea,
  formatCurrency, formatDate, timeAgo, ActivityIcon, ConfirmDialog, Skeleton
} from '../../components/ui';
import toast from 'react-hot-toast';

const ACTIVITY_TYPES = ['Call', 'Email', 'WhatsApp', 'Meeting', 'Note', 'Follow-up'];

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [activityForm, setActivityForm] = useState({ type: 'Call', title: '', description: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [leadRes, usersRes] = await Promise.all([
          leadsAPI.getOne(id),
          usersAPI.getAll()
        ]);
        setLead(leadRes.data.data.lead);
        setActivities(leadRes.data.data.activities);
        setUsers(usersRes.data.data);
      } catch {
        navigate('/leads');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleStatusChange = async (status) => {
    try {
      const res = await leadsAPI.update(id, { status });
      setLead(res.data.data);
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await leadsAPI.addActivity(id, activityForm);
      toast.success('Activity logged');
      setShowActivityModal(false);
      setActivityForm({ type: 'Call', title: '', description: '' });
      const res = await leadsAPI.getOne(id);
      setActivities(res.data.data.activities);
    } catch {
      toast.error('Failed to log activity');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await leadsAPI.convert(id, { createDeal: true, dealName: `Deal with ${lead.firstName} ${lead.lastName}` });
      toast.success('Lead converted to customer!');
      navigate(`/customers/${res.data.data.customer._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Conversion failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await leadsAPI.delete(id);
      toast.success('Lead deleted');
      navigate('/leads');
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4"><Skeleton className="h-72" /><Skeleton className="h-48" /></div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/leads')} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400 font-medium">{lead.leadId}</p>
            <h1 className="text-xl font-bold text-slate-900">{lead.firstName} {lead.lastName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!lead.convertedToCustomer && (
            <Button variant="success" size="sm" icon={UserCheck} onClick={() => setShowConvertModal(true)}>
              Convert
            </Button>
          )}
          <Button variant="outline" size="sm" icon={Edit3} onClick={() => setShowEditModal(true)}>Edit</Button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: details + activities */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info card */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <Avatar name={`${lead.firstName} ${lead.lastName}`} size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{lead.firstName} {lead.lastName}</h2>
                  {lead.company && <p className="text-slate-500">{lead.company}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={lead.status} />
                    <ScoreBadge score={lead.score} />
                    {lead.convertedToCustomer && <Badge variant="success">✓ Converted</Badge>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(lead.expectedValue)}</p>
                <p className="text-xs text-slate-400">Expected Value</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Mail, label: 'Email', value: lead.email },
                { icon: Phone, label: 'Phone', value: lead.phone },
                { icon: Building2, label: 'Industry', value: lead.industry },
                { icon: Globe, label: 'Source', value: lead.source },
                { icon: MapPin, label: 'Location', value: lead.location },
                { icon: Calendar, label: 'Follow-up', value: formatDate(lead.nextFollowUpDate) },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-700">{value}</p>
                  </div>
                </div>
              ) : null)}
            </div>

            {lead.tags?.length > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map(tag => (
                    <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {lead.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-600">{lead.notes}</p>
              </div>
            )}
          </Card>

          {/* Status pipeline */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">Pipeline Status</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {LEAD_STATUSES.map((status, i) => (
                <button key={status}
                  onClick={() => !['Converted'].includes(status) && handleStatusChange(status)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                    ${lead.status === status
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                  {status}
                </button>
              ))}
            </div>
          </Card>

          {/* Activity timeline */}
          <Card padding="">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Activity Timeline</h3>
              <Button size="sm" icon={Plus} onClick={() => setShowActivityModal(true)}>Log Activity</Button>
            </div>
            {activities.length === 0 ? (
              <div className="py-10 text-center">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No activities logged yet</p>
                <button onClick={() => setShowActivityModal(true)} className="text-indigo-600 text-sm font-medium mt-2 hover:text-indigo-700">
                  Log first activity
                </button>
              </div>
            ) : (
              <div className="px-5 py-3 space-y-4">
                {activities.map((activity, i) => (
                  <div key={activity._id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <ActivityIcon type={activity.type} />
                      {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 ml-4 flex-shrink-0">{timeAgo(activity.createdAt)}</p>
                      </div>
                      {activity.performedBy && (
                        <p className="text-xs text-slate-400 mt-1">
                          By {activity.performedBy.firstName} {activity.performedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Assigned to */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-3">Assignment</h3>
            {lead.assignedTo ? (
              <div className="flex items-center gap-3">
                <Avatar name={`${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`} />
                <div>
                  <p className="font-medium text-slate-800">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</p>
                  <p className="text-xs text-slate-400">{lead.assignedTo.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Not assigned</p>
            )}
          </Card>

          {/* Details */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-3">Lead Details</h3>
            <dl className="space-y-3">
              {[
                { label: 'Lead ID', value: lead.leadId },
                { label: 'Source', value: lead.source },
                { label: 'Score', value: <ScoreBadge score={lead.score} /> },
                { label: 'Created', value: formatDate(lead.createdAt) },
                { label: 'Last Updated', value: formatDate(lead.updatedAt) },
                { label: 'Last Contacted', value: formatDate(lead.lastContactedDate) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className="text-xs font-medium text-slate-700">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Quick actions */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: Phone, label: 'Log a Call', type: 'Call' },
                { icon: Mail, label: 'Log an Email', type: 'Email' },
                { icon: Calendar, label: 'Schedule Follow-up', type: 'Follow-up' },
              ].map(({ icon: Icon, label, type }) => (
                <button key={type}
                  onClick={() => { setActivityForm(p => ({ ...p, type, title: label })); setShowActivityModal(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors text-sm text-slate-600 text-left">
                  <Icon className="w-4 h-4 text-slate-400" />
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Log Activity Modal */}
      <Modal isOpen={showActivityModal} onClose={() => setShowActivityModal(false)} title="Log Activity" size="sm">
        <form onSubmit={handleAddActivity} className="space-y-4">
          <Select label="Type" value={activityForm.type} onChange={(e) => setActivityForm(p => ({ ...p, type: e.target.value }))}>
            {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Title" required value={activityForm.title}
            onChange={(e) => setActivityForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Describe the activity..." />
          <Textarea label="Notes" value={activityForm.description} rows={3}
            onChange={(e) => setActivityForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Additional details..." />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowActivityModal(false)}>Cancel</Button>
            <Button type="submit" loading={formLoading}>Log Activity</Button>
          </div>
        </form>
      </Modal>

      {/* Convert Modal */}
      <Modal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} title="Convert Lead to Customer" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-9 h-9 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Convert {lead.firstName} {lead.lastName}?</h3>
          <p className="text-sm text-slate-500 mb-6">
            This will create a new customer record and optionally create a deal for ${lead.expectedValue?.toLocaleString() || 0}.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowConvertModal(false)}>Cancel</Button>
            <Button variant="success" onClick={handleConvert} loading={formLoading}>Convert Now</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${lead.firstName} ${lead.lastName}"? This cannot be undone.`}
      />
    </div>
  );
};

export default LeadDetailPage;
