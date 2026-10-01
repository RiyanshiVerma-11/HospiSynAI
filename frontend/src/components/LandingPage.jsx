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
  Shield,
  Mic,
  MicOff,
  Volume2,
  Stethoscope,
  Scale,
  Receipt,
  ChevronDown,
  HelpCircle,
  Ticket,
  QrCode,
  Clock,
  Calendar,
  Send,
  AlertCircle,
  Loader2,
  Check,
  XCircle
} from 'lucide-react';
import AppointmentBookingModal from './AppointmentBookingModal';

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
      className="stat-card-new relative overflow-hidden p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-teal-400 group transition-all duration-300 hover:scale-[1.02]"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.3s, transform 0.3s`
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-xl pointer-events-none group-hover:bg-teal-100 transition-colors" />
      <div className="text-2xl md:text-3xl font-black text-teal-600 mb-1 font-mono tracking-tight flex items-baseline">
        <span>{isNumeric ? count : num}</span>
        <span className="text-emerald-600 ml-0.5">{suffix}</span>
      </div>
      <div className="text-xs font-bold text-slate-900 mb-0.5 tracking-wide">{title}</div>
      <div className="text-[11px] text-slate-500 font-medium leading-tight">{desc}</div>
    </div>
  );
}

// --- Feature Card ---
function FeatureCard({ icon: Icon, title, desc, color, gradientFrom, delay = 0 }) {
  const [ref, inView] = useInView(0.15);
  return (
    <div
      ref={ref}
      className="feature-card-new group relative p-6 rounded-3xl border border-slate-200 bg-white hover:border-teal-400 shadow-sm hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] cursor-default flex flex-col justify-between"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, background-color 0.3s, border-color 0.3s`
      }}
    >
      <div>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors duration-300 tracking-tight">{title}</h3>
        <p className="text-slate-600 text-xs leading-relaxed font-medium">{desc}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-teal-600 transition-colors">
        <span>Production verified</span>
        <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-600 opacity-80 group-hover:opacity-100" />
      </div>
    </div>
  );
}

// --- Trust Strip Items ---
const trustItems = [
  { label: '🎙️ Ambient Hindi/Hinglish Voice Scribe' },
  { label: '⚡ Groq AI Clinical Engine (<1.5s latency)' },
  { label: '🛡️ Hybrid Deterministic + LLM Auditor' },
  { label: '⚖️ NHA CGHS Price Benchmark Intelligence' },
  { label: '🧑‍⚕️ 4 Specialized Role Desks (Doctor/Recep/Acct/Admin)' },
  { label: '🐍 Python FastAPI Backend' },
  { label: '🐘 Neon PostgreSQL + SQLAlchemy' },
  { label: '🌐 11 Indian Regional Languages Handouts' },
  { label: '💡 Interactive Hospital ROI Calculator' },
  { label: '🔒 RBAC + Tamper-Evident Audit Trail' },
  { label: '📄 ReportLab PDF Invoice & Rx Engine' },
  { label: '📱 PWA + Offline Service Workers' },
  { label: '🐳 Docker Containerized Deployment' },
  // Duplicate for seamless infinite loop
  { label: '🎙️ Ambient Hindi/Hinglish Voice Scribe' },
  { label: '⚡ Groq AI Clinical Engine (<1.5s latency)' },
  { label: '🛡️ Hybrid Deterministic + LLM Auditor' },
  { label: '⚖️ NHA CGHS Price Benchmark Intelligence' },
  { label: '🧑‍⚕️ 4 Specialized Role Desks (Doctor/Recep/Acct/Admin)' },
  { label: '🐍 Python FastAPI Backend' },
  { label: '🐘 Neon PostgreSQL + SQLAlchemy' },
  { label: '🌐 11 Indian Regional Languages Handouts' },
  { label: '💡 Interactive Hospital ROI Calculator' },
  { label: '🔒 RBAC + Tamper-Evident Audit Trail' },
  { label: '📄 ReportLab PDF Invoice & Rx Engine' },
  { label: '📱 PWA + Offline Service Workers' },
  { label: '🐳 Docker Containerized Deployment' }
];

export default function LandingPage({ onEnterWorkspace, onPatientAuthSuccess, API_BASE, showToast }) {
  const [activeSimTab, setActiveSimTab] = useState('voice');
  const [activeLang, setActiveLang] = useState('hi');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(true);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [probCategory, setProbCategory] = useState('all');

  // OPD Self-Booking & Live Queue State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [liveQueue, setLiveQueue] = useState(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(`${API_BASE || '/api'}/queue/live`);
        if (res.ok) {
          const qData = await res.json();
          setLiveQueue(qData);
        }
      } catch (e) {
        // silent fallback
      }
    };
    fetchQueue();
    const qInterval = setInterval(fetchQueue, 20000);

    // Auto-open modals if arrived from Hospital QR code poster
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'book' || action === 'register') {
      setShowBookingModal(true);
    } else if (action === 'checkin' || action === 'patient') {
      setIsPatientModalOpen(true);
    }

    return () => clearInterval(qInterval);
  }, [API_BASE]);

  // Patient OTP Modal State
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientIdent, setPatientIdent] = useState('');
  const [patientOtp, setPatientOtp] = useState('');
  const [patientOtpStep, setPatientOtpStep] = useState('identifier'); // 'identifier' | 'otp'
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState('');

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!patientIdent.trim()) {
      setOtpError('Please enter your Mobile Number or Patient ID (UHID).');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE || '/api'}/patient-portal/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: patientIdent.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not send verification code');
      setOtpSentNotice(data.message || 'OTP sent to your registered email! Please check your inbox.');
      setPatientOtpStep('otp');
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!patientOtp.trim()) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE || '/api'}/patient-portal/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: patientIdent.trim(),
          otp: patientOtp.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid or expired OTP');
      setIsPatientModalOpen(false);
      if (onPatientAuthSuccess) {
        onPatientAuthSuccess(data);
      }
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDemoPatientLogin = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE || '/api'}/patient-portal/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'PAT-20260921-0001',
          otp: '123456'
        })
      });
      const data = await res.json();
      if (res.ok && onPatientAuthSuccess) {
        setIsPatientModalOpen(false);
        onPatientAuthSuccess(data);
        return;
      }
      // Fallback to username/password patient/pat123
      const formBody = new URLSearchParams();
      formBody.append('username', 'patient');
      formBody.append('password', 'pat123');
      const fallbackRes = await fetch(`${API_BASE || '/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });
      if (fallbackRes.ok) {
        const fallData = await fallbackRes.json();
        setIsPatientModalOpen(false);
        if (onPatientAuthSuccess) onPatientAuthSuccess(fallData);
      } else {
        throw new Error('Demo patient account not initialized yet.');
      }
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const typewriterWords = [
    'Hindi/Hinglish Ambient Voice Scribes',
    'Instant Clinical Rx & Dosing Generation',
    'NHA CGHS Pre-Invoice Tariff Audits',
    '11 Indian Language Patient Handouts',
    'Autonomous Hospital Revenue Intelligence'
  ];
  const typedWord = useTypewriter(typewriterWords, 65, 1700);

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
  const [probRef, probInView] = useInView(0.12);
  const [demoRef, demoInView] = useInView(0.15);
  const [techRef, techInView] = useInView(0.15);
  const [faqRef, faqInView] = useInView(0.15);
  const [ctaRef, ctaInView] = useInView(0.2);

  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const faqsList = [
    {
      category: "Voice AI & Reception",
      question: "How does the Guided One-Go Voice Intake work for hospital receptionists?",
      answer: "Receptionists click 'Guided Voice Intake' once. The microphone streams continuously without interruption as they speak each field: 1. Patient Name ➔ 2. Age & Gender ➔ 3. Mobile Number ➔ 4. Residential Address ➔ 5. Reason for Visit. Pressing [Enter ↵] on the keyboard seamlessly advances focus to the next field in real time without stopping the mic or dropping audio. It automatically formats 10-digit mobile numbers and intelligently resolves phonetics (such as recognizing 'Male' vs 'Mail').",
      highlight: "Zero mouse interaction needed during patient registration — complete registration in under 15 seconds."
    },
    {
      category: "Clinical Triage",
      question: "What is AI OPD Triage & Doctor Allotment Guidance?",
      answer: "As chief complaints or symptoms are entered in English, Hindi, or Hinglish (e.g., 'saas lene m dikkat', 'chhati me tez dard', 'pet me severe ulti', 'fracture chot'), HospiSynAI's clinical NLP engine evaluates urgency. Critical respiratory distress or cardiac symptoms are immediately elevated to High Priority (Pulmonology / Cardiology / Emergency OPD) with pre-consultation vitals flags (SpO2, ECG, BP), while routine complaints are allocated standard OPD slots.",
      highlight: "Trained on real-world Indian OPD vernacular to catch high-risk emergencies before clinical consultation."
    },
    {
      category: "Revenue Protection",
      question: "How does HospiSynAI prevent hospital billing leakages and unbilled services?",
      answer: "HospiSynAI runs an autonomous dual-verification audit pipeline before invoices are finalized. It cross-references doctor prescriptions, ordered diagnostic tests, nursing interventions, and bed occupancies against registered patient payments and deposits. Any unbilled medicines, missing advance adjustments, or tariff discrepancies are instantly highlighted with auto-fix recommendations.",
      highlight: "Stops 12-18% revenue leakage typical in manual billing and discharge workflows."
    },
    {
      category: "Doctor Scribe",
      question: "How does the Doctor Console Speech-to-Text Clinical Scribe work?",
      answer: "Doctors can click the microphone icon in any clinical note section—Chief Complaints, Diagnosis, Prescribed Medicines, Recommended Tests, or Lifestyle Advice. HospiSynAI transcribes clinical speech in real time with zero latency, eliminates repetitive dictation echoes, automatically suggests dosages and schedules from a 50+ formulary datastore, and maps ICD-10 diagnostic codes.",
      highlight: "Saves doctors up to 2.5 hours per shift on clinical data entry and documentation."
    },
    {
      category: "Multilingual Care",
      question: "In which languages can HospiSynAI generate patient consultation handouts?",
      answer: "HospiSynAI supports 1-click bilingual patient discharge handouts across 11 Indian languages: Hindi (हिंदी), Bengali (বাংলা), Marathi (मराठी), Telugu (తెలుగు), Tamil (தமிழ்), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), Odia (ଓଡ଼ିଆ), and Urdu (اردو). Prescriptions and lifestyle advice are translated into clear, conversational instructions that patients and families can easily follow at home.",
      highlight: "Improves patient medication adherence and reduces post-discharge readmissions."
    },
    {
      category: "Deployment & PWA",
      question: "Can HospiSynAI be installed as an offline-ready Progressive Web App (PWA)?",
      answer: "Yes. HospiSynAI is fully PWA-certified with Service Worker caching and Web App Manifests. Hospital staff can install it directly onto Windows workstations, macOS, iPads, and Android tablets for full-screen, app-like performance with sub-second page loads and offline resilience.",
      highlight: "Installable on any hospital desktop or tablet in 2 clicks with zero driver installations."
    },
    {
      category: "Security & Privacy",
      question: "Is patient data safe, secure, and compliant with health data standards?",
      answer: "HospiSynAI strictly adheres to DISHA and healthcare data security protocols. The system features role-based access control (Admin, Doctor, Receptionist, Auditor), cryptographic audit trails for all invoice modifications, and localized processing ensuring sensitive medical records are protected from unauthorized access or external data harvesting.",
      highlight: "Full role isolation and immutable audit logs ensure complete clinical and financial compliance."
    }
  ];

  const problemSolutions = [
    {
      id: 'opd-queue',
      category: 'opd',
      pillar: '1. OPD Flow & Token Management',
      tag: 'OPD Friction',
      icon: Ticket,
      problemTitle: 'Manual Registers, Token Collisions & Chaotic Waiting Rooms',
      problemPoints: [
        'Patients stand in long chaotic lines; manual slip registers get misplaced or bypassed, sparking angry arguments at reception.',
        'Walk-in emergency cases collide with pre-booked appointments with zero systematic queue coordination.',
        'Patients constantly crowd doctor consulting room doors because neither patient nor staff has visibility into live wait times.'
      ],
      problemMetric: '45–60 Mins',
      problemMetricLabel: 'Avg. Anxiety & Wait Time',
      solutionTitle: 'Sequential Conflict-Free Tokens + Live Gate QR Check-in',
      solutionPoints: [
        'Deterministic sequential token generator (Token #1, #2, #3...) ensures zero collisions between online bookings and walk-ins.',
        'Contactless Hospital Gate QR Code: Arriving patients scan the poster with any smartphone to confirm arrival, switching status to "Arrived" in OPD.',
        'Live OPD Queue Tracker broadcasts real-time token counts, active doctor room status, and estimated wait minutes to waiting screens and mobile phones.'
      ],
      solutionMetric: '12 Mins',
      solutionMetricLabel: 'Smooth Streamlined Flow',
      simulatorTab: null,
      simulatorLabel: 'Book Appointment & Live Check-in'
    },
    {
      id: 'voice-burnout',
      category: 'clinical',
      pillar: '2. Doctor Desk & Clinical Notes',
      tag: 'Documentation Burnout',
      icon: Mic,
      problemTitle: 'Doctor Typing Fatigue & Vernacular Language Barrier',
      problemPoints: [
        'Patients describe complex symptoms in colloquial Hindi/Hinglish ("2 din se tez bukhar hai aur badan tootta hai"), but EHR software demands English typing.',
        'Doctors spend 40%+ of patient consultation time staring at a keyboard rather than examining the patient.',
        'Rushed typing leads to truncated medical records, missing drug interactions, and severe clinician burnout.'
      ],
      problemMetric: '6+ Minutes',
      problemMetricLabel: 'Per Patient EHR Typing',
      solutionTitle: 'Ambient Voice Scribe (मरीज़ की आवाज़) + Instant Clinical AI',
      solutionPoints: [
        'Ambient Audio Intake: Doctor/patient speaks naturally in Hindi, Hinglish, or English while visualizer captures live voice.',
        'Groq Ultra-Low Latency Clinical AI converts spoken vernacular into standard medical English diagnoses, differential assessments, and lab tests in <800ms.',
        'Automated OPD Prescription: Generates precise BD/OD/TID schedules, food instructions, and pediatric/geriatric safety warnings with zero doctor typing.'
      ],
      solutionMetric: '45 Seconds',
      solutionMetricLabel: 'Zero-Typing Rx Generation',
      simulatorTab: 'voice',
      simulatorLabel: 'Try Ambient Voice Simulator'
    },
    {
      id: 'billing-auditor',
      category: 'billing',
      pillar: '3. Billing Integrity & Compliance',
      tag: 'Revenue Leakage',
      icon: ShieldAlert,
      problemTitle: 'Duplicate Tests, Dangerous Mismatches & Missing GST',
      problemPoints: [
        'Redundant bill items (e.g. charging both ICU Bed and General AC Room, or duplicate Complete Blood Counts) slip past cashiers.',
        'Clinical incompatibilities: Adult 625mg tablets billed to toddlers without pediatric suspension adjustments, creating safety hazards.',
        'GST Non-Compliance: Missing statutory 5% GST on luxury room rent (>₹5,000/day), missing 18% GST on elective cosmetic procedures, and wide divergence from CGHS/NHA tariff rates.'
      ],
      problemMetric: '15–20%',
      problemMetricLabel: 'Hospital Revenue Leakage & Audit Risk',
      solutionTitle: 'Pre-Invoice AI Auditor + 1-Click Auto-Corrections',
      solutionPoints: [
        'Hybrid Rule Engine + LLM pre-scans every draft bill before invoice generation against clinical and statutory tax criteria.',
        '1-Click Auto-Resolve: Eliminates duplicate room charges, swaps adult tablets to pediatric suspensions, and automatically attaches statutory 5% & 18% GST items.',
        'NHA & CGHS Live Price Benchmark Intelligence: Flags overpriced or undercharged procedures against government benchmarks in real time.'
      ],
      solutionMetric: '100% Audited',
      solutionMetricLabel: 'Zero GST Leaks & Full Safety',
      simulatorTab: 'auditor',
      simulatorLabel: 'Test Pre-Invoice AI Auditor'
    },
    {
      id: 'patient-adherence',
      category: 'patient',
      pillar: '4. Patient Discharge & Adherence',
      tag: 'Communication Gap',
      icon: Languages,
      problemTitle: 'Illegible Handwriting, Latin Jargon & Missed Doses',
      problemPoints: [
        'Patients cannot decipher handwritten prescriptions or cryptic Latin codes like "TID PC 5D", leading to dangerous medication errors.',
        'Non-English speaking patients receive English-only discharge slips they cannot understand or follow at home.',
        'Zero post-consultation reminder system: Patients forget dosage timings, stop antibiotic courses halfway, and suffer preventable relapse.'
      ],
      problemMetric: '52%',
      problemMetricLabel: 'Patient Non-Adherence Rate',
      solutionTitle: '11 Regional Language Handouts + Google/Apple Calendar Alarms',
      solutionPoints: [
        'Instant Vernacular Translation: Auto-translates prescriptions into 11 Indian native languages (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, etc.) with Morning/Afternoon/Night timeline summaries.',
        '1-Click Calendar Sync: Generates Google Calendar reminder links and downloadable .ics calendar files that set daily alarm schedules on patient smartphones.',
        'Self-Service Patient Portal: Patients access digitized bilingual A5 PDF receipts, clinical notes, and digital health cards via phone number or UHID without visiting reception.'
      ],
      solutionMetric: '94%',
      solutionMetricLabel: 'Observed Medication Adherence',
      simulatorTab: 'vernacular',
      simulatorLabel: 'View 11-Language Translator'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 relative overflow-x-clip font-sans selection:bg-teal-500 selection:text-white">

      {/* --- Animated Ambient Background Glows --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Layered luminous mesh orbs */}
        <div className="absolute w-[800px] h-[800px] rounded-full orb-float-1 opacity-70" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.14) 0%, rgba(13,148,136,0.03) 45%, transparent 70%)', top: '-22%', left: '-10%' }} />
        <div className="absolute w-[700px] h-[700px] rounded-full orb-float-2 opacity-60" style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.10) 0%, rgba(99,102,241,0.03) 45%, transparent 70%)', top: '10%', right: '-12%' }} />
        <div className="absolute w-[550px] h-[550px] rounded-full orb-float-3 opacity-60" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.10) 0%, transparent 65%)', top: '42%', left: '15%' }} />
        
        {/* Animated ECG Heartbeat Line running across hero background */}
        <svg className="absolute top-28 left-0 w-full h-40 opacity-40 pointer-events-none" viewBox="0 0 1200 120" fill="none" preserveAspectRatio="none">
          <path
            d="M0,60 L280,60 L300,60 L315,18 L330,105 L345,12 L360,88 L375,60 L400,60 L680,60 L700,60 L715,15 L730,110 L745,10 L760,90 L775,60 L800,60 L1200,60"
            stroke="url(#ecgGlowGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ecg-line-animated"
          />
          <defs>
            <linearGradient id="ecgGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0" />
              <stop offset="25%" stopColor="#0d9488" stopOpacity="0.7" />
              <stop offset="65%" stopColor="#059669" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Subtle high-tech radial grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(13,148,136,0.08) 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }} />
      </div>

      {/* --- Permanent Top Navigation Header (PRESERVED DARK BACKGROUND AS REQUESTED) --- */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl border-b border-white/10 bg-[#040814]/85 shadow-2xl px-6 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25 relative z-10" style={{ background: 'linear-gradient(135deg, #14b8a6, #10b981)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-teal-500/30 blur-sm animate-pulse-teal" />
          </div>
          <div>
            <span className="text-white font-black text-xl tracking-tight">HospiSyn<span className="gradient-text-teal">AI</span></span>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">OPD Voice & Billing OS</span>
            </div>
          </div>
        </div>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1 text-xs font-semibold text-slate-300">
            <a href="#problem-solution" className="px-3.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-teal-300 transition-colors">
              Problem & Solution
            </a>
            <a href="#features" className="px-3.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-teal-300 transition-colors">
              Key Capabilities
            </a>
            <a href="#demo" className="px-3.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-teal-300 transition-colors">
              Interactive Demo
            </a>
            <a href="#tech" className="px-3.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-teal-300 transition-colors">
              Tech Architecture
            </a>
            <a href="#faqs" className="px-3.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-teal-300 transition-colors">
              FAQs
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {showInstallBtn && (
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={onEnterWorkspace}
            className="relative px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 group overflow-hidden transition-all active:scale-[0.97] shadow-lg shadow-teal-900/40 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
          >
            <span className="relative z-10 hidden sm:inline">Launch Console</span>
            <span className="relative z-10 sm:hidden">Launch</span>
            <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </header>

      <main className="relative z-10">

        {/* =========================================================================
            HERO SECTION (LIGHT THEME)
        ========================================================================= */}
        <section ref={heroRef} className="max-w-7xl mx-auto px-6 pt-6 lg:pt-10 pb-14 flex flex-col lg:flex-row items-center gap-10 lg:gap-10">

          {/* Hero Left: Pitch */}
          <div className="flex-1 text-center lg:text-left">

            {/* Showstopping Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black tracking-tight text-slate-900 leading-[1.08] mb-4"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s'
              }}
            >
              Ambient Voice AI & <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm">
                Clinical Intelligence
              </span> <br />
              Operating System
            </h1>

            {/* Dynamic Auto-Execution Tag */}
            <div
              className="inline-flex items-center gap-2.5 bg-white border border-teal-200/80 px-4 py-2 rounded-xl mb-5 shadow-sm mx-auto lg:mx-0 flex"
              style={{
                width: 'fit-content',
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(15px)',
                transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s'
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Autonomous Engine:</span>
              <span className="text-xs font-black text-teal-700 font-mono tracking-wide typewriter-cursor min-w-[220px] text-left">
                {typedWord}
              </span>
            </div>

            {/* Subtitle */}
            <p
              className="text-slate-600 text-base md:text-lg max-w-xl leading-relaxed mb-7 mx-auto lg:mx-0 font-normal"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s'
              }}
            >
              Doctors speak colloquially in <strong className="text-slate-900 font-bold">Hindi or Hinglish</strong> — HospiSynAI autonomously transcribes clinical notes, creates structured prescription plans, audits pre-invoice compliance against <strong className="text-teal-700 font-semibold">NHA CGHS benchmarks</strong>, and issues vernacular patient checklists in <strong className="text-emerald-700 font-semibold">11 native languages</strong>.
            </p>

            {/* Live OPD Queue Status Banner */}
            {liveQueue && (
              <div
                className="inline-flex flex-wrap items-center gap-2.5 px-4 py-2 rounded-2xl bg-teal-50/90 border border-teal-200 text-xs font-semibold text-teal-900 mb-5 shadow-sm mx-auto lg:mx-0"
                style={{
                  opacity: heroInView ? 1 : 0,
                  transform: heroInView ? 'translateY(0)' : 'translateY(15px)',
                  transition: 'opacity 0.7s ease 0.22s, transform 0.7s ease 0.22s'
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="text-slate-900 font-bold">Live OPD Queue:</span>
                <span className="bg-teal-700 text-white px-2 py-0.5 rounded-md font-mono font-bold">
                  Serving #{liveQueue.currently_serving_token || '1'}
                </span>
                <span className="text-teal-400">•</span>
                <span>{liveQueue.total_waiting} in Waiting Area</span>
                <span className="text-teal-400">•</span>
                <span className="text-slate-600">Avg Wait: ~{liveQueue.estimated_wait_minutes} mins</span>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  className="ml-1 text-teal-700 hover:text-teal-900 underline font-bold text-[11px] cursor-pointer"
                >
                  Join Queue ➔
                </button>
              </div>
            )}

            {/* Primary Action Group */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 justify-center lg:justify-start mb-6"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s'
              }}
            >
              <button
                onClick={() => setShowBookingModal(true)}
                className="group relative px-7 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] overflow-hidden shadow-xl shadow-teal-500/25 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
                }}
              >
                <Ticket className="w-4 h-4 text-white" />
                <span className="relative z-10">Book OPD Token</span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1.5" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>

              <button
                onClick={onEnterWorkspace}
                className="group relative px-7 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-800 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] overflow-hidden border border-slate-200 bg-white hover:bg-slate-50 shadow-md cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>Launch Hospital Console</span>
                </span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1.5 text-teal-600" />
              </button>

              <a
                href="#demo"
                className="px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-teal-700 hover:text-teal-900 border border-teal-200 hover:border-teal-300 bg-teal-50/80 hover:bg-teal-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
              >
                <Mic className="w-4 h-4 text-teal-600 animate-pulse" />
                <span>Voice Scribe Demo</span>
              </a>
            </div>

            {/* Direct Role Desks Strip */}
            <div
              className="pt-1 flex items-center gap-2 flex-wrap justify-center lg:justify-start"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(15px)',
                transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s'
              }}
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Direct Desks:</span>
              {[
                { role: 'Doctor OPD', icon: '🧑‍⚕️', color: 'hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/60' },
                { role: 'Receptionist', icon: '📋', color: 'hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/60' },
                { role: 'Accountant', icon: '🧾', color: 'hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50/60' },
                { role: 'Administrator', icon: '🛡️', color: 'hover:border-violet-500 hover:text-violet-700 hover:bg-violet-50/60' },
              ].map((r, i) => (
                <button
                  key={i}
                  onClick={() => onEnterWorkspace && onEnterWorkspace(r.role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 shadow-sm transition-all duration-200 flex items-center gap-1.5 ${r.color} hover:scale-105 active:scale-95`}
                >
                  <span>{r.icon}</span>
                  <span>{r.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hero Right: The Living Clinical AI Terminal (LIGHT THEME MOCKUP) */}
          <div
            className="flex-1 flex justify-center lg:justify-end w-full relative"
            style={{
              opacity: heroInView ? 1 : 0,
              transform: heroInView ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s'
            }}
          >
            <div className="relative w-full max-w-lg float-card">
              {/* Ambient Radial Glow */}
              <div className="absolute -inset-4 rounded-3xl blur-3xl opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.22), rgba(99,102,241,0.12), transparent 70%)' }} />

              {/* Floating Badges */}
              <div className="absolute -top-3.5 -left-3.5 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/95 border border-rose-200 backdrop-blur-xl shadow-xl float-badge-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[11px] font-extrabold text-slate-800">Live Hindi Scribe</span>
              </div>

              <div className="absolute -top-4 -right-2 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/95 border border-emerald-200 backdrop-blur-xl shadow-xl float-badge-2">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-black text-emerald-700 font-mono">0.76s Groq OSS-120B</span>
              </div>

              <div className="absolute -bottom-3.5 -left-3 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/95 border border-amber-200 backdrop-blur-xl shadow-xl float-badge-2">
                <Scale className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-extrabold text-amber-800">₹450 NHA CGHS Verified</span>
              </div>

              <div className="absolute -bottom-3.5 -right-2 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 border border-violet-200 backdrop-blur-xl shadow-xl float-badge-1">
                <Languages className="w-3.5 h-3.5 text-violet-600" />
                <span className="text-[11px] font-extrabold text-violet-800">11 Native Languages</span>
              </div>

              {/* Glass Mockup Window */}
              <div className="relative rounded-3xl border border-slate-200 overflow-hidden shadow-2xl bg-white/95 backdrop-blur-2xl">
                {/* Top Window Bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/90">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-slate-800 font-black text-xs">HospiSyn<span className="text-teal-600">AI</span> Clinical Desk</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-700 font-bold font-mono">OPD ACTIVE</span>
                  </div>
                </div>

                <div className="p-5 space-y-3.5">
                  {/* Live Ambient Speech Capture */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-teal-100 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                          <Mic className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-900">मरीज़ की आवाज़ (Ambient Speech Stream)</span>
                      </div>
                      {/* Dancing Audio Bars */}
                      <div className="flex items-end gap-1 h-5 px-2 bg-white rounded-lg border border-teal-200/80">
                        {[10, 18, 8, 22, 14, 20, 12, 24, 16, 8, 19, 11].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-full audio-bar-anim"
                            style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 italic font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                      "डॉक्टर साहब, 4 दिन से बहुत तेज़ बुखार (102°F) है, सूखी खांसी है और छाती में जकड़न है..."
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-medium">
                      <span>🇮🇳 Hindi/Hinglish Detected</span>
                      <span className="text-teal-700 font-bold">Confidence: 99.4%</span>
                    </div>
                  </div>

                  {/* AI Diagnosis & Prescription */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-teal-600" />
                        <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">AI Clinical Prescription</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        Groq OSS-120B
                      </span>
                    </div>

                    {/* Diagnosis */}
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[9px] font-extrabold text-teal-700 uppercase tracking-wider block">Working Diagnosis</span>
                        <span className="text-xs font-bold text-slate-900">Acute Bronchitis with High Pyrexia (102.4°F)</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">ICD-10 J20.9</span>
                    </div>

                    {/* Meds List */}
                    <div className="space-y-1.5">
                      {[
                        { name: 'Tab Paracetamol 650mg', dose: 'BD · Post Meals · 5 Days', tag: 'Antipyretic', color: 'bg-teal-500' },
                        { name: 'Tab Amoxicillin-Clav 625mg', dose: 'TID · 5 Days · Dosing Safe', tag: 'Antibiotic', color: 'bg-violet-500' },
                        { name: 'Levosalbutamol Inhaler', dose: 'PRN · SOS for Bronchial Relief', tag: 'Inhaler', color: 'bg-emerald-500' }
                      ].map((med, i) => (
                        <div key={i} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-1.5 border border-slate-200 text-xs shadow-sm">
                          <div className={`w-2 h-2 rounded-full ${med.color}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-900 font-bold text-[11px] mr-1.5">{med.name}</span>
                            <span className="text-[10px] text-slate-500">{med.dose}</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{med.tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pre-Invoice Compliance Check */}
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-[11px] text-emerald-900 font-extrabold leading-tight">
                          Pre-Invoice Audit Cleared: 0 Collisions
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          ₹450 NHA Standard Consultation Rate Verified
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Metric Counters Strip (LIGHT THEME) --- */}
        <section className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard num={0.76} suffix="s" title="Avg AI Latency" desc="Groq OSS-120B Clinical Engine" delay={0} />
            <StatCard num="100" suffix="%" title="Pre-Invoice Audit" desc="Zero duplicate charges or GST leaks" delay={100} />
            <StatCard num={11} suffix="+" title="Native Languages" desc="Real-time translated patient handouts" delay={200} />
            <StatCard num={76} suffix="%" title="OPD Time Saved" desc="Intake from 6 mins down to 1.5 mins" delay={300} />
          </div>
        </section>


        {/* =========================================================================
            TRUST STRIP / INFINITE TICKER (LIGHT THEME)
        ========================================================================= */}
        <div className="relative overflow-hidden py-4 border-y border-slate-200 bg-white/70 backdrop-blur-md my-6">
          <div className="absolute left-0 top-0 w-32 h-full z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #f8fafc, transparent)' }} />
          <div className="absolute right-0 top-0 w-32 h-full z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #f8fafc, transparent)' }} />
          <div className="flex trust-ticker">
            {trustItems.map((item, i) => (
              <div
                key={i}
                className={`flex-shrink-0 flex items-center gap-2 mx-4 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${item.highlight
                  ? 'border-amber-300 bg-amber-50 text-amber-900 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 shadow-sm'
                  }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        
        {/* =========================================================================
            PROBLEM VS SOLUTION SECTION (LIGHT THEME)
        ========================================================================= */}
        <section id="problem-solution" ref={probRef} className="max-w-7xl mx-auto px-6 py-16 scroll-mt-28 relative">
          {/* Ambient Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[130px] pointer-events-none opacity-20 -z-10"
            style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.18) 0%, rgba(20,184,166,0.2) 60%, transparent 100%)' }}
          />

          <div
            className="text-center mb-12"
            style={{
              opacity: probInView ? 1 : 0,
              transform: probInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease'
            }}
          >
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 mb-3 shadow-sm">
              <Scale className="w-3.5 h-3.5 text-rose-600" />
              Problem vs Solution • असल समस्या और समाधान
            </div>
            <h2 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
              Problem Kya Thi — <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">Aur Humne Kaise Solve Ki?</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
              पारंपरिक अस्पतालों में घंटों का इंतज़ार, डॉक्टरों का कंप्यूटर पर टाइपिंग बर्नआउट, बिना ऑडिट के बिलिंग लीकेज और दवाओं की गलत खुराक आम बात थी। देखिए <span className="text-teal-700 font-semibold">HospiSynAI</span> ने इन चारों जटिल समस्याओं को कैसे जड़ से खत्म किया।
            </p>

            {/* Quick Category Filters */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {[
                { id: 'all', label: 'All 4 Pillars • सभी 4 स्तंभ' },
                { id: 'opd', label: '1. OPD Queue & Gate' },
                { id: 'clinical', label: '2. Doctor Desk & Voice' },
                { id: 'billing', label: '3. Pre-Invoice & GST' },
                { id: 'patient', label: '4. Patient & Handouts' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setProbCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${probCategory === cat.id
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20 scale-[1.03]'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-sm'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="space-y-8">
            {problemSolutions
              .filter(item => probCategory === 'all' || item.category === probCategory)
              .map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className="relative rounded-3xl border border-slate-200 bg-white backdrop-blur-xl overflow-hidden shadow-xl transition-all duration-300 hover:border-teal-400/50 hover:shadow-2xl"
                    style={{
                      opacity: probInView ? 1 : 0,
                      transform: probInView ? 'translateY(0)' : 'translateY(40px)',
                      transition: `opacity 0.6s ease ${idx * 0.1}s, transform 0.6s ease ${idx * 0.1}s`
                    }}
                  >
                    {/* Top Header Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-200 bg-slate-50/80">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-extrabold text-slate-900 tracking-wide">
                          {item.pillar}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
                        {item.tag}
                      </span>
                    </div>

                    {/* Side-by-Side Comparison Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                      {/* Left Side: The Problem */}
                      <div className="p-6 md:p-8 bg-gradient-to-br from-rose-50/60 via-slate-50/20 to-white flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100/70 border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              Problem Kya Thi • The Friction Point
                            </span>
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 leading-snug">
                            {item.problemTitle}
                          </h3>
                          <ul className="space-y-3 mb-6">
                            {item.problemPoints.map((point, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-600 leading-relaxed">
                                <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Metric Callout */}
                        <div className="pt-4 border-t border-rose-200 flex items-center justify-between bg-rose-50 px-4 py-3 rounded-2xl border border-rose-200">
                          <span className="text-xs text-rose-800 font-medium">
                            {item.problemMetricLabel}
                          </span>
                          <span className="text-base md:text-lg font-black text-rose-600">
                            {item.problemMetric}
                          </span>
                        </div>
                      </div>

                      {/* Right Side: How We Solved It */}
                      <div className="p-6 md:p-8 bg-gradient-to-br from-teal-50/50 via-emerald-50/20 to-white flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100/80 border border-teal-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                              Humne Kaise Solve Ki • HospiSynAI Fix
                            </span>
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 leading-snug">
                            {item.solutionTitle}
                          </h3>
                          <ul className="space-y-3 mb-6">
                            {item.solutionPoints.map((point, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-700 leading-relaxed">
                                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Metric & Interactive Link */}
                        <div className="pt-4 border-t border-teal-200 flex flex-wrap items-center justify-between gap-3 bg-teal-50/80 px-4 py-3 rounded-2xl border border-teal-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-teal-900 font-medium">
                              {item.solutionMetricLabel}:
                            </span>
                            <span className="text-base md:text-lg font-black text-teal-700">
                              {item.solutionMetric}
                            </span>
                          </div>

                          {item.simulatorTab ? (
                            <button
                              onClick={() => {
                                setActiveSimTab(item.simulatorTab);
                                if (demoRef?.current) {
                                  demoRef.current.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
                            >
                              <span>{item.simulatorLabel}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowBookingModal(true)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
                            >
                              <span>{item.simulatorLabel}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>


        {/* =========================================================================
            INTERACTIVE SIMULATOR SECTION (LIGHT THEME)
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
            <div className="inline-flex items-center gap-2 text-xs text-teal-700 font-bold uppercase tracking-wider bg-teal-50 px-4 py-1.5 rounded-full border border-teal-200 mb-3 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              Live Interactive Simulator
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3">Test HospiSynAI Workflows In Real Time</h2>
            <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
              Click the simulator tabs to see how clinical intelligence, pre-invoice compliance audits, and vernacular translation handouts operate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Tab Selectors */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {[
                { id: 'voice', label: 'Ambient Voice Scribe (मरीज़ की आवाज़)', desc: 'Translates natural colloquial Hindi/Hinglish speech into structured OPD plans.', icon: Mic, color: 'text-teal-700 bg-teal-100', accentColor: 'rgba(20,184,166,0.2)' },
                { id: 'clinical', label: 'AI Prescribing Assistant', desc: 'Auto-generates complete treatment plans with OD/BD/TID dosing & safety checks.', icon: Brain, color: 'text-emerald-700 bg-emerald-100', accentColor: 'rgba(52,211,153,0.2)' },
                { id: 'auditor', label: 'Pre-Invoice AI Auditor', desc: 'Scans bills to catch duplicate diagnostics, GST errors, and location clashes.', icon: ShieldAlert, color: 'text-rose-700 bg-rose-100', accentColor: 'rgba(251,113,133,0.2)' },
                { id: 'vernacular', label: 'Multilingual Summary Handout', desc: 'Translates prescription checklists to 11 Indian native languages instantly.', icon: Languages, color: 'text-violet-700 bg-violet-100', accentColor: 'rgba(167,139,250,0.2)' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeSimTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSimTab(tab.id)}
                    className={`group p-5 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden flex gap-4 ${isSelected
                      ? 'bg-white border-teal-500 shadow-xl ring-1 ring-teal-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-sm'
                      }`}
                  >
                    {isSelected && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-500 to-emerald-500" />}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tab.color} transition-transform duration-300 ${isSelected ? 'scale-110 shadow-sm' : 'group-hover:scale-105'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 mb-1 uppercase tracking-wider">{tab.label}</div>
                      <div className="text-[11px] text-slate-500 leading-normal">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Screen Panel */}
            <div className="lg:col-span-8 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[420px] bg-white border border-slate-200 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6 text-xs relative z-10">
                <div className="flex items-center gap-2 text-slate-600 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SIMULATOR CONSOLE
                </div>
                <div className="text-[10px] text-teal-700 font-bold bg-teal-50 px-3 py-1 rounded-full border border-teal-200 font-mono uppercase tracking-wider">
                  ⚡ Live Output Simulation
                </div>
              </div>

              <div className="flex-1 relative z-10">
                {activeSimTab === 'voice' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between bg-teal-50 border border-teal-200 px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-black text-rose-600">मरीज़ बोल रहे हैं... (Live Ambient Voice Intake)</span>
                      </div>
                      <div className="flex items-center gap-1 h-5 px-2 bg-white rounded-lg border border-slate-200">
                        {[12, 18, 8, 22, 14, 26, 19, 10, 24, 16, 8, 20].map((h, i) => (
                          <div key={i} className="w-1 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-full animate-pulse" style={{ height: `${h}px`, animationDelay: `${i * 70}ms` }} />
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-medium">
                      <span className="text-teal-700 font-bold block text-[10px] uppercase tracking-wider mb-1">Colloquial Spoken Hindi/Hinglish Input:</span>
                      <p className="text-slate-800 italic">"Mere ball bahut toot rahe Hain aur saath he mere ko dandruff bhee bahut jyaada hai. So what should I do?"</p>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 mt-2 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-black text-slate-900">Groq AI Extraction Result</span>
                        <span className="ml-auto text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">⚡ 0.76s Latency</span>
                      </div>
                      
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">Clinical Working Diagnosis</span>
                        <span className="text-xs font-bold text-slate-900">Telogen Effluvium with Seborrheic Dermatitis of Scalp</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <span className="text-[10px] font-extrabold text-teal-700 uppercase block tracking-wider mb-1.5">Prescribed Medicines</span>
                          <ul className="space-y-1.5 text-slate-700 font-medium text-[11px]">
                            <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />Scalpe+ (Ketoconazole 2% + ZPTO) – 2-3x/week</li>
                            <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />Tab Keraglo-Eva (Biotin 10mg + Zinc) – 1 Tab OD</li>
                          </ul>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <span className="text-[10px] font-extrabold text-teal-700 uppercase block tracking-wider mb-1.5">Indicated Lab Tests</span>
                          <ul className="space-y-1.5 text-slate-700 font-medium text-[11px]">
                            <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />Serum Ferritin & Iron Profile (TIBC)</li>
                            <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />Thyroid Profile (TSH, Free T4) + Vit D3</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSimTab === 'clinical' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Demographics:</span>
                      <span className="text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-bold border border-slate-200">Female, 45 Yrs (OPD)</span>
                    </div>
                    <div className="flex gap-2.5 items-center flex-wrap">
                      <span className="text-xs text-slate-600 font-semibold">Chief Complaints:</span>
                      <span className="text-xs text-teal-800 font-bold bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">High fever (102°F), dry cough, shortness of breath</span>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-teal-600 animate-pulse" />
                        <span className="text-xs font-black text-slate-900">AI Assistant Suggestions</span>
                        <span className="ml-auto text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-mono">⚡ 0.84s Latency</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-normal">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <span className="text-[10px] font-extrabold text-teal-700 uppercase block tracking-wider mb-2">Prescription & Dosing</span>
                          <ul className="space-y-1.5 text-slate-700 font-medium">
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />Paracetamol 650mg (BD - Post Meals)</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />Amoxicillin 500mg (TID - 5 Days)</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />Levosalbutamol Inhaler (PRN - SOS)</li>
                          </ul>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <span className="text-[10px] font-extrabold text-teal-700 uppercase block tracking-wider mb-2">Tests & Safety Advisories</span>
                          <ul className="space-y-1.5 text-slate-700 font-medium">
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />Complete Blood Count (CBC)</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />Chest X-Ray (PA View)</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />Dosing safety check: CLEARED</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSimTab === 'auditor' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-rose-900">AI Audit Result: Critical Anomaly Blocked</p>
                          <p className="text-[11px] text-rose-700 mt-0.5 font-medium">Invoice checkout halted to protect billing compliance & patient safety</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg font-mono font-bold uppercase shrink-0 border border-rose-200">⚠️ Blocked</span>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Deterministic & LLM Violations Detected:</p>
                      <ul className="space-y-3 text-xs">
                        {[
                          { n: '1', title: 'Duplicate Diagnostics', desc: 'CBC Hematology and Automated Blood Count were both added. Removed duplicate charge saving ₹450.' },
                          { n: '2', title: 'Location Clash', desc: 'Active ICU bed assignment logged, but an Outpatient (OPD) consultation fee was attached. Flagged incompatible billing tags.' }
                        ].map(v => (
                          <li key={v.n} className="flex items-start gap-3 bg-white border border-rose-200 rounded-xl p-3 shadow-sm">
                            <span className="text-rose-600 font-black font-mono text-[11px] mt-0.5">{v.n}.</span>
                            <span className="text-slate-700 font-medium"><strong className="text-rose-900">{v.title}:</strong> {v.desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeSimTab === 'vernacular' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Choose Handout Language:</span>
                      <div className="flex gap-2 flex-wrap">
                        {[{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिंदी (Hindi)' }, { id: 'ta', label: 'தமிழ் (Tamil)' }].map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => setActiveLang(lang.id)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeLang === lang.id ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'}`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-violet-50/60 border border-violet-200 rounded-2xl p-5 shadow-sm relative">
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                        <Languages className="w-4 h-4 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mb-3 tracking-wide">{translationData[activeLang].title}</h4>
                      <div className="space-y-2 text-xs text-slate-800 leading-relaxed font-semibold">
                        <p className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">{translationData[activeLang].med1}</p>
                        <p className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">{translationData[activeLang].med2}</p>
                        <p className="text-amber-900 mt-4 leading-normal bg-amber-50 border border-amber-200 p-3 rounded-xl">{translationData[activeLang].advice}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 mt-6 flex justify-between items-center text-xs relative z-10">
                <span className="text-slate-500 font-semibold">Interactive Sandbox Mode</span>
                <button onClick={onEnterWorkspace} className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1.5 group transition-colors">
                  Enter Live Hospital Desk
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            STANDOUT CAPABILITIES SECTION (3x3 Grid, LIGHT THEME)
        ========================================================================= */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs text-violet-700 font-bold uppercase tracking-wider bg-violet-50 px-4 py-1.5 rounded-full border border-violet-200 mb-3 shadow-sm">
              <Star className="w-3.5 h-3.5" />
              Comprehensive Capabilities
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3">Engineered for Reliability & Scale</h2>
            <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
              Connecting clinical ambient intake, pre-invoice compliance, government tariffs, and multi-role operations in a decoupled high-performance stack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Mic, title: "Ambient Voice Scribe (मरीज़ की आवाज़)", desc: "Translates colloquial Hindi/Hinglish speech into structured OPD plans with diagnoses, medicines, and tests in real time without doctor re-typing.", color: "text-teal-700 bg-teal-50", gradientFrom: 'rgba(20,184,166,0.5)' },
              { icon: Brain, title: "AI Prescribing & Safety Engine", desc: "Transforms patient symptoms into structured medication plans with precise OD/BD/TID dosing, pediatric safety caps, and non-overlapping classes.", color: "text-emerald-700 bg-emerald-50", gradientFrom: 'rgba(52,211,153,0.5)' },
              { icon: ShieldAlert, title: "Hybrid Pre-Invoice AI Auditor", desc: "Combines deterministic rule validation with LLM reasoning to catch 6 critical billing inconsistencies before invoice checkout.", color: "text-rose-700 bg-rose-50", gradientFrom: 'rgba(251,113,133,0.5)' },
              { icon: Languages, title: "11 Indian Language Handouts", desc: "Translates complex clinical notes into 11 Indian native languages with visual emoji daily-routine checklists for patient adherence.", color: "text-violet-700 bg-violet-50", gradientFrom: 'rgba(167,139,250,0.5)' },
              { icon: Users, title: "4 Role-Tailored Workspaces", desc: "Dedicated consoles for Doctor (Clinical Queue), Receptionist (Speed Registration & Advance Deposits), Accountant (Reconciliation), and Admin.", color: "text-blue-700 bg-blue-50", gradientFrom: 'rgba(96,165,250,0.5)' },
              { icon: Scale, title: "NHA & CGHS Price Benchmarks", desc: "Real-time tariff auditing against National Health Authority (NHA) & CGHS standards to detect overbilling, undercharging, and margin leakage.", color: "text-amber-700 bg-amber-50", gradientFrom: 'rgba(251,191,36,0.5)' },
              { icon: BarChart3, title: "AI Revenue & Audit Insights", desc: "Generates natural language summaries of outstanding ledger balances, digital vs cash splits, and actionable management alerts.", color: "text-cyan-700 bg-cyan-50", gradientFrom: 'rgba(34,211,238,0.5)' },
              { icon: FileText, title: "ReportLab PDF Receipts & Rx", desc: "Server-side dynamic PDF generation reproducing official diagnostic slips & prescriptions with Devanagari font support and custom branding.", color: "text-orange-700 bg-orange-50", gradientFrom: 'rgba(251,146,60,0.5)' },
              { icon: TrendingUp, title: "Hospital ROI & Savings Calculator", desc: "Interactive financial model simulating annual hospital cost recovery from eliminated billing leakage, reduced consultation delays, and automated audits.", color: "text-indigo-700 bg-indigo-50", gradientFrom: 'rgba(129,140,248,0.5)' }
            ].map((feat, i) => (
              <FeatureCard key={i} {...feat} delay={i * 70} />
            ))}
          </div>
        </section>

        {/* =========================================================================
            TECH ARCHITECTURE SECTION (LIGHT THEME)
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
              <div className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-bold uppercase tracking-wider bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200 shadow-sm">
                <Cpu className="w-3.5 h-3.5 animate-spin-slow text-teal-600" />
                Under the Hood
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">Production-Ready Decoupled Architecture</h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
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
                  <div key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-700 group">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span className="group-hover:text-slate-900 transition-colors">{item}</span>
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
                  icon: Layers, title: 'Client Stack', color: 'bg-teal-100 text-teal-700', items: [
                    { label: 'React (JSX + Hooks)', color: 'text-teal-800' },
                    { label: 'Tailwind CSS', color: 'text-teal-800' },
                    { label: 'Lucide + Recharts', color: 'text-slate-700' },
                    { label: 'PWA + Service Worker', color: 'text-slate-700' },
                  ]
                },
                {
                  icon: Terminal, title: 'Backend Core', color: 'bg-violet-100 text-violet-700', items: [
                    { label: 'Python FastAPI', color: 'text-violet-800' },
                    { label: 'Groq OSS-120B Clinical Engine', color: 'text-violet-800' },
                    { label: 'ReportLab PDF Engine', color: 'text-slate-700' },
                    { label: 'SQLAlchemy ORM', color: 'text-slate-700' },
                  ]
                },
                {
                  icon: Database, title: 'DevOps & Infra', color: 'bg-rose-100 text-rose-700', items: [
                    { label: 'Neon PostgreSQL', color: 'text-rose-800' },
                    { label: 'Docker + Compose', color: 'text-rose-800' },
                    { label: 'Vercel + Render', color: 'text-slate-700' },
                    { label: 'Fine-grained RBAC', color: 'text-slate-700' },
                  ]
                }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="p-6 rounded-3xl border border-slate-200 bg-white hover:border-teal-400 shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-3px] group">
                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mb-3 uppercase tracking-wide">{card.title}</h4>
                    <div className="space-y-1.5">
                      {card.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-2 text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
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
            FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION SECTION (LIGHT THEME)
        ========================================================================= */}
        <section id="faqs" ref={faqRef} className="max-w-5xl mx-auto px-6 py-16 relative z-10">
          {/* Ambient section header */}
          <div
            className="text-center mb-14"
            style={{
              opacity: faqInView ? 1 : 0,
              transform: faqInView ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease'
            }}
          >
            <div className="inline-flex items-center gap-2 text-xs text-teal-700 font-bold uppercase tracking-wider bg-teal-50 px-4 py-1.5 rounded-full border border-teal-200 mb-4 shadow-sm">
              <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Everything You Need to Know About <span className="gradient-text-teal">HospiSynAI</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed">
              Explore how our autonomous clinical dictation, guided voice intake, real-time AI triage, and pre-invoice audit engine transform modern hospital operations.
            </p>
          </div>

          {/* FAQ Accordion List */}
          <div
            className="space-y-3.5"
            style={{
              opacity: faqInView ? 1 : 0,
              transform: faqInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s'
            }}
          >
            {faqsList.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'bg-white border-teal-500/60 shadow-lg shadow-teal-500/10'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                        isOpen ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 md:px-6 pb-6 pt-1 border-t border-slate-100 text-xs md:text-sm text-slate-600 leading-relaxed font-normal animate-in slide-in-from-top-2 duration-200">
                      <p className="text-slate-600 font-medium">
                        {faq.answer}
                      </p>
                      {faq.highlight && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold text-teal-800">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{faq.highlight}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Support / Contact Callout Banner */}
          <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-white to-emerald-50 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Have more questions or need custom hospital integration?</h4>
                <p className="text-xs text-slate-600 font-medium">Our clinical engineering team provides tailored deployment support for NABH & Ayushman Bharat hospitals.</p>
              </div>
            </div>
            <button
              onClick={onEnterWorkspace}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              Test Live Console →
            </button>
          </div>
        </section>

        {/* =========================================================================
            FULL-BLEED SHOWSTOPPER CTA SECTION
        ========================================================================= */}
        <section ref={ctaRef} className="relative overflow-hidden py-16 px-6 my-10 max-w-7xl mx-auto rounded-3xl shadow-2xl">
          {/* Deep emerald & teal luxury backdrop */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #042f2e 0%, #064e3b 45%, #0f172a 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(20,184,166,0.3) 0%, transparent 65%), radial-gradient(ellipse at 70% 50%, rgba(52,211,153,0.2) 0%, transparent 65%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.5), transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.5), transparent)' }} />

          <div
            className="relative z-10 max-w-4xl mx-auto text-center"
            style={{
              opacity: ctaInView ? 1 : 0,
              transform: ctaInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.9s ease, transform 0.9s ease'
            }}
          >
            <div className="inline-flex items-center gap-2 text-xs text-teal-300 font-bold uppercase tracking-wider bg-teal-500/20 px-4 py-1.5 rounded-full border border-teal-400/30 mb-6">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Enterprise HealthTech Solution
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Ready to Experience the<br />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">Future of Hospital AI?</span>
            </h2>

            <p className="text-slate-200 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Launch the live console to test doctor consultations, billing audits, deposit synchronization, and multilingual PDF generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onEnterWorkspace}
                className="group relative px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-wider text-white flex items-center justify-center gap-3 transition-all active:scale-[0.97] overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
                  boxShadow: '0 0 40px rgba(20,184,166,0.4)'
                }}
              >
                <span className="relative z-10">Launch HospiSynAI Now</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-2" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>

              <a
                href="#demo"
                className="px-8 py-5 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-100 hover:text-white border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/15 backdrop-blur-md transition-all active:scale-[0.97] flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-teal-300" />
                View Interactive Demo
              </a>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              {['⚡ <1.5s Groq Latency', '🛡️ Hybrid Audit Engine', '🌐 11 Indian Languages', '🔒 Tamper-Evident Audit Logs', '🐳 Dockerized PWA'].map((badge, i) => (
                <span key={i} className="text-[11px] text-slate-200 font-bold bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* --- Footer (LIGHT THEME) --- */}
      <footer className="border-t border-slate-200 bg-white py-10 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-600 font-semibold">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-slate-900 font-bold text-sm">HospiSynAI Ecosystem</span>
          </div>
          <div className="text-center leading-relaxed">
            <p>Designed & Engineered with Enterprise-Grade SDE Best Practices.</p>
            <p className="text-slate-400 mt-0.5">Autonomous Clinical & Pre-Invoice Intelligence Platform</p>
          </div>
          <button
            onClick={onEnterWorkspace}
            className="px-5 py-2.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 transition-all font-bold uppercase tracking-wider active:scale-[0.97]"
          >
            Launch System →
          </button>
        </div>
      </footer>

      {/* --- Manual Installation Instructions Modal --- */}
      {showInstructionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-lg w-full relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowInstructionModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Install HospiSynAI PWA</h3>
                <p className="text-xs text-slate-500 font-medium">Add to your device home screen for standalone utility.</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: '🍎', title: 'iOS Safari (iPhone/iPad)', color: 'teal', steps: ['Tap the Share button at the bottom bar.', 'Scroll down and select "Add to Home Screen".', 'Tap Add in the top-right corner.'] },
                { icon: <Smartphone className="w-4 h-4" />, title: 'Android Chrome / Edge', color: 'violet', steps: ['Tap Menu (⋮) in the top-right corner.', 'Tap "Install app" or "Add to Home screen".'] },
                { icon: <Monitor className="w-4 h-4" />, title: 'Desktop Chrome / Edge / Opera', color: 'teal', steps: ['Click the Install Icon in the URL address bar.', 'Or open browser menu and choose "Install HospiSynAI".'] },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm text-teal-700 flex items-center justify-center flex-shrink-0 text-sm font-black border border-slate-200">
                    {typeof s.icon === 'string' ? s.icon : s.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">{s.title}</h4>
                    <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1 leading-relaxed font-medium">
                      {s.steps.map((step, j) => <li key={j}>{step}</li>)}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowInstructionModal(false)} className="w-full mt-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 transition-colors">
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PATIENT PORTAL QUICK-ACCESS & OTP VERIFICATION MODAL
      ========================================================================= */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-teal-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={() => { setIsPatientModalOpen(false); setPatientOtpStep('identifier'); setOtpError(''); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Patient Health Portal</h3>
                <p className="text-xs text-slate-500">Access Prescriptions, Invoices & OPD Pass</p>
              </div>
            </div>

            {otpError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {patientOtpStep === 'identifier' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mobile Number or UHID / Health ID
                  </label>
                  <input
                    type="text"
                    value={patientIdent}
                    onChange={(e) => setPatientIdent(e.target.value)}
                    placeholder="e.g. 9876543210 or PAT-20260921-0001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:bg-white"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the phone number or UHID given during hospital OPD registration.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 disabled:opacity-50"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{otpLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                </button>

                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleDemoPatientLogin}
                    disabled={otpLoading}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-teal-700 border border-teal-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Instant Demo Access (Nisha Patel)</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpSentNotice && (
                  <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{otpSentNotice}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={patientOtp}
                    onChange={(e) => setPatientOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-slate-50 border border-teal-400 rounded-xl px-4 py-3 text-center text-xl tracking-[6px] font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white"
                    required
                  />
                  <p className="text-[11px] text-teal-700 mt-1.5 flex items-center justify-between">
                    <span>📩 Enter the 6-digit OTP sent to your email.</span>
                    <span className="text-slate-500 font-mono text-[10px]">(Demo bypass: 123456)</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setPatientOtpStep('identifier'); setOtpError(''); }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 disabled:opacity-50"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{otpLoading ? 'Verifying...' : 'Access My Records'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- Patient Self-Booking & AI Triage Modal --- */}
      <AppointmentBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        API_BASE={API_BASE}
        showToast={showToast}
        onBookingSuccess={(appt) => {
          // Keep modal open or trigger refresh if needed
        }}
      />
    </div>
  );
}
