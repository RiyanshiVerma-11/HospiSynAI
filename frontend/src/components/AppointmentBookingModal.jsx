import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  QrCode,
  HeartPulse,
  Mic,
  MicOff,
  Flame
} from 'lucide-react';
import { buildFollowUpGoogleCalendarUrl } from '../utils/calendarService';

const SYMPTOM_CHIPS = [
  'Fever & Chills',
  'Severe Cough & Cold',
  'Headache / Migraine',
  'Chest Pain & Heaviness',
  'Shortness of Breath',
  'Abdominal Pain & Acidity',
  'Joint / Knee Pain',
  'Skin Rash / Allergy',
  'General Weakness & Fatigue'
];

export default function AppointmentBookingModal({
  isOpen,
  onClose,
  API_BASE,
  showToast,
  onBookingSuccess
}) {
  const resolvedApiBase = API_BASE || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '/api' 
      : 'https://hospisyn-backend.onrender.com/api');

  const [step, setStep] = useState(1); // 1: Patient Details, 2: Triage & Doctor, 3: Confirmation Pass
  const [loading, setLoading] = useState(false);
  const [triageLoading, setTriageLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    mobile: '',
    email: '',
    city: '',
    chief_complaints: '',
    doctor_id: 1,
    triage_severity: 'Normal'
  });

  // Triage Result State
  const [triageResult, setTriageResult] = useState(null);

  // Booking Result State
  const [bookingResult, setBookingResult] = useState(null);

  // Doctors list from server or fallback defaults
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. Shweta Grover', degree: 'MBBS, MD (Pathology), Consultant', fee: 500 },
    { id: 2, name: 'Dr. Rajesh Verma', degree: 'MBBS, MD (General Medicine)', fee: 400 },
    { id: 3, name: 'Dr. Priya Nair', degree: 'MBBS, MS (ENT Specialist)', fee: 450 }
  ]);

  // Fetch doctors on modal open
  useEffect(() => {
    if (isOpen) {
      fetch(`${resolvedApiBase}/doctors`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setDoctors(data);
            if (!formData.doctor_id) {
              setFormData(prev => ({ ...prev, doctor_id: data[0].id }));
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, resolvedApiBase]);

  // Web Speech recognition for voice symptom intake
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast?.('Voice recognition not supported in this browser. Please type symptoms.', 'warning');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Code-mixed Hindi/English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        showToast?.('🎙️ Listening... Speak symptoms in Hindi or English', 'info');
      };

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setFormData(prev => ({
          ...prev,
          chief_complaints: prev.chief_complaints ? `${prev.chief_complaints}, ${transcript}` : transcript
        }));
        setIsListening(false);
        showToast?.('Speech captured!', 'success');
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleChipClick = (chip) => {
    setFormData(prev => {
      const current = prev.chief_complaints.trim();
      if (!current) return { ...prev, chief_complaints: chip };
      if (current.toLowerCase().includes(chip.toLowerCase())) return prev;
      return { ...prev, chief_complaints: `${current}, ${chip}` };
    });
  };

  // Run AI Triage check
  const handleRunAITriage = async () => {
    if (!formData.chief_complaints.trim()) {
      showToast?.('Please enter your symptoms first', 'warning');
      return;
    }

    setTriageLoading(true);
    setSubmitError('');
    try {
      const res = await fetch(`${resolvedApiBase}/ai/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chief_complaints: formData.chief_complaints,
          age: formData.age ? parseInt(formData.age, 10) : undefined,
          gender: formData.gender || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTriageResult(data);

        let targetDocId = formData.doctor_id;
        if (data.recommended_department) {
          const depLower = data.recommended_department.toLowerCase();
          const matchedDoc = doctors.find(d => 
            (d.degree && d.degree.toLowerCase().includes(depLower)) ||
            (d.specialty && d.specialty.toLowerCase().includes(depLower)) ||
            (depLower.includes('medicine') && d.degree?.toLowerCase().includes('general medicine'))
          );
          if (matchedDoc) {
            targetDocId = matchedDoc.id;
          }
        }

        setFormData(prev => ({
          ...prev,
          doctor_id: targetDocId,
          triage_severity: data.severity
        }));
        showToast?.(`AI Triage: ${data.severity} priority recommended (${data.recommended_department})`, 'info');
      } else {
        showToast?.('AI Triage offline, continuing with default priority', 'info');
      }
    } catch {
      showToast?.('AI Triage offline, continuing with default priority', 'info');
    } finally {
      setTriageLoading(false);
    }
  };

  // Submit Booking
  const handleBookAppointment = async (e) => {
    if (e) e.preventDefault();
    setSubmitError('');

    if (!formData.name.trim() || !formData.mobile.trim() || !formData.age || !formData.gender) {
      const missingMsg = 'Please fill required patient details (Name, Age, Gender, Mobile)';
      setSubmitError(missingMsg);
      showToast?.(missingMsg, 'warning');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const targetDoctorId = formData.doctor_id ? parseInt(formData.doctor_id, 10) : (doctors[0]?.id || 1);
      const payload = {
        name: formData.name.trim(),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || undefined,
        city: formData.city.trim() || undefined,
        chief_complaints: formData.chief_complaints.trim() || 'General OPD Consultation',
        doctor_id: targetDoctorId,
        triage_severity: formData.triage_severity || 'Normal'
      };

      const res = await fetch(`${resolvedApiBase}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = 'Failed to book appointment';
        try {
          const err = await res.json();
          errMsg = err.detail || errMsg;
        } catch {
          errMsg = `Server error (${res.status}): Please check that backend server is running.`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setBookingResult(data);
      setStep(3); // Go to confirmation pass
      showToast?.(`Appointment Confirmed! Token #${data.token_number}`, 'success');
      onBookingSuccess?.(data);
    } catch (err) {
      const errorText = err.message || 'Failed to book appointment. Please check network/server connection.';
      setSubmitError(errorText);
      showToast?.(errorText, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 1-Tap Arrival Check-In
  const handle1TapCheckin = async () => {
    if (!bookingResult?.visit_id) return;
    setCheckinLoading(true);
    try {
      const res = await fetch(`${resolvedApiBase}/appointments/${bookingResult.visit_id}/checkin`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Check-in failed');
      const data = await res.json();
      setBookingResult(prev => ({ ...prev, status: 'Arrived' }));
      showToast?.(`Checked in! You are marked as Arrived in waiting area.`, 'success');
    } catch (err) {
      showToast?.(err.message || 'Check-in failed', 'error');
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleCopyPass = () => {
    if (!bookingResult) return;
    const text = `HospiSynAI Digital OPD Pass\nToken: #${bookingResult.token_number}\nUHID: ${bookingResult.patient_id}\nPatient: ${bookingResult.patient_name}\nDoctor: ${bookingResult.doctor_name}`;
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
    showToast?.('Digital pass details copied to clipboard!', 'info');
  };

  const handleDownloadIcs = () => {
    if (!bookingResult) return;
    const today = new Date().toISOString().split('T')[0];
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HospiSynAI//Hospital Management//EN',
      'BEGIN:VEVENT',
      `SUMMARY:OPD Appointment - Token #${bookingResult.token_number} with ${bookingResult.doctor_name}`,
      `DESCRIPTION:Patient: ${bookingResult.patient_name}\\nUHID: ${bookingResult.patient_id}\\nVisit ID: ${bookingResult.visit_id}\\nHospital: Vedam Diagnostics & Super Speciality`,
      `DTSTART:${today.replace(/-/g, '')}T100000Z`,
      `DTEND:${today.replace(/-/g, '')}T103000Z`,
      'LOCATION:Vedam Diagnostics OPD Clinic',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: HospiSynAI OPD Appointment',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment_token_${bookingResult.token_number}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast?.('Calendar invite (.ics) downloaded!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header with Progress Steps */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-indigo-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/25 flex-shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Book OPD Appointment
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full">
                  Instant Token
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                30-Second registration &middot; AI smart triage &middot; 1-tap hospital check-in
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => step > 1 && setStep(1)}
              className={`flex items-center gap-2 transition-colors ${
                step === 1
                  ? 'text-teal-600 dark:text-teal-400 font-bold'
                  : step > 1
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>1</span>
              <span>Patient Details</span>
            </button>

            <span className="text-slate-300 dark:text-slate-600">&rarr;</span>

            <button
              type="button"
              onClick={() => step > 2 && setStep(2)}
              className={`flex items-center gap-2 transition-colors ${
                step === 2
                  ? 'text-teal-600 dark:text-teal-400 font-bold'
                  : step > 2
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>2</span>
              <span>AI Triage & Doctor</span>
            </button>

            <span className="text-slate-300 dark:text-slate-600">&rarr;</span>

            <div className={`flex items-center gap-2 ${
              step === 3
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>3</span>
              <span>Digital OPD Pass</span>
            </div>
          </div>

          <div className="text-[11px] font-medium text-slate-400">
            Step {step} of 3
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: Patient Information */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div className="bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>New to HospiSyn?</strong> Just enter your basic details once. We will automatically generate your permanent hospital UHID and OPD appointment token.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Verma"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="e.g. 32"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="For calendar & PDF receipts"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City / Address (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Sector 62, Noida"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI Triage & Doctor Selection */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    What symptoms or problems are you experiencing?
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/20'
                        : 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Stop' : 'Voice (Hindi/Eng)'}</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  placeholder="Describe in plain Hindi or English (e.g., 2 din se tez bukhar hai, gala kharab hai aur saans lene me dikkat)..."
                  value={formData.chief_complaints}
                  onChange={e => setFormData({ ...formData, chief_complaints: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                />

                {/* Quick Symptom Chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SYMPTOM_CHIPS.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-xs font-medium transition"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Triage Trigger & Card */}
              <div className="pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    AI Clinical Triage & Department Recommender
                  </span>
                  <button
                    type="button"
                    onClick={handleRunAITriage}
                    disabled={triageLoading || !formData.chief_complaints.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 disabled:opacity-50 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{triageLoading ? 'Analyzing...' : 'Run AI Triage'}</span>
                  </button>
                </div>

                {triageResult && (
                  <div className={`mt-3 p-4 rounded-2xl border transition-all ${
                    triageResult.severity === 'Urgent'
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40'
                      : triageResult.severity === 'Moderate'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
                  }`}>
                    <div className="flex items-start gap-3">
                      {triageResult.severity === 'Urgent' ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[10px] ${
                            triageResult.severity === 'Urgent'
                              ? 'bg-rose-600 text-white'
                              : triageResult.severity === 'Moderate'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {triageResult.severity} Priority
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Recommended: {triageResult.recommended_department}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {triageResult.clinical_advisory}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Doctor Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Attending Specialist / Doctor
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {doctors.map(doc => {
                    const isAiMatch = triageResult?.recommended_department && (
                      (doc.degree && doc.degree.toLowerCase().includes(triageResult.recommended_department.toLowerCase())) ||
                      (triageResult.recommended_department.toLowerCase().includes('medicine') && doc.degree?.toLowerCase().includes('general medicine'))
                    );
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, doctor_id: doc.id })}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          formData.doctor_id === doc.id
                            ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                        }`}
                      >
                        {isAiMatch && (
                          <span className="absolute -top-2 right-3 text-[9.5px] font-black bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                            ✨ AI Match
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {doc.name}
                          </div>
                          <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                            ₹{doc.consultation_fee || doc.fee || 500}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {doc.degree}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Notification Banner if Booking Fails */}
              {submitError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-black text-rose-900 dark:text-rose-100">Booking Notification</div>
                    <div className="text-[11px] mt-0.5 leading-relaxed text-rose-700 dark:text-rose-300">{submitError}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirmation Digital OPD Pass */}
          {step === 3 && bookingResult && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="text-center">
                <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  OPD Appointment Confirmed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your OPD slot is booked. Show this digital pass or mark arrival at the reception.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex items-center justify-between border-b border-teal-600/50 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] tracking-wider uppercase font-bold text-teal-300">
                      HospiSynAI Digital Health Pass
                    </div>
                    <div className="text-sm font-black">Vedam Diagnostics & Super Speciality</div>
                  </div>
                  <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md text-[11px] font-bold">
                    {bookingResult.status === 'Arrived' ? '🟢 Arrived' : '🟡 Scheduled'}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-teal-200">Your OPD Token</div>
                    <div className="text-4xl sm:text-5xl font-black tracking-tight mt-0.5 text-white">
                      Token #{bookingResult.token_number}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-teal-200">Patient UHID</div>
                    <div className="text-sm sm:text-base font-mono font-bold text-teal-100">
                      {bookingResult.patient_id}
                    </div>
                    <div className="text-xs text-teal-300 font-semibold mt-0.5">
                      {bookingResult.patient_name}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-teal-600/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-300" />
                    <span>Doctor: <strong>{bookingResult.doctor_name}</strong></span>
                  </div>
                  <div className="text-teal-200 text-[11px]">
                    Visit ID: <code>{bookingResult.visit_id}</code>
                  </div>
                </div>
              </div>

              {/* Action Buttons: 1-Tap Arrival Check-in & Calendar Sync */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handle1TapCheckin}
                  disabled={checkinLoading || bookingResult.status === 'Arrived'}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                    bookingResult.status === 'Arrived'
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {bookingResult.status === 'Arrived'
                      ? '✓ Marked as Arrived at Hospital'
                      : checkinLoading
                      ? 'Confirming Arrival...'
                      : '📍 I Have Arrived (1-Tap Check-In)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Add to Phone Calendar (.ics)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPass}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition"
                >
                  {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedToken ? 'Pass Copied!' : 'Copy Token Details'}</span>
                </button>

                <a
                  href={buildFollowUpGoogleCalendarUrl(
                    new Date().toISOString().split('T')[0],
                    `OPD Token #${bookingResult.token_number} - ${bookingResult.doctor_name}`,
                    'Vedam Diagnostics OPD'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition"
                >
                  <ExternalLink className="w-4 h-4 text-teal-600" />
                  <span>Sync to Google Calendar</span>
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.name || !formData.age || !formData.gender || !formData.mobile) {
                    showToast?.('Please fill required fields (Name, Age, Gender, Mobile)', 'warning');
                    return;
                  }
                  setStep(2);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-600/20 active:scale-95 transition"
              >
                <span>Next: Symptoms & AI Triage</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleBookAppointment}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/25 active:scale-95 disabled:opacity-50 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Issuing Token...' : 'Confirm & Generate OPD Token'}</span>
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                You can access this anytime from the Patient Portal tab.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black hover:opacity-90 transition shadow-md"
              >
                Done
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
