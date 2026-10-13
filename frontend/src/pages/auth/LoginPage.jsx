import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // GSAP Entrance Animation
  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.login-blob',
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, stagger: 0.2 }
    )
    .fromTo('.login-header-item',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 },
      '-=0.8'
    )
    .fromTo('.login-card',
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.4)' },
      '-=0.6'
    )
    .fromTo('.login-input-row',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, stagger: 0.08 },
      '-=0.5'
    )
    .fromTo('.login-footer-item',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
      '-=0.4'
    );
  }, { scope: containerRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.message);
  };

  return (
    <div
      ref={containerRef}
      style={{ minHeight: '100dvh' }}
      className="keep-dark relative bg-[#090D16] text-slate-100 flex items-center justify-center overflow-y-auto py-12 px-4 selection:bg-emerald-500 selection:text-white"
    >
      {/* ─── Ambient Glow Blobs ───────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-blob absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="login-blob absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[130px]" />
        <div className="login-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/8 rounded-full blur-[140px]" />
      </div>

      {/* Top back navigation */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Card column */}
      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Logo + headline */}
        <div className="text-center mb-8">
          <div className="login-header-item inline-flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1.5px] shadow-xl shadow-emerald-500/25">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Crefto CRM" className="w-7 h-7 object-contain" />
              </div>
            </div>
          </div>
          <h1 className="login-header-item font-display text-3xl font-bold text-white tracking-tight leading-tight">
            Welcome to <span className="text-emerald-400">Crefto</span>
          </h1>
          <p className="login-header-item text-slate-400 text-sm mt-2 font-normal">
            Sign in to access your sales pipeline &amp; developer desk
          </p>
        </div>

        {/* Glass card */}
        <div className="login-card bg-[#0F172A]/85 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8 sm:p-9 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />

          {error && (
            <div className="mb-5 px-4 py-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-sm leading-relaxed flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="login-input-row space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                             text-white text-sm placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60
                             transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-input-row space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl
                             text-white text-sm placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60
                             transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="login-input-row flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input type="checkbox" className="rounded accent-emerald-500 w-3.5 h-3.5" />
                <span>Keep me signed in</span>
              </label>
              <Link to="/forgot-password" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="login-input-row w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                         font-semibold text-sm rounded-xl hover:from-emerald-500 hover:to-teal-500
                         transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-60
                         flex items-center justify-center gap-2 active:scale-[.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Account notice */}
          <p className="login-footer-item text-center text-xs text-slate-400 mt-6">
            Need credentials? Contact your workspace administrator.
          </p>
        </div>

        {/* Feature badges */}
        <div className="login-footer-item mt-6 flex items-center justify-center gap-6 text-slate-400 text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>Ultra Fast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Enterprise SLA</span>
          </div>
        </div>

        <p className="login-footer-item text-center text-[11px] text-slate-600 mt-4">
          &copy; {new Date().getFullYear()} Crefto CRM · All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
