import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tasksAPI, leadsAPI, customersAPI, dealsAPI, usersAPI } from '../../api';
import { Plus, CheckSquare, Edit3, Trash2, X } from 'lucide-react';
import {
  Card, Button, Badge, StatusBadge, PriorityBadge, Avatar, Pagination, PageHeader, EmptyState,
  Modal, Input, Select, Textarea, formatDate, ConfirmDialog, Skeleton, Tabs
} from '../../components/ui';
import toast from 'react-hot-toast';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const TaskForm = ({ task, onSubmit, onClose, users, loading }) => {
  const [f, setF] = useState({
    title: task?.title || '', description: task?.description || '',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
    priority: task?.priority || 'Medium', status: task?.status || 'Pending',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    tags: task?.tags?.join(', ') || '',
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, tags: f.tags.split(',').map(t => t.trim()).filter(Boolean) }); }} className="space-y-4">
      <Input label="Task Title" required value={f.title} onChange={(e) => setF(p => ({ ...p, title: e.target.value }))} placeholder="Describe the task..." />
      <Textarea label="Description" value={f.description} rows={3} onChange={(e) => setF(p => ({ ...p, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Priority" value={f.priority} onChange={(e) => setF(p => ({ ...p, priority: e.target.value }))}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </Select>
        <Select label="Status" value={f.status} onChange={(e) => setF(p => ({ ...p, status: e.target.value }))}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </Select>
        <Select label="Assigned To" value={f.assignedTo} onChange={(e) => setF(p => ({ ...p, assignedTo: e.target.value }))}>
          <option value="">Unassigned</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
        </Select>
        <Input label="Due Date" type="date" value={f.dueDate} onChange={(e) => setF(p => ({ ...p, dueDate: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{task ? 'Update' : 'Create Task'}</Button>
      </div>
    </form>
  );
};

// Kanban for tasks
const TaskKanban = ({ tasks, onEdit, onComplete, onDelete }) => {
  const grouped = STATUSES.reduce((acc, s) => { acc[s] = tasks.filter(t => t.status === s); return acc; }, {});
  const colors = { 'Pending': 'bg-amber-50 border-amber-200', 'In Progress': 'bg-blue-50 border-blue-200', 'Completed': 'bg-emerald-50 border-emerald-200', 'Cancelled': 'bg-slate-50 border-slate-200' };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {STATUSES.map(status => (
          <div key={status} className={`min-w-64 rounded-2xl border-2 ${colors[status]} p-3`}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-slate-700">{status}</h3>
              <span className="text-xs bg-white rounded-full px-2 py-0.5 font-semibold text-slate-500 border border-white shadow-sm">{grouped[status].length}</span>
            </div>
            <div className="space-y-2.5">
              {grouped[status].map(task => (
                <div key={task._id} className="bg-white rounded-xl border border-slate-200 p-3 group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{task.title}</p>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.dueDate && (
                    <p className={`text-xs mb-2 ${new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                      Due: {formatDate(task.dueDate)}
                    </p>
                  )}
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status !== 'Completed' && (
                      <button onClick={() => onComplete(task)} className="text-xs text-emerald-600 font-medium hover:text-emerald-700">✓ Complete</button>
                    )}
                    <div className="flex gap-1 ml-auto">
                      <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><Edit3 className="w-3 h-3" /></button>
                      <button onClick={() => onDelete(task)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {grouped[status].length === 0 && <div className="py-6 text-center"><p className="text-xs text-slate-300">Empty</p></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TasksPage = () => {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({ status: '', priority: '' });

  useEffect(() => { if (searchParams.get('action') === 'new') setShowModal(true); }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([tasksAPI.getAll({ page, limit: 50, ...filters }), usersAPI.getAll()]);
      setTasks(tRes.data.data); setTotal(tRes.data.total); setPages(tRes.data.pages);
      setUsers(uRes.data.data);
    } catch { toast.error('Failed to load tasks'); } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try { await tasksAPI.create(data); toast.success('Task created'); setShowModal(false); loadData(); }
    catch { toast.error('Failed'); } finally { setFormLoading(false); }
  };
  const handleUpdate = async (data) => {
    setFormLoading(true);
    try { await tasksAPI.update(editing._id, data); toast.success('Task updated'); setEditing(null); loadData(); }
    catch { toast.error('Failed'); } finally { setFormLoading(false); }
  };
  const handleDelete = async () => {
    try { await tasksAPI.delete(deleteConfirm._id); toast.success('Deleted'); setDeleteConfirm(null); loadData(); }
    catch { toast.error('Failed'); }
  };
  const handleComplete = async (task) => {
    try { await tasksAPI.update(task._id, { status: 'Completed' }); toast.success('Task completed! ✅'); loadData(); }
    catch { toast.error('Failed'); }
  };

  const priorityColors = { Low: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', High: 'bg-red-100 text-red-700', Urgent: 'bg-red-600 text-white' };

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${total} tasks`}
        actions={<Button onClick={() => setShowModal(true)} icon={Plus}>New Task</Button>} />

      <Card padding="p-4" className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters(p => ({ ...p, priority: e.target.value }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <div className="ml-auto flex gap-1 bg-slate-100 p-1 rounded-xl">
            {['list', 'kanban'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${view === v ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {view === 'list' ? (
        <Card padding="">
          {loading ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            : tasks.length === 0 ? <EmptyState icon={CheckSquare} title="No tasks" description="Create your first task." action={() => setShowModal(true)} actionLabel="Add Task" />
            : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100">
                      {['Task', 'Priority', 'Status', 'Assigned To', 'Due Date', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {tasks.map(task => {
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                        return (
                          <tr key={task._id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button onClick={() => handleComplete(task)}
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                    ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500'}`}>
                                  {task.status === 'Completed' && <span className="text-[10px]">✓</span>}
                                </button>
                                <div>
                                  <p className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                                  {task.description && <p className="text-xs text-slate-400 truncate max-w-xs">{task.description}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                            <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                            <td className="px-4 py-3">
                              {task.assignedTo ? <div className="flex items-center gap-2"><Avatar name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`} size="xs" /><span className="text-sm">{task.assignedTo.firstName}</span></div> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                {isOverdue ? '⚠️ ' : ''}{formatDate(task.dueDate)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => setEditing(task)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setDeleteConfirm(task)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} pages={pages} total={total} limit={50} onPageChange={setPage} />
              </>
            )}
        </Card>
      ) : (
        <TaskKanban tasks={tasks} onEdit={setEditing} onComplete={handleComplete} onDelete={setDeleteConfirm} />
      )}

      <Modal isOpen={showModal || !!editing} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Task' : 'New Task'} size="md">
        <TaskForm task={editing} onSubmit={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }} users={users} loading={formLoading} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Task" message={`Delete "${deleteConfirm?.title}"?`} />
    </div>
  );
};

export default TasksPage;
