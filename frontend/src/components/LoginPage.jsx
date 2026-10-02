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
    key: 'patient',
    label: 'Patient Health Portal',
    subtitle: 'View lab reports & prescription notes',
    icon: UserCheck,
    badgeText: 'Patient Access',
    name: 'Palak',
    defaultUsername: 'mailtopalak0002@gmail.com',
    defaultPassword: 'palak@123'
  }
];

export default function LoginPage({
  onLogin,
  onAuthSuccess,
  authError,
  setAuthError,
  onBackToLanding,
  onOpenBookingModal,
  initialRole = 'admin',
  API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? '/api'
    : 'https://hospisynai.onrender.com/api'
}) {
  // Navigation role state (defaults to Admin on top)
  const [selectedRoleKey, setSelectedRoleKey] = useState('admin');
  const [selectedDoctorId, setSelectedDoctorId] = useState('dr.rajesh');

  // Credentials inputs
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingSeconds, setSubmittingSeconds] = useState(0);

  // Track submission duration to detect slow cold-start spin ups
  useEffect(() => {
    let timer;
    if (isSubmitting) {
      setSubmittingSeconds(0);
      timer = setInterval(() => {
        setSubmittingSeconds(s => s + 1);
      }, 1000);
    } else {
      setSubmittingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isSubmitting]);

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
      setUsername('mailtopalak0002@gmail.com');
      setPassword('palak@123');
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans select-text">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[45%] right-[25%] w-[380px] h-[380px] bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Header - Dark Bar matching Landing Page */}
      <header className="relative z-20 w-full bg-[#040814] border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
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

          {/* Top Header Mode Toggle & Register Action */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-white/[0.08] p-1 rounded-2xl border border-white/10 shadow-inner">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-teal-500/20"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In (Login)</span>
              </button>
              <button
                type="button"
                onClick={onOpenBookingModal}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/[0.08] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                <span>Register as New Patient</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenBookingModal}
              className="sm:hidden bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5 text-slate-950" />
              <span>Register</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dual-Panel Workspace */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-2 sm:p-4 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">

          {/* ========================================================= */}
          {/* LEFT PANEL: Role Navigation & Patient Registration Action */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-lg shadow-slate-200/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                  Select Role or Chamber
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                HospiSyn Gateway
              </h1>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Choose your clinic workstation below. The login screen adapts to your selected role and chamber context.
              </p>

              {/* ======================================= */}
              {/* SECTION 1: PATIENT PORTAL & REGISTER   */}
              {/* ======================================= */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-teal-700 mb-1.5">
                  <span>1. Patient Portal & Registration</span>
                  <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-700 font-bold">For Patients</span>
                </div>

                {/* Patient Health Portal */}
                <div
                  onClick={() => handleSelectRole('patient')}
                  className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                    selectedRoleKey === 'patient'
                      ? 'bg-teal-50/80 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          selectedRoleKey === 'patient'
                            ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                            : 'bg-slate-200/80 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-[11.5px] font-bold text-slate-900 leading-tight">Patient Health Portal</h2>
                          {selectedRoleKey === 'patient' && (
                            <span className="bg-teal-100 text-teal-800 text-[8px] font-black px-1.5 py-0.2 rounded border border-teal-300">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] text-slate-500 mt-0.5">Login with Patient ID (UHID) or Email</p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        selectedRoleKey === 'patient' ? 'text-teal-600 translate-x-0.5' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Register New Patient Action Card */}
                <div className="mt-2 p-2 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                        <Ticket className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900">Register as New Patient</h4>
                        <p className="text-[9px] text-slate-500">Book OPD consultation & get token</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenBookingModal}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      Register Now →
                    </button>
                  </div>
                </div>
              </div>

              {/* ======================================= */}
              {/* SECTION 2: HOSPITAL CLINICAL & ADMIN    */}
              {/* ======================================= */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  <span>2. Hospital Clinical & Admin Staff</span>
                  <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-bold">Doctors & Staff</span>
                </div>

                <div className="space-y-1">
                  {ROLES_CATALOG.filter(r => r.key !== 'patient').map((item) => {
                    const isSelected = selectedRoleKey === item.key;
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleSelectRole(item.key)}
                        className={`p-1.5 px-2 rounded-lg border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500/30'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                                  : 'bg-slate-200/80 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <IconComponent className="w-3 h-3" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h2 className="text-[11px] font-bold text-slate-900 leading-tight">{item.label}</h2>
                                {isSelected && (
                                  <span className="bg-teal-100 text-teal-800 text-[8px] font-black px-1.5 py-0.2 rounded border border-teal-300">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-500">{item.subtitle}</p>
                            </div>
                          </div>

                          <ChevronRight
                            className={`w-3 h-3 transition-transform ${
                              isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Compliance Badge */}
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>DISHA Certified · RBAC Isolated</span>
              </span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Clinic Online
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: Dynamic Adaptable Login Card */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-200/60 flex flex-col justify-between">

            {/* Top Dynamic Header based on left selection */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-sm">
                    {React.createElement(activeRoleIcon, { className: 'w-4 h-4' })}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {selectedRoleKey === 'doctor' ? currentDoctor.name : currentRoleItem.label}
                      </h2>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                        {selectedRoleKey === 'doctor' ? currentDoctor.chamber : currentRoleItem.badgeText}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      {selectedRoleKey === 'doctor'
                        ? `${currentDoctor.dept} • ${currentDoctor.experience}`
                        : currentRoleItem.subtitle}
                    </p>
                  </div>
                </div>

                {/* Login Mode Switcher Badge */}
                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                  <span>Interactive Portal</span>
                </span>
              </div>

              {/* If Doctor OPD is selected, show 3 Chamber Switcher Buttons */}
              {selectedRoleKey === 'doctor' && (
                <div className="mb-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Select Doctor Chamber (3 Active Consultants):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DOCTORS_ROSTER.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => handleSelectDoctor(doc)}
                          className={`p-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 text-slate-900 ring-1 ring-teal-500 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-[11px] font-bold leading-tight truncate">{doc.name.split(' ')[1] || doc.name}</div>
                          <div className={`text-[9.5px] font-medium ${isSelected ? 'text-teal-700 font-bold' : 'text-slate-500'}`}>{doc.chamber}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error Alert with special friendly handling for Render cold starts / Failed to fetch */}
              {authError && (
                <div className={`mb-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  authError.toLowerCase().includes('fetch') || authError.toLowerCase().includes('waking up') || authError.toLowerCase().includes('network')
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    authError.toLowerCase().includes('fetch') || authError.toLowerCase().includes('waking up') || authError.toLowerCase().includes('network')
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`} />
                  <div className="flex-1">
                    {authError.toLowerCase().includes('fetch') || authError.toLowerCase().includes('waking up') || authError.toLowerCase().includes('network') ? (
                      <div>
                        <div className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                          <span>Render services are waking up, please wait...</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 leading-normal">
                          Free cloud instances spin down after inactivity and take about 1–2 minutes to spin up. Please wait 10–15 seconds and click retry below.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleInstantDemoLogin()}
                          className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry Login Now</span>
                        </button>
                      </div>
                    ) : (
                      <span>{authError}</span>
                    )}
                  </div>
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
                  <div className="mb-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-teal-800 text-[10.5px] font-extrabold uppercase tracking-wider">
                          <Zap className="w-3 h-3 text-teal-600 fill-teal-600" />
                          <span>Option 1: 1-Click Instant Demo Access</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          No credentials typing required. Instantly launches{' '}
                          <strong className="text-slate-900 font-bold">
                            {selectedRoleKey === 'doctor' ? currentDoctor.name : currentRoleItem.label}
                          </strong>.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInstantDemoLogin}
                      disabled={isSubmitting}
                      className="mt-2 w-full py-2 px-3 rounded-lg font-extrabold text-xs text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>
                            {submittingSeconds >= 2
                              ? `Render services are waking up (${submittingSeconds}s)...`
                              : 'Authenticating Workspace...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>
                            Instant 1-Click Login as{' '}
                            {selectedRoleKey === 'doctor'
                              ? `${currentDoctor.name.split(' ')[1] || 'Doctor'} (${currentDoctor.chamber})`
                              : currentRoleItem.label}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    {/* Prominent Wake-Up notice when cold boot takes more than 2 seconds */}
                    {isSubmitting && submittingSeconds >= 2 && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 text-[11px] flex items-start gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-extrabold text-amber-950 flex items-center gap-1">
                            <span>render services are waking up please wait ..</span>
                            <span className="font-mono text-[10px] px-1 bg-amber-200 rounded font-bold">({submittingSeconds}s)</span>
                          </div>
                          <p className="text-amber-800 mt-0.5 text-[10.5px]">
                            Free cloud hosting sleeps after inactivity. It takes around 1 to 2 minutes to spin up. Do not close this page; workspace will open automatically once active.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visual Divider */}
                  <div className="relative my-2.5 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative px-2.5 bg-white text-[9px] font-extrabold uppercase tracking-widest text-slate-500">
                      Option 2: Secure Sign In With Credentials
                    </span>
                  </div>

                  {/* CREDENTIAL HINT BADGE */}
                  <div className="mb-2.5 p-2 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-sky-800">
                      <KeyRound className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block leading-tight">
                          Credential Hint ({selectedRoleKey === 'doctor' ? currentDoctor.name : currentRoleItem.label}):
                        </span>
                        <span className="font-mono text-sky-950 text-[11px]">
                          ID: <strong className="text-slate-900">{username}</strong> &bull; Pass: <strong className="text-slate-900">{password}</strong>
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
                      className="text-[9.5px] font-bold text-teal-700 hover:text-teal-800 bg-teal-100 hover:bg-teal-200 border border-teal-300 px-2 py-0.5 rounded-md transition-all cursor-pointer whitespace-nowrap"
                    >
                      Fill Credentials
                    </button>
                  </div>

                  {/* Username & Password Form */}
                  <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                          {selectedRoleKey === 'patient' 
                            ? 'Patient ID (UHID) or Registered Email Address' 
                            : 'Staff Username / Email / ID'}
                        </label>
                        {selectedRoleKey === 'patient' && (
                          <span className="text-[9px] text-teal-700 font-mono">e.g. PAT-... or Gmail</span>
                        )}
                      </div>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={selectedRoleKey === 'patient' 
                            ? 'e.g. PAT-20260926-00001 or mailtopalak0002@gmail.com' 
                            : 'e.g. dr.rajesh, receptionist, admin'}
                          className="w-full rounded-lg pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs font-medium transition-all shadow-xs"
                          required
                        />
                      </div>
                      {selectedRoleKey === 'patient' && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Enter your 14-digit UHID (e.g. <span className="text-teal-700 font-mono font-semibold">PAT-20260926-00001</span>) or registered email.
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider">
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
                          className="text-[10px] font-bold text-teal-700 hover:text-teal-800 underline cursor-pointer"
                        >
                          Forgot Password? Login via OTP
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className="w-full rounded-lg pl-10 pr-10 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs font-medium transition-all shadow-xs"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-0.5"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-lg font-bold text-white text-xs bg-slate-900 hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                          <span>
                            {submittingSeconds >= 2
                              ? `Render services are waking up (${submittingSeconds}s)...`
                              : 'Signing in...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-teal-400" />
                          <span>
                            Sign In as {selectedRoleKey === 'doctor' ? currentDoctor.name.split(' ')[1] || 'Doctor' : currentRoleItem.label}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Quick Select Chips for the 5 Real Patients */}
                    {selectedRoleKey === 'patient' && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
                          ⚡ 1-Click Select Real Patient Profile:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                          {[
                            { label: '1. Palak (Paid)', user: 'mailtopalak0002@gmail.com', pass: 'palak@123', status: 'Completed • Paid' },
                            { label: '2. Mahesh (Paid)', user: 'maimahesh1192@gmail.com', pass: 'mahesh@123', status: 'Completed • Paid' },
                            { label: '3. Yashvi (Wait)', user: 'yashviii1289@gmail.com', pass: 'yashvi@123', status: 'Waiting' },
                            { label: '4. Pari (Critical)', user: 'pari43093@gmail.com', pass: 'pari@123', status: 'Critical' },
                            { label: '5. Rohit (Pending)', user: 'mailrohitkumar002@gmail.com', pass: 'rohit@123', status: 'Bill Pending' }
                          ].map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setUsername(p.user);
                                setPassword(p.pass);
                                if (setAuthError) setAuthError('');
                              }}
                              className={`text-left p-1 rounded border text-[10px] transition-all cursor-pointer ${
                                username === p.user
                                  ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="font-bold block truncate text-slate-900">{p.label}</span>
                              <span className="text-[8.5px] text-teal-700 font-semibold block truncate">{p.status}</span>
                            </button>
                          ))}
                        </div>

                        {/* Clear Distinction: Registration Guidance */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 text-center mt-2 shadow-sm">
                          <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wider mb-0.5">
                            <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                            <span>New Patient? Don't have an Account or UHID?</span>
                          </div>
                          <p className="text-[10.5px] text-slate-600 mb-2">
                            Register as a new patient, choose your doctor chamber, specify symptoms, and generate your instant OPD queue token.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenBookingModal) onOpenBookingModal();
                            }}
                            className="w-full py-1.5 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Ticket className="w-3.5 h-3.5 fill-white" />
                            <span>Register as New Patient & Get Token →</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </>
              ) : (
                /* ===================================================== */
                /* OTP LOGIN / FORGOT PASSWORD FLOW                       */
                /* ===================================================== */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold text-[11px] uppercase tracking-wider">
                      <Mail className="w-3.5 h-3.5 text-teal-600" />
                      <span>Email OTP Instant Sign In</span>
                    </div>
                    <p className="text-slate-600 text-[10.5px] mt-0.5">
                      Forgot your password? Enter your registered email address or username. We will dispatch a 6-digit verification code directly to your email.
                    </p>
                  </div>

                  {otpErrorMessage && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      <span>{otpErrorMessage}</span>
                    </div>
                  )}

                  {otpSentMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{otpSentMessage}</span>
                    </div>
                  )}

                  {/* Step 1: Identifier Input & Send OTP */}
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Registered Email or Username
                    </label>
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={otpIdentifier}
                          onChange={(e) => setOtpIdentifier(e.target.value)}
                          placeholder="e.g. dr.rajesh, patient@example.com"
                          className="w-full rounded-lg pl-10 pr-2.5 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs font-medium transition-all shadow-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="px-3 py-1.5 rounded-lg font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-1 shadow-sm"
                      >
                        {isSendingOtp ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3" />
                            <span>Send OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: 6-Digit OTP Code Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                        6-Digit Verification Code
                      </label>
                      <span className="text-[9.5px] text-teal-700 font-mono font-semibold">Demo Fallback: 123456</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP (or 123456)"
                        className="w-full rounded-lg pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs font-mono tracking-widest transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Verify & Login Button */}
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp}
                    className="w-full py-2.5 rounded-lg font-extrabold text-xs text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Sign In Instantly</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode('credentials');
                        setOtpErrorMessage('');
                        setOtpSentMessage('');
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Return to Password Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Looking for OPD booking?</span>
              <button
                type="button"
                onClick={onOpenBookingModal}
                className="text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer"
              >
                Register & Get Queue Token
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 text-center text-slate-500 text-[11px] border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white/60">
        <span>&copy; 2026 HospiSynAI &bull; Multi-Doctor Clinical Intelligence Platform</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-teal-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            DISHA Compliant
          </span>
          <span className="flex items-center gap-1 text-cyan-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
            RBAC Isolated
          </span>
          <span className="flex items-center gap-1 text-indigo-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            256-bit Encrypted
          </span>
        </div>
      </footer>
    </div>
  );
}
