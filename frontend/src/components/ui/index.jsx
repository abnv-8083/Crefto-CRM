// Reusable UI Components Library

// Badge component
export const Badge = ({ children, variant = 'default', size = 'sm', dot = false }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    primary: 'bg-indigo-100 text-indigo-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-sky-100 text-sky-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

// Status badge with color mapping
export const StatusBadge = ({ status }) => {
  const map = {
    'New': { variant: 'primary', label: 'New' },
    'Contacted': { variant: 'info', label: 'Contacted' },
    'Qualified': { variant: 'success', label: 'Qualified' },
    'Proposal Sent': { variant: 'warning', label: 'Proposal Sent' },
    'Negotiation': { variant: 'warning', label: 'Negotiation' },
    'Converted': { variant: 'success', label: 'Converted' },
    'Lost': { variant: 'default', label: 'Lost' },
    'Closed Won': { variant: 'success', label: 'Closed Won' },
    'Closed Lost': { variant: 'default', label: 'Closed Lost' },
    'Qualification': { variant: 'info', label: 'Qualification' },
    'Discovery': { variant: 'purple', label: 'Discovery' },
    'Proposal': { variant: 'warning', label: 'Proposal' },
    'Pending': { variant: 'warning', label: 'Pending' },
    'In Progress': { variant: 'info', label: 'In Progress' },
    'Completed': { variant: 'success', label: 'Completed' },
    'Cancelled': { variant: 'default', label: 'Cancelled' },
    'Draft': { variant: 'default', label: 'Draft' },
    'Sent': { variant: 'info', label: 'Sent' },
    'Accepted': { variant: 'success', label: 'Accepted' },
    'Rejected': { variant: 'danger', label: 'Rejected' },
    'Expired': { variant: 'default', label: 'Expired' },
    'active': { variant: 'success', label: 'Active' },
    'inactive': { variant: 'default', label: 'Inactive' },
    'Overdue': { variant: 'danger', label: 'Overdue' },
    'Rescheduled': { variant: 'purple', label: 'Rescheduled' },
  };

  const config = map[status] || { variant: 'default', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Priority badge
export const PriorityBadge = ({ priority }) => {
  const map = {
    'Low': 'success',
    'Medium': 'warning',
    'High': 'danger',
    'Urgent': 'danger',
  };
  return (
    <Badge variant={map[priority] || 'default'}>
      {priority === 'Urgent' && '🔴 '}
      {priority}
    </Badge>
  );
};

// Card component
export const Card = ({ children, className = '', padding = 'p-5', hover = false }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${padding} ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

// SectionCard: card with header row, divider, body slot
export const SectionCard = ({ title, subtitle, actions, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// InfoRow: label + value row for detail pages
export const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex-shrink-0 mt-0.5">{label}</span>
    <span className="text-sm font-medium text-slate-800 text-right">{value || '—'}</span>
  </div>
);

// KanbanCard: card with colored left border, title, metadata, status badge
export const KanbanCard = ({ title, subtitle, status, assignee, date, color = 'indigo', onClick }) => {
  const borderColors = {
    indigo: 'border-l-indigo-500',
    sky: 'border-l-sky-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    orange: 'border-l-orange-500',
    green: 'border-l-green-500',
    slate: 'border-l-slate-400',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderColors[color] || 'border-l-indigo-500'} p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group`}
    >
      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2 mb-2">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mb-3 line-clamp-1">{subtitle}</p>}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {assignee && (
            <Avatar name={assignee} size="xs" />
          )}
          {date && <span className="text-[10px] text-slate-400">{date}</span>}
        </div>
        {status && <StatusBadge status={status} />}
      </div>
    </div>
  );
};

// Stat card component
export const StatCard = ({ title, value, icon: Icon, change, color = 'indigo', trend, suffix = '', className = '', style }) => {
  const colors = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500', border: 'border-l-indigo-500' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500', border: 'border-l-emerald-500' },
    blue:   { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500', border: 'border-l-blue-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500', border: 'border-l-orange-500' },
    red:    { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500', border: 'border-l-red-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500', border: 'border-l-purple-500' },
    amber:  { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500', border: 'border-l-amber-500' },
    cyan:   { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: 'text-cyan-500', border: 'border-l-cyan-500' },
  };

  const c = colors[color] || colors.indigo;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${c.border} shadow-sm p-5 card-hover ${className}`} style={style}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      {/* Mini trend bar */}
      <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${c.bg.replace('bg-', 'bg-').replace('-50', '-400')} rounded-full transition-all`}
          style={{ width: change !== undefined ? `${Math.min(100, Math.abs(change) * 4 + 20)}%` : '40%' }}
        />
      </div>
      {(change !== undefined || trend) && (
        <p className={`text-xs mt-1.5 font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% {trend || 'vs last month'}
        </p>
      )}
    </div>
  );
};

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-slate-200 shadow-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
    <Skeleton className="h-8 w-16 mb-4" />
    <Skeleton className="h-1 w-full rounded-full" />
  </div>
);

// Button component
export const Button = ({
  children, variant = 'primary', size = 'md',
  onClick, disabled, loading, type = 'button', icon: Icon, className = ''
}) => {
  const variants = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200/50 disabled:bg-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200/50 disabled:bg-red-300 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
    outline:   'border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
    ghost:     'text-slate-600 hover:bg-slate-100 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
    'icon-only': 'p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
    link:      'text-indigo-600 hover:underline underline-offset-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 rounded-lg',
    sm: 'text-sm px-3 py-2 rounded-xl',
    md: 'text-sm px-4 py-2.5 rounded-xl',
    lg: 'text-base px-6 py-3 rounded-xl',
  };

  // icon-only and link variants have their own sizing
  const sizeClass = (variant === 'icon-only' || variant === 'link') ? '' : sizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-95
        ${variants[variant]} ${sizeClass} ${className}`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      ) : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
};

// Input component
export const Input = ({ label, error, required, className = '', ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// Select component
export const Select = ({ label, error, required, children, className = '', ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// Textarea component
export const Textarea = ({ label, error, required, className = '', rows = 3, ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <textarea
      rows={rows}
      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// Modal component
export const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-fadeIn`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Confirm dialog
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
    footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>
    }>
    <p className="text-slate-600 text-sm">{message}</p>
  </Modal>
);

// Skeleton loader
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
);

// Empty state
export const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mb-4">
      {Icon && <Icon className="w-9 h-9 text-slate-400" />}
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 max-w-sm mb-5">{description}</p>}
    {action && <Button onClick={action}>{actionLabel}</Button>}
  </div>
);

// Avatar — deterministic color from name hash
export const Avatar = ({ name, size = 'md' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg',
  };

  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-indigo-600',
    'from-cyan-500 to-sky-600',
    'from-fuchsia-500 to-purple-600',
  ];

  // Deterministic hash from name string
  const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];

  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
};

// Page header
export const PageHeader = ({ title, subtitle, actions, breadcrumb, spacing = 'mb-6', tabs }) => (
  <div className={spacing}>
    <div className="flex items-start justify-between mb-1">
      <div>
        {breadcrumb && <p className="text-xs text-slate-400 mb-1">{breadcrumb}</p>}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>}
    </div>
    {tabs && <div className="mt-4">{tabs}</div>}
  </div>
);

// Table component
export const Table = ({ columns, data, onRowClick, loading, emptyIcon, emptyTitle, emptyDescription, emptyAction, emptyActionLabel }) => {
  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            {columns.map((col, j) => <Skeleton key={j} className="h-8 flex-1" />)}
          </div>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return <EmptyState icon={emptyIcon} title={emptyTitle || 'No records found'} description={emptyDescription} action={emptyAction} actionLabel={emptyActionLabel} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row._id || i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-sm text-slate-700 whitespace-nowrap ${col.className || ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Pagination — smart window (page ± 2)
export const Pagination = ({ page, pages, total, limit, onPageChange }) => {
  if (pages <= 1) return null;

  const pageWindow = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-500">
        Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex gap-1">
        <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50">
          Previous
        </button>
        {page > 3 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">1</button>
            {page > 4 && <span className="px-2 py-1.5 text-xs text-slate-400">…</span>}
          </>
        )}
        {pageWindow().map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-xs rounded-lg ${p === page ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {p}
          </button>
        ))}
        {page < pages - 2 && (
          <>
            {page < pages - 3 && <span className="px-2 py-1.5 text-xs text-slate-400">…</span>}
            <button onClick={() => onPageChange(pages)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">{pages}</button>
          </>
        )}
        <button disabled={page === pages} onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50">
          Next
        </button>
      </div>
    </div>
  );
};

// Tab component — with variant support
export const Tabs = ({ tabs, activeTab, onChange, variant = 'pill' }) => {
  const containerClass = variant === 'pill'
    ? 'flex gap-1 bg-slate-100 p-1 rounded-xl'
    : 'flex gap-1 bg-white border border-slate-200 rounded-xl p-1';

  const activeClass = variant === 'pill'
    ? 'bg-white text-slate-800 shadow-sm'
    : 'bg-indigo-600 text-white shadow-sm';

  const inactiveClass = variant === 'pill'
    ? 'text-slate-500 hover:text-slate-700'
    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50';

  return (
    <div className={containerClass}>
      {tabs.map(tab => {
        const TabIcon = tab.icon;
        return (
          <button key={tab.value} onClick={() => onChange(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.value ? activeClass : inactiveClass}`}>
            {TabIcon && <TabIcon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.value
                  ? (variant === 'pill' ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white')
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Activity icon
export const ActivityIcon = ({ type }) => {
  const icons = {
    'Call': { emoji: '📞', bg: 'bg-green-100' },
    'Email': { emoji: '📧', bg: 'bg-blue-100' },
    'WhatsApp': { emoji: '💬', bg: 'bg-green-100' },
    'Meeting': { emoji: '🤝', bg: 'bg-purple-100' },
    'Note': { emoji: '📝', bg: 'bg-yellow-100' },
    'Follow-up': { emoji: '📅', bg: 'bg-orange-100' },
    'Task': { emoji: '✅', bg: 'bg-indigo-100' },
    'Status Change': { emoji: '🔄', bg: 'bg-slate-100' },
    'Deal Created': { emoji: '💼', bg: 'bg-blue-100' },
    'Deal Won': { emoji: '🎉', bg: 'bg-green-100' },
    'Deal Lost': { emoji: '😔', bg: 'bg-red-100' },
    'Lead Created': { emoji: '👤', bg: 'bg-indigo-100' },
    'Customer Created': { emoji: '⭐', bg: 'bg-amber-100' },
    'Quote Sent': { emoji: '📄', bg: 'bg-cyan-100' },
  };

  const config = icons[type] || { emoji: '📌', bg: 'bg-slate-100' };

  return (
    <div className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center text-base flex-shrink-0`}>
      {config.emoji}
    </div>
  );
};

// Search/filter bar
export const FilterBar = ({ children, className = '' }) => (
  <div className={`flex flex-wrap items-center gap-3 ${className}`}>
    {children}
  </div>
);

// Currency formatter
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount || 0);
};

// Date formatter
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Relative time
export const timeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(date);
};

// Score badge — with colored dot
export const ScoreBadge = ({ score }) => {
  const color = score >= 80
    ? 'text-emerald-600 bg-emerald-50'
    : score >= 60
    ? 'text-amber-600 bg-amber-50'
    : 'text-slate-600 bg-slate-100';
  const dotColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {score}
    </span>
  );
};
