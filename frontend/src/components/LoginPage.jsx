import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Ticket,
  Building2,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Activity,
  Check,
  ChevronRight,
  Award
} from 'lucide-react';

const DOCTORS_ROSTER = [
  {
    id: 'dr.shweta',
    legacyUsername: 'doctor',
    name: 'Dr. Shweta Grover',
    title: 'Consultant Pathologist',
    degree: 'MBBS, MD (Pathology), PhD',
    chamber: 'Chamber 102',
    dept: 'Pathology & Lab Medicine',
    avatarBg: 'from-emerald-500 to-teal-700',
    color: 'emerald',
    badge: 'OPD Active',
    experience: '14+ Yrs Exp.',
    quote: 'Histopathology, CBC diagnostic validation & biopsies'
  },
  {
    id: 'dr.rajesh',
    legacyUsername: 'dr.rajesh',
    name: 'Dr. Rajesh Verma',
    title: 'Senior Consultant Physician',
    degree: 'MBBS, MD (General Medicine)',
    chamber: 'Chamber 103',
    dept: 'General & Internal Medicine',
    avatarBg: 'from-cyan-500 to-blue-700',
    color: 'cyan',
    badge: 'OPD Active',
    experience: '18+ Yrs Exp.',
    quote: 'Hypertension, Diabetes, Viral fevers & Acute consultations'
  },
  {
    id: 'dr.priya',
    legacyUsername: 'dr.priya',
    name: 'Dr. Priya Nair',
    title: 'Consultant ENT Surgeon',
    degree: 'MBBS, MS (ENT Specialist)',
    chamber: 'Chamber 104',
    dept: 'Ear, Nose & Throat (ENT)',
    avatarBg: 'from-purple-500 to-indigo-700',
    color: 'purple',
    badge: 'OPD Active',
    experience: '12+ Yrs Exp.',
    quote: 'Sinusitis, Audiometry, Tonsillitis & Ambient Rhinoscopy'
  }
];

const STAFF_ROLES = [
  {
    role: 'Receptionist',
    username: 'receptionist',
    name: 'Front-Desk Reception Desk',
    icon: '🧑‍💼',
    color: 'border-teal-500/30 text-teal-300 bg-teal-500/10 hover:bg-teal-500/20',
    desc: 'Patient check-ins, walk-in tokens, billing generation'
  },
  {
    role: 'Accountant',
    username: 'accountant',
    name: 'Chief Accounts & Billing',
    icon: '🧾',
    color: 'border-violet-500/30 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20',
    desc: 'Revenue tracking, audits, tax compliance, receipts'
  },
  {
    role: 'Administrator',
    username: 'admin',
    name: 'Hospital Administrator',
    icon: '🛡️',
    color: 'border-amber-500/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20',
    desc: 'System settings, staff accounts, tariff master config'
  },
  {
    role: 'Patient',
    username: 'patient',
    name: 'Nisha Patel (Patient Portal)',
    icon: '👤',
    color: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20',
    desc: 'Personal prescriptions, lab results, live OPD queue tracker'
  }
];

export default function LoginPage({
  onLogin,
  authError,
  setAuthError,
  onBackToLanding,
  onOpenBookingModal,
  initialRole = 'doctor'
}) {
  const [activePortalTab, setActivePortalTab] = useState('doctor'); // 'doctor' | 'staff'
  const [selectedDoctorId, setSelectedDoctorId] = useState('dr.rajesh');
  const [username, setUsername] = useState('dr.rajesh');
  const [password, setPassword] = useState('doc123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialRole === 'doctor' || initialRole === 'Doctor OPD') {
      setActivePortalTab('doctor');
      setSelectedDoctorId('dr.rajesh');
      setUsername('dr.rajesh');
      setPassword('doc123');
    } else if (initialRole === 'receptionist' || initialRole === 'Receptionist') {
      setActivePortalTab('staff');
      setUsername('receptionist');
      setPassword('recep123');
    } else if (initialRole === 'accountant' || initialRole === 'Accountant') {
      setActivePortalTab('staff');
      setUsername('accountant');
      setPassword('acct123');
    } else if (initialRole === 'admin' || initialRole === 'Administrator') {
      setActivePortalTab('staff');
      setUsername('admin');
      setPassword('admin123');
    }
  }, [initialRole]);

  const handleSelectDoctor = (doc) => {
    setSelectedDoctorId(doc.id);
    setUsername(doc.id);
    setPassword('doc123');
    if (setAuthError) setAuthError('');
  };

  const handleSelectStaff = (st) => {
    setUsername(st.username);
    setPassword(st.username === 'admin' ? 'admin123' : st.username === 'accountant' ? 'acct123' : st.username === 'patient' ? 'pat123' : 'recep123');
    if (setAuthError) setAuthError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      if (setAuthError) setAuthError('Please enter username and password');
      return;
    }
    setIsSubmitting(true);
    try {
      await onLogin(username.trim(), password.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDoctor = DOCTORS_ROSTER.find(d => d.id === selectedDoctorId) || DOCTORS_ROSTER[1];

  return (
    <div className="min-h-screen bg-[#040812] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Background Matrix Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hospital Home</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <HeartPulse className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight">HospiSyn<span className="text-teal-400">AI</span></span>
              <span className="text-[10px] text-slate-400 block leading-none">Clinical Chambers Gateway</span>
            </div>
          </div>
        </div>

        {/* Patient Registration Direct Action */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-block text-[11px] text-slate-400 font-medium">New Patient or Need Token?</span>
          <button
            type="button"
            onClick={onOpenBookingModal}
            className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5 text-slate-950" />
            <span>⚡ Register Patient</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 my-auto">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* LEFT PANEL: Clinic Doctor Chambers Roster & Information */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-teal-500/20 rounded-3xl p-5 sm:p-6 flex flex-col justify-between backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Corner Decorative Aura */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                  Clinic Chamber Roster
                </span>
                <span className="text-slate-400 text-xs">3 Active Consultants</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                HospiSyn Clinical Portal
              </h1>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Dedicated clinical command desk for each doctor. Select your chamber below to open your queue, Voice Scribe dictation, and clinical notes.
              </p>

              {/* 3 Doctors Chamber Cards */}
              <div className="mt-5 space-y-2.5">
                {DOCTORS_ROSTER.map((doc) => {
                  const isSelected = activePortalTab === 'doctor' && selectedDoctorId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setActivePortalTab('doctor');
                        handleSelectDoctor(doc);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-teal-950/40 border-teal-400/60 shadow-lg shadow-teal-500/10 ring-1 ring-teal-400/40'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${doc.avatarBg} flex items-center justify-center font-bold text-white text-xs shadow-md`}>
                            {doc.name.split(' ')[1]?.[0] || 'D'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-bold text-white leading-tight">{doc.name}</h3>
                              {isSelected && (
                                <span className="bg-teal-400/20 text-teal-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-teal-400/40">
                                  SELECTED
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-teal-300/90 font-medium leading-none mt-0.5">{doc.title}</p>
                            <p className="text-[9.5px] text-slate-400 mt-1 font-mono">{doc.degree}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/10 text-slate-300 whitespace-nowrap">
                          {doc.chamber}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Security / DISHA Compliance Badge */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10.5px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>DISHA Compliant · RBAC Isolated</span>
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live OPD Active
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: Dedicated Login Card */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-center">

            {/* Portal Tab Switcher */}
            <div className="flex items-center bg-[#070e1c] p-1 rounded-2xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActivePortalTab('doctor');
                  handleSelectDoctor(currentDoctor);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activePortalTab === 'doctor'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor Portal (3 Chambers)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePortalTab('staff');
                  handleSelectStaff(STAFF_ROLES[0]);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activePortalTab === 'staff'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Staff & Reception Desk</span>
              </button>
            </div>

            {/* Context Header */}
            {activePortalTab === 'doctor' ? (
              <div className="mb-5 p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/25 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Entering As:
                  </span>
                  <h2 className="text-base font-black text-white mt-0.5">{currentDoctor.name}</h2>
                  <p className="text-slate-400 text-xs">{currentDoctor.chamber} • {currentDoctor.dept}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Pass: doc123
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-5">
                <p className="text-slate-400 text-xs mb-2 font-bold uppercase tracking-wider">Select Staff Role:</p>
                <div className="grid grid-cols-2 gap-2">
                  {STAFF_ROLES.map((st) => {
                    const isSelected = username === st.username;
                    return (
                      <button
                        key={st.role}
                        type="button"
                        onClick={() => handleSelectStaff(st)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-400 text-white ring-1 ring-teal-400'
                            : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{st.icon}</span>
                          <span className="text-xs font-bold text-white">{st.role}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{st.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Notification */}
            {authError && (
              <div className="mb-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  Username / Doctor ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. dr.rajesh, dr.priya, dr.shweta"
                    className="w-full rounded-xl pl-10 pr-4 py-3 bg-[#070e1c] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400">Demo PIN: doc123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl pl-10 pr-10 py-3 bg-[#070e1c] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm font-medium transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-slate-950 text-sm bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>Authenticating Chamber...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {activePortalTab === 'doctor'
                        ? `Sign In to ${currentDoctor.chamber} (${currentDoctor.name.split(' ')[1] || 'Doctor'})`
                        : 'Secure Staff Sign In'}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Doctor Roster Switcher Bar */}
            {activePortalTab === 'doctor' && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                  Quick 1-Tap Chamber Switcher:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {DOCTORS_ROSTER.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleSelectDoctor(doc)}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer text-center truncate ${
                        selectedDoctorId === doc.id
                          ? 'bg-teal-500/25 border-teal-400 text-teal-300'
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {doc.name.split(' ')[1] || doc.name} ({doc.chamber.replace('Chamber ', 'Ch.')})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Register Reminder */}
            <div className="mt-5 text-center text-xs text-slate-400">
              Are you a Patient?{' '}
              <button
                type="button"
                onClick={onOpenBookingModal}
                className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer"
              >
                Book OPD Token & AI Triage
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 py-3 text-center text-slate-500 text-[11px] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 HospiSynAI • Multi-Doctor Clinical Intelligence Platform</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-teal-400">
            <Check className="w-3 h-3" />
            DISHA Compliant
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <Check className="w-3 h-3" />
            Role Isolated
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <Check className="w-3 h-3" />
            256-bit Encrypted
          </span>
        </div>
      </footer>
    </div>
  );
}
