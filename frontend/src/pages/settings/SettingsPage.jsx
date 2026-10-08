import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { settingsAPI, authAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, User, Lock, Bell, Shield, Save } from 'lucide-react';
import { Card, Button, Input, Select, Textarea, PageHeader, Avatar } from '../../components/ui';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'profile', label: 'My Profile', icon: User },
  { key: 'password', label: 'Password', icon: Lock },
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'notifications', label: 'Notifications', icon: Bell },
];

const SettingsPage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user, updateUser, isAdmin } = useAuth();
  const activeTab = tab || 'profile';

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    jobTitle: user?.jobTitle || '',
  });

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', website: '', address: '', city: '', country: '', industry: '' });
  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'company' && isAdmin()) {
      settingsAPI.getCompany().then(({ data }) => {
        const c = data.data;
        setCompanyForm({
          name: c.name || '', email: c.email || '', phone: c.phone || '',
          website: c.website || '', address: c.address || '',
          city: c.city || '', country: c.country || '', industry: c.industry || '',
        });
      }).catch(() => {}).finally(() => setCompanyLoading(false));
    }
  }, [activeTab, isAdmin]);

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      updateUser(data.data);
      toast.success('Profile updated successfully');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.updatePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const handleCompanySave = async () => {
    setLoading(true);
    try {
      await settingsAPI.updateCompany(companyForm);
      toast.success('Company settings saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and company settings" />

      <div className="flex gap-4">
        {/* Sidebar nav */}
        <div className="w-56 flex-shrink-0">
          <Card padding="p-2">
            <nav className="space-y-1">
              {TABS.filter(t => t.key !== 'company' || isAdmin()).map(t => {
                const Icon = t.icon;
                const isActive = activeTab === t.key;
                return (
                  <button key={t.key}
                    onClick={() => navigate(`/settings/${t.key}`)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">My Profile</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <Avatar name={`${user?.firstName} ${user?.lastName}`} size="lg" />
                <div>
                  <p className="font-semibold text-slate-800">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{user?.company?.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={profileForm.firstName}
                    onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))} />
                  <Input label="Last Name" value={profileForm.lastName}
                    onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
                <Input label="Email" type="email" value={profileForm.email}
                  onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" value={profileForm.phone}
                    onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                  <Input label="Job Title" value={profileForm.jobTitle}
                    onChange={(e) => setProfileForm(p => ({ ...p, jobTitle: e.target.value }))} />
                </div>
                <div className="pt-2">
                  <Button onClick={handleProfileSave} loading={loading} icon={Save}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h2>
              <div className="space-y-4 max-w-md">
                <Input label="Current Password" type="password" value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password" />
                <Input label="New Password" type="password" value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min 6 characters" />
                <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password" />

                {/* Password strength */}
                {passwordForm.newPassword && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">Password strength</p>
                    <div className="flex gap-1">
                      {[6, 8, 10, 12].map((len, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                          passwordForm.newPassword.length >= len
                            ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-amber-400' : i === 2 ? 'bg-emerald-400' : 'bg-emerald-500'
                            : 'bg-slate-100'
                        }`} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button onClick={handlePasswordSave} loading={loading} icon={Lock}>Change Password</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && isAdmin() && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Company Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Company Name" value={companyForm.name}
                    onChange={(e) => setCompanyForm(p => ({ ...p, name: e.target.value }))} className="col-span-2" />
                  <Input label="Company Email" type="email" value={companyForm.email}
                    onChange={(e) => setCompanyForm(p => ({ ...p, email: e.target.value }))} />
                  <Input label="Company Phone" value={companyForm.phone}
                    onChange={(e) => setCompanyForm(p => ({ ...p, phone: e.target.value }))} />
                  <Input label="Website" value={companyForm.website}
                    onChange={(e) => setCompanyForm(p => ({ ...p, website: e.target.value }))} />
                  <Input label="Industry" value={companyForm.industry}
                    onChange={(e) => setCompanyForm(p => ({ ...p, industry: e.target.value }))} />
                  <Input label="City" value={companyForm.city}
                    onChange={(e) => setCompanyForm(p => ({ ...p, city: e.target.value }))} />
                  <Input label="Country" value={companyForm.country}
                    onChange={(e) => setCompanyForm(p => ({ ...p, country: e.target.value }))} />
                </div>
                <Textarea label="Address" value={companyForm.address} rows={2}
                  onChange={(e) => setCompanyForm(p => ({ ...p, address: e.target.value }))} />
                <div className="pt-2">
                  <Button onClick={handleCompanySave} loading={loading} icon={Save}>Save Company Settings</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'leadAssigned', label: 'Lead Assigned', desc: 'When a lead is assigned to you' },
                  { key: 'taskDue', label: 'Task Due', desc: 'When a task deadline approaches' },
                  { key: 'followUpDue', label: 'Follow-up Due', desc: 'When a follow-up is scheduled' },
                  { key: 'dealWon', label: 'Deal Won', desc: 'When a deal is marked as won' },
                  { key: 'dealLost', label: 'Deal Lost', desc: 'When a deal is marked as lost' },
                  { key: 'mentionedInNote', label: 'Mentioned in Note', desc: 'When someone mentions you' },
                  { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly performance summary' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
                <div className="pt-2">
                  <Button onClick={() => toast.success('Notification preferences saved')} icon={Save}>Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
