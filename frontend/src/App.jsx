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

// Role gate: renders children only for the allowed roles, otherwise → home
const RequireRole = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
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
              background: '#1E293B',
              color: '#F8FAFC',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* App routes (protected) */}
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
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
