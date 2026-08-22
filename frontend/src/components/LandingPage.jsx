import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ArrowRight,
  Brain,
  ShieldAlert,
  Languages,
  TrendingUp,
  Printer,
  Database,
  Cpu,
  Layers,
  Lock,
  Terminal,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Smartphone,
  Monitor,
  Trophy,
  Zap,
  Globe,
  Server,
  GitBranch,
  Star,
  ChevronRight,
  Sparkles,
  BarChart3,
  FileText,
  Users,
  Shield
} from 'lucide-react';

// --- Animated Counter Hook ---
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const isFloat = String(target).includes('.');
    const numericTarget = parseFloat(target);
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * numericTarget;
      setCount(isFloat ? current.toFixed(1) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(isFloat ? numericTarget.toFixed(1) : numericTarget);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// --- Intersection Observer Hook ---
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// --- Typewriter Hook ---
function useTypewriter(words, speed = 80, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIdx];
    let timeout;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(i => (i + 1) % words.length);
    }
    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return display;
}

// --- Stat Card with Counter ---
function StatCard({ num, suffix = '', title, desc, delay = 0 }) {
  const [ref, inView] = useInView(0.3);
  const numericTarget = parseFloat(num);
  const isNumeric = !isNaN(numericTarget);
  const count = useCountUp(numericTarget, 1600, inView && isNumeric);

  return (
    <div
      ref={ref}
      className="stat-card-new relative overflow-hidden p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b1329]/80 to-[#060c18]/90 backdrop-blur-xl group hover:border-teal-500/40 transition-all duration-300 hover:scale-[1.02]"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.3s, transform 0.3s`
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
      <div className="text-2xl md:text-3xl font-black text-teal-400 mb-1 font-mono tracking-tight flex items-baseline">
        <span>{isNumeric ? count : num}</span>
        <span className="text-emerald-400 ml-0.5">{suffix}</span>
      </div>
      <div className="text-xs font-bold text-white mb-0.5 tracking-wide">{title}</div>
      <div className="text-[11px] text-slate-400 font-medium leading-tight">{desc}</div>
    </div>
  );
}

// --- Feature Card ---
function FeatureCard({ icon: Icon, title, desc, color, gradientFrom, delay = 0 }) {
  const [ref, inView] = useInView(0.15);
  return (
    <div
      ref={ref}
      className="feature-card-new group relative p-6 rounded-3xl border border-white/5 bg-[#0b1329]/40 hover:bg-[#0f1b38]/60 backdrop-blur-xl transition-all duration-300 hover:translate-y-[-4px] hover:border-white/15 cursor-default flex flex-col justify-between"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, background-color 0.3s, border-color 0.3s`
      }}
    >
      <div>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color} transition-transform duration-300 group-hover:scale-110`}
          style={{ boxShadow: `0 0 20px ${gradientFrom}25` }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-white mb-2 group-hover:text-teal-300 transition-colors duration-300 tracking-tight">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed font-medium">{desc}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-teal-400 transition-colors">
        <span>Production verified</span>
        <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-400 opacity-70 group-hover:opacity-100" />
      </div>
    </div>
  );
}

// --- Trust Strip Items ---
const trustItems = [
  { label: '⚡ Groq LLaMA 3.3 70B (<1.5s latency)' },
  { label: '🛡️ Hybrid Deterministic + LLM Auditor' },
  { label: '🐍 Python FastAPI Backend' },
  { label: '🐘 Neon PostgreSQL + SQLAlchemy' },
  { label: '🐳 Docker Containerized' },
  { label: '⚛️ React PWA + Service Workers' },
  { label: '🌐 11 Indian Languages Handouts' },
  { label: '🔒 RBAC + Tamper-Evident Audit Trail' },
  { label: '📄 ReportLab PDF Invoice Engine' },
  { label: '⚡ Groq LLaMA 3.3 70B (<1.5s latency)' },
  { label: '🛡️ Hybrid Deterministic + LLM Auditor' },
  { label: '🐍 Python FastAPI Backend' },
  { label: '🐘 Neon PostgreSQL + SQLAlchemy' },
  { label: '🐳 Docker Containerized' },
  { label: '⚛️ React PWA + Service Workers' },
  { label: '🌐 11 Indian Languages Handouts' },
  { label: '🔒 RBAC + Tamper-Evident Audit Trail' },
  { label: '📄 ReportLab PDF Invoice Engine' },
];

export default function LandingPage({ onEnterWorkspace }) {
  const [activeSimTab, setActiveSimTab] = useState('clinical');
  const [activeLang, setActiveLang] = useState('hi');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(true);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const typewriterWords = ['Hospital Billing', 'Clinical Consulting', 'Prescription Accuracy', 'Revenue Intelligence'];
  const typedWord = useTypewriter(typewriterWords);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setShowInstallBtn(false);
      return;
    }
    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const handleAppInstalled = () => { setShowInstallBtn(false); setDeferredPrompt(null); };
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    } else {
      setShowInstructionModal(true);
    }
  };

  const translationData = {
    en: {
      title: "Morning / Night Routine Checklist",
      med1: "💊 Paracetamol 650mg — 1 tablet after breakfast (Fever relief)",
      med2: "🥛 Cough Syrup — 10ml before sleep (Soothing & throat relief)",
      advice: "⚠️ Avoid cold drinks. Drink warm water only and rest for 3 days."
    },
    hi: {
      title: "सुबह / रात की दिनचर्या चेकलिस्ट",
      med1: "💊 पैरासिटामॉल 650mg — 1 गोली नाश्ते के बाद (बुखार से राहत)",
      med2: "🥛 कफ सिरप — 10ml सोने से पहले (गले में आराम)",
      advice: "⚠️ ठंडे पेय पदार्थों से बचें। केवल गुनगुना पानी पिएं और 3 दिनों तक आराम करें।"
    },
    ta: {
      title: "காலை / இரவு வழக்கமான சரிபார்ப்பு பட்டியல்",
      med1: "💊 பாராசிட்டமால் 650 மி.கி — காலை உணவுக்கு பின் 1 மாத்திரை (காய்ச்சல் நிவாரணம்)",
      med2: "🥛 இருமல் சிரப் — தூங்குவதற்கு முன் 10 மி.லி (தொண்டை நிவாரணம்)",
      advice: "⚠️ குளிர்ந்த பானங்களைத் தவிர்க்கவும். வெதுவெதுப்பான நீரை மட்டுமே குடித்து, 3 நாட்கள் ஓய்வெடுக்கவும்."
    }
  };

  // Section reveal hooks
  const [heroRef, heroInView] = useInView(0.1);
  const [demoRef, demoInView] = useInView(0.15);
  const [techRef, techInView] = useInView(0.15);
  const [ctaRef, ctaInView] = useInView(0.2);

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 relative overflow-hidden font-sans selection:bg-teal-500 selection:text-white">

      {/* --- Animated Ambient Background Glows --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full orb-float-1" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.16) 0%, transparent 70%)', top: '-18%', left: '-12%' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full orb-float-2" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%)', bottom: '-15%', right: '-8%' }} />
        <div className="absolute w-[450px] h-[450px] rounded-full orb-float-3" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.09) 0%, transparent 70%)', top: '38%', right: '18%' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full orb-float-1" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.11) 0%, transparent 70%)', top: '65%', left: '8%', animationDelay: '-4s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* --- Permanent Top Navigation Header --- */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl border-b border-white/10 bg-[#060c18]/90 shadow-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-teal shadow-lg shadow-teal-500/20" style={{ background: 'linear-gradient(135deg, #14b8a6, #34d399)' }}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">HospiSyn<span className="gradient-text-teal">AI</span></span>
        </div>

        <nav className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-300">
          <a
            href="#features"
            className="px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-teal-300 transition-colors"
          >
            Key Capabilities
          </a>
          <a
            href="#demo"
            className="px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-teal-300 transition-colors"
          >
            Interactive Demo
          </a>
          <a
            href="#tech"
            className="px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-teal-300 transition-colors"
          >
            Tech Architecture
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onEnterWorkspace}
            className="relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 group overflow-hidden transition-all active:scale-[0.97] shadow-lg shadow-teal-900/30"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
          >
            <span className="relative z-10 hidden sm:inline">Launch Console</span>
            <span className="relative z-10 sm:hidden">Launch</span>
            <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </header>

      <main className="relative z-10">

        {/* =========================================================================
            HERO SECTION
        ========================================================================= */}
        <section ref={heroRef} className="max-w-7xl mx-auto px-6 pt-12 lg:pt-16 pb-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* Hero Left: Pitch */}
          <div className="flex-1 text-center lg:text-left">

            {/* Enterprise Tag Badge */}
            <div
              className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 backdrop-blur-md"
              style={{
                boxShadow: '0 0 25px rgba(20,184,166,0.15)',
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(-16px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease'
              }}
            >
              <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
              <span className="text-teal-300 text-xs font-black uppercase tracking-wider">Enterprise Hospitech Platform</span>
              <span className="text-teal-500/40 text-xs">•</span>
              <span className="text-teal-400/90 text-xs font-bold">V1.0 Production Grade</span>
            </div>

            {/* Sub-badge */}
            <div
              className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide mb-6 mx-auto lg:mx-0 flex"
              style={{
                width: 'fit-content',
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s'
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
              MULTI-AGENT HOSPITECH ECOSYSTEM • &lt;1.5s LATENCY
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s'
              }}
            >
              Autonomous AI Ecosystem for<br />
              <span className="gradient-text-teal typewriter-cursor">{typedWord}</span>
            </h1>

            <p
              className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed mb-8 mx-auto lg:mx-0 font-medium"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s'
              }}
            >
              Architected to streamline clinical workflows from symptom intake to pre-invoice compliance and multilingual handouts. Built with a <strong className="text-teal-300">hybrid deterministic + LLM engine</strong> to prevent GST inconsistencies & pediatric dosing errors.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s'
              }}
            >
              <button
                onClick={onEnterWorkspace}
                className="group relative px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
                  boxShadow: '0 0 30px rgba(20,184,166,0.4), 0 4px 20px rgba(20,184,166,0.2)'
                }}
              >
                <span className="relative z-10">Access Workspace Desk</span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1.5" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>

              {showInstallBtn && (
                <button
                  onClick={handleInstallClick}
                  className="group relative px-7 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] overflow-hidden border border-violet-500/30"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    boxShadow: '0 0 25px rgba(139,92,246,0.35)'
                  }}
                >
                  <Download className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Install PWA</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              )}

              <a
                href="#demo"
                className="px-7 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md transition-all active:scale-[0.97] flex items-center justify-center"
              >
                Explore Demo
              </a>
            </div>
          </div>

          {/* Hero Right: Live Preview Mockup Card */}
          <div
            className="flex-1 flex justify-center lg:justify-end w-full"
            style={{
              opacity: heroInView ? 1 : 0,
              transform: heroInView ? 'translateX(0)' : 'translateX(40px)',
              transition: 'opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s'
            }}
          >
            <div className="relative w-full max-w-md float-card">
              {/* Radial glow background */}
              <div className="absolute -inset-4 rounded-3xl blur-3xl opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.4), rgba(139,92,246,0.3), transparent 70%)' }} />

              {/* Glass Mockup Window */}
              <div className="relative glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-[#091021]/90">
                {/* Header Bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#060c18]/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-teal-500/20 text-teal-400">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white font-black text-xs">HospiSyn<span className="text-teal-400">AI</span> Engine</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-300 font-bold font-mono">LATENCY: 0.82s</span>
                  </div>
                </div>

                <div className="p-5 space-y-3.5">
                  {/* Patient Info Row */}
                  <div className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3.5 py-2.5 border border-white/5">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Patient Case</div>
                      <div className="text-xs text-white font-extrabold">Meena Sharma, 45F</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Symptoms</div>
                      <div className="text-xs text-teal-300 font-bold">Fever (102°F), Dry Cough</div>
                    </div>
                  </div>

                  {/* AI Agent Status */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                    <Brain className="w-4 h-4 text-teal-400 animate-pulse flex-shrink-0" />
                    <span className="text-xs text-teal-300 font-bold">Groq LLaMA 3.3 70B Assistant</span>
                    <div className="flex gap-1 ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 thinking-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 thinking-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 thinking-dot" />
                    </div>
                  </div>

                  {/* Prescribed Items */}
                  <div className="space-y-1.5">
                    {[
                      { name: 'Paracetamol 650mg', dose: 'BD · Post Meals · 5 Days', tag: 'Antipyretic', color: 'text-teal-400' },
                      { name: 'Amoxicillin 500mg', dose: 'TID · 5 Days · Dosing Safe', tag: 'Antibiotic', color: 'text-violet-400' },
                      { name: 'Levosalbutamol Inhaler', dose: 'PRN · SOS Throat/Bronchial', tag: 'Inhaler', color: 'text-emerald-400' },
                    ].map((med, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-950/60 rounded-xl px-3 py-2 border border-white/5">
                        <div className={`w-2 h-2 rounded-full ${med.color} flex-shrink-0`} style={{ backgroundColor: 'currentColor' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white font-bold truncate">{med.name}</div>
                          <div className="text-[10px] text-slate-400">{med.dose}</div>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase text-slate-400 bg-white/5 px-2 py-0.5 rounded">{med.tag}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pre-Invoice Compliance Check */}
                  <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5">
                    <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="text-[11px] text-emerald-300 font-bold leading-tight">
                      Hybrid Audit Passed: 0 GST or Dosing Collisions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Metric Counters Strip --- */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard num={0.8} suffix="s" title="Avg AI Latency" desc="Powered by Groq LLaMA 3.3" delay={0} />
            <StatCard num="100" suffix="%" title="Deterministic Audit" desc="Zero duplicate or GST leaks" delay={100} />
            <StatCard num={11} suffix="+" title="Native Languages" desc="Real-time translated handouts" delay={200} />
            <StatCard num={76} suffix="%" title="Verification Saved" desc="From 6 mins down to 1.5 mins" delay={300} />
          </div>
        </section>

        {/* =========================================================================
            TRUST STRIP / INFINITE TICKER
        ========================================================================= */}
        <div className="relative overflow-hidden py-4 border-y border-white/10 bg-[#060c18]/60 backdrop-blur-md my-6">
          <div className="absolute left-0 top-0 w-32 h-full z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #060c18, transparent)' }} />
          <div className="absolute right-0 top-0 w-32 h-full z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #060c18, transparent)' }} />
          <div className="flex trust-ticker">
            {trustItems.map((item, i) => (
              <div
                key={i}
                className={`flex-shrink-0 flex items-center gap-2 mx-4 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${item.highlight
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            INTERACTIVE SIMULATOR SECTION
        ========================================================================= */}
        <section id="demo" ref={demoRef} className="max-w-7xl mx-auto px-6 py-12 scroll-mt-28">
          <div
            className="text-center mb-12"
            style={{
              opacity: demoInView ? 1 : 0,
              transform: demoInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease'
            }}
          >
            <div className="inline-flex items-center gap-2 text-xs text-teal-400 font-bold uppercase tracking-wider bg-teal-500/10 px-4 py-1.5 rounded-full border border-teal-500/20 mb-3">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              Live Interactive Simulator
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Test HospiSynAI Workflows In Real Time</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
              Click the simulator tabs to see how clinical intelligence, pre-invoice compliance audits, and vernacular translation handouts operate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Tab Selectors */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {[
                { id: 'clinical', label: 'AI Prescribing Assistant', desc: 'Auto-generates complete treatment plans based on patient symptoms.', icon: Brain, color: 'text-teal-400 bg-teal-500/10', accentColor: 'rgba(20,184,166,0.3)' },
                { id: 'auditor', label: 'Pre-Invoice AI Auditor', desc: 'Scans bills to catch duplicate diagnostics, GST errors, and location clashes.', icon: ShieldAlert, color: 'text-rose-400 bg-rose-500/10', accentColor: 'rgba(251,113,133,0.3)' },
                { id: 'vernacular', label: 'Multilingual Summary Handout', desc: 'Translates prescription checklists to 11 Indian native languages instantly.', icon: Languages, color: 'text-violet-400 bg-violet-500/10', accentColor: 'rgba(167,139,250,0.3)' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeSimTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSimTab(tab.id)}
                    className={`group p-5 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden flex gap-4 ${isSelected
                      ? 'bg-slate-900 border-teal-500/40 shadow-xl'
                      : 'bg-[#0b1329]/40 border-white/5 hover:border-slate-700 hover:bg-[#0b1329]/70'
                      }`}
                    style={isSelected ? { boxShadow: `0 8px 32px ${tab.accentColor}` } : {}}
                  >
                    {isSelected && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-400 to-emerald-500" />}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tab.color} transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white mb-1 uppercase tracking-wider">{tab.label}</div>
                      <div className="text-[11px] text-slate-400 leading-normal">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Screen Panel */}
            <div className="lg:col-span-8 glass-card border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[420px] bg-[#091021]/80 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6 text-xs relative z-10">
                <div className="flex items-center gap-2 text-slate-400 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SIMULATOR CONSOLE
                </div>
                <div className="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 font-mono uppercase tracking-wider">
                  ⚡ Live Output Simulation
                </div>
              </div>

              <div className="flex-1 relative z-10">
                {activeSimTab === 'clinical' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Demographics:</span>
                      <span className="text-xs bg-slate-800 px-3 py-1 rounded-full font-bold border border-white/10">Female, 45 Yrs (OPD)</span>
                    </div>
                    <div className="flex gap-2.5 items-center flex-wrap">
                      <span className="text-xs text-slate-400 font-semibold">Chief Complaints:</span>
                      <span className="text-xs text-teal-300 font-bold bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg">High fever (102°F), dry cough, shortness of breath</span>
                    </div>
                    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-teal-400 animate-pulse" />
                        <span className="text-xs font-black text-white">AI Assistant Suggestions</span>
                        <span className="ml-auto text-[10px] text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded-full font-mono">⚡ 0.84s Latency</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-normal">
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] font-extrabold text-teal-400 uppercase block tracking-wider mb-2">Prescription & Dosing</span>
                          <ul className="space-y-1.5 text-slate-300 font-medium">
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />Paracetamol 650mg (BD - Post Meals)</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />Amoxicillin 500mg (TID - 5 Days)</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />Levosalbutamol Inhaler (PRN - SOS)</li>
                          </ul>
                        </div>
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] font-extrabold text-teal-400 uppercase block tracking-wider mb-2">Tests & Safety Advisories</span>
                          <ul className="space-y-1.5 text-slate-300 font-medium">
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />Complete Blood Count (CBC)</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />Chest X-Ray (PA View)</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />Dosing safety check: CLEARED</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSimTab === 'auditor' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">AI Audit Result: Critical Anomaly Blocked</p>
                          <p className="text-[11px] text-rose-200 mt-0.5 font-medium">Invoice checkout halted to protect billing compliance & patient safety</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-1 rounded-lg font-mono font-bold uppercase shrink-0">⚠️ Blocked</span>
                    </div>
                    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs font-bold text-white mb-3 uppercase tracking-wide">Deterministic & LLM Violations Detected:</p>
                      <ul className="space-y-3 text-xs">
                        {[
                          { n: '1', title: 'Duplicate Diagnostics', desc: 'CBC Hematology and Automated Blood Count were both added. Removed duplicate charge saving ₹450.' },
                          { n: '2', title: 'Location Clash', desc: 'Active ICU bed assignment logged, but an Outpatient (OPD) consultation fee was attached. Flagged incompatible billing tags.' }
                        ].map(v => (
                          <li key={v.n} className="flex items-start gap-3 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
                            <span className="text-rose-400 font-black font-mono text-[11px] mt-0.5">{v.n}.</span>
                            <span className="text-slate-300 font-medium"><strong className="text-rose-300">{v.title}:</strong> {v.desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeSimTab === 'vernacular' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Choose Handout Language:</span>
                      <div className="flex gap-2 flex-wrap">
                        {[{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिंदी (Hindi)' }, { id: 'ta', label: 'தமிழ் (Tamil)' }].map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => setActiveLang(lang.id)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeLang === lang.id ? 'bg-violet-500 text-white shadow-lg shadow-violet-900/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5'}`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#0b1731] border border-violet-500/30 rounded-2xl p-5 shadow-xl relative">
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                        <Languages className="w-4 h-4 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-black text-white mb-3 tracking-wide">{translationData[activeLang].title}</h4>
                      <div className="space-y-2 text-xs text-slate-200 leading-relaxed font-semibold">
                        <p className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-white/5">{translationData[activeLang].med1}</p>
                        <p className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-white/5">{translationData[activeLang].med2}</p>
                        <p className="text-amber-400 mt-4 leading-normal bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">{translationData[activeLang].advice}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 mt-6 flex justify-between items-center text-xs relative z-10">
                <span className="text-slate-500 font-semibold">Interactive Sandbox Mode</span>
                <button onClick={onEnterWorkspace} className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 group transition-colors">
                  Enter Live Hospital Desk
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            STANDOUT CAPABILITIES SECTION
        ========================================================================= */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs text-violet-400 font-bold uppercase tracking-wider bg-violet-500/10 px-4 py-1.5 rounded-full border border-violet-500/20 mb-3">
              <Star className="w-3.5 h-3.5" />
              Comprehensive Capabilities
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Engineered for Reliability & Scale</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
              Connecting clinical diagnostics, pre-invoice compliance, and financial administration in a decoupled high-performance stack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI Prescription Suggester", desc: "Transforms symptom arrays into structured medication plans with precise OD/BD/TID dosing, pediatric safety caps, and follow-up schedules.", color: "text-teal-400 bg-teal-500/10", gradientFrom: 'rgba(20,184,166,0.5)' },
              { icon: ShieldAlert, title: "Hybrid Pre-Invoice AI Auditor", desc: "Combines deterministic rule validation with LLM reasoning to catch 6 critical billing inconsistencies before invoice checkout.", color: "text-rose-400 bg-rose-500/10", gradientFrom: 'rgba(251,113,133,0.5)' },
              { icon: Languages, title: "Multilingual Patient Handouts", desc: "Translates complex clinical notes into 11 Indian native languages with visual emoji checklists for patient compliance.", color: "text-violet-400 bg-violet-500/10", gradientFrom: 'rgba(167,139,250,0.5)' },
              { icon: BarChart3, title: "AI Revenue Intelligence", desc: "Generates natural language summaries of outstanding ledger balances, digital vs cash splits, and actionable management alerts.", color: "text-emerald-400 bg-emerald-500/10", gradientFrom: 'rgba(52,211,153,0.5)' },
              { icon: FileText, title: "ReportLab PDF Receipts", desc: "Server-side dynamic PDF generation reproducing official diagnostic and payment receipts with customizable hospital branding.", color: "text-amber-400 bg-amber-500/10", gradientFrom: 'rgba(251,191,36,0.5)' },
              { icon: Lock, title: "RBAC & Audit Trail Security", desc: "Tamper-evident system logs capturing Receptionist deposits, Accountant checkouts, and Admin settings with JWT role enforcement.", color: "text-indigo-400 bg-indigo-500/10", gradientFrom: 'rgba(99,102,241,0.5)' }
            ].map((feat, i) => (
              <FeatureCard key={i} {...feat} delay={i * 80} />
            ))}
          </div>
        </section>

        {/* =========================================================================
            TECH ARCHITECTURE SECTION
        ========================================================================= */}
        <section id="tech" ref={techRef} className="max-w-7xl mx-auto px-6 py-12 scroll-mt-28 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div
              className="lg:col-span-5 space-y-6"
              style={{
                opacity: techInView ? 1 : 0,
                transform: techInView ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'opacity 0.8s ease, transform 0.8s ease'
              }}
            >
              <div className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-bold uppercase tracking-wider bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
                <Cpu className="w-3.5 h-3.5 animate-spin-slow" />
                Under the Hood
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">Production-Ready Decoupled Architecture</h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                HospiSynAI separates presentation, business logic, and persistence layers for horizontal scalability and compliance verification.
              </p>
              <div className="space-y-3">
                {[
                  "FastAPI backend with built-in Pydantic schemas & input sanitization",
                  "Neon PostgreSQL relational database with SQLAlchemy connection pooling",
                  "ReportLab dynamic canvas drawing engine for PDF templates",
                  "Docker Compose configuration with automated health checks",
                  "Role-based access control (RBAC) enforced at all API endpoints",
                  "Installable PWA with offline fallback and service worker caching"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-300 group">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="group-hover:text-white transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4"
              style={{
                opacity: techInView ? 1 : 0,
                transform: techInView ? 'translateX(0)' : 'translateX(30px)',
                transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s'
              }}
            >
              {[
                {
                  icon: Layers, title: 'Client Stack', color: 'bg-teal-500/10 text-teal-400', items: [
                    { label: 'React (JSX + Hooks)', color: 'text-teal-300' },
                    { label: 'Tailwind CSS', color: 'text-teal-300' },
                    { label: 'Lucide + Recharts', color: 'text-slate-300' },
                    { label: 'PWA + Service Worker', color: 'text-slate-300' },
                  ]
                },
                {
                  icon: Terminal, title: 'Backend Core', color: 'bg-violet-500/10 text-violet-400', items: [
                    { label: 'Python FastAPI', color: 'text-violet-300' },
                    { label: 'Groq Llama 3.3 70B', color: 'text-violet-300' },
                    { label: 'ReportLab PDF', color: 'text-slate-300' },
                    { label: 'SQLAlchemy ORM', color: 'text-slate-300' },
                  ]
                },
                {
                  icon: Database, title: 'DevOps & Infra', color: 'bg-rose-500/10 text-rose-400', items: [
                    { label: 'Neon PostgreSQL', color: 'text-rose-300' },
                    { label: 'Docker + Compose', color: 'text-rose-300' },
                    { label: 'Vercel + Render', color: 'text-slate-300' },
                    { label: 'Fine-grained RBAC', color: 'text-slate-300' },
                  ]
                }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="glass-card p-6 rounded-3xl border border-white/10 bg-[#0b1329]/50 hover:border-white/20 transition-all duration-300 hover:translate-y-[-3px] group">
                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-3 uppercase tracking-wide">{card.title}</h4>
                    <div className="space-y-1.5">
                      {card.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-2 text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                          <span className={item.color}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            FULL-BLEED SHOWSTOPPER CTA SECTION
        ========================================================================= */}
        <section ref={ctaRef} className="relative overflow-hidden py-20 px-6 my-12">
          {/* Deep gradient background */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #091f24 0%, #0d1a36 40%, #170f38 70%, #081d22 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(20,184,166,0.2) 0%, transparent 65%), radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.2) 0%, transparent 65%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.5), rgba(139,92,246,0.5), transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.5), rgba(139,92,246,0.5), transparent)' }} />

          <div
            className="relative z-10 max-w-4xl mx-auto text-center"
            style={{
              opacity: ctaInView ? 1 : 0,
              transform: ctaInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.9s ease, transform 0.9s ease'
            }}
          >
            <div className="inline-flex items-center gap-2 text-xs text-teal-400 font-bold uppercase tracking-wider bg-teal-500/10 px-4 py-1.5 rounded-full border border-teal-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Enterprise HealthTech Solution
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Ready to Experience the<br />
              <span className="gradient-text-teal">Future of Hospital AI?</span>
            </h2>

            <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Launch the live console to test doctor consultations, billing audits, deposit synchronization, and multilingual PDF generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onEnterWorkspace}
                className="group relative px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-wider text-white flex items-center justify-center gap-3 transition-all active:scale-[0.97] overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
                  boxShadow: '0 0 40px rgba(20,184,166,0.5), 0 8px 30px rgba(20,184,166,0.3)'
                }}
              >
                <span className="relative z-10">Launch HospiSynAI Now</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-2" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>

              <a
                href="#demo"
                className="px-8 py-5 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white border border-white/15 hover:border-white/30 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md transition-all active:scale-[0.97] flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-teal-400" />
                View Interactive Demo
              </a>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              {['⚡ <1.5s Groq Latency', '🛡️ Hybrid Audit Engine', '🌐 11 Indian Languages', '🔒 Tamper-Evident Audit Logs', '🐳 Dockerized PWA'].map((badge, i) => (
                <span key={i} className="text-[11px] text-slate-300 font-bold bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-white/10 bg-[#030710] py-10 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400 font-semibold">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-slate-200 font-bold text-sm">HospiSynAI Ecosystem</span>
          </div>
          <div className="text-center leading-relaxed">
            <p>Designed & Engineered with Enterprise-Grade SDE Best Practices.</p>
            <p className="text-slate-500 mt-0.5">Autonomous Clinical & Pre-Invoice Intelligence Platform</p>
          </div>
          <button
            onClick={onEnterWorkspace}
            className="px-5 py-2.5 rounded-xl border border-teal-500/40 text-teal-400 hover:bg-teal-500/15 transition-all font-bold uppercase tracking-wider active:scale-[0.97]"
          >
            Launch System →
          </button>
        </div>
      </footer>

      {/* --- Manual Installation Instructions Modal --- */}
      {showInstructionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-md">
          <div className="bg-[#091021] border border-white/15 rounded-3xl p-6 md:p-8 max-w-lg w-full relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowInstructionModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Install HospiSynAI PWA</h3>
                <p className="text-xs text-slate-400 font-medium">Add to your device home screen for standalone utility.</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: '🍎', title: 'iOS Safari (iPhone/iPad)', color: 'teal', steps: ['Tap the Share button at the bottom bar.', 'Scroll down and select "Add to Home Screen".', 'Tap Add in the top-right corner.'] },
                { icon: <Smartphone className="w-4 h-4" />, title: 'Android Chrome / Edge', color: 'violet', steps: ['Tap Menu (⋮) in the top-right corner.', 'Tap "Install app" or "Add to Home screen".'] },
                { icon: <Monitor className="w-4 h-4" />, title: 'Desktop Chrome / Edge / Opera', color: 'teal', steps: ['Click the Install Icon in the URL address bar.', 'Or open browser menu and choose "Install HospiSynAI".'] },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-teal-400 flex items-center justify-center flex-shrink-0 text-sm font-black">
                    {typeof s.icon === 'string' ? s.icon : s.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1.5">{s.title}</h4>
                    <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1 leading-relaxed font-medium">
                      {s.steps.map((step, j) => <li key={j}>{step}</li>)}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowInstructionModal(false)} className="w-full mt-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 transition-colors">
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
