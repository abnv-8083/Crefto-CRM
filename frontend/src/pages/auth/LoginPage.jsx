import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.message);
  };


  return (
    /* Outer shell — fills full viewport, scrolls on small screens */
    <div
      style={{ minHeight: '100dvh' }}
      className="keep-dark relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900
                 flex items-center justify-center overflow-y-auto py-10 px-4"
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4  left-1/4  w-3 h-3 bg-indigo-400/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3  right-1/4 w-2 h-2 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-indigo-300/20 rounded-full animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-2/3  right-1/3 w-2.5 h-2.5 bg-violet-400/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Card column */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Logo + headline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center shadow-xl shadow-indigo-500/30 flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-2xl leading-tight">Crefto</p>
              <p className="text-indigo-400 text-xs font-medium tracking-wide">CRM Platform</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to your account to continue</p>
        </div>

        {/* Glass card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl
                             text-white text-sm placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-white/10 border border-white/20 rounded-xl
                             text-white text-sm placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between text-sm pt-0.5">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input type="checkbox" className="rounded accent-indigo-500 w-3.5 h-3.5" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                         font-semibold text-sm rounded-xl hover:from-indigo-500 hover:to-purple-500
                         transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60
                         flex items-center justify-center gap-2 active:scale-[.98]"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>


          {/* No self-signup — managers add users from the Users page */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Need an account? Ask your manager to add you.
          </p>
        </div>

        {/* Feature badges */}
        <div className="mt-6 flex items-center justify-center gap-6">
          {[{ icon: '🔒', label: 'Secure' }, { icon: '⚡', label: 'Fast' }, { icon: '🛡️', label: 'Reliable' }].map(f => (
            <div key={f.label} className="flex items-center gap-1.5 text-slate-500">
              <span className="text-sm">{f.icon}</span>
              <span className="text-xs font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          © 2024 Crefto CRM. Enterprise-grade CRM platform.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
