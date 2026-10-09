import { useState, useEffect } from 'react';
import { reportsAPI } from '../../api';
import { BarChart3, TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, PageHeader, Skeleton, formatCurrency, StatCard, StatCardSkeleton } from '../../components/ui';

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: res } = await reportsAPI.get({ period });
        setData(res.data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [period]);

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Business performance overview"
        actions={
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {periods.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${period === p.value ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {loading ? [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />) : (
          <>
            <StatCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon={DollarSign} color="green" />
            <StatCard title="New Leads" value={(summary.newLeads || 0)} icon={Target} color="indigo" />
            <StatCard title="New Customers" value={(summary.newCustomers || 0)} icon={Users} color="blue" />
            <StatCard title="Won Deals" value={(summary.wonDeals || 0)} icon={TrendingUp} color="purple" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Revenue trend */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-1">Revenue Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Won deal revenue over time</p>
          {loading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={charts.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Lead conversion funnel */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-1">Lead Funnel</h3>
          <p className="text-xs text-slate-400 mb-4">Status distribution</p>
          {loading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.leadFunnel || []} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Leads">
                  {(charts.leadFunnel || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Deal stages */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-1">Pipeline by Stage</h3>
          <p className="text-xs text-slate-400 mb-4">Deal value per stage</p>
          {loading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.dealStages || []} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Value']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="totalValue" radius={[6, 6, 0, 0]} name="Value">
                  {(charts.dealStages || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Customer acquisition */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-1">Customer Acquisition</h3>
          <p className="text-xs text-slate-400 mb-4">New customers over time</p>
          {loading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={charts.customerAcquisition || []}>
                <defs>
                  <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2.5} fill="url(#custGrad)" dot={false} name="Customers" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Sales rep performance */}
      {(charts.repPerformance || []).length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-1">Sales Rep Performance</h3>
          <p className="text-xs text-slate-400 mb-4">Revenue by team member</p>
          {loading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts.repPerformance || []} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={100} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="totalRevenue" fill="#6366F1" radius={[0, 6, 6, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
