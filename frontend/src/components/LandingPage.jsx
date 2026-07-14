import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

export default function LandingPage({ onEnterWorkspace }) {
  const [activeSimTab, setActiveSimTab] = useState('clinical');
  const [activeLang, setActiveLang] = useState('hi');

  // Interactive translation data
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

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 relative overflow-hidden font-sans">
      {/* Animated Background Orbs */}
      <div className="absolute w-[600px] h-[600px] rounded-full orb-float-1 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)', top: '-15%', left: '-10%' }} />
      <div className="absolute w-[500px] h-[500px] rounded-full orb-float-2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', bottom: '-10%', right: '-5%' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full orb-float-3 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', top: '35%', right: '25%' }} />

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-white/5 bg-[#060c18]/70 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-teal" style={{ background: 'linear-gradient(135deg, #14b8a6, #34d399)' }}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">HospiSyn<span className="gradient-text-teal">AI</span></span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Key Capabilities</a>
          <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
          <a href="#tech" className="hover:text-white transition-colors">Tech Architecture</a>
        </nav>

        <div>
          <button
            onClick={onEnterWorkspace}
            className="relative px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 group overflow-hidden transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)', boxShadow: '0 4px 15px rgba(20,184,166,0.25)' }}
          >
            Launch Console
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* HERO SECTION */}
        <section className="pt-20 pb-16 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide mb-6 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            V1.0 LIVE • PRODUCTION-GRADE HOSPITECH
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-tight mb-6 animate-slide-up">
            The Autonomous AI Ecosystem for <span className="gradient-text-teal">Hospital Billing</span> & <span className="gradient-text-violet">Consultations</span>
          </h1>

          <p className="text-slate-400 text-base md:text-xl max-w-3xl leading-relaxed mb-10 animate-slide-up animate-slide-up-delay-1">
            An SDE-3 architected platform bridging the gap between clinical diagnoses, smart pre-invoice audits, and multilingual patient handouts. Experience real-time billing powered by Groq and Llama 3.3.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up animate-slide-up-delay-2">
            <button
              onClick={onEnterWorkspace}
              className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] glow-teal"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
            >
              Access Workspace Desk
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#demo"
              className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 bg-slate-900/40 backdrop-blur-md transition-all active:scale-[0.98] flex items-center justify-center"
            >
              Explore Interactive Demo
            </a>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl w-full text-left animate-slide-up animate-slide-up-delay-3">
            {[
              { num: "0.8s", title: "AI Prescribing Dosing", desc: "Instant symptoms analysis" },
              { num: "100%", title: "Deterministic Compliance", desc: "Pre-invoice duplicate checks" },
              { num: "11+", title: "Indian Languages", desc: "Native patient summary handouts" },
              { num: "Zero", title: "Licensing Friction", desc: "Docker-ready open-source stack" }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0b1329]/40">
                <div className="text-xl md:text-2xl font-black text-teal-400 mb-1">{stat.num}</div>
                <div className="text-xs font-bold text-white mb-0.5">{stat.title}</div>
                <div className="text-[10px] text-slate-400">{stat.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-white/5 my-16" />

        {/* INTERACTIVE DEMO / SIMULATOR SECTION */}
        <section id="demo" className="py-8 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Experience HospiSynAI Features</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
              Interact with our visual simulator tabs below to see how clinical intelligence, pre-invoice compliance audits, and vernacular summarizations run in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Simulator Controls */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {[
                { id: 'clinical', label: 'AI Prescribing Assistant', desc: 'Auto-generates complete treatment plans based on symptom indicators.', icon: Brain, color: 'text-teal-400 bg-teal-500/10' },
                { id: 'auditor', label: 'Pre-Invoice AI Auditor', desc: 'Scans services and bills to prevent duplicate charges or anomalies.', icon: ShieldAlert, color: 'text-rose-400 bg-rose-500/10' },
                { id: 'vernacular', label: 'Multilingual Summary Handout', desc: 'Translates prescription checklists to local Indian dialects instantly.', icon: Languages, color: 'text-violet-400 bg-violet-500/10' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeSimTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSimTab(tab.id)}
                    className={`p-5 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden flex gap-4 ${
                      isSelected 
                        ? 'bg-slate-900 border-teal-500/30 shadow-lg shadow-teal-950/20' 
                        : 'bg-[#0b1329]/30 border-white/5 hover:border-slate-700 hover:bg-[#0b1329]/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500" />
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tab.color}`}>
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

            {/* Simulator Display Screen */}
            <div className="lg:col-span-8 glass-card border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[380px] bg-[#091021]/80 shadow-2xl relative">
              
              {/* Screen Top Status Bar */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SIMULATOR DESK
                </div>
                <div className="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                  Live Response Mode
                </div>
              </div>

              {/* SIMULATOR SCREEN CONTENT */}
              <div className="flex-1">
                
                {/* 1. CLINICAL PRESCRIBING SCREEN */}
                {activeSimTab === 'clinical' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Demographics:</span>
                      <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full font-bold">Female, 45 Yrs</span>
                    </div>
                    <div className="flex gap-2.5 items-center">
                      <span className="text-xs text-slate-400 font-semibold">Chief Complaints:</span>
                      <span className="text-xs text-teal-300 font-bold bg-teal-500/5 border border-teal-500/15 px-3 py-1 rounded-lg">High fever (102°F), dry cough, shortness of breath</span>
                    </div>

                    <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-teal-400 animate-pulse" />
                        <span className="text-xs font-black text-white">AI Assistant Suggestions</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-normal">
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] font-extrabold text-teal-400 uppercase block tracking-wider mb-1">Medicines & Dosing</span>
                          <ul className="space-y-1.5 text-slate-300 font-medium list-disc list-inside">
                            <li>Paracetamol 650mg (BD - Post Meals)</li>
                            <li>Amoxicillin 500mg (TID - 5 Days)</li>
                            <li>Levosalbutamol Inhaler (PRN - SOS)</li>
                          </ul>
                        </div>
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] font-extrabold text-teal-400 uppercase block tracking-wider mb-1">Tests & Safety Advisories</span>
                          <ul className="space-y-1.5 text-slate-300 font-medium list-disc list-inside">
                            <li>Complete Blood Count (CBC)</li>
                            <li>Chest X-Ray (Posterior-Anterior)</li>
                            <li>⚠️ Dosing precaution check clear</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PRE-INVOICE AUDITOR SCREEN */}
                {activeSimTab === 'auditor' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">AI Audit Result: Critical</p>
                          <p className="text-[11px] text-rose-200 mt-0.5 font-medium">Checkout blocked due to clinical and billing inconsistency</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono font-bold uppercase">Verdict ⚠️</span>
                    </div>

                    <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
                      <p className="text-xs font-bold text-white mb-2 uppercase tracking-wide">Audit Trail Violations Detected:</p>
                      <ul className="space-y-2 text-xs">
                        <li className="flex items-start gap-2 text-slate-300 font-medium">
                          <span className="text-rose-400 font-bold font-mono">1.</span>
                          <span><strong>Duplicate Diagnostics:</strong> CBC Hematology and Blood Count automated tests are both added. Select only one to avoid double-charging.</span>
                        </li>
                        <li className="flex items-start gap-2 text-slate-300 font-medium">
                          <span className="text-rose-400 font-bold font-mono">2.</span>
                          <span><strong>Incompatible Locations:</strong> Active ICU bed assignment is logged, but an outpatient (OPD) consultation fee was added. Incompatible billing tags.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 3. MULTILINGUAL TRANSLATION SCREEN */}
                {activeSimTab === 'vernacular' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Select Vernacular Dialect:</span>
                      <div className="flex gap-2">
                        {[
                          { id: 'en', label: 'English' },
                          { id: 'hi', label: 'हिंदी (Hindi)' },
                          { id: 'ta', label: 'தமிழ் (Tamil)' }
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => setActiveLang(lang.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              activeLang === lang.id 
                                ? 'bg-violet-500 text-white shadow-md shadow-violet-950/20' 
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0b1731] border border-violet-500/20 rounded-2xl p-5 shadow-lg relative">
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 animate-pulse">
                        <Languages className="w-4 h-4" />
                      </div>
                      
                      <h4 className="text-sm font-black text-white mb-3 tracking-wide">{translationData[activeLang].title}</h4>
                      <div className="space-y-2 text-xs text-slate-200 leading-relaxed font-semibold">
                        <p className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                          {translationData[activeLang].med1}
                        </p>
                        <p className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                          {translationData[activeLang].med2}
                        </p>
                        <p className="text-amber-400 mt-4 leading-normal">
                          {translationData[activeLang].advice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Quick-Launch Trigger link */}
              <div className="pt-4 border-t border-white/5 mt-6 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Fully mock-integrated on landing</span>
                <button
                  onClick={onEnterWorkspace}
                  className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 group transition-colors"
                >
                  Test actual environment
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

            </div>
          </div>
        </section>

        <hr className="border-white/5 my-16" />

        {/* STANDOUT CAPABILITIES GRID SECTION */}
        <section id="features" className="py-8 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Platform Standout Capabilities</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
              Our architecture maps clinical intelligence directly to receipt flows, built from the ground up on modern SDE principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "AI Prescription Suggester",
                desc: "Attending doctors submit symptom arrays and receive structured medication list recommendations with strict BD/OD dosing tags, pediatric limits, and follow-up timetables.",
                color: "text-teal-400 bg-teal-500/10"
              },
              {
                icon: ShieldAlert,
                title: "Pre-Invoice Billing Auditor",
                desc: "An automatic guardian checking bills before checkout for duplicate diagnostic protocols, conflicting charges (e.g. ICU + OPD codes), or age-inappropriate medication additions.",
                color: "text-rose-400 bg-rose-500/10"
              },
              {
                icon: Languages,
                title: "Live Vernacular Translations",
                desc: "Translate clinical directions immediately into 11 Indian native dialects including Hindi, Tamil, and Marathi. Patient handouts print with emoji checklists representing routines.",
                color: "text-violet-400 bg-violet-500/10"
              },
              {
                icon: TrendingUp,
                title: "AI Revenue Narratives",
                desc: "A natural-language analytics dashboard describing outstanding ledger balances, digital vs cash payment splits, and strategic administrative advice in daily summaries.",
                color: "text-emerald-400 bg-emerald-500/10"
              },
              {
                icon: Printer,
                title: "ReportLab PDF Receipts",
                desc: "Server-side dynamic PDF generation reproducing standard diagnostic receipts. Tweak credentials, branding, addresses, and contacts in the admin panel with zero code rebuilds.",
                color: "text-amber-400 bg-amber-500/10"
              },
              {
                icon: Lock,
                title: "Secure Audit Trails & RBAC",
                desc: "Tamper-evident system logs detailing Receptionist deposits, Accountant checkouts, and Admin settings changes. Fine-grained roles enforced at API endpoints via FastAPI.",
                color: "text-indigo-400 bg-indigo-500/10"
              }
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 bg-[#0b1329]/30 hover:border-slate-700 transition-all flex flex-col justify-between hover:translate-y-[-2px] duration-300">
                  <div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-white mb-2">{feat.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-semibold">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <hr className="border-white/5 my-16" />

        {/* TECHNOLOGY ARCHITECTURE STACK */}
        <section id="tech" className="py-8 scroll-mt-24 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-bold uppercase tracking-wider bg-teal-500/10 px-3 py-1 rounded-full">
                <Cpu className="w-3.5 h-3.5 animate-spin-slow" />
                Under the Hood
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">Production-Ready Tech Architecture</h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                HospiSynAI utilizes a decoupled architecture structure to ensure high performance, security auditing, and painless deployability. 
              </p>
              
              <div className="space-y-3.5">
                {[
                  "FastAPI backend with built-in Pydantic schemas",
                  "Relational PostgreSQL database layer with SQLAlchemy ORM",
                  "ReportLab dynamic canvas drawing engine for PDF templates",
                  "Docker Compose configuration with automated health checks"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Frontend Card */}
              <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#0b1329]/40">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-extrabold text-white mb-2 uppercase tracking-wide">Client Side</h4>
                <div className="text-[11px] text-slate-400 space-y-1 font-semibold leading-relaxed">
                  <p className="text-slate-200">• React (JSX)</p>
                  <p className="text-slate-250">• Tailwind CSS</p>
                  <p className="text-slate-250">• Lucide Icons</p>
                  <p className="text-slate-250">• Recharts Charts</p>
                </div>
              </div>

              {/* Backend Card */}
              <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#0b1329]/40">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                  <Terminal className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-extrabold text-white mb-2 uppercase tracking-wide">Backend Core</h4>
                <div className="text-[11px] text-slate-400 space-y-1 font-semibold leading-relaxed">
                  <p className="text-slate-200">• Python FastAPI</p>
                  <p className="text-slate-250">• Groq Llama 3.3</p>
                  <p className="text-slate-250">• ReportLab PDF</p>
                  <p className="text-slate-250">• SQLAlchemy ORM</p>
                </div>
              </div>

              {/* Database & DevOps Card */}
              <div className="glass-card p-6 rounded-3xl border border-white/5 bg-[#0b1329]/40">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-extrabold text-white mb-2 uppercase tracking-wide">Data & Infra</h4>
                <div className="text-[11px] text-slate-400 space-y-1 font-semibold leading-relaxed">
                  <p className="text-slate-200">• PostgreSQL</p>
                  <p className="text-slate-250">• Docker Containers</p>
                  <p className="text-slate-250">• Docker Compose</p>
                  <p className="text-slate-250">• Fine-grained RBAC</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Section */}
      <footer className="border-t border-white/5 bg-[#040913] py-12 px-6 relative z-10 text-center text-xs text-slate-500 font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-slate-300 font-bold font-sans">HospiSynAI Ecosystem</span>
          </div>

          <div>
            <p className="leading-relaxed">
              Designed & Built with Enterprise-Grade Best Practices.<br />
              Proprietary Software. For deployment or licensing requests, please contact the developer first.
            </p>
          </div>

          <button
            onClick={onEnterWorkspace}
            className="px-5 py-2.5 rounded-xl border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-all font-bold uppercase tracking-wider active:scale-[0.98]"
          >
            Launch System
          </button>
        </div>
      </footer>
    </div>
  );
}
