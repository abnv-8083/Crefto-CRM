import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';

const ForgotPasswordPage = () => {
  const containerRef = useRef(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.forgot-blob',
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, stagger: 0.2 }
    )
    .fromTo('.forgot-header-item',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 },
      '-=0.8'
    )
    .fromTo('.forgot-card',
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.4)' },
      '-=0.6'
    );
  }, { scope: containerRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ minHeight: '100dvh' }}
      className="keep-dark relative bg-[#090D16] text-slate-100 flex items-center justify-center overflow-y-auto py-12 px-4 selection:bg-emerald-500 selection:text-white"
    >
      {/* Ambient Glow Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="forgot-blob absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="forgot-blob absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[130px]" />
      </div>

      {/* Top back navigation */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 my-auto">
        <div className="text-center mb-8">
          <div className="forgot-header-item inline-flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1.5px] shadow-xl shadow-emerald-500/25">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Crefto CRM" className="w-7 h-7 object-contain" />
              </div>
            </div>
          </div>
          <h1 className="forgot-header-item font-display text-3xl font-bold text-white tracking-tight leading-tight">
            Reset Password
          </h1>
          <p className="forgot-header-item text-slate-400 text-sm mt-2 font-normal">
            Enter your account email to receive security instructions
          </p>
        </div>

        <div className="forgot-card bg-[#0F172A]/85 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8 sm:p-9 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Instructions Sent</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                If an account exists for <span className="text-white font-medium">{email}</span>, you will receive a secure password reset link shortly.
              </p>
              <Link
                to="/login"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                               text-white text-sm placeholder:text-slate-500
                               focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60
                               transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                           font-semibold text-sm rounded-xl hover:from-emerald-500 hover:to-teal-500
                           transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-60
                           flex items-center justify-center gap-2 active:scale-[.99] cursor-pointer"
              >
                {loading ? 'Sending Instructions…' : 'Send Reset Link'}
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs text-slate-400 hover:text-emerald-400 font-medium inline-flex items-center gap-1.5 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
