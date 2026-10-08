import { useState, useEffect } from 'react';
import { activitiesAPI } from '../../api';
import { Activity } from 'lucide-react';
import { Card, PageHeader, EmptyState, Pagination, ActivityIcon, timeAgo, Skeleton } from '../../components/ui';
import toast from 'react-hot-toast';

const ACTIVITY_TYPES = ['Call', 'Email', 'WhatsApp', 'Meeting', 'Note', 'Follow-up', 'Task', 'Status Change', 'Deal Created', 'Deal Won', 'Deal Lost', 'Lead Created'];

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await activitiesAPI.getAll({ page, limit: 30, type: typeFilter || undefined });
        setActivities(data.data); setTotal(data.total); setPages(data.pages);
      } catch { toast.error('Failed to load'); } finally { setLoading(false); }
    };
    load();
  }, [page, typeFilter]);

  return (
    <div>
      <PageHeader title="Activity Timeline" subtitle={`${total} activities recorded`} />

      <Card padding="p-4" className="mb-4">
        <div className="overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex gap-2 flex-nowrap">
            <button onClick={() => setTypeFilter('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${!typeFilter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              All
              <span className={`text-[10px] px-1 rounded-full ${!typeFilter ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{total}</span>
            </button>
            {ACTIVITY_TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${typeFilter === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState icon={Activity} title="No activities" description="Activities are automatically logged as you work." />
        ) : (
          <>
            <div className="px-5 py-4 space-y-0">
              {activities.map((activity, i) => (
                <div key={activity._id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <ActivityIcon type={activity.type} />
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1 min-h-4" />}
                  </div>
                  <div className="pb-5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                        {activity.description && <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          {activity.performedBy && (
                            <span className="text-xs text-slate-400">
                              By {activity.performedBy.firstName} {activity.performedBy.lastName}
                            </span>
                          )}
                          {activity.relatedLead && (
                            <span className="text-xs text-indigo-500">
                              Lead: {activity.relatedLead.firstName} {activity.relatedLead.lastName}
                            </span>
                          )}
                          {activity.relatedCustomer && (
                            <span className="text-xs text-emerald-500">
                              Customer: {activity.relatedCustomer.name}
                            </span>
                          )}
                          {activity.relatedDeal && (
                            <span className="text-xs text-blue-500">
                              Deal: {activity.relatedDeal.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-300 flex-shrink-0">{timeAgo(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pages={pages} total={total} limit={30} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};

export default ActivitiesPage;
