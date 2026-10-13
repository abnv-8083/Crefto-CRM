import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// App pages
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/leads/LeadsPage';
import LeadDetailPage from './pages/leads/LeadDetailPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import DealsPage from './pages/deals/DealsPage';
import ContactsPage from './pages/contacts/ContactsPage';
import TasksPage from './pages/tasks/TasksPage';
import FollowUpsPage from './pages/followups/FollowUpsPage';
import CalendarPage from './pages/calendar/CalendarPage';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import ProductsPage from './pages/products/ProductsPage';
import QuotationsPage from './pages/quotations/QuotationsPage';
import QuotationDetailPage from './pages/quotations/QuotationDetailPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/users/UsersPage';
import SettingsPage from './pages/settings/SettingsPage';
import DemoRequestsPage from './pages/demo/DemoRequestsPage';

import LandingPage from './pages/landing/LandingPage';

// Role gate: renders children only for the allowed roles, otherwise → dashboard
const RequireRole = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Root route: Show modern Landing Page for unauthenticated visitors, dashboard for logged in users
const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));

  // If token is present and still loading auth, show sleek themed backdrop
  if (loading && hasToken) {
    return (
      <div className="fixed inset-0 bg-[#070A11] flex items-center justify-center z-50">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1.5px] animate-pulse">
          <div className="w-full h-full bg-[#090D16] rounded-[14px] flex items-center justify-center">
            <img src="/logo.png" alt="Crefto" className="w-7 h-7 object-contain" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
};

const MANAGER = ['manager'];
const SALES = ['manager', 'sales_rep'];
const TEAM = ['manager', 'sales_rep', 'developer']; // tasks & calendar are open to everyone

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0F172A',
              color: '#F8FAFC',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 18px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public Website & Auth routes */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* App routes (protected by Layout) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/demo-requests" element={<DemoRequestsPage />} />
            <Route path="/leads" element={<RequireRole roles={SALES}><LeadsPage /></RequireRole>} />
            <Route path="/leads/:id" element={<RequireRole roles={SALES}><LeadDetailPage /></RequireRole>} />
            <Route path="/customers" element={<RequireRole roles={SALES}><CustomersPage /></RequireRole>} />
            <Route path="/customers/:id" element={<RequireRole roles={SALES}><CustomerDetailPage /></RequireRole>} />
            <Route path="/deals" element={<RequireRole roles={SALES}><DealsPage /></RequireRole>} />
            <Route path="/contacts" element={<RequireRole roles={SALES}><ContactsPage /></RequireRole>} />
            <Route path="/tasks" element={<RequireRole roles={TEAM}><TasksPage /></RequireRole>} />
            <Route path="/follow-ups" element={<RequireRole roles={SALES}><FollowUpsPage /></RequireRole>} />
            <Route path="/calendar" element={<RequireRole roles={TEAM}><CalendarPage /></RequireRole>} />
            <Route path="/activities" element={<RequireRole roles={SALES}><ActivitiesPage /></RequireRole>} />
            <Route path="/products" element={<RequireRole roles={MANAGER}><ProductsPage /></RequireRole>} />
            <Route path="/quotations" element={<RequireRole roles={TEAM}><QuotationsPage /></RequireRole>} />
            <Route path="/quotations/:id" element={<RequireRole roles={TEAM}><QuotationDetailPage /></RequireRole>} />
            <Route path="/reports" element={<RequireRole roles={MANAGER}><ReportsPage /></RequireRole>} />
            <Route path="/users" element={<RequireRole roles={MANAGER}><UsersPage /></RequireRole>} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:tab" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
