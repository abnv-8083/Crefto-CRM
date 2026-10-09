import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI, searchAPI } from '../../api';
import {
  Menu, Search, Bell, Plus, ChevronDown, LogOut, User,
  Settings, Target, UserCheck, Handshake, CheckSquare, Phone,
  Contact, X, PlayCircle, Moon, Sun, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const Topbar = ({ onMenuClick, collapsed, onToggleCollapse }) => {
  const { user, logout, isDeveloper } = useAuth();
  const developer = isDeveloper();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAddModal, setShowAddModal] = useState(null);
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* private mode */ }
  };

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const quickAddRef = useRef(null);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data } = await notificationsAPI.getAll({ limit: 10 });
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      } catch {}
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await searchAPI.global(searchQuery);
        setSearchResults(data.data);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) setShowQuickAdd(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Quick add targets per role: developers don't create CRM records
  const quickAddItems = developer ? [] : [
    { label: 'New Lead', icon: Target, path: '/leads?action=new', color: 'text-indigo-600' },
    { label: 'New Customer', icon: UserCheck, path: '/customers?action=new', color: 'text-green-600' },
    { label: 'New Deal', icon: Handshake, path: '/deals?action=new', color: 'text-blue-600' },
    { label: 'New Task', icon: CheckSquare, path: '/tasks?action=new', color: 'text-orange-600' },
    { label: 'New Follow-up', icon: Phone, path: '/follow-ups?action=new', color: 'text-purple-600' },
    { label: 'New Contact', icon: Contact, path: '/contacts?action=new', color: 'text-pink-600' },
    { label: 'Demo Request', icon: PlayCircle, path: '/demo-requests?action=new', color: 'text-sky-600' },
  ];

  const notificationIcons = {
    lead_assigned: '👤',
    lead_status_changed: '🔄',
    follow_up_due: '📅',
    task_due: '✅',
    task_assigned: '📋',
    deal_won: '🎉',
    deal_lost: '😔',
    meeting_reminder: '🤝',
    overdue_task: '⚠️',
    general: '🔔',
  };

  const getSearchResultsCount = () => {
    if (!searchResults) return 0;
    return Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const map = {
      '/': 'Dashboard',
      '/leads': 'Leads',
      '/customers': 'Customers',
      '/contacts': 'Contacts',
      '/deals': 'Deals',
      '/tasks': 'Tasks',
      '/follow-ups': 'Follow-ups',
      '/calendar': 'Calendar',
      '/activities': 'Activities',
      '/products': 'Products',
      '/demo-requests': 'Demo Requests',
      '/quotations': 'Quotations',
      '/reports': 'Reports',
      '/users': 'Users',
      '/settings': 'Settings',
      '/notifications': 'Notifications',
    };
    for (const [key, val] of Object.entries(map)) {
      if (path === key || (key !== '/' && path.startsWith(key))) return val;
    }
    return 'Crefto CRM';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-30 shadow-sm">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        title="Open menu"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar toggle button */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
      </button>

      {/* Vertical divider + page title */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="h-5 w-px bg-slate-200" />
        <span className="text-sm font-semibold text-slate-700">{getPageTitle()}</span>
      </div>

      {/* Search (CRM data — hidden for developers) */}
      {!developer && (
      <div ref={searchRef} className="flex-1 max-w-xl relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, customers, deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            className="w-full pl-10 pr-20 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       placeholder:text-slate-400 transition-all"
          />
          {searchQuery ? (
            <button onClick={() => { setSearchQuery(''); setSearchResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium bg-slate-100 rounded px-1.5 py-0.5 pointer-events-none">
              ⌘K
            </span>
          )}
        </div>

        {/* Search results dropdown */}
        {showSearch && searchResults && getSearchResultsCount() > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-80 overflow-y-auto animate-fadeIn">
            {searchResults.leads?.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Leads</p>
                {searchResults.leads.map(lead => (
                  <button key={lead._id} onClick={() => { navigate(`/leads/${lead._id}`); setShowSearch(false); setSearchQuery(''); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-slate-400">{lead.email} • {lead.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchResults.customers?.length > 0 && (
              <div className="p-2 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Customers</p>
                {searchResults.customers.map(c => (
                  <button key={c._id} onClick={() => { navigate(`/customers/${c._id}`); setShowSearch(false); setSearchQuery(''); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <UserCheck className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchResults.deals?.length > 0 && (
              <div className="p-2 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Deals</p>
                {searchResults.deals.map(d => (
                  <button key={d._id} onClick={() => { navigate(`/deals`); setShowSearch(false); setSearchQuery(''); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <Handshake className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-400">₹{d.value?.toLocaleString()} • {d.stage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Light mode' : 'Dark mode'}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Quick Add */}
        {!developer && (
        <div ref={quickAddRef} className="relative">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium
                       hover:bg-indigo-700 transition-colors shadow-[0_2px_8px_rgba(79,70,229,0.25)] hover:shadow-[0_4px_12px_rgba(79,70,229,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Quick Add</span>
          </button>

          {showQuickAdd && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-fadeIn py-2">
              {quickAddItems.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.path}
                    onClick={() => { navigate(item.path); setShowQuickAdd(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 ${unreadCount > 0 ? 'ring-pulse' : ''}`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Mark all read
                    </button>
                  )}
                  <span className="text-xs text-slate-400">{unreadCount} unread</span>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif._id}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors
                        ${!notif.isRead ? 'bg-indigo-50/50' : ''}`}
                    >
                      <div className="flex gap-3">
                        <span className="text-base">{notificationIcons[notif.type] || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!notif.isRead ? 'text-slate-800' : 'text-slate-600'}`}>{notif.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-slate-300 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 text-center">
                <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${showUserMenu ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight">{user?.firstName}</p>
              <p className="text-xs text-slate-400 capitalize leading-tight">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-fadeIn py-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button onClick={() => { navigate('/settings/profile'); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                <User className="w-4 h-4 text-slate-400" />
                Profile
              </button>
              <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </button>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
