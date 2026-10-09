import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, Handshake, Contact, CheckSquare,
  Calendar, Activity, Package, FileText, BarChart3, Settings,
  X, TrendingUp, Target, Phone, PlayCircle,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

// The app has exactly 3 roles: manager (everything), developer (projects),
// sales_rep (CRM pipeline). 'all' = every role can see the item.
const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['all'] },
      { path: '/leads', label: 'Leads', icon: Target, roles: ['manager', 'sales_rep'] },
      { path: '/customers', label: 'Customers', icon: UserCheck, roles: ['manager', 'sales_rep'] },
      { path: '/contacts', label: 'Contacts', icon: Contact, roles: ['manager', 'sales_rep'] },
      { path: '/deals', label: 'Deals', icon: Handshake, roles: ['manager', 'sales_rep'] },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { path: '/tasks', label: 'Tasks', icon: CheckSquare, roles: ['manager', 'sales_rep', 'developer'] },
      { path: '/follow-ups', label: 'Follow-ups', icon: Phone, roles: ['manager', 'sales_rep'], notificationDot: true },
      { path: '/calendar', label: 'Calendar', icon: Calendar, roles: ['manager', 'sales_rep', 'developer'] },
      { path: '/activities', label: 'Activities', icon: Activity, roles: ['manager', 'sales_rep'] },
    ],
  },
  {
    label: 'Workspace',
    items: [
      // Sales reps open demo requests → developers deliver them
      { path: '/demo-requests', label: 'Demo Requests', developerLabel: 'Projects', icon: PlayCircle, roles: ['all'] },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { path: '/products', label: 'Products', icon: Package, roles: ['manager'] },
      { path: '/quotations', label: 'Quotations', icon: FileText, roles: ['manager', 'sales_rep'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['manager'] },
      { path: '/users', label: 'Users', icon: Users, roles: ['manager'] },
      { path: '/settings', label: 'Settings', icon: Settings, roles: ['all'] },
    ],
  },
];

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const canAccess = (roles) => {
    if (roles.includes('all')) return true;
    return roles.includes(user?.role);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col
        transition-[width,transform] duration-300 ease-in-out select-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
        ${collapsed ? 'w-64 lg:w-20' : 'w-64'}
      `}>
        {/* Header: logo + collapse control + mobile close */}
        <div className={`h-16 border-b border-slate-200 dark:border-slate-800 flex items-center flex-shrink-0 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
        }`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <img src="/logo-light.png" alt="Crefto CRM" className="h-8 dark:hidden block object-contain" />
                <img src="/logo-dark.png" alt="Crefto CRM" className="h-8 hidden dark:block object-contain" />
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={onToggleCollapse}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar (Ctrl+B)"
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  title="Close sidebar"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar (Ctrl+B)"
              title="Expand sidebar (Ctrl+B)"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
            >
              <img src="/logo.png" alt="Crefto" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Optional Company Subheader */}
        {!collapsed && user?.company?.name && (
          <div className="px-3.5 py-1.5 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/20">
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider truncate">
              {user.company.name}
            </p>
          </div>
        )}

        {/* Navigation list */}
        <nav className={`flex-1 overflow-y-auto py-2 space-y-2.5 ${collapsed ? 'px-2' : 'px-2.5'}`}>
          {NAV_GROUPS.map((group, groupIndex) => {
            const visibleItems = group.items.filter(item => canAccess(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-0.5">
                {!collapsed ? (
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-2 mb-1 mt-1.5 select-none">
                    {group.label}
                  </p>
                ) : (
                  groupIndex > 0 && <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-2" />
                )}

                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path));
                    const label = user?.role === 'developer' && item.developerLabel
                      ? item.developerLabel
                      : item.label;

                    return (
                      <li
                        key={item.path}
                        onMouseEnter={(e) => {
                          if (collapsed) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredItem({
                              label,
                              top: rect.top + rect.height / 2,
                              hasDot: item.notificationDot
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          if (collapsed) setHoveredItem(null);
                        }}
                      >
                        <NavLink
                          to={item.path}
                          onClick={() => window.innerWidth < 1024 && onClose()}
                          title={collapsed ? label : undefined}
                          className={`
                            relative flex items-center rounded-xl text-sm font-medium
                            transition-all duration-200 group
                            ${collapsed
                              ? 'justify-center w-11 h-11 mx-auto'
                              : 'gap-3 px-3 py-2 justify-start'
                            }
                            ${isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                            }
                          `}
                        >
                          {/* Active indicator bar in expanded mode */}
                          {isActive && !collapsed && (
                            <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-white/70 rounded-r-full" />
                          )}

                          <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`} />

                          {!collapsed && (
                            <span className="flex-1 truncate">{label}</span>
                          )}

                          {/* Notification dot */}
                          {item.notificationDot && (
                            collapsed ? (
                              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-400 ring-2 ring-white dark:ring-slate-900" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                            )
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Collapsed floating tooltip */}
        {collapsed && hoveredItem && (
          <div
            className="fixed left-[88px] -translate-y-1/2 px-2.5 py-1.5 bg-white dark:bg-slate-950/95 backdrop-blur-sm text-slate-900 dark:text-slate-100 text-xs font-medium rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700/80 pointer-events-none z-[9999] whitespace-nowrap animate-fadeIn flex items-center gap-2"
            style={{ top: hoveredItem.top }}
          >
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white dark:border-r-slate-950/95" />
            <span>{hoveredItem.label}</span>
            {hoveredItem.hasDot && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            )}
          </div>
        )}

        {/* Footer: user profile + collapse toggle */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-2 flex-shrink-0">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-900 dark:text-white text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-slate-400 text-xs truncate capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <button
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar (Ctrl+B)"
                className="hidden lg:flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Collapse sidebar</span>
                <kbd className="ml-auto text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                  Ctrl+B
                </kbd>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-md cursor-pointer hover:ring-2 hover:ring-indigo-400/50 transition-all"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({
                    label: `${user?.firstName || ''} ${user?.lastName || ''} (${user?.role?.replace('_', ' ') || ''})`.trim(),
                    top: rect.top + rect.height / 2
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>

              <button
                onClick={onToggleCollapse}
                aria-label="Expand sidebar"
                title="Expand sidebar (Ctrl+B)"
                className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors items-center justify-center cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
