import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { demoRequestsAPI } from '../../api';
import {
  Plus, PlayCircle, Video, Image, Link2, Trash2, Edit3,
  Send, Mail, Phone, Building2, User, ExternalLink
} from 'lucide-react';
import {
  Card, Button, Badge, PageHeader, EmptyState, Modal, Input, Textarea,
  ConfirmDialog, Skeleton, Tabs, timeAgo, formatDate
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const STATUS = {
  requested: { label: 'Requested', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
};

const DemoRequestForm = ({ request, onSubmit, onClose, loading }) => {
  const [f, setF] = useState({
    title: request?.title || '',
    clientName: request?.clientName || '',
    clientEmail: request?.clientEmail || '',
    clientPhone: request?.clientPhone || '',
    clientCompany: request?.clientCompany || '',
    description: request?.description || '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4">
      <Input label="Demo / Project Title" required value={f.title}
        onChange={(e) => setF(p => ({ ...p, title: e.target.value }))}
        placeholder="e.g. Product demo for Acme Corp" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Client Name" required value={f.clientName}
          onChange={(e) => setF(p => ({ ...p, clientName: e.target.value }))} placeholder="John Doe" />
        <Input label="Client Company" value={f.clientCompany}
          onChange={(e) => setF(p => ({ ...p, clientCompany: e.target.value }))} placeholder="Acme Corp" />
        <Input label="Client Email" type="email" value={f.clientEmail}
          onChange={(e) => setF(p => ({ ...p, clientEmail: e.target.value }))} placeholder="john@acme.com" />
        <Input label="Client Phone" value={f.clientPhone}
          onChange={(e) => setF(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+1 555-0100" />
      </div>
      <Textarea label="Requirements / Notes" value={f.description} rows={3}
        onChange={(e) => setF(p => ({ ...p, description: e.target.value }))}
        placeholder="What should the demo cover? Any client requirements..." />
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{request ? 'Save Changes' : 'Open Demo Request'}</Button>
      </div>
    </form>
  );
};

const DeliveryForm = ({ request, onSubmit, onClose, loading }) => {
  const [f, setF] = useState({
    demoVideo: request?.demoVideo || '',
    demoPhoto: request?.demoPhoto || '',
    demoLink: request?.demoLink || '',
    deliveryNotes: request?.deliveryNotes || '',
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!f.demoVideo && !f.demoPhoto && !f.demoLink) {
        toast.error('Provide at least one of: video, photo, or link');
        return;
      }
      onSubmit(f);
    }} className="space-y-4">
      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
        <p className="text-sm font-medium text-indigo-800">{request?.title}</p>
        <p className="text-xs text-indigo-500 mt-0.5">Client: {request?.clientName}{request?.clientCompany ? ` — ${request.clientCompany}` : ''}</p>
      </div>
      <Input label="Demo Video URL" value={f.demoVideo}
        onChange={(e) => setF(p => ({ ...p, demoVideo: e.target.value }))}
        placeholder="https://youtube.com/watch?v=... or hosted file URL" />
      <Input label="Demo Photo URL" value={f.demoPhoto}
        onChange={(e) => setF(p => ({ ...p, demoPhoto: e.target.value }))}
        placeholder="https://..." />
      <Input label="Demo Link (live demo / download)" value={f.demoLink}
        onChange={(e) => setF(p => ({ ...p, demoLink: e.target.value }))}
        placeholder="https://..." />
      <Textarea label="Notes for the sales rep" value={f.deliveryNotes} rows={2}
        onChange={(e) => setF(p => ({ ...p, deliveryNotes: e.target.value }))}
        placeholder="Anything the sales rep should know before sharing with the client..." />
      <p className="text-xs text-slate-400">At least one of video, photo, or link is required.</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon={Send} loading={loading}>Send Demo</Button>
      </div>
    </form>
  );
};

const DeliveryLinks = ({ request }) => {
  const links = [
    { url: request.demoVideo, label: 'Watch video', icon: Video, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
    { url: request.demoPhoto, label: 'View photo', icon: Image, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
    { url: request.demoLink, label: 'Open link', icon: Link2, color: 'text-sky-600 bg-sky-50 hover:bg-sky-100' },
  ].filter(l => l.url);

  if (!links.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demo delivered</p>
      <div className="flex flex-wrap gap-2">
        {links.map(({ url, label, icon: Icon, color }) => (
          <a key={label} href={url} target="_blank" rel="noreferrer"
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${color}`}>
            <Icon className="w-3.5 h-3.5" /> {label} <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        ))}
      </div>
      {request.deliveryNotes && (
        <p className="text-xs text-slate-400 mt-2">{request.deliveryNotes}</p>
      )}
      {request.deliveredAt && (
        <p className="text-[10px] text-slate-300 mt-1">Delivered {timeAgo(request.deliveredAt)}</p>
      )}
    </div>
  );
};

const DemoRequestsPage = () => {
  const { user, isDeveloper, isSalesRep } = useAuth();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [delivering, setDelivering] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const canCreate = !isDeveloper(); // manager + sales rep open demo requests
  const isDev = isDeveloper();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await demoRequestsAPI.getAll({ limit: 100 });
      setRequests(data.data);
    } catch { toast.error('Failed to load demo requests'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (searchParams.get('action') === 'new' && canCreate) setShowModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await demoRequestsAPI.create(formData);
      toast.success('Demo request opened — developers have been notified');
      setShowModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create'); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (formData) => {
    setFormLoading(true);
    try {
      await demoRequestsAPI.update(editing._id, formData);
      toast.success('Demo request updated');
      setEditing(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update'); }
    finally { setFormLoading(false); }
  };

  const handleStart = async (request) => {
    try {
      await demoRequestsAPI.start(request._id);
      toast.success('Demo request picked up');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to start'); }
  };

  const handleDeliver = async (formData) => {
    setFormLoading(true);
    try {
      await demoRequestsAPI.deliver(delivering._id, formData);
      toast.success('Demo delivered — the sales rep has been notified 🎉');
      setDelivering(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to deliver'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await demoRequestsAPI.remove(deleteConfirm._id);
      toast.success('Demo request deleted');
      setDeleteConfirm(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  const isOwner = (r) => r.requestedBy?._id === user?._id || r.requestedBy === user?._id;
  const canEdit = (r) => user?.role === 'manager' || (isSalesRep() && isOwner(r) && r.status !== 'delivered');
  const canDelete = (r) => user?.role === 'manager' || (isOwner(r) && r.status === 'requested');
  const canStart = (r) => isDev && r.status === 'requested';
  const canDeliver = (r) => (isDev || user?.role === 'manager') && r.status !== 'delivered';

  const counts = {
    all: requests.length,
    requested: requests.filter(r => r.status === 'requested').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
  };

  const tabs = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'requested', label: 'Requested', count: counts.requested },
    { value: 'in_progress', label: 'In Progress', count: counts.in_progress },
    { value: 'delivered', label: 'Delivered', count: counts.delivered },
  ];

  const visible = tab === 'all' ? requests : requests.filter(r => r.status === tab);

  return (
    <div>
      <PageHeader
        title={isDev ? 'Projects' : 'Demo Requests'}
        subtitle={isDev
          ? `${counts.requested} waiting · ${counts.in_progress} in progress · ${counts.delivered} delivered`
          : `${requests.length} total demo requests`}
        actions={canCreate ? (
          <Button onClick={() => setShowModal(true)} icon={Plus}>
            {isSalesRep() ? 'New Demo Request' : 'New Demo Request'}
          </Button>
        ) : null}
      />

      <div className="mb-4">
        <Tabs tabs={tabs} activeTab={tab} onChange={setTab} variant="button" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card padding="">
          <EmptyState
            icon={PlayCircle}
            title={tab === 'all' ? 'No demo requests yet' : `No ${tabs.find(t => t.value === tab)?.label.toLowerCase()} requests`}
            description={isDev
              ? 'Demo requests opened by sales reps will show up here.'
              : 'Open a demo request with the client details and the developers will pick it up.'}
            action={canCreate ? () => setShowModal(true) : undefined} actionLabel="New Demo Request"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(r => {
            const status = STATUS[r.status] || STATUS.requested;
            return (
              <Card key={r._id} padding="" className="flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{r.requestId || 'Demo'}</p>
                    <h3 className="text-sm font-semibold text-slate-800 truncate mt-0.5">{r.title}</h3>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {/* Client details */}
                <div className="px-5 py-4 flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client Details</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium">{r.clientName}</span>
                      {r.clientCompany && <span className="text-slate-400 truncate">· {r.clientCompany}</span>}
                    </div>
                    {r.clientEmail && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{r.clientEmail}</span>
                      </div>
                    )}
                    {r.clientPhone && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{r.clientPhone}</span>
                      </div>
                    )}
                    {r.clientCompany && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{r.clientCompany}</span>
                      </div>
                    )}
                  </div>

                  {r.description && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2">{r.description}</p>
                  )}

                  <div className="mt-3 text-[10px] text-slate-400">
                    Requested by {r.requestedBy ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}` : '—'} · {formatDate(r.createdAt)}
                    {r.assignedTo && <> · Dev: {r.assignedTo.firstName} {r.assignedTo.lastName}</>}
                  </div>

                  {r.status === 'delivered' && <DeliveryLinks request={r} />}
                </div>

                {/* Actions */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2">
                  {canStart(r) && (
                    <Button size="xs" onClick={() => handleStart(r)}>Start Work</Button>
                  )}
                  {canDeliver(r) && (
                    <Button size="xs" variant={r.status === 'in_progress' ? 'primary' : 'secondary'}
                      icon={Send} onClick={() => setDelivering(r)}>
                      {r.status === 'in_progress' ? 'Send Demo' : 'Deliver Now'}
                    </Button>
                  )}
                  <div className="flex gap-1 ml-auto">
                    {canEdit(r) && (
                      <button onClick={() => setEditing(r)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete(r) && (
                      <button onClick={() => setDeleteConfirm(r)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Demo Request" size="lg">
        <DemoRequestForm onSubmit={handleCreate} onClose={() => setShowModal(false)} loading={formLoading} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)}
        title={`Edit — ${editing?.title || ''}`} size="lg">
        {editing && (
          <DemoRequestForm request={editing} onSubmit={handleUpdate}
            onClose={() => setEditing(null)} loading={formLoading} />
        )}
      </Modal>

      {/* Delivery modal (developer) */}
      <Modal isOpen={!!delivering} onClose={() => setDelivering(null)} title="Send Demo Delivery" size="md">
        {delivering && (
          <DeliveryForm request={delivering} onSubmit={handleDeliver}
            onClose={() => setDelivering(null)} loading={formLoading} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Demo Request"
        message={`Delete "${deleteConfirm?.title}" for ${deleteConfirm?.clientName}? This cannot be undone.`}
      />
    </div>
  );
};

export default DemoRequestsPage;
