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
  Users,
  Receipt,
  UserCheck,
  Mail,
  KeyRound,
  RefreshCw,
  ChevronRight,
  Award,
  Zap
} from 'lucide-react';

const DOCTORS_ROSTER = [
  {
    id: 'dr.rajesh',
    username: 'dr.rajesh',
    name: 'Dr. Rajesh Verma',
    title: 'Senior Consultant Physician',
    degree: 'MBBS, MD (General Medicine)',
    chamber: 'Chamber 103',
    dept: 'General & Internal Medicine',
    color: 'cyan',
    badge: 'OPD Active',
    experience: '18+ Yrs Exp',
    password: 'doc123'
  },
  {
    id: 'dr.shweta',
    username: 'dr.shweta',
    name: 'Dr. Shweta Grover',
    title: 'Consultant Pathologist',
    degree: 'MBBS, MD (Pathology), PhD',
    chamber: 'Chamber 102',
    dept: 'Pathology & Lab Medicine',
    color: 'emerald',
    badge: 'OPD Active',
    experience: '14+ Yrs Exp',
    password: 'doc123'
  },
  {
    id: 'dr.priya',
    username: 'dr.priya',
    name: 'Dr. Priya Nair',
    title: 'Consultant ENT Surgeon',
    degree: 'MBBS, MS (ENT Specialist)',
    chamber: 'Chamber 104',
    dept: 'Ear, Nose & Throat (ENT)',
    color: 'purple',
    badge: 'OPD Active',
    experience: '12+ Yrs Exp',
    password: 'doc123'
  }
];

const ROLES_CATALOG = [
  {
    key: 'doctor',
    label: 'Doctor OPD',
    subtitle: '3 Clinic Chambers (102, 103, 104)',
    icon: Stethoscope,
    badgeText: 'Clinical Desk',
    defaultUsername: 'dr.rajesh',
    defaultPassword: 'doc123'
  },
  {
    key: 'receptionist',
    label: 'Front Desk Reception',
    subtitle: 'Queue tokens & patient check-ins',
    icon: Users,
    badgeText: 'Front Office',
    name: 'Aarti Sharma',
    defaultUsername: 'receptionist',
    defaultPassword: 'recep123'
  },
  {
    key: 'accountant',
    label: 'Staff / Accounts & Billing',
    subtitle: 'Invoices, receipts, audits & revenue',
    icon: Receipt,
    badgeText: 'Finance Desk',
    name: 'Rohan Gupta',
    defaultUsername: 'accountant',
    defaultPassword: 'acct123'
  },
  {
    key: 'admin',
    label: 'Hospital Administrator',
    subtitle: 'Master tariffs, users & governance',
    icon: ShieldCheck,
    badgeText: 'Super Admin',
    name: 'System Admin',
    defaultUsername: 'admin',
    defaultPassword: 'admin123'
  },
  {
    key: 'patient',
    label: 'Patient Health Portal',
    subtitle: 'View lab reports & prescription notes',
    icon: UserCheck,
    badgeText: 'Patient Access',
    name: 'Nisha Patel',
    defaultUsername: 'patient',
    defaultPassword: 'pat123'
  }
];

export default function LoginPage({
  onLogin,
  onAuthSuccess,
  authError,
  setAuthError,
  onBackToLanding,
  onOpenBookingModal,
  initialRole = 'doctor',
  API_BASE = 'http://127.0.0.1:5000/api'
}) {
  // Navigation role state
  const [selectedRoleKey, setSelectedRoleKey] = useState('doctor');
  const [selectedDoctorId, setSelectedDoctorId] = useState('dr.rajesh');

  // Credentials inputs
  const [username, setUsername] = useState('dr.rajesh');
  const [password, setPassword] = useState('doc123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Login Mode state ('credentials' | 'otp')
  const [loginMode, setLoginMode] = useState('credentials');
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');

  // Sync initialRole on load
  useEffect(() => {
    const r = (initialRole || '').toLowerCase();
    if (r.includes('doctor')) {
      setSelectedRoleKey('doctor');
      setSelectedDoctorId('dr.rajesh');
      setUsername('dr.rajesh');
      setPassword('doc123');
    } else if (r.includes('recep')) {
      setSelectedRoleKey('receptionist');
      setUsername('receptionist');
      setPassword('recep123');
    } else if (r.includes('account') || r.includes('bill')) {
      setSelectedRoleKey('accountant');
      setUsername('accountant');
      setPassword('acct123');
    } else if (r.includes('admin')) {
      setSelectedRoleKey('admin');
      setUsername('admin');
      setPassword('admin123');
    } else if (r.includes('patient')) {
      setSelectedRoleKey('patient');
      setUsername('patient');
      setPassword('pat123');
    }
  }, [initialRole]);

  // Handle selecting a role from left navigation
  const handleSelectRole = (roleKey) => {
    setSelectedRoleKey(roleKey);
    setLoginMode('credentials');
    if (setAuthError) setAuthError('');
    setOtpErrorMessage('');
    setOtpSentMessage('');

    if (roleKey === 'doctor') {
      const doc = DOCTORS_ROSTER.find(d => d.id === selectedDoctorId) || DOCTORS_ROSTER[0];
      setUsername(doc.username);
      setPassword(doc.password);
      setOtpIdentifier(doc.username);
    } else {
      const roleItem = ROLES_CATALOG.find(r => r.key === roleKey);
      if (roleItem) {
        setUsername(roleItem.defaultUsername);
        setPassword(roleItem.defaultPassword);
        setOtpIdentifier(roleItem.defaultUsername);
      }
    }
  };

  // Handle selecting a specific doctor
  const handleSelectDoctor = (doc) => {
    setSelectedDoctorId(doc.id);
    setUsername(doc.username);
    setPassword(doc.password);
    setOtpIdentifier(doc.username);
    if (setAuthError) setAuthError('');
  };

  // 1-Click Instant Demo Login (no typing required)
  const handleInstantDemoLogin = async () => {
    if (setAuthError) setAuthError('');
    setIsSubmitting(true);
    try {
      if (selectedRoleKey === 'doctor') {
        const doc = DOCTORS_ROSTER.find(d => d.id === selectedDoctorId) || DOCTORS_ROSTER[0];
        await onLogin(doc.username, doc.password);
      } else {
        const roleItem = ROLES_CATALOG.find(r => r.key === selectedRoleKey);
        await onLogin(roleItem.defaultUsername, roleItem.defaultPassword);
      }
    } catch (err) {
      // Error handled by parent authError
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Login Submit
  const handlePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      if (setAuthError) setAuthError('Please enter both username and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onLogin(username.trim(), password.trim());
    } catch (err) {
      // Handled by parent authError
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP: Send code to email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const ident = (otpIdentifier || username).trim();
    if (!ident) {
      setOtpErrorMessage('Please enter your email or username to send the OTP code.');
      return;
    }
    setIsSendingOtp(true);
    setOtpErrorMessage('');
    setOtpSentMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: ident })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not send verification code. Please check your username/email.');
      }
      setOtpSentMessage(data.message || `Verification code sent! (Demo Fallback Code: 123456)`);
    } catch (err) {
      setOtpErrorMessage(err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OTP: Verify code and login
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const ident = (otpIdentifier || username).trim();
    const code = otpCode.trim();
    if (!ident || !code) {
      setOtpErrorMessage('Please provide both the email/username and the 6-digit code.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: ident, otp: code })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid or expired code. Please enter 123456 or request a new code.');
      }
      if (onAuthSuccess) {
        onAuthSuccess(data);
      } else {
        // Fallback: reload
        sessionStorage.setItem('token', data.access_token);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('name', data.name);
        window.location.reload();
      }
    } catch (err) {
      setOtpErrorMessage(err.message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Helper getters for active role display
  const currentRoleItem = ROLES_CATALOG.find(r => r.key === selectedRoleKey) || ROLES_CATALOG[0];
  const currentDoctor = DOCTORS_ROSTER.find(d => d.id === selectedDoctorId) || DOCTORS_ROSTER[0];
  const activeRoleIcon = currentRoleItem.icon;

  return (
    <div className="min-h-screen bg-[#040812] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-500/12 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] bg-indigo-600/12 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[45%] right-[25%] w-[380px] h-[380px] bg-cyan-500/8 rounded-full blur-[130px] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hospital Home</span>
          </button>

          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-white/10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <HeartPulse className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight">
                HospiSyn<span className="text-teal-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block leading-none">Clinical Chambers Gateway</span>
            </div>
          </div>
        </div>

        {/* Top Right: Register Patient Action */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-block text-[11px] text-slate-400 font-medium">New Patient or Need Token?</span>
          <button
            type="button"
            onClick={onOpenBookingModal}
            className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5 text-slate-950" />
            <span>Register Patient</span>
          </button>
        </div>
      </header>

      {/* Main Dual-Panel Workspace */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 my-auto">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* ========================================================= */}
          {/* LEFT PANEL: Role Navigation & Patient Registration Action */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-teal-500/20 rounded-3xl p-5 sm:p-6 flex flex-col justify-between backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                  Select Role or Chamber
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                HospiSyn Gateway
              </h1>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Choose your clinic workstation below. The login screen adapts to your selected role and chamber context.
              </p>

              {/* Roles List */}
              <div className="mt-4 space-y-2">
                {ROLES_CATALOG.map((item) => {
                  const isSelected = selectedRoleKey === item.key;
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleSelectRole(item.key)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-teal-950/40 border-teal-400/60 shadow-lg shadow-teal-500/15 ring-1 ring-teal-400/40'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-gradient-to-tr from-teal-400 to-emerald-400 text-slate-950 shadow-md shadow-teal-500/20'
                                : 'bg-white/[0.05] text-slate-400 border border-white/10'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h2 className="text-xs font-bold text-white leading-tight">{item.label}</h2>
                              {isSelected && (
                                <span className="bg-teal-400/20 text-teal-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-teal-400/40">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-slate-400 mt-0.5">{item.subtitle}</p>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected ? 'text-teal-400 translate-x-0.5' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Patient Direct Register Action Card */}
              <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-teal-950/30 border border-emerald-500/25">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Register as a Patient</h4>
                      <p className="text-[10px] text-slate-400">Book OPD consultation & get token</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenBookingModal}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Compliance Badge */}
            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[10.5px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>DISHA Certified · RBAC Isolated</span>
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Clinic Online
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: Dynamic Adaptable Login Card */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-slate-900/85 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between">

            {/* Top Dynamic Header based on left selection */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-md">
                    {React.createElement(activeRoleIcon, { className: 'w-5 h-5' })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-white">
                        {selectedRoleKey === 'doctor' ? currentDoctor.name : currentRoleItem.label}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-slate-300">
                        {selectedRoleKey === 'doctor' ? currentDoctor.chamber : currentRoleItem.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedRoleKey === 'doctor'
                        ? `${currentDoctor.dept} • ${currentDoctor.experience}`
                        : currentRoleItem.subtitle}
                    </p>
                  </div>
                </div>

                {/* Login Mode Switcher Badge */}
                <span className="text-[10px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  <span>Interactive Portal</span>
                </span>
              </div>

              {/* If Doctor OPD is selected, show 3 Chamber Switcher Buttons */}
              {selectedRoleKey === 'doctor' && (
                <div className="mb-5 p-3 rounded-2xl bg-[#070e1c] border border-white/10">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                    Select Doctor Chamber (3 Active Consultants):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {DOCTORS_ROSTER.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => handleSelectDoctor(doc)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-500/20 border-teal-400 text-white ring-1 ring-teal-400'
                              : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="text-xs font-bold leading-tight truncate">{doc.name.split(' ')[1] || doc.name}</div>
                          <div className="text-[10px] text-teal-300/90 font-medium">{doc.chamber}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {authError && (
                <div className="mb-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* ===================================================== */}
              {/* TWO LOGIN OPTIONS:                                     */}
              {/* Option 1: 1-Click Instant Demo Login (no typing)       */}
              {/* Option 2: Secure Sign In with Credential Hint & OTP    */}
              {/* ===================================================== */}

              {loginMode === 'credentials' ? (
                <>
                  {/* OPTION 1: 1-CLICK INSTANT DEMO LOGIN */}
                  <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 border border-teal-500/30 shadow-lg relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-teal-300 text-xs font-extrabold uppercase tracking-wider">
                          <Zap className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
                          <span>Option 1: 1-Click Instant Demo Access</span>
                        </div>
                        <p className="text-slate-300 text-xs mt-1">
                          No credentials typing required. Instantly launches{' '}
                          <strong className="text-white">
                            {selectedRoleKey === 'doctor' ? currentDoctor.name : currentRoleItem.label}
                          </strong>.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInstantDemoLogin}
                      disabled={isSubmitting}
                      className="mt-3 w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Authenticating Workspace...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-slate-950" />
                          <span>
                            Instant 1-Click Login as{' '}
                            {selectedRoleKey === 'doctor'
                              ? `${currentDoctor.name.split(' ')[1] || 'Doctor'} (${currentDoctor.chamber})`
                              : currentRoleItem.label}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Visual Divider */}
                  <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <span className="relative px-3 bg-slate-900 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Option 2: Secure Sign In With Credentials
                    </span>
                  </div>

                  {/* CREDENTIAL HINT BADGE */}
                  <div className="mb-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <KeyRound className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                          Credential Hint ({selectedRoleKey === 'doctor' ? currentDoctor.name : currentRoleItem.label}):
                        </span>
                        <span className="font-mono text-cyan-200 text-xs">
                          ID: <strong className="text-white">{username}</strong> &bull; Pass: <strong className="text-white">{password}</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedRoleKey === 'doctor') {
                          setUsername(currentDoctor.username);
                          setPassword(currentDoctor.password);
                        } else {
                          setUsername(currentRoleItem.defaultUsername);
                          setPassword(currentRoleItem.defaultPassword);
                        }
                      }}
                      className="text-[10.5px] font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    >
                      Fill Credentials
                    </button>
                  </div>

                  {/* Username & Password Form */}
                  <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                        Username / ID
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. dr.rajesh, receptionist, admin"
                          className="w-full rounded-xl pl-10 pr-4 py-2.5 bg-[#070e1c] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm font-medium transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginMode('otp');
                            setOtpIdentifier(username);
                            setOtpErrorMessage('');
                            setOtpSentMessage('');
                          }}
                          className="text-[11px] font-bold text-teal-400 hover:text-teal-300 underline cursor-pointer"
                        >
                          Forgot Password? Login via OTP
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className="w-full rounded-xl pl-10 pr-10 py-2.5 bg-[#070e1c] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm font-medium transition-all"
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

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl font-bold text-white text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-teal-400/50 transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4 text-teal-400" />
                      <span>
                        Sign In as {selectedRoleKey === 'doctor' ? currentDoctor.name.split(' ')[1] || 'Doctor' : currentRoleItem.label}
                      </span>
                    </button>
                  </form>
                </>
              ) : (
                /* ===================================================== */
                /* OTP LOGIN / FORGOT PASSWORD FLOW                       */
                /* ===================================================== */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30">
                    <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
                      <Mail className="w-4 h-4 text-teal-400" />
                      <span>Email OTP Instant Sign In</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">
                      Forgot your password? Enter your registered email address or username. We will dispatch a 6-digit verification code directly to your email.
                    </p>
                  </div>

                  {otpErrorMessage && (
                    <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{otpErrorMessage}</span>
                    </div>
                  )}

                  {otpSentMessage && (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{otpSentMessage}</span>
                    </div>
                  )}

                  {/* Step 1: Identifier Input & Send OTP */}
                  <div>
                    <label className="block text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                      Registered Email or Username
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          value={otpIdentifier}
                          onChange={(e) => setOtpIdentifier(e.target.value)}
                          placeholder="e.g. dr.rajesh, patient@example.com"
                          className="w-full rounded-xl pl-10 pr-3 py-2.5 bg-[#070e1c] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm font-medium transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isSendingOtp ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5" />
                            <span>Send OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: 6-Digit OTP Code Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                        6-Digit Verification Code
                      </label>
                      <span className="text-[10px] text-teal-400 font-mono">Demo Fallback: 123456</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP (or 123456)"
                        className="w-full rounded-xl pl-10 pr-4 py-2.5 bg-[#070e1c] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 text-sm font-mono tracking-widest transition-all"
                      />
                    </div>
                  </div>

                  {/* Verify & Login Button */}
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp}
                    className="w-full py-3 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Sign In Instantly</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode('credentials');
                        setOtpErrorMessage('');
                        setOtpSentMessage('');
                      }}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Return to Password Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Looking for OPD booking?</span>
              <button
                type="button"
                onClick={onOpenBookingModal}
                className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer"
              >
                Register & Get Queue Token
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 text-center text-slate-500 text-[11px] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>&copy; 2026 HospiSynAI &bull; Multi-Doctor Clinical Intelligence Platform</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-teal-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            DISHA Compliant
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RBAC Isolated
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            256-bit Encrypted
          </span>
        </div>
      </footer>
    </div>
  );
}
