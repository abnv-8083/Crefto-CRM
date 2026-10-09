import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import {
  Target, UserCheck, Handshake, TrendingUp, CheckSquare, Phone,
  Trophy, XCircle, DollarSign, AlertCircle, Calendar,
  ArrowRight, MoreHorizontal
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  StatCard, StatCardSkeleton, Card, Badge, StatusBadge, Avatar, formatCurrency, timeAgo, ActivityIcon, Skeleton
} from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This month', value: 'month' },
  { label: 'Last month', value: 'last_month' },
];

const getDateRange = (range) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case 'today': return { startDate: today.toISOString(), endDate: now.toISOString() };
    case '7d': return { startDate: new Date(now - 7 * 86400000).toISOString(), endDate: now.toISOString() };
    case '30d': return { startDate: new Date(now - 30 * 86400000).toISOString(), endDate: now.toISOString() };
    case 'month': return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: now.toISOString() };
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    default: return {};
  }
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = getDateRange(dateRange);
        const res = await dashboardAPI.get(params);
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateRange]);

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const widgets = data?.widgets || {};

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Format chart data
  const leadsOverTime = (charts.leadsOverTime || []).map(d => ({
    date: d._id, count: d.count
  }));
  const revenueOverTime = (charts.revenueOverTime || []).map(d => ({
    date: d._id, revenue: d.revenue
  }));
  const dealsByStage = (charts.dealsByStage || []).map(d => ({
    name: d._id, count: d.count, value: d.totalValue
  }));
  const leadsBySource = (charts.leadsBySource || []).map(d => ({
    name: d._id, value: d.count
  }));
  const revenueByRep = (charts.revenueByRep || []).map(d => ({
    name: `${d.user?.firstName} ${d.user?.lastName}`,
    revenue: d.totalRevenue,
    deals: d.count,
  }));

  const statCards = [
    { title: 'Total Leads', value: stats.totalLeads, icon: Target, color: 'indigo' },
    { title: 'New Leads', value: stats.newLeads, icon: TrendingUp, color: 'blue' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: UserCheck, color: 'green' },
    { title: 'Active Deals', value: stats.activeDeals, icon: Handshake, color: 'purple' },
    { title: 'Won Deals', value: stats.wonDeals, icon: Trophy, color: 'amber' },
    { title: 'Lost Deals', value: stats.lostDeals, icon: XCircle, color: 'red' },
    { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'green' },
    { title: 'Pending Tasks', value: stats.pendingTasks, icon: CheckSquare, color: 'orange' },
    { title: 'Follow-ups Today', value: stats.followUpsToday, icon: Phone, color: 'cyan' },
    { title: 'Qualified Leads', value: stats.qualifiedLeads, icon: AlertCircle, color: 'indigo' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user?.firstName}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-x-auto">
          {DATE_RANGES.map(r => (
            <button key={r.value} onClick={() => setDateRange(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                dateRange === r.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? [...Array(10)].map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card, i) => (
            <StatCard
              key={i}
              title={card.title}
              value={typeof card.value === 'number' ? card.value : card.value || 0}
              icon={card.icon}
              color={card.color}
              change={card.change}
              style={{ animationDelay: `${i * 0.05}s` }}
            />
          ))
        }
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads over time */}
        <Card className="lg:col-span-2" padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Leads Generated</h2>
              <p className="text-xs text-slate-400 mt-0.5">Over the selected period</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-56" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={leadsOverTime}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2.5} fill="url(#leadGrad)" dot={false} name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Leads by source */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Lead Sources</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distribution by channel</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-56" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leadsBySource} cx="50%" cy="50%" outerRadius={80} innerRadius={50}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {leadsBySource.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Leads']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue over time */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Revenue</h2>
              <p className="text-xs text-slate-400 mt-0.5">Won deals over time</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueOverTime}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Deals by stage */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Pipeline by Stage</h2>
              <p className="text-xs text-slate-400 mt-0.5">Deal count per stage</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dealsByStage} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Deals">
                  {dealsByStage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Revenue by rep */}
      {(loading || revenueByRep.length > 0) && (
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Revenue by Sales Representative</h2>
              <p className="text-xs text-slate-400 mt-0.5">Top performers</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-40" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revenueByRep} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={100} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#6366F1" radius={[0, 6, 6, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {/* Widgets row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent leads */}
        <Card padding="">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Leads</h2>
            <button onClick={() => navigate('/leads')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            )) : (widgets.recentLeads || []).map(lead => (
              <div key={lead._id} onClick={() => navigate(`/leads/${lead._id}`)}
                className="px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{lead.company || lead.email}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
            {!loading && !widgets.recentLeads?.length && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No leads yet</p>
            )}
          </div>
        </Card>

        {/* Recent activities */}
        <Card padding="">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Activities</h2>
            <button onClick={() => navigate('/activities')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            )) : (widgets.recentActivities || []).slice(0, 5).map(activity => (
              <div key={activity._id} className="px-5 py-3 flex items-start gap-3">
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 line-clamp-1">{activity.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activity.performedBy?.firstName} • {timeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {!loading && !widgets.recentActivities?.length && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No activities yet</p>
            )}
          </div>
        </Card>

        {/* Today's tasks + upcoming follow-ups */}
        <div className="space-y-4">
          {/* Today's tasks */}
          <Card padding="">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Today's Tasks</h2>
              <button onClick={() => navigate('/tasks')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? [...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex gap-3 items-center">
                  <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/4" />
                  </div>
                  <Skeleton className="w-16 h-5 rounded-full" />
                </div>
              )) : (widgets.todayTasks || []).slice(0, 3).map(task => (
                <div key={task._id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === 'Urgent' ? 'bg-red-500' :
                    task.priority === 'High' ? 'bg-orange-500' :
                    task.priority === 'Medium' ? 'bg-amber-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{task.priority}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
              {!loading && !widgets.todayTasks?.length && (
                <p className="px-5 py-5 text-center text-sm text-slate-400">No tasks due today</p>
              )}
            </div>
          </Card>

          {/* Recently won deals */}
          <Card padding="">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Recently Won 🎉</h2>
              <button onClick={() => navigate('/deals')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? [...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-2 w-1/2" />
                </div>
              )) : (widgets.recentWonDeals || []).slice(0, 3).map(deal => (
                <div key={deal._id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800 truncate flex-1 mr-2">{deal.name}</p>
                    <span className="text-sm font-bold text-emerald-600 flex-shrink-0">{formatCurrency(deal.value)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{deal.customer?.name} • {deal.assignedTo?.firstName}</p>
                </div>
              ))}
              {!loading && !widgets.recentWonDeals?.length && (
                <p className="px-5 py-5 text-center text-sm text-slate-400">No won deals yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Upcoming follow-ups */}
      {(loading || (widgets.upcomingFollowUps || []).length > 0) && (
        <Card padding="">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Upcoming Follow-ups</h2>
            <button onClick={() => navigate('/follow-ups')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 divide-slate-50">
            {loading ? [...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-3 border-b border-slate-50 sm:border-r last:border-r-0">
                <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="w-full space-y-2 pt-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                  <Skeleton className="h-2 w-1/3 mt-2" />
                </div>
              </div>
            )) : widgets.upcomingFollowUps.slice(0, 6).map(fu => (
              <div key={fu._id} className="px-5 py-4 flex items-start gap-3 border-b border-slate-50 sm:border-r last:border-r-0">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-base flex-shrink-0">📅</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{fu.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fu.relatedLead ? `${fu.relatedLead.firstName} ${fu.relatedLead.lastName}` : fu.relatedCustomer?.name}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium mt-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(fu.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
