import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight, CheckCircle2, ChevronRight, Play, Shield,
  Zap, BarChart3, Users, FileText, Send, Sparkles,
  Layers, Lock, Clock, Moon, Sun, Laptop, ArrowUpRight,
  TrendingUp, Award, RefreshCw, Star, HelpCircle, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const heroWrapperRef = useRef(null);
  const navbarRef = useRef(null);
  const mockupRef = useRef(null);
  const floatingCardsRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const workflowRef = useRef(null);
  const interactivePreviewRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);

  // Preloader Refs
  const loaderRef = useRef(null);
  const curtainRef = useRef(null);
  const accentCurtainRef = useRef(null);
  const counterTextRef = useRef(null);
  const statusTextRef = useRef(null);
  const progressBarRef = useRef(null);
  const loaderTimelineRef = useRef(null);

  // States
  const [activeTab, setActiveTab] = useState('pipeline');
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(0);
  const [theme, setTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch {}
    }
  };

  // Skip loader for instant access on click / escape key
  const skipLoader = useCallback(() => {
    if (loaderTimelineRef.current) {
      loaderTimelineRef.current.progress(1);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        skipLoader();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipLoader]);

  // GSAP Animations
  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (loaderRef.current) loaderRef.current.style.display = 'none';
      if (heroWrapperRef.current) {
        heroWrapperRef.current.style.filter = 'none';
        heroWrapperRef.current.style.transform = 'none';
        heroWrapperRef.current.style.opacity = '1';
      }
      if (navbarRef.current) {
        navbarRef.current.style.transform = 'none';
        navbarRef.current.style.opacity = '1';
      }
      return;
    }

    // 1. Initial State Setup: Prepare Hero & Navbar behind the Preloader
    gsap.set(heroWrapperRef.current, {
      scale: 1.06,
      filter: 'blur(10px)',
      opacity: 0.85,
      transformOrigin: 'center 20%',
    });
    gsap.set(navbarRef.current, { yPercent: -100, opacity: 0 });
    gsap.set('.hero-badge', { opacity: 0, y: 25, scale: 0.9 });
    gsap.set('.hero-title-line', { y: '115%', opacity: 0 });
    gsap.set('.hero-description', { opacity: 0, y: 30 });
    gsap.set('.hero-cta-group', { opacity: 0, y: 25 });
    if (mockupRef.current) {
      gsap.set(mockupRef.current, { opacity: 0, y: 80, scale: 0.92, rotateX: 8 });
    }
    gsap.set('.floating-badge', { opacity: 0, scale: 0.7, y: 35 });

    // 2. Master Loading-to-Hero Reveal Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        if (loaderRef.current) loaderRef.current.style.display = 'none';
        ScrollTrigger.refresh();
      }
    });
    loaderTimelineRef.current = tl;

    const counterObj = { value: 0 };

    // Phase 1: Preloader Emblem & Counter Progression
    tl.fromTo('.loader-emblem',
      { scale: 0.7, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' }
    )
    .fromTo('.loader-meta',
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out' },
      '-=0.25'
    )
    .to(counterObj, {
      value: 100,
      duration: 1.35,
      ease: 'power3.inOut',
      onUpdate: () => {
        const val = Math.floor(counterObj.value);
        if (counterTextRef.current) {
          counterTextRef.current.textContent = `${val < 10 ? '0' + val : val}%`;
        }
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${val}%`;
        }
        if (statusTextRef.current) {
          if (val < 25) statusTextRef.current.textContent = 'INITIALIZING ARCHITECTURE';
          else if (val < 55) statusTextRef.current.textContent = 'CALIBRATING DEAL PIPELINE';
          else if (val < 85) statusTextRef.current.textContent = 'SYNCHRONIZING WEBSOCKETS';
          else statusTextRef.current.textContent = 'EXPERIENCE READY';
        }
      }
    }, '-=0.15')

    // Phase 2: Loading Screen Exit (Dissolve & Theatrical Shutter Wipe)
    .to('.loader-center-content', {
      opacity: 0,
      scale: 1.08,
      y: -24,
      duration: 0.42,
      ease: 'power3.in',
    })
    .to('.loader-meta', {
      opacity: 0,
      duration: 0.3,
    }, '-=0.35')

    // The Dual-Curtain Lift
    .to(accentCurtainRef.current, {
      yPercent: -100,
      duration: 0.85,
      ease: 'expo.inOut',
    }, '-=0.12')
    .to(curtainRef.current, {
      yPercent: -100,
      duration: 1.0,
      ease: 'expo.inOut',
    }, '-=0.78')

    // Phase 3: Seamless Hero Section Entrance Orchestration
    .to(heroWrapperRef.current, {
      scale: 1,
      filter: 'blur(0px)',
      opacity: 1,
      duration: 1.15,
      ease: 'power3.out',
    }, '-=0.88')
    .to(navbarRef.current, {
      yPercent: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.85')
    .to('.hero-badge', {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: 'back.out(1.7)',
    }, '-=0.75')
    .to('.hero-title-line', {
      y: '0%',
      opacity: 1,
      duration: 1.05,
      stagger: 0.12,
      ease: 'power4.out',
    }, '-=0.68')
    .to('.hero-description', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.58')
    .to('.hero-cta-group', {
      opacity: 1,
      y: 0,
      duration: 0.75,
      stagger: 0.1,
      ease: 'power3.out',
    }, '-=0.52')
    .to(mockupRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      duration: 1.25,
      ease: 'power3.out',
    }, '-=0.62')
    .to('.floating-badge', {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.85,
      stagger: 0.14,
      ease: 'back.out(1.9)',
    }, '-=0.75');

    // 2. Hero Parallax ScrollTrigger
    if (mockupRef.current) {
      gsap.to(mockupRef.current, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
        y: 80,
        rotateX: -4,
        scale: 0.97,
        ease: 'none',
      });
    }

    // Parallax on Floating Badges
    const floatingBadges = gsap.utils.toArray('.floating-badge');
    floatingBadges.forEach((badge, i) => {
      const speed = (i + 1) * 35;
      gsap.to(badge, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
        y: -speed,
        ease: 'none',
      });
    });

    // 3. Stats Stagger Counter Appearance
    gsap.fromTo('.stat-item',
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      }
    );

    // 4. Feature Cards Reveal
    gsap.fromTo('.feature-card',
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        },
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.18,
        ease: 'power3.out',
      }
    );

    // 5. Workflow Bridge Reveal
    gsap.fromTo('.workflow-step',
      { opacity: 0, x: -30 },
      {
        scrollTrigger: {
          trigger: workflowRef.current,
          start: 'top 80%',
        },
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
      }
    );

    // 6. Interactive Preview Mockup Entrance
    gsap.fromTo('.preview-container',
      { opacity: 0, scale: 0.95, y: 40 },
      {
        scrollTrigger: {
          trigger: interactivePreviewRef.current,
          start: 'top 80%',
        },
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      }
    );

    // 7. Pricing Cards Stagger
    gsap.fromTo('.pricing-card',
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: pricingRef.current,
          start: 'top 80%',
        },
        opacity: 1,
        y: 0,
        duration: 0.85,
        stagger: 0.15,
        ease: 'power3.out',
      }
    );

  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#F8FAF9] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 relative overflow-x-hidden"
    >
      {/* ─── Ambient Glow Blobs ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/12 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] -right-32 w-[550px] h-[550px] bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-emerald-600/10 dark:bg-emerald-600/8 rounded-full blur-[130px]" />
      </div>

      {/* ─── High-End Editorial Preloader Screen & Shutter Reveal ─── */}
      <div
        ref={loaderRef}
        onClick={skipLoader}
        className="fixed inset-0 z-[100] overflow-hidden select-none cursor-pointer"
        title="Click to skip preview"
      >
        {/* Layer A: Accent Emerald Blade Curtain */}
        <div
          ref={accentCurtainRef}
          className="absolute inset-0 bg-gradient-to-b from-emerald-600 via-teal-700 to-emerald-950 pointer-events-none"
        />

        {/* Layer B: Main Dark Architectural Curtain */}
        <div
          ref={curtainRef}
          className="absolute inset-0 bg-[#070A11] flex flex-col justify-between p-6 sm:p-12 text-white"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[160px]" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
          </div>

          {/* Preloader Header Telemetry */}
          <div className="relative z-10 flex items-center justify-between loader-meta text-xs font-mono tracking-widest text-slate-400">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold text-slate-200">CREFTO // OS</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-500 hidden sm:inline">ENTERPRISE SUITE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-medium">[ INITIALIZING ]</span>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <span className="text-slate-500 hidden sm:inline">v2.4</span>
            </div>
          </div>

          {/* Preloader Centerpiece Content */}
          <div className="relative z-10 my-auto text-center max-w-xl mx-auto w-full loader-center-content">
            {/* Glowing Emblem */}
            <div className="loader-emblem inline-flex items-center justify-center mb-8 relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-2xl shadow-emerald-500/30">
                <div className="w-full h-full bg-[#090D16] rounded-[14px] flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="Crefto" className="w-9 h-9 object-contain" />
                </div>
              </div>
              <div className="absolute -inset-2.5 rounded-3xl border border-emerald-500/30 animate-pulse pointer-events-none" />
            </div>

            {/* Cinematic Counter */}
            <div
              ref={counterTextRef}
              className="font-display font-extrabold text-7xl sm:text-9xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-emerald-400 leading-none mb-4"
            >
              00%
            </div>

            {/* Progress Bar Track */}
            <div className="w-full max-w-md mx-auto h-[3px] bg-white/10 rounded-full overflow-hidden relative shadow-inner mb-4">
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 w-0 transition-all duration-75 relative rounded-full"
              >
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/80 blur-[2px] rounded-full" />
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div
              ref={statusTextRef}
              className="text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-400/90 font-medium"
            >
              INITIALIZING ARCHITECTURE
            </div>
          </div>

          {/* Preloader Footer Telemetry */}
          <div className="relative z-10 flex items-center justify-between loader-meta text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <span>ENCRYPTED WORKSPACE</span>
              <span className="text-slate-700">/</span>
              <span>LATENCY: 14ms</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <span>PRESS ANYWHERE TO SKIP</span>
              <span className="text-emerald-400">→</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Floating Smart Navbar ───────────────────── */}
      <header
        ref={navbarRef}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 backdrop-blur-xl bg-white/75 dark:bg-[#090D16]/80 border-b border-slate-200/60 dark:border-white/5 transition-all"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Crefto" className="w-6 h-6 object-contain" />
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white block">
                CREFTO <span className="text-emerald-500">CRM</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-widest text-emerald-600 dark:text-emerald-400 block -mt-1">
                Enterprise Suite
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Workflow</a>
            <a href="#preview" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Live Preview</a>
            <a href="#pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          {/* Nav Right Action Group */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-md shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                >
                  <span>Launch App</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Zoom Perspective Wrapper ─── */}
      <div ref={heroWrapperRef} className="hero-perspective-wrapper will-change-transform">
        <section ref={heroRef} className="relative z-10 pt-36 pb-20 md:pt-44 md:pb-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto text-center">

          {/* Top Pill Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Next-Generation Revenue Infrastructure</span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium lowercase">v2.4 Active</span>
          </div>

          {/* Masked Editorial Headline */}
          <h1 className="font-display font-extrabold text-fluid-hero text-slate-900 dark:text-white tracking-tight mb-8">
            <span className="mask-line-container">
              <span className="hero-title-line inline-block">
                The Operating System For
              </span>
            </span>
            <span className="mask-line-container">
              <span className="hero-title-line inline-block bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
                Modern Client Growth.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-description max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-10">
            Unify lead pipelines, developer demo delivery, automated follow-up cadences, and multi-currency quotations into one remarkably fast, beautifully unified workspace.
          </p>

          {/* Dual CTAs */}
          <div className="hero-cta-group flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-base shadow-xl shadow-emerald-600/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
            >
              <span>{isAuthenticated ? 'Enter CRM Workspace' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 font-semibold text-base shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              <span>Explore Interactive Demo</span>
            </a>
          </div>

          {/* Hero Parallax Workspace Showcase */}
          <div className="relative max-w-5xl mx-auto mt-6">
            {/* Ambient Back Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-60 dark:opacity-40 pointer-events-none" />

            {/* Main CRM Canvas Container */}
            <div
              ref={mockupRef}
              className="relative rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-white/15 bg-white/90 dark:bg-[#0F172A]/90 shadow-2xl backdrop-blur-2xl overflow-hidden p-2 sm:p-4 text-left"
            >
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/10 px-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-3 text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
                    crefto-crm.app/pipeline/overview
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time Workspace Active</span>
                </div>
              </div>

              {/* Inside Mockup UI Content */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 sm:p-4 bg-slate-50/70 dark:bg-[#090D16]/70 rounded-xl">
                {/* Metric Card 1 */}
                <div className="bg-white dark:bg-[#1E293B]/70 p-4 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>Quarterly Won</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">$842,500</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">+24.8% vs last quarter</div>
                </div>

                {/* Metric Card 2 */}
                <div className="bg-white dark:bg-[#1E293B]/70 p-4 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>Qualified Leads</span>
                    <Users className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">1,428</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">84 booked demo calls</div>
                </div>

                {/* Metric Card 3 */}
                <div className="bg-white dark:bg-[#1E293B]/70 p-4 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>Demo Delivery SLA</span>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">99.2%</div>
                  <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-medium">&lt; 1.8 hrs developer pickup</div>
                </div>

                {/* Metric Card 4 */}
                <div className="bg-white dark:bg-[#1E293B]/70 p-4 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>Active Quotations</span>
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">$318,000</div>
                  <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">12 awaiting client signoff</div>
                </div>

                {/* Main Visual Pipeline Section inside Mockup */}
                <div className="md:col-span-4 bg-white dark:bg-[#1E293B]/70 p-5 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display font-semibold text-sm text-slate-800 dark:text-white">Live Deal Pipeline</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Drag-and-drop enabled</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
                      <div className="text-[11px] uppercase font-semibold text-slate-400 mb-2">Discovery (18)</div>
                      <div className="p-2.5 bg-white dark:bg-[#0F172A] rounded-md shadow-sm border border-slate-200/50 dark:border-white/10 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-white">Vertex Health</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">$45,000 · Enterprise</div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
                      <div className="text-[11px] uppercase font-semibold text-amber-500 mb-2">Demo Built (12)</div>
                      <div className="p-2.5 bg-white dark:bg-[#0F172A] rounded-md shadow-sm border border-slate-200/50 dark:border-white/10 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-white">Aura Fintech</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">$72,000 · Delivered 🎉</div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
                      <div className="text-[11px] uppercase font-semibold text-teal-500 mb-2">Proposal Sent (9)</div>
                      <div className="p-2.5 bg-white dark:bg-[#0F172A] rounded-md shadow-sm border border-slate-200/50 dark:border-white/10 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-white">Nexus Robotics</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">$120,000 · Net 15</div>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/40 dark:border-emerald-800/40">
                      <div className="text-[11px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Won Deals (34)</div>
                      <div className="p-2.5 bg-white dark:bg-[#0F172A] rounded-md shadow-sm border border-emerald-300/40 dark:border-emerald-700/40 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-white">Global Logistics Corp</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">$210,000 · Closed 🎯</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Glass Badges (Layered Parallax) */}
            <div className="floating-badge hidden lg:flex items-center gap-3 absolute -top-8 -left-10 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200 dark:border-white/15 px-4 py-3 rounded-2xl shadow-xl z-20">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Deal Won: $48,000</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Horizon Cloud · Closed just now</div>
              </div>
            </div>

            <div className="floating-badge hidden lg:flex items-center gap-3 absolute -bottom-6 -right-10 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200 dark:border-white/15 px-4 py-3 rounded-2xl shadow-xl z-20">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Demo Ready &amp; Delivered</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Dev team synced in real-time</div>
              </div>
            </div>

          </div>
        </div>
      </section>
      </div>

      {/* ─── Stats Ribbon (Scroll Stagger) ──────────── */}
      <section ref={statsRef} className="relative z-10 py-16 border-y border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-[#0F172A]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="stat-item">
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-1">$24M+</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Deal Pipeline Managed</div>
            </div>
            <div className="stat-item">
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400 mb-1">8.4x</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Faster Proposal Generation</div>
            </div>
            <div className="stat-item">
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-1">&lt; 2 hrs</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Demo Turnaround</div>
            </div>
            <div className="stat-item">
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-teal-600 dark:text-teal-400 mb-1">99.8%</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Client SLA Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Pillars / Features Section ───────── */}
      <section id="features" ref={featuresRef} className="py-24 md:py-32 px-4 sm:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Spectrum Capabilities</span>
            </div>
            <h2 className="font-display font-bold text-fluid-h2 text-slate-900 dark:text-white mb-6">
              Built for High-Growth Sales &amp; Engineering Teams
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
              Eliminate disjointed tools. Crefto brings your pipeline, custom demo requests, customer contracts, and real-time activities into one high-performance command center.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card group relative p-8 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-3">
                Intelligent Deal Pipeline
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Visual Kanban stages with multi-stage drag-and-drop, automated conversion metrics, win probability forecasting, and overdue follow-up flags.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time deal stage tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Integrated revenue projection analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Filter by rep, company, or deal value</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: Unique Demo Request Desk */}
            <div className="feature-card group relative p-8 rounded-3xl bg-gradient-to-b from-white to-emerald-50/30 dark:from-[#0F172A] dark:to-emerald-950/20 border border-emerald-500/30 dark:border-emerald-500/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-6 right-6">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                  Exclusive
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Laptop className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-3">
                Developer Demo Request Desk
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Sales reps open customized demo requests directly to engineers. Developers claim tickets, deploy prototypes, and deliver live links without Slack friction.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time WebSocket &amp; polling sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instant developer-to-sales handoff notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Delivered repository &amp; video link tracking</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="feature-card group relative p-8 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-3">
                Precision Quotations Engine
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Build enterprise proposals with catalog products, line-item discounts, custom VAT/tax rules, client metadata, and one-click printable invoices.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automated line-item calculation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Export to print &amp; high-res PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Quotation status lifecycle (Draft → Sent → Approved)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Workflow Bridge (Sales Reps ↔ Developers) ─ */}
      <section id="workflow" ref={workflowRef} className="py-24 bg-slate-100/60 dark:bg-[#0B1120] border-y border-slate-200/80 dark:border-white/10 relative z-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
              Collaborative Velocity
            </span>
            <h2 className="font-display font-bold text-fluid-h2 text-slate-900 dark:text-white mb-4">
              How Crefto Closes The Gap
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Traditional CRMs isolate sales reps from technical delivery. Crefto turns custom client demos into a synchronized, live assembly line.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="workflow-step bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-display font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
                Sales Rep Logs Request
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Rep captures client requirements, company size, and specific feature needs during a prospect call and triggers a demo request ticket with one click.
              </p>
            </div>

            <div className="workflow-step bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-display font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
                Developer Claims &amp; Builds
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Developer views their tailored project queue, claims the request, sets status to &quot;In Progress&quot;, and spins up the tailored demonstration environment.
              </p>
            </div>

            <div className="workflow-step bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-display font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
                Live Delivery &amp; Deal Won
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Engineer submits the live demo links and video walkthrough. Sales rep gets an instant toast notification, delivers to client, and closes the contract.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Interactive Sandbox / Preview Section ────── */}
      <section id="preview" ref={interactivePreviewRef} className="py-24 md:py-32 px-4 sm:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display font-bold text-fluid-h2 text-slate-900 dark:text-white mb-4">
              Explore The Modules
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Switch between views to experience the design and functional clarity of Crefto CRM.
            </p>

            {/* Interactive Switcher Tabs */}
            <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 mt-8">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${activeTab === 'pipeline' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Lead Pipeline
              </button>
              <button
                onClick={() => setActiveTab('demo')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${activeTab === 'demo' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Project Demo Desk
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${activeTab === 'quotes' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Quotation Builder
              </button>
            </div>
          </div>

          {/* Interactive Screen Preview Container */}
          <div className="preview-container bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {activeTab === 'pipeline' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
                  <div>
                    <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">Active Deals Kanban</h4>
                    <p className="text-xs text-slate-500">Total pipeline value: $468,500 Across 4 Stages</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Live Filter: Q4 Priority
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200/60 dark:border-white/5">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                      <span>Qualified</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-full">3</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200/50 dark:border-white/5">
                        <div className="font-semibold text-sm text-slate-800 dark:text-white">Optima BioTech</div>
                        <div className="text-xs text-slate-500 mt-1">Lead: Dr. Marcus Vance</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-2">$35,000</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200/50 dark:border-white/5">
                        <div className="font-semibold text-sm text-slate-800 dark:text-white">Solari Solar Grid</div>
                        <div className="text-xs text-slate-500 mt-1">Lead: Elena Rostova</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-2">$64,000</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200/60 dark:border-white/5">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                      <span>Negotiation</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">2</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200/50 dark:border-white/5">
                        <div className="font-semibold text-sm text-slate-800 dark:text-white">Kite Payment Systems</div>
                        <div className="text-xs text-slate-500 mt-1">Terms: Annual Contract</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-2">$88,500</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/40 dark:border-emerald-800/40">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                      <span>Closed Won</span>
                      <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">5</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-emerald-300/40 dark:border-emerald-700/40">
                        <div className="font-semibold text-sm text-slate-800 dark:text-white">Aerolite Dynamics</div>
                        <div className="text-xs text-slate-500 mt-1">Signed via Crefto Proposal</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-2">$140,000 · Won 🎉</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'demo' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
                  <div>
                    <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">Project Demo Desk (Live WebSocket Sync)</h4>
                    <p className="text-xs text-slate-500">Developer view · Real-time status updates</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>WebSocket Connected</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">E-Commerce Analytics Portal</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                          In Progress
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Client: Vertex Retail · Requested by Sarah Jenkins (Sales) · Assigned to Dev Team</div>
                    </div>
                    <button className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all">
                      Deliver Prototype
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Fintech Multi-Tenant Dashboard</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          Delivered
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Client: FinPulse Labs · Preview Links: staging-finpulse.app · Video Walkthrough Ready</div>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Client Notified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quotes' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
                  <div>
                    <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">Interactive Quotation Preview</h4>
                    <p className="text-xs text-slate-500">Proposal #QT-2026-0891 · Client: Global Cloud Systems</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total Valuation</div>
                    <div className="font-display font-bold text-xl text-emerald-600 dark:text-emerald-400">$32,450.00</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/70 dark:border-white/10 text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Item &amp; Description</th>
                        <th className="pb-3 font-semibold">Qty</th>
                        <th className="pb-3 font-semibold">Rate</th>
                        <th className="pb-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      <tr>
                        <td className="py-3 font-medium text-slate-800 dark:text-white">Custom Web Architecture &amp; CRM Setup</td>
                        <td className="py-3 text-slate-500">1</td>
                        <td className="py-3 text-slate-500">$18,500.00</td>
                        <td className="py-3 font-bold text-slate-800 dark:text-white text-right">$18,500.00</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium text-slate-800 dark:text-white">API Integration &amp; Real-time WebSocket Gateway</td>
                        <td className="py-3 text-slate-500">1</td>
                        <td className="py-3 text-slate-500">$9,500.00</td>
                        <td className="py-3 font-bold text-slate-800 dark:text-white text-right">$9,500.00</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium text-slate-800 dark:text-white">Enterprise SLA Support &amp; Maintenance (12mo)</td>
                        <td className="py-3 text-slate-500">1</td>
                        <td className="py-3 text-slate-500">$4,450.00</td>
                        <td className="py-3 font-bold text-slate-800 dark:text-white text-right">$4,450.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900 dark:text-white">$32,450.00</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Early Bird Discount (5%)</span>
                      <span>-$1,622.50</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-white/10">
                      <span>Net Total</span>
                      <span className="text-emerald-600 dark:text-emerald-400">$30,827.50</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─────────────────────────── */}
      <section id="pricing" ref={pricingRef} className="py-24 md:py-32 bg-slate-100/50 dark:bg-[#0B1120] border-t border-slate-200/80 dark:border-white/10 relative z-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
              Transparent Investment
            </span>
            <h2 className="font-display font-bold text-fluid-h2 text-slate-900 dark:text-white mb-4">
              Simple, Predictable Pricing
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-8">
              Everything your revenue and product teams need to scale without hidden per-contact penalties.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${billingCycle === 'annual' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
              >
                <span>Annual</span>
                <span className="text-[10px] bg-emerald-400 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1: Starter */}
            <div className="pricing-card p-8 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">Starter Team</h3>
                <p className="text-xs text-slate-500 mb-6">For small boutique agencies and focused sales pairs.</p>
                <div className="font-display font-extrabold text-4xl text-slate-900 dark:text-white mb-6">
                  {billingCycle === 'annual' ? '$29' : '$39'}
                  <span className="text-xs text-slate-400 font-normal"> / user / mo</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Up to 5 team members</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited leads &amp; deals</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Quotation PDF generator</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Calendar &amp; task reminders</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-semibold text-center transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Tier 2: Pro Growth (Featured) */}
            <div className="pricing-card p-8 rounded-3xl bg-white dark:bg-[#0F172A] border-2 border-emerald-500 shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">Growth Scale</h3>
                <p className="text-xs text-slate-500 mb-6">For scaling agencies and multi-rep sales engines.</p>
                <div className="font-display font-extrabold text-4xl text-emerald-600 dark:text-emerald-400 mb-6">
                  {billingCycle === 'annual' ? '$69' : '$89'}
                  <span className="text-xs text-slate-400 font-normal"> / user / mo</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Developer Demo Request Desk</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-time WebSocket live updates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Multi-role permissions (Manager, Rep, Dev)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>CSV bulk imports &amp; exports</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold text-center shadow-lg shadow-emerald-500/25 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="pricing-card p-8 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">Enterprise</h3>
                <p className="text-xs text-slate-500 mb-6">Dedicated deployments, bespoke SLA &amp; custom workflows.</p>
                <div className="font-display font-extrabold text-4xl text-slate-900 dark:text-white mb-6">
                  Custom
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited users &amp; enterprise accounts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Dedicated database / private cloud</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Custom ERP / WhatsApp integrations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>24/7 Priority engineering SLA</span>
                  </li>
                </ul>
              </div>
              <a
                href="mailto:contact@creftocrm.com"
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-semibold text-center transition-colors"
              >
                Contact Enterprise Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ─────────────────────────────── */}
      <section id="faq" ref={faqRef} className="py-24 px-4 sm:px-8 relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-fluid-h2 text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Everything you need to know about adopting Crefto CRM.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does the Developer Demo Request Desk work?',
              a: 'When your sales rep speaks with a prospect who needs a customized prototype or technical proof of concept, they create a Demo Request ticket in Crefto. Developers see this in their Projects desk, claim it, and mark it delivered with live preview links. Sales reps receive instant real-time notifications via WebSockets or auto-sync.'
            },
            {
              q: 'Can I assign specific roles with distinct access permissions?',
              a: 'Yes. Crefto features 3 distinct role gates: Managers (unrestricted access to all modules, reports, users, products), Sales Reps (lead pipeline, deals, quotations, demo requests), and Developers (assigned project demo tickets, tasks, calendar).'
            },
            {
              q: 'How does Crefto handle quotations and multi-currency billing?',
              a: 'Crefto includes a full-featured quotation generator. You can add catalog products, define quantities, apply percentage or fixed discounts, and compute taxes automatically. You can export or print high-fidelity proposals directly.'
            },
            {
              q: 'Can I import my existing leads and contacts?',
              a: 'Yes, Crefto supports one-click CSV file imports for leads, customers, and contacts, complete with sample templates and automated column mapping.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-display font-semibold text-sm sm:text-base text-slate-900 dark:text-white"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Banner ───────────────────────── */}
      <section className="py-20 px-4 sm:px-8 relative z-10">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-950 via-[#0F172A] to-slate-950 border border-emerald-500/30 p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="font-display font-bold text-fluid-h2 text-white mb-6 relative z-10">
            Ready To Accelerate Your Revenue Engine?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base mb-8 relative z-10">
            Join hundreds of forward-thinking sales reps and engineering teams executing with clarity and velocity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get Started with Crefto'}
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Modern Editorial Footer ─────────────────── */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 py-12 px-4 sm:px-8 bg-white/70 dark:bg-[#060911] text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Crefto" className="w-5 h-5 object-contain" />
            <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
              CREFTO <span className="text-emerald-500">CRM</span>
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span>All rights reserved &copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-emerald-500 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-emerald-500 transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-emerald-500 transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-emerald-500 transition-colors font-semibold">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
