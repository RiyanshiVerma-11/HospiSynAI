import React from 'react';
import {
  Search,
  Trash2,
  PlusCircle,
  Calendar,
  Printer,
  Plus,
  UserCheck,
  FileText,
  Sparkles,
  Brain,
  Save,
  Loader2,
  Copy,
  Download,
  Globe,
  Languages,
  Receipt,
  Stethoscope,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  X,
  Mail,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
  ExternalLink
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { buildMasterGoogleCalendarUrl, buildFollowUpGoogleCalendarUrl, downloadClientIcsFile } from '../utils/calendarService';

const MEDICINE_DATASTORE = [
  // Paracetamol & Pain Relievers
  { name: 'Dolo 650mg (Paracetamol)', dosage: 'Once Daily (OD), After Meals for 3 Days' },
  { name: 'Crocin 500mg (Paracetamol)', dosage: 'Thrice Daily (TID), After Meals for 3 Days' },
  { name: 'Calpol 650mg (Paracetamol)', dosage: 'Thrice Daily (TID), After Meals for 3 Days' },
  { name: 'Combiflam (Ibuprofen + Paracetamol)', dosage: 'Twice Daily (BD), After Meals for 3 Days' },
  { name: 'Zerodol-P (Aceclofenac + Paracetamol)', dosage: 'Twice Daily (BD), After Meals for 3 Days' },
  { name: 'Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Ultracet (Tramadol + Paracetamol)', dosage: 'Twice Daily (BD), After Meals for 3 Days' },
  { name: 'Dynapar AQ Injection (Diclofenac)', dosage: 'Once Daily (OD), As Needed (SOS)' },
  { name: 'Meftal-Spas (Dicyclomine + Mefenamic Acid)', dosage: 'Thrice Daily (TID), As Needed (SOS) for Spasms' },
  
  // Antibiotics & Antivirals & Antifungals
  { name: 'Azee 500mg (Azithromycin)', dosage: 'Once Daily (OD), Empty Stomach for 3 Days' },
  { name: 'Augmentin 625mg (Amoxicillin + Clavulanate)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Taxim-O 200mg (Cefixime)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'O2 (Ofloxacin + Ornidazole)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Zifi 200mg (Cefixime)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Monocef 1g Injection (Ceftriaxone)', dosage: 'Once Daily (OD), IV/IM Route' },
  { name: 'Sporidex 500mg (Cephalexin)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Fluka 150mg (Fluconazole)', dosage: 'Once Weekly (OW), After Meals for 2 Weeks' },
  { name: 'Acyclovir 400mg', dosage: 'Five Times Daily, After Meals for 5 Days' },
  
  // Antacids, Gastroesophageal Reflux & Laxatives
  { name: 'Pan 40mg (Pantoprazole)', dosage: 'Once Daily (OD), Empty Stomach for 10 Days' },
  { name: 'Pantocid 40mg (Pantoprazole)', dosage: 'Once Daily (OD), Empty Stomach for 14 Days' },
  { name: 'Omez 20mg (Omeprazole)', dosage: 'Once Daily (OD), Empty Stomach for 7 Days' },
  { name: 'Rantac 150mg (Ranitidine)', dosage: 'Twice Daily (BD), Empty Stomach for 7 Days' },
  { name: 'Aciloc 150mg (Ranitidine)', dosage: 'Twice Daily (BD), Empty Stomach for 7 Days' },
  { name: 'Digene Gel Syrup', dosage: '10ml Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Gelusil MPS Liquid', dosage: '10ml Thrice Daily (TID), After Meals for 5 Days' },
  { name: 'Cremaffin Syrup (Liquid Paraffin + Milk of Magnesia)', dosage: '15ml At Bedtime (HS) for Constipation' },
  { name: 'Duphalac Oral Solution (Lactulose)', dosage: '15ml Once Daily (OD), At Bedtime (HS)' },
  
  // Cough, Cold, Allergy & Bronchodilators
  { name: 'Levocet 5mg (Levocetirizine)', dosage: 'Once Daily (OD), At Bedtime (HS) for 5 Days' },
  { name: 'Okacet 10mg (Cetirizine)', dosage: 'Once Daily (OD), At Bedtime (HS) for 5 Days' },
  { name: 'Montair LC (Montelukast + Levocetirizine)', dosage: 'Once Daily (OD), At Bedtime (HS) for 7 Days' },
  { name: 'Ascoril LS Syrup', dosage: '5ml Thrice Daily (TID), After Meals for 5 Days' },
  { name: 'Grilinctus Syrup', dosage: '5ml Thrice Daily (TID), After Meals for 5 Days' },
  { name: 'Solvin Cold (Paracetamol + Phenylephrine + Chlorpheniramine)', dosage: 'Thrice Daily (TID), After Meals for 3 Days' },
  { name: 'Avil 25mg (Pheniramine Maleate)', dosage: 'Twice Daily (BD), After Meals for 3 Days' },
  { name: 'Allegra 120mg (Fexofenadine)', dosage: 'Once Daily (OD), After Meals for 5 Days' },
  
  // Antidiabetic & Antihypertensive & Cholesterol
  { name: 'Glycomet 500mg (Metformin)', dosage: 'Twice Daily (BD), After Meals (Long-term)' },
  { name: 'Glycomet GP 1 (Glimepiride + Metformin)', dosage: 'Once Daily (OD), Before Breakfast (Long-term)' },
  { name: 'Amlong 5mg (Amlodipine)', dosage: 'Once Daily (OD), In Morning (Long-term)' },
  { name: 'Telma 40mg (Telmisartan)', dosage: 'Once Daily (OD), In Morning (Long-term)' },
  { name: 'Telma-H (Telmisartan + Hydrochlorothiazide)', dosage: 'Once Daily (OD), In Morning (Long-term)' },
  { name: 'Atorva 10mg (Atorvastatin)', dosage: 'Once Daily (OD), At Bedtime (HS) (Long-term)' },
  { name: 'Lipvas 10mg (Atorvastatin)', dosage: 'Once Daily (OD), At Bedtime (HS) (Long-term)' },
  { name: 'Thyronorm 50mcg (Thyroxine)', dosage: 'Once Daily (OD), Early Morning Empty Stomach (Long-term)' },
  
  // Diarrhea, Antiemetics & Probiotics
  { name: 'Lopamide 2mg (Loperamide)', dosage: 'Once Daily (OD), As Needed (SOS) after loose motion' },
  { name: 'Ondem 4mg (Ondansetron)', dosage: 'Thrice Daily (TID), Before Food as needed for vomiting' },
  { name: 'Domstal 10mg (Domperidone)', dosage: 'Thrice Daily (TID), Before Food for nausea' },
  { name: 'Econorm Sachet (Saccharomyces boulardii)', dosage: 'Twice Daily (BD), in lukewarm water for 3 Days' },
  { name: 'Enterogermina Oral Suspension', dosage: 'Once Daily (OD), directly consume for 5 Days' },
  
  // Vitamins, Minerals & Supplements
  { name: 'Limcee 500mg (Vitamin C)', dosage: 'Once Daily (OD), Chewable after meals for 15 Days' },
  { name: 'Calcirol Sachet (Cholecalciferol D3 60K)', dosage: 'Once Weekly (OW), with warm milk for 4 Weeks' },
  { name: 'Becosules Capsules (B-Complex + Vitamin C)', dosage: 'Once Daily (OD), After Lunch for 10 Days' },
  { name: 'Shelcal 500mg (Calcium + Vitamin D3)', dosage: 'Once Daily (OD), After Dinner for 30 Days' },
  { name: 'Orofer XT (Iron + Folic Acid)', dosage: 'Once Daily (OD), After Dinner for 30 Days' },
  { name: 'Neurobion Forte (Vitamin B12 + B-Complex)', dosage: 'Once Daily (OD), After Meals for 30 Days' },
];

const COMMON_COMPLAINTS = [
  'Fever', 'Dry Cough', 'Productive Cough', 'Sore Throat', 'Running Nose', 
  'Headache', 'Body Pain', 'Stomach Ache', 'Vomiting', 'Loose Motions', 
  'Chest Pain', 'Shortness of Breath', 'Weakness', 'High BP'
];

const COMMON_TESTS = [
  'CBC (Complete Blood Count)', 'Chest X-Ray PA View', 'Blood Sugar (Fasting & PP)', 
  'HbA1c', 'LFT (Liver Function)', 'KFT (Kidney Function)', 
  'Lipid Profile', 'Thyroid Profile (T3/T4/TSH)', 'Urine RE/ME'
];

const COMMON_ADVICE = [
  'Drink warm water frequently', 'Take complete bed rest for 2-3 days', 
  'Warm saline gargles 3-4 times a day', 'Avoid cold drinks and oily food', 
  'Monitor temperature and BP daily', 'Maintain a light, low-sugar diet', 
  'Avoid heavy physical activity'
];

const analyzeChiefComplaint = (complaintText) => {
  if (!complaintText || complaintText.trim().length < 2) return null;
  const text = complaintText.toLowerCase();

  // High Priority: Respiratory Distress & Breathing Difficulties (Hindi/Hinglish/English)
  if (
    /\b(saas|saans|sans|breathless|breathlessness|dyspnea|suffocat|chok|oxygen|spo2)\b/.test(text) ||
    /sa+n?s\s*(phool|fool|lene|fulna|phulna)/.test(text) ||
    /sa+n?s\s+lene\s*(me|m|mein)?\s*(dikkat|takleef|problem|pareshani|kasht)/.test(text) ||
    /(difficulty|shortness|trouble|hard|struggling)\s*(in|to|of)?\s*breath/.test(text) ||
    /\b(asthma attack|severe asthma|acute asthma|stridor|bronchospasm)\b/.test(text)
  ) {
    return {
      specialty: 'Pulmonology / Emergency OPD',
      priority: 'High',
      priorityBadgeClass: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      note: 'Flagged: High Priority - Immediate SpO2 saturation, respiratory rate & nebulization triage required',
      doctorRole: 'Pulmonologist / Emergency MO'
    };
  }

  // High Priority: Cardiology / Emergency / Severe Chest / Trauma / Stroke / Collapse
  if (/\b(chest|chhati|heart|cardio|angina|palpitation|heart attack|bp high|stroke|unconscious|bleed|bleeding|severe pain|dora|behosh|faint|collapse)\b/.test(text)) {
    return {
      specialty: 'Cardiology / Emergency OPD',
      priority: 'High',
      priorityBadgeClass: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      note: 'Flagged: Immediate vitals (ECG, BP, SpO2) check required before consultation',
      doctorRole: 'Cardiologist / Emergency MO'
    };
  }

  // Pulmonology / Respiratory (Moderate)
  if (/\b(cough|khansi|phlegm|asthma|wheezing|cold|pneumonia|balgham|throat|gala|bukhar|fever)\b/.test(text)) {
    return {
      specialty: 'Pulmonology / Internal Medicine',
      priority: 'Moderate',
      priorityBadgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      note: 'SpO2 saturation & clinical temperature triage check recommended',
      doctorRole: 'Chest Physician / General Physician'
    };
  }
  // Gastroenterology
  if (/\b(stomach|pet|abdomen|vomit|loose motion|diarrhea|dast|nausea|acidity|gas|ulcer|constipation|kabz|ulti)\b/.test(text)) {
    return {
      specialty: 'Gastroenterology / General Medicine',
      priority: 'Moderate',
      priorityBadgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      note: 'Dehydration check & oral rehydration protocol guidance',
      doctorRole: 'Gastroenterologist'
    };
  }
  // Orthopedics / Trauma Care
  if (/\b(fracture|bone|joint|knee|back pain|haddi|chot|injury|accident|sprain|swelling|kamar dard|ghutna)\b/.test(text)) {
    return {
      specialty: 'Orthopedics / Trauma Care',
      priority: 'High',
      priorityBadgeClass: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      note: 'Immobilization support & preliminary digital X-Ray requisition recommended',
      doctorRole: 'Orthopedic Surgeon'
    };
  }
  // Neurology
  if (/\b(headache|migraine|sir dard|dizziness|chakkar|faint|seizure|mrgi)\b/.test(text)) {
    return {
      specialty: 'Neurology / Internal Medicine',
      priority: 'Moderate',
      priorityBadgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      note: 'Neurological reflex & BP stability examination recommended',
      doctorRole: 'Neurologist / General Physician'
    };
  }
  // Dermatology
  if (/\b(skin|rash|khujli|allergy|itching|dane)\b/.test(text)) {
    return {
      specialty: 'Dermatology OPD',
      priority: 'Routine',
      priorityBadgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
      note: 'Standard OPD consultation queue allotted',
      doctorRole: 'Dermatologist'
    };
  }
  // Routine / Default OPD
  return {
    specialty: 'General Medicine / OPD Triage',
    priority: 'Routine',
    priorityBadgeClass: 'bg-teal-500/15 text-teal-600 border-teal-500/30',
    note: 'Standard outpatient consultation queue allotted',
    doctorRole: 'General Physician'
  };
};

const STATIC_BASE = import.meta.env.VITE_STATIC_BASE_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "http://localhost:5000" 
    : "https://hospisyn-backend.onrender.com");

export default function PatientSearchTab({
  API_BASE,
  getHeaders,
  showToast,
  adminSettingsForm,
  userRole,
  sidebarCollapsed,
  setSidebarCollapsed,
  searchQuery,
  setSearchQuery,
  patients = [],
  unpaidBills = [],
  selectedPatient,
  patientHistory,
  newPatient,
  setNewPatient,
  newAdvancePayment,
  setNewAdvancePayment,
  billItems,
  setBillItems,
  availableServices,
  selectedServiceId,
  setSelectedServiceId,
  customItemPrice,
  setCustomItemPrice,
  aiRecommendations,
  setAiRecommendations,
  aiRecommendationsLoading,
  setAiRecommendationsLoading,
  aiExplanation,
  setAiExplanation,
  aiRecommenderVisitId,
  setAiRecommenderVisitId,
  // Prescription → Billing Auto-fill
  prescAutoFillLoading,
  prescUnmatchedItems,
  prescAutoFillVisitId,
  fetchPrescriptionSuggestedItems,
  deskVoiceIntakeRequested,
  setDeskVoiceIntakeRequested,
  fetchPatients,
  handleSelectPatient,
  handleSoftDeletePatient,
  setNewVisit,
  setNewVisitDoctorId,
  setShowVisitModal,
  handleRecordAdvance,
  handleSoftDeleteBill,
  setActiveBillForPayment,
  setPaymentForm,
  setActiveTab,
  fetchReceiptDetails,
  fetchAiRecommendations,
  addRecommendedItem,
  addBillItem,
  removeBillItem,
  handleRegisterPatient,
  handleCreateBill
}) {
  // Clinical Notes & Patient AI Summary State
  const [showSummaryModal, setShowSummaryModal] = React.useState(false);
  const [selectedVisit, setSelectedVisit] = React.useState(null);
  const [summaryForm, setSummaryForm] = React.useState({
    diagnosis: '',
    chief_complaints: '',
    medicines_list: '',
    tests_list: '',
    advice: '',
    follow_up_date: '',
    patient_summary: ''
  });
  const [summaryGenerating, setSummaryGenerating] = React.useState(false);
  const [summarySaving, setSummarySaving] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState('');
  const [selectedLanguage, setSelectedLanguage] = React.useState('');
  const [viewMode, setViewMode] = React.useState('en'); // 'en' | 'native' | 'pdf'
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState('');
  // Patient Finder Width & Resizing States
  const [finderWidth, setFinderWidth] = React.useState(() => {
    const saved = localStorage.getItem('hospisyn_finder_width');
    return saved ? parseInt(saved, 10) : 340;
  });
  const [finderCollapsed, setFinderCollapsed] = React.useState(false);
  const [isDraggingFinder, setIsDraggingFinder] = React.useState(false);

  const containerRef = React.useRef(null);

  // Dragging Patient Finder Splitter (Horizontally enlarge or shrink the finder)
  React.useEffect(() => {
    if (!isDraggingFinder) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth < 160) {
        setFinderCollapsed(true);
      } else {
        setFinderCollapsed(false);
        const clampedWidth = Math.max(240, Math.min(newWidth, 600));
        setFinderWidth(clampedWidth);
        localStorage.setItem('hospisyn_finder_width', clampedWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsDraggingFinder(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingFinder]);

  const INDIAN_LANGUAGES = [
    { code: 'Hindi', label: 'Hindi (हिंदी)' },
    { code: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
    { code: 'Tamil', label: 'Tamil (தமிழ்)' },
    { code: 'Telugu', label: 'Telugu (తెలుగు)' },
    { code: 'Bengali', label: 'Bengali (বাংলা)' },
    { code: 'Marathi', label: 'Marathi (मराठी)' },
    { code: 'Gujarati', label: 'Gujarati (ગુજરાતી)' },
    { code: 'Malayalam', label: 'Malayalam (മലയാളം)' },
    { code: 'Punjabi', label: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'Odia', label: 'Odia (ଓଡ଼ିଆ)' },
    { code: 'Urdu', label: 'Urdu (اردو)' }
  ];

  const NATIVE_LABELS = {
    Hindi: { Morning: 'सुबह', Afternoon: 'दोपहर', Night: 'रात', 'Watch Out For': 'इन बातों का ध्यान रखें' },
    Kannada: { Morning: 'ಬೆಳಿಗ್ಗೆ', Afternoon: 'मध्याह्न', Night: 'ರಾತ್ರಿ', 'Watch Out For': 'ಎಚ್ಚರಿಕೆ' },
    Tamil: { Morning: 'காலை', Afternoon: 'மதியம்', Night: 'இரவு', 'Watch Out For': 'எச்சரிக்கை' },
    Telugu: { Morning: 'ఉదయం', Afternoon: 'మధ్యాహ్నం', Night: 'రాత్రి', 'Watch Out For': 'హెచ్చరిక' },
    Bengali: { Morning: 'সকাল', Afternoon: 'দুপুর', Night: 'রাত', 'Watch Out For': 'সতর্কতা' },
    Marathi: { Morning: 'सकाळ', Afternoon: 'दुपार', Night: 'रात्र', 'Watch Out For': 'सावधानता' },
    Gujarati: { Morning: 'સવાર', Afternoon: 'બપોર', Night: 'રાત', 'Watch Out For': 'ચેતવણી' },
    Malayalam: { Morning: 'രാവിലെ', Afternoon: 'ഉച്ചയ്ക്ക്', Night: 'രാത്രി', 'Watch Out For': 'മുന്നറിയിപ്പ്' },
    Punjabi: { Morning: 'ਸਵੇਰ', Afternoon: 'ਦੁਪਹਿਰ', Night: 'ਰਾਤ', 'Watch Out For': 'ਚੇਤਾਵਨੀ' },
    Odia: { Morning: 'ସକାଳ', Afternoon: 'ମଧ୍ୟାହ୍ନ', Night: 'ରାତି', 'Watch Out For': 'ସତର୍କତା' },
    Urdu: { Morning: 'صبح', Afternoon: 'دوپہر', Night: 'رات', 'Watch Out For': 'انتباہ' }
  };
  
  const [medicineSearch, setMedicineSearch] = React.useState('');
  const [medicineSuggestions, setMedicineSuggestions] = React.useState([]);

  // Prescription formatting builder states
  const [prescTiming, setPrescTiming] = React.useState('After Meals');
  const [prescFrequency, setPrescFrequency] = React.useState('Twice Daily (BD)');
  const [prescDuration, setPrescDuration] = React.useState('3 Days');
  const [aiPrescribeLoading, setAiPrescribeLoading] = React.useState(false);

  // Anomaly Check States
  const [anomalyCheckLoading, setAnomalyCheckLoading] = React.useState(false);
  const [anomalyResult, setAnomalyResult] = React.useState(null);

  // Voice Intake & Voice Search State
  const [showVoiceIntake, setShowVoiceIntake] = React.useState(false);
  const [voiceIntakeParsing, setVoiceIntakeParsing] = React.useState(false);
  const [voicePopulatedFields, setVoicePopulatedFields] = React.useState([]);

  // Field-level AI Extracted Micro-Badge Renderer (Disabled to eliminate clutter and save space)
  const renderAiBadge = () => null;

  // Custom Speech Recognition Hooks
  const intakeVoice = useSpeechRecognition({ defaultLang: 'en-IN' });
  const searchVoice = useSpeechRecognition({ defaultLang: 'en-IN' });

  // Guided Step-by-Step Voice Intake State (Enter ↵ on keyboard advances to next detail)
  const [guidedVoiceStep, setGuidedVoiceStep] = React.useState(null); 
  // 'name' | 'age_gender' | 'mobile_number' | 'address' | 'chief_complaints' | null

  // DOM Refs for auto-focusing inputs during guided flow
  const nameInputRef = React.useRef(null);
  const ageInputRef = React.useRef(null);
  const mobileInputRef = React.useRef(null);
  const addressInputRef = React.useRef(null);
  const complaintsInputRef = React.useRef(null);
  const registerBtnRef = React.useRef(null);
  const GUIDED_STEPS = [
    { id: 'name', label: '1. Patient Name', prompt: 'Speak Patient Full Name', next: 'age_gender', ref: nameInputRef },
    { id: 'age_gender', label: '2. Age & Gender', prompt: 'Speak Age & Gender (e.g. 32 Male)', next: 'mobile_number', ref: ageInputRef },
    { id: 'mobile_number', label: '3. Mobile Number', prompt: 'Speak 10-Digit Mobile Number', next: 'address', ref: mobileInputRef },
    { id: 'address', label: '4. City / Address', prompt: 'Speak City or Address (or Enter to skip)', next: 'chief_complaints', ref: addressInputRef },
    { id: 'chief_complaints', label: '5. Reason / Symptoms', prompt: 'Speak Symptoms or Reason (or Enter to finish)', next: null, ref: complaintsInputRef }
  ];

  // Global keydown for Escape to stop guided intake anytime
  React.useEffect(() => {
    if (!guidedVoiceStep) return;
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopGuidedVoiceIntake(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [guidedVoiceStep]);

  // Handle continuous one-go speech transcription into the currently active step field
  React.useEffect(() => {
    if (!guidedVoiceStep) return;
    
    // Read real-time text (both interim and final speech for instantaneous response)
    const spoken = (intakeVoice.fullText || intakeVoice.transcript || '').trim();
    if (!spoken) return;

    if (guidedVoiceStep === 'name') {
      const cleanName = spoken
        .replace(/^(patient|name|patient name|is|mr\.?|mrs\.?|ms\.?|shri|smt)\s*/i, '')
        .replace(/\.+$/, '')
        .trim();
      if (cleanName) {
        setNewPatient(prev => ({ ...prev, name: cleanName }));
      }
    } else if (guidedVoiceStep === 'age_gender') {
      const ageMatch = spoken.match(/\b(\d{1,3})\b/);
      const genderMatch = spoken.match(/\b(female|females|mahila|woman|girl|aurat|male|males|mail|purush|man|boy|other)\b/i);
      setNewPatient(prev => {
        const next = { ...prev };
        if (ageMatch) {
          const a = parseInt(ageMatch[1]);
          if (a > 0 && a <= 120) next.age = a;
        }
        if (genderMatch) {
          const g = genderMatch[1].toLowerCase();
          next.gender = ['female', 'females', 'mahila', 'woman', 'girl', 'aurat'].includes(g) ? 'Female' : 'Male';
        }
        return next;
      });
    } else if (guidedVoiceStep === 'mobile_number') {
      const digits = spoken.replace(/\D/g, '').slice(0, 10);
      if (digits) {
        setNewPatient(prev => ({ ...prev, mobile_number: digits }));
      }
    } else if (guidedVoiceStep === 'address') {
      const cleanAddress = spoken.replace(/\.+$/, '').trim();
      if (!/^(male|mail|female)$/i.test(cleanAddress)) {
        setNewPatient(prev => ({ ...prev, address: cleanAddress }));
      }
    } else if (guidedVoiceStep === 'chief_complaints') {
      const cleanComplaints = spoken.replace(/\.+$/, '').trim();
      setNewPatient(prev => ({ ...prev, chief_complaints: cleanComplaints }));
    }
  }, [intakeVoice.fullText, intakeVoice.transcript, guidedVoiceStep]);

  const startGuidedVoiceIntake = () => {
    if (searchVoice.isListening) searchVoice.stopListening();
    if (clinicalVoice.isListening) clinicalVoice.stopListening();

    setGuidedVoiceStep('name');
    intakeVoice.resetTranscript();
    intakeVoice.startListening();
    showToast('🎙️ Step 1/5: Speak Patient Name... Press [Enter ↵] for Age & Gender.');
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const handleNextGuidedStep = (currentStepId) => {
    const activeId = currentStepId || guidedVoiceStep || 'name';
    const stepIdx = GUIDED_STEPS.findIndex(s => s.id === activeId);
    if (stepIdx === -1) return;

    const nextStep = GUIDED_STEPS[stepIdx + 1];

    if (nextStep) {
      // Clear transcript so the next field receives only fresh speech without stopping the mic!
      intakeVoice.resetTranscript();
      setGuidedVoiceStep(nextStep.id);

      // Ensure microphone keeps running continuously
      if (!intakeVoice.isListening) {
        intakeVoice.startListening();
      }

      setTimeout(() => {
        nextStep.ref.current?.focus();
      }, 50);

      showToast(`🎙️ ${nextStep.label}: ${nextStep.prompt}... Press [Enter ↵] for Next.`);
    } else {
      stopGuidedVoiceIntake(true);
    }
  };

  const stopGuidedVoiceIntake = (completed = false) => {
    intakeVoice.stopListening();
    intakeVoice.resetTranscript();
    setGuidedVoiceStep(null);
    if (completed) {
      showToast('✅ All details captured! Press Enter or click Register Patient.');
      setTimeout(() => {
        registerBtnRef.current?.focus();
      }, 100);
    } else {
      showToast('Voice intake stopped.');
    }
  };

  const handleToggleSingleFieldIntake = (stepId) => {
    if (guidedVoiceStep === stepId) {
      stopGuidedVoiceIntake(false);
    } else {
      if (searchVoice.isListening) searchVoice.stopListening();
      if (clinicalVoice.isListening) clinicalVoice.stopListening();

      intakeVoice.resetTranscript();
      if (!intakeVoice.isListening) {
        intakeVoice.startListening();
      }

      setGuidedVoiceStep(stepId);
      const st = GUIDED_STEPS.find(s => s.id === stepId);
      if (st) {
        showToast(`🎙️ Dictating into ${st.label}... Speak now or press [Enter ↵].`);
        setTimeout(() => st.ref.current?.focus(), 80);
      }
    }
  };

  // Auto-open and listen if requested from dashboard
  React.useEffect(() => {
    if (deskVoiceIntakeRequested) {
      startGuidedVoiceIntake();
      if (setDeskVoiceIntakeRequested) setDeskVoiceIntakeRequested(false);
    }
  }, [deskVoiceIntakeRequested]);

  // Voice Search Effect: updates searchQuery as user speaks
  React.useEffect(() => {
    if (searchVoice.transcript) {
      const cleanQuery = searchVoice.transcript.replace(/^(search|find|patient|dekho|search for)\s*/i, '').trim();
      if (cleanQuery) {
        setSearchQuery(cleanQuery);
        fetchPatients(cleanQuery);
      }
    }
  }, [searchVoice.transcript]);

  const handleToggleSearchVoice = () => {
    if (searchVoice.isListening) {
      searchVoice.stopListening();
    } else {
      searchVoice.resetTranscript();
      searchVoice.startListening();
      showToast('🎙️ Listening... Speak patient name or mobile number');
    }
  };

  // Voice Dictation for Doctor's Clinical Notes in Modal
  const clinicalVoice = useSpeechRecognition({ defaultLang: 'en-IN' });
  const [activeClinicalFieldMic, setActiveClinicalFieldMic] = React.useState(null);
  const clinicalFieldBaseRef = React.useRef('');

  const handleToggleClinicalFieldMic = (fieldName) => {
    if (activeClinicalFieldMic === fieldName) {
      clinicalVoice.stopListening();
      setActiveClinicalFieldMic(null);
      clinicalFieldBaseRef.current = '';
      showToast(`Finished dictating into ${fieldName.replace('_', ' ')}.`);
    } else {
      if (intakeVoice.isListening) intakeVoice.stopListening();
      if (searchVoice.isListening) searchVoice.stopListening();
      clinicalVoice.stopListening();
      setActiveClinicalFieldMic(fieldName);
      clinicalFieldBaseRef.current = summaryForm[fieldName] || '';
      clinicalVoice.resetTranscript();
      clinicalVoice.startListening();
      showToast(`🎙️ Dictating into ${fieldName.replace('_', ' ')}... Speak now.`);
    }
  };

  React.useEffect(() => {
    if (activeClinicalFieldMic && clinicalVoice.transcript) {
      const spokenText = clinicalVoice.transcript.trim();
      const base = clinicalFieldBaseRef.current ? clinicalFieldBaseRef.current.trim() : '';
      setSummaryForm(prev => {
        if (!base) {
          return { ...prev, [activeClinicalFieldMic]: spokenText };
        }
        const separator = (activeClinicalFieldMic === 'chief_complaints' || activeClinicalFieldMic === 'advice') ? ', ' : '\n';
        return { ...prev, [activeClinicalFieldMic]: `${base}${separator}${spokenText}` };
      });
    }
  }, [clinicalVoice.transcript, activeClinicalFieldMic]);

  // Client-side fallback parser for voice intake
  const clientHeuristicParseIntake = (text) => {
    const clean = text.trim();
    const result = {};

    // 1. Phone number extraction: look for 10 digits or spoken digit clusters (e.g. 9876543210, 834565898, with spaces/dots)
    const exactPhone = clean.match(/\b[6-9]\d{9}\b/);
    if (exactPhone) {
      result.mobile_number = exactPhone[0];
    } else {
      const digitClusters = clean.match(/\b\d[\d\s\-\.]{6,14}\d\b/g);
      if (digitClusters) {
        for (const cluster of digitClusters) {
          const digitsOnly = cluster.replace(/\D/g, '');
          if (digitsOnly.length >= 8 && digitsOnly.length <= 11) {
            result.mobile_number = digitsOnly.slice(-10);
            break;
          }
        }
      }
    }

    // 2. Gender extraction (including common STT homophones like "mail" for "male")
    const gender = clean.match(/\b(female|females|mahila|woman|girl|aurat|male|males|mail|purush|man|boy|other)\b/i);
    if (gender) {
      const g = gender[1].toLowerCase();
      result.gender = ['female', 'females', 'mahila', 'woman', 'girl', 'aurat'].includes(g) 
        ? 'Female' 
        : (['male', 'males', 'mail', 'purush', 'man', 'boy'].includes(g) ? 'Male' : 'Other');
    }

    // 3. Age extraction
    const age = clean.match(/\b(?:age\s*)?(\d{1,3})\s*(?:years?(?:\s*old)?|yrs?|saal)?\b/i);
    if (age && parseInt(age[1]) <= 120 && parseInt(age[1]) > 0) {
      result.age = parseInt(age[1]);
    }

    // 4. Name & Complaints & Address extraction
    const parts = clean.split(/[,;\.]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const nameCand = parts[0].replace(/\b(?:register(?:\s*patient)?|new\s*patient|patient(?:\s*name)?|name(?:\s*is)?|mr\.?|mrs\.?|ms\.?)\b/gi, '').trim();
      if (nameCand && !/^\d+$/.test(nameCand)) result.name = nameCand;

      for (const part of parts.slice(1)) {
        if (/fever|cough|pain|check\s*up|headache|weakness|vomiting|cold|diarrhea|bp|sugar/i.test(part)) {
          result.chief_complaints = part;
          break;
        }
      }
    } else {
      const nameMatch = clean.replace(/\b(?:register(?:\s*patient)?|new\s*patient|patient)\b/gi, '').trim().split(/\s+/).slice(0, 2).join(' ');
      if (nameMatch) result.name = nameMatch;
    }

    if (result.address && /^(mail|male|female|purush|mahila)$/i.test(result.address)) {
      delete result.address;
    }

    return result;
  };

  const handleParseVoiceIntake = async (customText) => {
    const textToParse = (customText || intakeVoice.fullText).trim();
    if (!textToParse) {
      showToast('Please speak or click a demo sample chip first.', 'warning');
      return;
    }

    setVoiceIntakeParsing(true);
    intakeVoice.stopListening();

    try {
      const res = await fetch(`${API_BASE}/ai/parse-voice-intake`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ transcript: textToParse })
      });

      let parsed = null;
      if (res.ok) {
        parsed = await res.json();
      } else {
        parsed = clientHeuristicParseIntake(textToParse);
      }

      if (parsed) {
        const updated = { ...newPatient };
        const filled = [];
        if (parsed.name) { updated.name = parsed.name; filled.push('name'); }
        if (parsed.age) { updated.age = parsed.age; filled.push('age'); }
        if (parsed.gender) { updated.gender = parsed.gender; filled.push('gender'); }
        if (parsed.mobile_number) { updated.mobile_number = parsed.mobile_number; filled.push('mobile_number'); }
        if (parsed.address) { updated.address = parsed.address; filled.push('address'); }
        if (parsed.chief_complaints) { updated.chief_complaints = parsed.chief_complaints; filled.push('chief_complaints'); }

        setNewPatient(updated);
        setVoicePopulatedFields(filled);
        showToast('🎙️ Voice intake parsed! Review and click Register.');
      }
    } catch (err) {
      console.warn('Voice intake fetch fallback:', err);
      const parsed = clientHeuristicParseIntake(textToParse);
      if (parsed) {
        const filled = [];
        if (parsed.name) filled.push('name');
        if (parsed.age) filled.push('age');
        if (parsed.gender) filled.push('gender');
        if (parsed.mobile_number) filled.push('mobile_number');
        if (parsed.address) filled.push('address');
        if (parsed.chief_complaints) filled.push('chief_complaints');
        setVoicePopulatedFields(filled);
        setNewPatient(prev => ({ ...prev, ...parsed }));
        showToast('Voice intake processed! Please verify details.');
      }
    } finally {
      setVoiceIntakeParsing(false);
    }
  };

  // Rate Verification States (NHA / CGHS / Anakin MCP)
  const [rateVerificationLoading, setRateVerificationLoading] = React.useState(false);
  const [rateVerificationResult, setRateVerificationResult] = React.useState(null);
  const [showRateModal, setShowRateModal] = React.useState(false);

  const [downloadPrescriptionLoading, setDownloadPrescriptionLoading] = React.useState(false);

  // Story View State
  const [showStoryModal, setShowStoryModal] = React.useState(false);
  const [storyVisit, setStoryVisit] = React.useState(null);
  const [summaryTab, setSummaryTab] = React.useState('clinical'); // 'clinical' | 'story'

  const checkFollowUpStatus = (currentVisit) => {
    if (!currentVisit || !currentVisit.doctor) return { isFollowUp: false, daysDiff: null, validityDays: 7 };
    const docId = currentVisit.doctor.id;
    const validityDays = currentVisit.doctor.consultation_validity_days ?? 7;
    const currDate = new Date(currentVisit.visit_date);

    // Find previous visits with the same doctor for this patient
    const previousVisits = (selectedPatient?.visits || []).filter(v => 
      v.id !== currentVisit.id && 
      v.doctor && 
      v.doctor.id === docId &&
      new Date(v.visit_date) < currDate
    );

    if (previousVisits.length === 0) {
      return { isFollowUp: false, daysDiff: null, validityDays };
    }

    // Sort to find the most recent previous visit
    previousVisits.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
    const lastVisitDate = new Date(previousVisits[0].visit_date);
    const diffMs = currDate.getTime() - lastVisitDate.getTime();
    const daysDiff = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (daysDiff <= validityDays) {
      return { isFollowUp: true, daysDiff, validityDays, lastVisitDate: previousVisits[0].visit_date };
    }

    return { isFollowUp: false, daysDiff, validityDays, lastVisitDate: previousVisits[0].visit_date };
  };

  const handleAddDoctorFeeItem = (currentVisit) => {
    const doctor = typeof currentVisit === 'object' && currentVisit?.doctor ? currentVisit.doctor : currentVisit;
    if (!doctor) return;

    const { isFollowUp, daysDiff, validityDays } = typeof currentVisit === 'object' && currentVisit?.visit_date ? checkFollowUpStatus(currentVisit) : { isFollowUp: false };
    
    let docFee = doctor.consultation_fee ?? 500;
    let docServiceName = `Doctor Consultation (${doctor.name})`;
    let isFree = false;

    if (isFollowUp) {
      docFee = 0;
      docServiceName = `Doctor Consultation - FREE Follow-Up (${doctor.name})`;
      isFree = true;
    }

    const matchedSvc = availableServices.find(s => s.category === 'Doctor Consultation') || availableServices[0];
    const serviceId = matchedSvc ? matchedSvc.id : 1;
    
    if (billItems.some(bi => bi.service_name.includes(doctor.name) || (bi.service_id === serviceId && bi.amount === docFee))) {
      showToast(`Doctor Consultation fee for ${doctor.name} is already in the bill.`, "warning");
      return;
    }
    
    setBillItems(prev => [
      {
        service_id: serviceId,
        service_name: docServiceName,
        amount: docFee,
        fromDoctorConfig: true,
        isFollowUp: isFree
      },
      ...prev
    ]);

    if (isFree) {
      showToast(`⚡ FREE Follow-up Applied! (Previous visit ${daysDiff} days ago, limit: ${validityDays} days)`);
    } else {
      showToast(`⚡ Auto-filled Doctor Fee (₹${docFee}) for ${doctor.name}!`);
    }
  };

  const runAnomalyCheck = async (visit) => {
    if (billItems.length === 0) {
      showToast("Add some items to the bill before running an audit.", "warning");
      return;
    }
    setAnomalyCheckLoading(true);
    setAnomalyResult(null);
    try {
      const itemsPayload = billItems.map(item => ({
        service_name: item.service_name,
        amount: parseFloat(item.amount)
      }));

      const res = await fetch(`${API_BASE}/bills/ai-anomaly-check`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          items: itemsPayload,
          patient_age: selectedPatient ? parseInt(selectedPatient.age) : null,
          patient_gender: selectedPatient ? selectedPatient.gender : null,
          diagnosis: visit.diagnosis || null
        })
      });
      if (!res.ok) {
        throw new Error("Audit request failed.");
      }
      const data = await res.json();
      setAnomalyResult(data);
      if (data.status === 'clear') {
        showToast("AI Bill Audit passed: No anomalies detected.", "success");
      } else {
        showToast(`AI Bill Audit flagged: ${data.summary}`, data.status === 'critical' ? 'error' : 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast("AI Auditor is temporarily offline. Continuing with default invoicing.", "warning");
    } finally {
      setAnomalyCheckLoading(false);
    }
  };

  const handleVerifyExternalRates = async () => {
    if (!billItems || billItems.length === 0) {
      showToast("Add items to the bill before verifying external rates.", "warning");
      return;
    }
    setRateVerificationLoading(true);
    try {
      const itemsPayload = billItems.map(item => ({
        service_name: item.service_name,
        billed_amount: parseFloat(item.amount)
      }));
      const res = await fetch(`${API_BASE}/bills/verify-external-rates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items: itemsPayload })
      });
      if (!res.ok) throw new Error("External rate verification failed");
      const data = await res.json();
      setRateVerificationResult(data);
      setShowRateModal(true);
      if (data.overall_status === 'overpriced_detected') {
        showToast(`Govt NHA Rate Warning: ${data.summary}`, 'warning');
      } else {
        showToast("Rate Verification Passed: All items compliant with NHA/CGHS rate caps.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Rate verification service offline.", "error");
    } finally {
      setRateVerificationLoading(false);
    }
  };

  const handleAutoResolveInvoice = () => {
    if (!anomalyResult || !anomalyResult.auto_corrections) return;
    const { corrected_items, action_summary, savings_amount } = anomalyResult.auto_corrections;
    
    const updatedItems = corrected_items.map(ci => {
      const match = Array.isArray(availableServices) 
        ? availableServices.find(s => s.name.toLowerCase() === ci.service_name.toLowerCase())
        : null;
      return {
        service_id: match ? match.id : null,
        service_name: match ? match.name : ci.service_name,
        amount: ci.amount
      };
    });
    
    setBillItems(updatedItems);
    setAnomalyResult({
      status: 'clear',
      issues: [],
      summary: `✨ AI Auto-Resolved: ${action_summary}`,
      safe_to_proceed: true,
      auto_corrections: null
    });
    
    const savingsMsg = savings_amount > 0 ? ` Saved ₹${savings_amount.toFixed(2)}!` : '';
    showToast(`🎉 AI Agent auto-resolved billing anomalies! ${action_summary}${savingsMsg}`, 'success');
  };

  React.useEffect(() => {
    setAnomalyResult(null);
  }, [billItems]);

  // Toggle quick tag helper
  const handleToggleTag = (field, tagValue) => {
    const currentVal = summaryForm[field] || '';
    
    if (field === 'chief_complaints' || field === 'advice') {
      const items = currentVal.trim() ? currentVal.split(',').map(x => x.trim()).filter(Boolean) : [];
      if (items.includes(tagValue)) {
        const filtered = items.filter(x => x !== tagValue);
        setSummaryForm(prev => ({ ...prev, [field]: filtered.join(', ') }));
      } else {
        items.push(tagValue);
        setSummaryForm(prev => ({ ...prev, [field]: items.join(', ') }));
      }
    } else if (field === 'tests_list') {
      const lines = currentVal.trim() ? currentVal.split('\n').map(x => x.trim()).filter(Boolean) : [];
      const matchIdx = lines.findIndex(line => line.toLowerCase().includes(tagValue.toLowerCase()));
      if (matchIdx !== -1) {
        const filtered = lines.filter((_, idx) => idx !== matchIdx);
        const renumbered = filtered.map((line, idx) => {
          const clean = line.replace(/^\d+\.\s*/, '');
          return `${idx + 1}. ${clean}`;
        });
        setSummaryForm(prev => ({ ...prev, [field]: renumbered.join('\n') }));
      } else {
        const nextNum = lines.length + 1;
        const newline = `${nextNum}. ${tagValue}`;
        const updated = currentVal ? `${currentVal.trim()}\n${newline}` : newline;
        setSummaryForm(prev => ({ ...prev, [field]: updated }));
      }
    }
  };

  // AI Suggest Treatment caller
  const handleAiSuggestTreatment = async () => {
    if (!summaryForm.chief_complaints.trim()) {
      showToast('Please type or select Chief Complaints first so AI has clinical context.', 'warning');
      return;
    }
    setAiPrescribeLoading(true);
    try {
      const response = await fetch(`${API_BASE}/visits/ai-suggest-treatment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          chief_complaints: summaryForm.chief_complaints,
          diagnosis: summaryForm.diagnosis,
          age: selectedPatient ? selectedPatient.age : null,
          gender: selectedPatient ? selectedPatient.gender : null
        })
      });
      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.detail || 'AI Treatment suggestion request failed.');
      }
      const data = await response.json();
      setSummaryForm(prev => ({
        ...prev,
        diagnosis: data.diagnosis || prev.diagnosis,
        medicines_list: data.medicines_list || prev.medicines_list,
        tests_list: data.tests_list || prev.tests_list,
        advice: data.advice || prev.advice,
        follow_up_date: data.follow_up_date || prev.follow_up_date
      }));
      showToast('AI treatment plan loaded! Review and adjust details below.');
    } catch (e) {
      console.error(e);
      setSummaryError(e.message);
      showToast(e.message || 'AI Prescribing service is offline. Enter prescription details manually.', 'error');
    } finally {
      setAiPrescribeLoading(false);
    }
  };

  // Auto-filter medicine suggestions
  React.useEffect(() => {
    if (!medicineSearch.trim()) {
      setMedicineSuggestions([]);
      return;
    }
    const query = medicineSearch.toLowerCase().trim();
    const filtered = MEDICINE_DATASTORE.filter(med => 
      med.name.toLowerCase().includes(query)
    ).slice(0, 8); // Expanded list selection limit
    setMedicineSuggestions(filtered);
  }, [medicineSearch]);

  const handleAddMedicineFromSuggest = (med) => {
    const currentText = summaryForm.medicines_list || '';
    const lines = currentText.split('\n').map(line => line.trim()).filter(Boolean);
    const nextNum = lines.length + 1;
    const formattedDosage = `${prescFrequency}, ${prescTiming} for ${prescDuration}`;
    const newline = `${nextNum}. ${med.name} - ${formattedDosage}`;
    const updated = currentText ? `${currentText.trim()}\n${newline}` : newline;
    
    setSummaryForm(prev => ({
      ...prev,
      medicines_list: updated
    }));
    setMedicineSearch('');
    setMedicineSuggestions([]);
  };

  const handleOpenSummary = (visit) => {
    if (setSidebarCollapsed) setSidebarCollapsed(true);
    setSelectedVisit(visit);
    setSummaryTab('clinical');
    setSummaryForm({
      diagnosis: visit.diagnosis || '',
      chief_complaints: visit.chief_complaints || '',
      medicines_list: visit.medicines_list || '',
      tests_list: visit.tests_list || '',
      advice: visit.advice || '',
      follow_up_date: visit.follow_up_date || '',
      patient_summary: visit.patient_summary || ''
    });
    setSummaryError('');
    setMedicineSearch('');
    setMedicineSuggestions([]);
    setShowSummaryModal(true);
  };

  const handleOpenStory = (visit) => {
    setStoryVisit(visit);
    setShowStoryModal(true);
  };

  const handleSaveSummary = async (e) => {
    if (e) e.preventDefault();
    setSummarySaving(true);
    setSummaryError('');
    try {
      const res = await fetch(`${API_BASE}/visits/${selectedVisit.id}/summary`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(summaryForm)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to save clinical summary');
      }
      showToast('Clinical summary saved successfully!');
      handleSelectPatient(selectedPatient.id);
      setShowSummaryModal(false);
    } catch (err) {
      setSummaryError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSummarySaving(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!selectedLanguage) {
      showToast('कृपया पहले भाषा चुनें (Please select target language first)', 'warning');
      return;
    }
    setSummaryGenerating(true);
    setSummaryError('');
    try {
      const res = await fetch(`${API_BASE}/visits/${selectedVisit.id}/summary?generate_ai_summary=true&target_language=${selectedLanguage}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(summaryForm)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to generate AI summary');
      }
      const updatedVisit = await res.json();
      setSummaryForm(prev => ({
        ...prev,
        patient_summary: updatedVisit.patient_summary || ''
      }));
      setViewMode('native');
      showToast('AI Patient summary generated!');
      handleSelectPatient(selectedPatient.id);
    } catch (err) {
      setSummaryError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSummaryGenerating(false);
    }
  };

  const handlePrintSummary = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadPrescription = async (visitId) => {
    const targetVisitId = (typeof visitId === 'string' || typeof visitId === 'number') ? visitId : selectedVisit?.id;
    if (!targetVisitId) return;
    setDownloadPrescriptionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/visits/${targetVisitId}/prescription-pdf`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to generate PDF prescription sheet.");
      const data = await res.json();
      window.open(`${STATIC_BASE}${data.pdf_path}`, "_blank");
      showToast("Prescription PDF downloaded successfully!");
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDownloadPrescriptionLoading(false);
    }
  };

  const [sendingPrescriptionEmailId, setSendingPrescriptionEmailId] = useState(null);

  const handleSendPrescriptionEmail = async (visitId) => {
    const targetVisitId = (typeof visitId === 'string' || typeof visitId === 'number') ? visitId : selectedVisit?.id;
    if (!targetVisitId) return;
    setSendingPrescriptionEmailId(targetVisitId);
    try {
      const res = await fetch(`${API_BASE}/visits/${targetVisitId}/send-prescription-email`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to email prescription.");
      showToast(data.message || "Prescription emailed to patient successfully!", "success");
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSendingPrescriptionEmailId(null);
    }
  };

  const handleTriggerPdfPreview = async () => {
    if (!selectedVisit) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`${API_BASE}/visits/${selectedVisit.id}/prescription-pdf`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to compile prescription PDF sheet.");
      const data = await res.json();
      setPdfPreviewUrl(`${STATIC_BASE}${data.pdf_path}?t=${Date.now()}`);
      setViewMode('pdf');
      showToast("Prescription PDF compiled! Previewing...");
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col lg:flex-row gap-0 items-stretch animate-in fade-in duration-300 h-full w-full min-h-0 p-2 md:p-3 relative ${
        isDraggingFinder ? 'select-none' : ''
      }`}
    >
      {/* Search Panel (Left Sidebar: compact 320-350px / resizable) */}
      {finderCollapsed ? (
        /* Collapsed Slim Dock Rail with Triage Counters */
        <div className="hidden lg:flex w-14 min-w-[56px] bg-slate-50 border border-slate-200 rounded-2xl flex-col items-center py-3 px-1 flex-shrink-0 select-none z-10 mr-1.5 justify-between shadow-xs">
          {/* Top: Expand Toggle + Counts */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setFinderCollapsed(false)}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-slate-600 hover:text-teal-700 shadow-xs transition-all flex items-center justify-center group cursor-pointer"
              title="Expand Patient Finder (मरीज़ खोजें)"
            >
              <PanelLeftOpen className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </button>

            {/* Total Patients Badge */}
            <button
              type="button"
              onClick={() => setFinderCollapsed(false)}
              className="w-full py-1.5 px-0.5 rounded-xl border bg-white border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 shadow-xs transition-all cursor-pointer flex flex-col items-center"
              title={`Total Patients: ${patients.length}`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600 mb-0.5" />
              <span className="text-xs font-black text-slate-900 font-mono leading-none">
                {patients.length}
              </span>
              <span className="text-[7.5px] font-black uppercase text-slate-400 mt-0.5 leading-none">
                Total
              </span>
            </button>

            {/* Unpaid Bills Badge if any */}
            {unpaidBills && unpaidBills.length > 0 && (
              <button
                type="button"
                onClick={() => setFinderCollapsed(false)}
                className="w-full py-1.5 px-0.5 rounded-xl border bg-amber-50 border-amber-300 hover:bg-amber-100 shadow-xs transition-all cursor-pointer flex flex-col items-center"
                title={`${unpaidBills.length} Unpaid Bills`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                <span className="text-xs font-black text-amber-800 font-mono leading-none">
                  {unpaidBills.length}
                </span>
                <span className="text-[7.5px] font-black uppercase text-amber-700 mt-0.5 leading-none">
                  Unpaid
                </span>
              </button>
            )}
          </div>

          {/* Middle: Rotated Text Label */}
          <div 
            onClick={() => setFinderCollapsed(false)}
            className="my-auto flex flex-col items-center cursor-pointer group py-2"
            title="Click to expand Patient Finder"
          >
            <span className="text-[9.5px] font-black uppercase text-slate-400 group-hover:text-teal-700 [writing-mode:vertical-lr] rotate-180 tracking-widest">
              Patient Finder
            </span>
          </div>

          {/* Bottom: New Patient Button */}
          {userRole !== 'Doctor' && (
            <button
              type="button"
              onClick={() => {
                handleSelectPatient(null);
                setShowVoiceIntake(false);
                setFinderCollapsed(false);
              }}
              className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all flex items-center justify-center cursor-pointer"
              title="Register New Patient"
            >
              <PlusCircle className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      ) : (
        /* Expanded Resizable Patient Finder */
        <div 
          style={{ width: `${finderWidth}px`, minWidth: `${finderWidth}px` }}
          className="w-full lg:w-auto shrink-0 flex flex-col gap-3 md:h-full md:min-h-0 transition-[width] duration-75"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:h-full md:overflow-hidden min-h-[300px] lg:min-h-0">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-teal-600" />
                Patient Finder
                <span className="text-[10px] font-black bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded-full border border-teal-200">
                  {patients.length}
                </span>
              </h3>
              <div className="flex items-center gap-1">
                {userRole !== 'Doctor' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectPatient(null);
                      setShowVoiceIntake(false);
                    }}
                    className="text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-95"
                    title="Open New Patient Registration form"
                  >
                    <PlusCircle className="w-3 h-3 text-teal-600" />
                    + New Patient
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFinderCollapsed(true)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Collapse Patient Finder (पूरा स्क्रीन खोलें)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>
          <div className="flex gap-2 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-9 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-semibold ${
                  searchVoice.isListening
                    ? 'border-rose-400 ring-2 ring-rose-300 bg-rose-50/40 text-rose-900'
                    : 'border-slate-200 focus:border-teal-500'
                }`}
                placeholder={searchVoice.isListening ? '🎙️ Listening... Speak name/mobile' : 'Search ID, Name, Mobile...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchPatients(e.target.value);
                }}
              />
              <button
                type="button"
                onClick={handleToggleSearchVoice}
                className={`absolute right-2 top-1.5 p-1 rounded-lg transition-all ${
                  searchVoice.isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                    : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                }`}
                title={searchVoice.isListening ? 'Stop Voice Search' : '🎙️ Voice Search (Call Patient Name)'}
              >
                {searchVoice.isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              onClick={() => fetchPatients(searchQuery)}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              Search
            </button>
          </div>

          {/* Patients Search Results list */}
          <div className="mt-3 space-y-2 md:flex-1 md:overflow-y-auto pr-1 min-h-0 compact-scroll">
            {patients.map((pat) => {
              const isSelected = selectedPatient?.id === pat.id;
              const visitsList = (isSelected && selectedPatient?.visits?.length > 0) ? selectedPatient.visits : (pat.visits || []);
              const hasVisits = visitsList.length > 0;
              const hasRx = visitsList.some(v => v.medicines_list || v.tests_list || v.diagnosis || v.patient_summary);
              
              const allBills = isSelected ? (patientHistory || []) : visitsList.flatMap(v => (v && v.bills) || []);
              const safeUnpaidBills = Array.isArray(unpaidBills) ? unpaidBills : [];
              const unpaidFromVisits = allBills.find(b => b && (b.balance_amount > 0 || b.payment_status === 'Pending' || b.payment_status === 'Partial Paid'));
              const unpaidFromGlobal = safeUnpaidBills.find(b => b && (
                (b.patient_id_str && b.patient_id_str === pat.patient_id) ||
                (b.patient_id && b.patient_id === pat.id) ||
                visitsList.some(v => v && v.id === b.visit_id)
              ));
              const activeUnpaidBill = unpaidFromVisits || (allBills.length === 0 ? unpaidFromGlobal : undefined);

              return (
                <div
                  key={pat.id}
                  onClick={() => handleSelectPatient(pat.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/25 shadow-sm ring-1 ring-teal-500/30'
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/60 bg-white shadow-2xs'
                  }`}
                >
                  {/* Left Section: Primary Identifiers & Clean Split Metadata */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* Primary Identifier: Name + Age/Gender Pill */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-[12.5px] leading-snug tracking-tight truncate">
                        {pat.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded shrink-0">
                        {pat.age} Yrs • {pat.gender}
                      </span>
                    </div>

                    {/* Secondary Metadata: ID and Mobile cleanly split in muted gray */}
                    <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-500">
                      <span className="font-mono text-slate-600 bg-slate-50 px-1 py-0.2 rounded border border-slate-200 text-[9px]">
                        ID: {pat.patient_id}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate text-[9.5px]">📞 {pat.mobile_number}</span>
                    </div>

                    {isSelected && (
                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[8.5px] font-extrabold text-teal-700 bg-teal-100/60 px-1.5 py-0.2 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                          Active Patient
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Section: Strictly Right-Aligned Vertical Stack of Status Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* 1. Financial Status Badge */}
                    {(() => {
                      if (activeUnpaidBill) {
                        const bal = activeUnpaidBill.balance_amount ?? activeUnpaidBill.grand_total;
                        return (
                          <span
                            className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.2 rounded-full font-extrabold text-[9px] flex items-center gap-0.5 shadow-2xs"
                            title={`Unpaid Invoice ${activeUnpaidBill.bill_id}: ₹${bal}`}
                          >
                            <AlertCircle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                            <span>Unpaid: ₹{bal.toLocaleString()}</span>
                          </span>
                        );
                      }
                      if (allBills.length > 0) {
                        return (
                          <span
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-bold text-[9px] flex items-center gap-0.5"
                            title="All invoices paid"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            <span>Bill Paid</span>
                          </span>
                        );
                      }
                      return (
                        <span
                          className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.2 rounded-full font-bold text-[9px] flex items-center gap-0.5"
                          title="No invoice generated yet"
                        >
                          <Receipt className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          <span>Bill Pending</span>
                        </span>
                      );
                    })()}

                    {/* 2. Clinical Status Row (Visits & Rx) */}
                    <div className="flex items-center gap-1 text-[8px] font-bold">
                      {hasVisits ? (
                        <span
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 py-0.2 rounded flex items-center gap-0.5"
                          title={`${visitsList.length} Visit(s) logged`}
                        >
                          <Stethoscope className="w-2 h-2 shrink-0" />
                          <span>{visitsList.length} Visit{visitsList.length > 1 ? 's' : ''}</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1 py-0.2 rounded">
                          No Visit
                        </span>
                      )}

                      {hasRx ? (
                        <span
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded flex items-center gap-0.5"
                          title="Prescription & notes recorded by doctor"
                        >
                          <FileText className="w-2 h-2 shrink-0" />
                          <span>Rx Done</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 border border-slate-200 px-1 py-0.2 rounded">
                          No Rx
                        </span>
                      )}
                    </div>

                    {/* 3. Action / Selection Pill */}
                    <span
                      className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
            {patients.length === 0 && (
              <p className="text-center text-slate-400 text-xs py-4">No matching patient profiles found.</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Draggable Splitter Handle between Patient Finder and Workspace */}
      {!finderCollapsed && (
        <div
          onMouseDown={() => setIsDraggingFinder(true)}
          onDoubleClick={() => setFinderCollapsed(true)}
          className={`hidden lg:flex w-2 hover:w-2.5 bg-slate-200 hover:bg-teal-500 cursor-col-resize transition-all items-center justify-center relative group select-none flex-shrink-0 mx-1 rounded-full ${
            isDraggingFinder ? 'bg-teal-600 w-2.5 ring-2 ring-teal-400/40' : ''
          }`}
          title="Drag horizontally to resize sections • Double click to collapse"
        >
          <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors pointer-events-none" />
        </div>
      )}

      {/* Workspace / Register Pane (FLEX-1: Expands across 100% of remaining screen width!) */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-3 md:h-full md:min-h-0 overflow-y-auto compact-scroll pr-1">
        {selectedPatient ? (
          <>
            {/* Top Patient Workspace Switcher Banner: Receptionist can register a new patient in 1 click at any time */}
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Finder Toggle Button */}
                <button
                  type="button"
                  onClick={() => setFinderCollapsed(prev => !prev)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                    finderCollapsed
                      ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={finderCollapsed ? 'Open Patient Finder' : 'Collapse Patient Finder'}
                >
                  {finderCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5 text-teal-600" /> : <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{finderCollapsed ? `Finder (${patients.length})` : 'Hide Finder'}</span>
                </button>

                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Workspace:</span>
                <span className="bg-teal-50 text-teal-900 border border-teal-200 text-xs font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  {selectedPatient.name} ({selectedPatient.patient_id})
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPatient(null);
                    setShowVoiceIntake(false);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Register New Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPatient(null);
                    startGuidedVoiceIntake();
                  }}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>🎙️ Guided Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPatient(null)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Close patient desk"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Selected Patient Workspace */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 md:h-full md:overflow-hidden flex flex-col min-h-[400px] lg:min-h-0 animate-in fade-in duration-150">
              {/* Patient Quick Header Details */}
              <div className="flex justify-between items-start pb-3 border-b border-slate-100 flex-shrink-0 flex-wrap gap-2">
                <div>
                  <span className="text-teal-600 font-bold text-[10px] uppercase tracking-wider font-sans">Patient Workspace</span>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedPatient.name}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Age: <b>{selectedPatient.age}</b> | Gender: <b>{selectedPatient.gender}</b> | Mobile: <b>{selectedPatient.mobile_number}</b> | ID: <b>{selectedPatient.patient_id}</b>
                  </p>
                  {selectedPatient.address && (
                    <p className="text-slate-500 text-[11px] mt-0.5">Address: {selectedPatient.address}</p>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {userRole !== 'Doctor' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectPatient(null);
                        setShowVoiceIntake(false);
                      }}
                      className="bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title="Open Registration Form"
                    >
                      <PlusCircle className="w-3 h-3 text-teal-600" />
                      + New Patient
                    </button>
                  )}
                  {userRole === 'Admin' && (
                    <button
                      onClick={() => handleSoftDeletePatient(selectedPatient.id)}
                      className="text-rose-600 hover:text-rose-800 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>

            {/* Create Visit Panel */}
            {['Admin', 'Receptionist', 'Doctor'].includes(userRole) && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Consultation Entry</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Record a new visit or pathology reference under an active doctor.</p>
                </div>
                <button
                  onClick={() => {
                    setNewVisit({ reason: '' });
                    setNewVisitDoctorId('');
                    setShowVisitModal(true);
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 justify-center whitespace-nowrap active:scale-[0.98]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Log Visit / Consult
                </button>
              </div>
            )}

            {/* Patient Visit Log List - local scroll */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="font-bold text-slate-500 text-[10px] mb-2 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Visits & Invoices Grid
              </h3>
              <div className="md:flex-1 md:overflow-y-auto space-y-3 pr-1 min-h-0 compact-scroll">
                {selectedPatient.visits?.map((vis) => {
                  const visitBills = patientHistory.filter(b => b.visit_id === vis.id);
                  return (
                    <div key={vis.id} className="border border-slate-200 rounded-xl p-3 space-y-3 hover:border-teal-200 bg-white transition-all shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400 text-[11px] font-semibold">Visit ID: <b className="text-slate-800">{vis.visit_id}</b></span>
                            <button
                              type="button"
                              onClick={() => handleOpenSummary(vis)}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-[10px] px-2 py-1 rounded transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Clinical Notes & AI Summary</span>
                            </button>
                            {vis.patient_summary && (
                              <button
                                type="button"
                                onClick={() => handleOpenStory(vis)}
                                className="bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 text-violet-700 border border-violet-200 font-bold text-[10px] px-2 py-1 rounded transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Patient Story</span>
                              </button>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 text-xs mt-1">Reason: {vis.reason || 'Not Specified'}</p>
                          {vis.doctor && (
                            <p className="text-[11px] text-teal-700 font-semibold mt-0.5">Consulting Doctor: <span className="text-slate-800 font-bold">{vis.doctor.name}</span></p>
                          )}
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Date: {new Date(vis.visit_date).toLocaleString()}</p>
                        </div>
                        
                        {/* Advance Payment creation for receptionist */}
                        {['Admin', 'Receptionist'].includes(userRole) && visitBills.length === 0 && (
                          <div className="border border-teal-100 bg-teal-50/30 p-2 rounded-lg flex flex-col gap-1">
                            <span className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider">Record Advance Deposit</span>
                            <form onSubmit={(e) => handleRecordAdvance(e, vis.id)} className="flex items-center gap-1.5 flex-wrap">
                              <input
                                type="number"
                                className="w-20 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-teal-500 font-bold text-slate-800"
                                placeholder="₹ Amount"
                                value={newAdvancePayment.amount_paid}
                                onChange={(e) => setNewAdvancePayment({ ...newAdvancePayment, amount_paid: e.target.value })}
                                required
                              />
                              <select
                                className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] focus:outline-none font-semibold text-slate-600"
                                value={newAdvancePayment.payment_method}
                                onChange={(e) => setNewAdvancePayment({ ...newAdvancePayment, payment_method: e.target.value })}
                              >
                                <option value="UPI">UPI</option>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Net Banking">Net Banking</option>
                                <option value="Wallet">Wallet</option>
                              </select>
                              <input
                                type="text"
                                className="w-20 bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] focus:outline-none font-medium text-slate-800"
                                placeholder="Ref No"
                                value={newAdvancePayment.transaction_reference}
                                onChange={(e) => setNewAdvancePayment({ ...newAdvancePayment, transaction_reference: e.target.value })}
                              />
                              <button
                                type="submit"
                                className="bg-teal-650 hover:bg-teal-700 text-white font-bold text-[10px] px-2 py-0.5 rounded"
                              >
                                Save
                              </button>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Bills table linked to this visit */}
                      <div className="space-y-2">
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Invoices / Bills:</div>
                        {visitBills.map(bill => (
                          <div key={bill.id} className="border border-slate-100 rounded-lg p-2 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50/50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{bill.bill_id}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  bill.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  bill.payment_status === 'Partial Paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>{bill.payment_status}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                Total: ₹{bill.grand_total.toLocaleString()} | Adjusted Advance: ₹{bill.advance_applied.toLocaleString()} | Outstanding: <b className="text-slate-700 font-bold">₹{bill.balance_amount.toLocaleString()}</b>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Link to record payment if Accountant/Admin and balance exists */}
                              {['Admin', 'Accountant'].includes(userRole) && bill.balance_amount > 0 && (
                                <button
                                  onClick={() => {
                                    setActiveBillForPayment(bill);
                                    setPaymentForm({
                                      amount_paid: bill.balance_amount.toString(),
                                      payment_method: 'UPI',
                                      transaction_reference: ''
                                    });
                                    setActiveTab('billing_history');
                                  }}
                                  className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-1 rounded border border-teal-100 transition-colors"
                                >
                                  Collect
                                </button>
                              )}

                              {/* Print/Download Receipts button if any payment exists */}
                              {bill.payments?.map(pay => (
                                <div key={pay.id} className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => fetchReceiptDetails(pay.id)}
                                    className="bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-sm hover:bg-slate-55 transition-colors"
                                    title={`View receipt`}
                                  >
                                    <Printer className="w-3 h-3 text-slate-500" />
                                    <span className="font-mono text-[9px]">{pay.payment_id.split('-').pop()}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(pay.payment_id);
                                    }}
                                    className="bg-white border border-slate-200 text-slate-400 hover:text-slate-600 p-1 rounded transition-colors shadow-sm"
                                    title="Copy Payment ID"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              {/* Soft delete invoice */}
                              {userRole === 'Admin' && (
                                <button
                                  onClick={() => handleSoftDeleteBill(bill.id)}
                                  className="text-rose-600 hover:text-rose-800 p-1 rounded bg-rose-50 hover:bg-rose-100 transition-colors"
                                  title="Cancel invoice"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Create bill builder if visits has no invoices */}
                        {['Admin', 'Receptionist'].includes(userRole) && visitBills.length === 0 && (
                          <div className="border border-dashed border-slate-200 p-2.5 rounded-lg bg-slate-50/20">
                            
                            {/* BILL BUILDER COMPONENT */}
                            <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2.5">
                              <div className="flex justify-between items-center pb-1 border-b border-slate-100 flex-wrap gap-2 flex-shrink-0">
                                <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Invoice Builder</h5>
                                <div className="flex items-center gap-1.5">

                                  {/* ⚡ Auto Doctor Fee button with Follow-up detection */}
                                  {vis.doctor && (() => {
                                    const { isFollowUp, daysDiff, validityDays } = checkFollowUpStatus(vis);
                                    return (
                                      <div className="flex items-center gap-1.5">
                                        {isFollowUp ? (
                                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            FREE FOLLOW-UP ({daysDiff}d ago / {validityDays}d limit)
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                            REGULAR ({validityDays}d validity)
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleAddDoctorFeeItem(vis)}
                                          title={isFollowUp ? `Auto-fill FREE Follow-up Fee (₹0)` : `Auto-fill Doctor Consultation Fee (₹${vis.doctor.consultation_fee ?? 500})`}
                                          className={`text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1 shadow-sm border ${
                                            isFollowUp 
                                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold'
                                              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
                                          }`}
                                        >
                                          <span>⚡ {isFollowUp ? 'Auto FREE Follow-Up Fee (₹0)' : `Auto Doctor Fee (₹${vis.doctor.consultation_fee ?? 500})`}</span>
                                        </button>
                                      </div>
                                    );
                                  })()}

                                  {/* ⚡ Auto-fill from Prescription button */}
                                  {(vis.tests_list || vis.medicines_list) && (
                                    <button
                                      type="button"
                                      onClick={() => fetchPrescriptionSuggestedItems(vis.id)}
                                      disabled={prescAutoFillLoading && prescAutoFillVisitId === vis.id}
                                      title="Auto-populate bill with tests and services from the saved prescription"
                                      className={`text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1 shadow-sm border ${
                                        prescAutoFillLoading && prescAutoFillVisitId === vis.id
                                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                      }`}
                                    >
                                      {prescAutoFillLoading && prescAutoFillVisitId === vis.id ? (
                                        <>
                                          <span className="animate-spin w-2 h-2 border-t-2 border-emerald-600 rounded-full inline-block"></span>
                                          Matching...
                                        </>
                                      ) : (
                                        <>⚡ Auto-fill from Rx</>
                                      )}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => fetchAiRecommendations(vis.id, vis.reason)}
                                    disabled={aiRecommendationsLoading}
                                    className={`text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1 shadow-sm ${
                                      aiRecommendationsLoading
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                                    }`}
                                  >
                                    {aiRecommendationsLoading && aiRecommenderVisitId === vis.id ? (
                                      <>
                                        <span className="animate-spin w-2 h-2 border-t-2 border-teal-600 rounded-full inline-block"></span>
                                        Analyzing...
                                      </>
                                    ) : (
                                      <>✨ AI Suggester</>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* AI Recommendations Section */}
                              {aiRecommenderVisitId === vis.id && (aiRecommendations.length > 0 || aiRecommendationsLoading || aiExplanation) && (
                                <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 space-y-1.5">
                                  <div className="flex justify-between items-center flex-shrink-0">
                                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                      <span>✦ AI Suggestions</span>
                                    </span>
                                    {aiRecommendations.length > 0 && (
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          setAiRecommendations([]);
                                          setAiExplanation('');
                                          setAiRecommenderVisitId(null);
                                        }}
                                        className="text-[10px] text-rose-600 hover:text-rose-700 font-bold"
                                      >
                                        Clear
                                      </button>
                                    )}
                                  </div>

                                  {aiRecommendationsLoading ? (
                                    <div className="py-2 text-center space-y-1">
                                      <div className="w-3.5 h-3.5 border-t-2 border-b-2 border-teal-650 rounded-full animate-spin mx-auto"></div>
                                      <p className="text-[9px] text-slate-500 font-semibold">Consulting AI...</p>
                                    </div>
                                  ) : (
                                    <>
                                      {aiRecommendations.length === 0 && !aiExplanation ? (
                                        <p className="text-[9px] text-slate-500 italic">No recommendations.</p>
                                      ) : (
                                        <div className="space-y-1.5">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                            {aiRecommendations.map((item, index) => (
                                              <div key={index} className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between shadow-sm hover:border-teal-500 transition-all duration-200">
                                                <div>
                                                  <div className="flex justify-between items-start gap-1">
                                                    <span className="font-bold text-slate-800 text-[10px] leading-tight">{item.service_name}</span>
                                                    <span className="font-extrabold text-teal-600 text-[10px]">₹{item.price}</span>
                                                  </div>
                                                  <p className="text-[9px] text-slate-500 leading-normal mt-1 italic">"{item.reason}"</p>
                                                </div>
                                                <div className="mt-2 flex justify-end">
                                                  <button
                                                    type="button"
                                                    onClick={() => addRecommendedItem(item)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[9px] px-2 py-0.5 rounded transition-colors flex items-center gap-0.5 shadow-sm"
                                                  >
                                                    <Plus className="w-3 h-3" />
                                                    Add
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {aiExplanation && (
                                            <div className="text-[9px] bg-teal-50/50 border border-teal-100 rounded-lg p-1.5 text-slate-600 italic leading-relaxed border-l-2 border-teal-500">
                                              <strong className="text-teal-800 font-bold not-italic">Clinical Context:</strong> {aiExplanation}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Service item selector */}
                              <div className="flex gap-2 flex-wrap items-end flex-shrink-0">
                                <div className="flex-1 min-w-[150px]">
                                  <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Select Service</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
                                    value={selectedServiceId}
                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                  >
                                    <option value="">-- Choose from Catalog --</option>
                                    {availableServices.map(s => (
                                      <option key={s.id} value={s.id}>{s.category} ➔ {s.name} (₹{s.price})</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="w-20 flex-shrink-0">
                                  <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price (₹)</label>
                                  <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                                    placeholder="Price"
                                    value={customItemPrice}
                                    onChange={(e) => setCustomItemPrice(e.target.value)}
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={addBillItem}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-1 rounded-lg transition-all flex items-center gap-0.5 shadow-sm h-[26px] self-end"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </button>
                              </div>

                              {/* Active items list for this bill */}
                              {billItems.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 flex-shrink-0">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bill Line Items</span>

                                  {/* Unmatched Rx items warning */}
                                  {prescAutoFillVisitId === vis.id && prescUnmatchedItems && prescUnmatchedItems.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[9px] text-amber-800">
                                      <span className="font-extrabold uppercase tracking-wider">⚠ Not in catalog:</span>{' '}
                                      <span className="font-semibold">{prescUnmatchedItems.join(', ')}</span>
                                      <span className="text-amber-600 ml-1">(Add manually or update catalog)</span>
                                    </div>
                                  )}

                                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/30 text-[10px]">
                                    {billItems.map((item, index) => (
                                      <div key={index} className="flex justify-between items-center py-1 px-2.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="font-semibold text-slate-800 truncate">{item.service_name}</span>
                                          {item.fromPrescription && (
                                            <span
                                              title={item.matchReason || 'Auto-filled from prescription'}
                                              className="flex-shrink-0 bg-teal-100 text-teal-700 border border-teal-200 text-[8px] font-extrabold px-1 py-0.5 rounded uppercase tracking-wider cursor-help"
                                            >
                                              Rx
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-slate-950">₹{item.amount.toLocaleString()}</span>
                                          <button
                                            onClick={() => removeBillItem(index)}
                                            className="text-rose-600 hover:text-rose-800 p-0.5"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* AI Billing Auditor */}
                                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1 flex-shrink-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
                                        <Brain className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                                        <span>AI Auditor & NHA Rate Agent</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={handleVerifyExternalRates}
                                          disabled={rateVerificationLoading}
                                          className="bg-blue-50 hover:bg-blue-100 text-blue-750 border border-blue-200 text-[9px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          {rateVerificationLoading ? (
                                            <>
                                              <span className="animate-spin w-2 h-2 border-t-2 border-blue-600 rounded-full inline-block"></span>
                                              Verifying...
                                            </>
                                          ) : (
                                            <>
                                              <Globe className="w-2.5 h-2.5 text-blue-600" />
                                              NHA Rates
                                            </>
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => runAnomalyCheck(vis)}
                                          disabled={anomalyCheckLoading}
                                          className="bg-violet-50 hover:bg-violet-100 text-violet-750 border border-violet-200 text-[9px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          {anomalyCheckLoading ? (
                                            <>
                                              <span className="animate-spin w-2 h-2 border-t-2 border-violet-600 rounded-full inline-block"></span>
                                              Auditing...
                                            </>
                                          ) : (
                                            <>
                                              <Search className="w-2.5 h-2.5" />
                                              Audit
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {anomalyResult ? (
                                      <div className={`p-2 rounded border text-[9px] ${
                                        anomalyResult.status === 'clear'
                                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                                          : anomalyResult.status === 'warning'
                                          ? 'bg-amber-50/50 border-amber-200 text-amber-800'
                                          : 'bg-rose-50/50 border-rose-200 text-rose-800'
                                      }`}>
                                        <div className="flex items-center justify-between font-bold">
                                          <div className="flex items-center gap-1">
                                            {anomalyResult.status === 'clear' && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
                                            {anomalyResult.status === 'warning' && <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />}
                                            {anomalyResult.status === 'critical' && <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />}
                                            <span className="uppercase text-[8px] tracking-wider font-extrabold">{anomalyResult.status}</span>
                                          </div>
                                          {anomalyResult.auto_corrections && (
                                            <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                              ✨ AI Auto-Fix Ready
                                            </span>
                                          )}
                                        </div>
                                        <p className="font-bold text-[9px] leading-snug mt-0.5">{anomalyResult.summary}</p>
                                        
                                        {/* Auto-Resolve Button */}
                                        {anomalyResult.status !== 'clear' && anomalyResult.auto_corrections && (
                                          <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 flex items-center justify-between">
                                            <span className="text-[8px] font-extrabold text-slate-600">
                                              {anomalyResult.auto_corrections.savings_amount > 0
                                                ? `Potential Savings: ₹${anomalyResult.auto_corrections.savings_amount.toFixed(2)}`
                                                : 'Auto-Corrections Available'}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={handleAutoResolveInvoice}
                                              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-[9px] font-black px-2 py-1 rounded-md shadow transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                            >
                                              <Sparkles className="w-2.5 h-2.5" />
                                              Auto-Resolve Invoice
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                  {/* Total Summary */}
                                  <div className="flex justify-between items-center pt-1.5 px-1 border-t border-slate-100 text-[11px] flex-shrink-0">
                                    <div>
                                      <span className="text-slate-400 font-bold">Subtotal:</span>
                                      <span className="font-extrabold text-slate-905 ml-1">₹{billItems.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (anomalyResult && !anomalyResult.safe_to_proceed) {
                                          const proceed = window.confirm(`⚠️ AI Auditor WARNING:\n${anomalyResult.summary}\n\nIssues:\n${anomalyResult.issues.map(i => '- ' + i).join('\n')}\n\nAre you sure you want to generate this invoice anyway?`);
                                          if (!proceed) return;
                                        }
                                        handleCreateBill(vis.id);
                                      }}
                                      style={{ backgroundColor: '#064e3b', color: '#ffffff' }}
                                      className="hover:bg-[#064e3b] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                    >
                                       <Receipt className="w-3.5 h-3.5 text-emerald-100" />
                                       Generate Invoice
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {selectedPatient.visits?.length === 0 && (
                  <p className="text-center text-slate-500 text-xs py-6 italic">No consults logged.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : userRole === 'Doctor' ? (
        /* Doctor's Medical Records Directory - No Registration Form for Doctor */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm w-full space-y-4 animate-in fade-in duration-150 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs border border-emerald-100">
            <FileText className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-extrabold text-slate-900 text-lg">
              Patient Medical Records Directory
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              As an attending doctor, you directly consult and treat patients. New patient registration and token intake are handled by Front-Desk Receptionists.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Select or search any patient from the directory on the left to review their previous consultation notes, prescribed medications, diagnostic reports, and medical history.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Front-Desk Receptionist handles patient check-in & registration
              </span>
            </div>
          </div>
        </div>
      ) : (
          /* Register Patient Profile form (displayed in right panel when no patient is selected) - FULL SCREEN WIDTH & 2-COLUMN RESPONSIVE LAYOUT */
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm w-full space-y-4 animate-in fade-in duration-150 overflow-hidden">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-teal-600" />
                  New Patient Registration
                </h3>
                <p className="text-slate-400 text-xs">Register a new patient profile into the central hospital records directory.</p>
              </div>
              {/* HERO VOICE ACTION BUTTONS */}
              <div className="flex items-center flex-wrap gap-2 shrink-0 max-w-full">
                {/* Finder Toggle inside Registration Form Header */}
                <button
                  type="button"
                  onClick={() => setFinderCollapsed(prev => !prev)}
                  className={`text-xs font-bold px-2.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    finderCollapsed
                      ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100 shadow-xs ring-1 ring-teal-400/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                  title={finderCollapsed ? 'Show Patient Finder' : 'Hide Patient Finder'}
                >
                  {finderCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5 text-teal-600" /> : <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{finderCollapsed ? `Finder (${patients.length})` : 'Hide Finder'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (guidedVoiceStep || intakeVoice.isListening) {
                      stopGuidedVoiceIntake(false);
                      setShowVoiceIntake(false);
                    } else {
                      startGuidedVoiceIntake();
                    }
                  }}
                  className={`relative group overflow-hidden text-xs font-black px-3.5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
                    guidedVoiceStep || intakeVoice.isListening
                      ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-rose-500/40 ring-4 ring-rose-400/50 animate-pulse'
                      : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-teal-500/30 ring-2 ring-teal-400/40 hover:ring-teal-300'
                  }`}
                  title="Speak patient details step-by-step and press Enter on keyboard to advance"
                >
                  {guidedVoiceStep || intakeVoice.isListening ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                      </span>
                      <span>● LISTENING ({GUIDED_STEPS.find(s => s.id === guidedVoiceStep)?.label || 'Guided Voice'}) - Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
                      <span>🎙️ Guided Voice Intake <span className="hidden xl:inline">(Enter ↵ to Advance)</span></span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* GUIDED ENTER-KEY VOICE FLOW PROGRESS BANNER */}
            {guidedVoiceStep && (
              <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 border-2 border-teal-400/80 rounded-2xl p-3.5 shadow-xl text-white animate-in slide-in-from-top-2 duration-200 ring-4 ring-teal-500/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                      <Mic className="w-5 h-5" />
                    </div>
                    {/* Live Audio Waveform Animated Bars */}
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-teal-900/40 rounded-xl border border-teal-500/30 shrink-0">
                      <span className={`w-1 bg-teal-400 rounded-full transition-all ${intakeVoice.isListening ? 'animate-pulse h-3.5' : 'h-2'}`} />
                      <span className={`w-1 bg-cyan-300 rounded-full transition-all ${intakeVoice.isListening ? 'animate-bounce h-5' : 'h-3'}`} style={{ animationDelay: '100ms' }} />
                      <span className={`w-1 bg-teal-300 rounded-full transition-all ${intakeVoice.isListening ? 'animate-pulse h-6' : 'h-4'}`} style={{ animationDelay: '200ms' }} />
                      <span className={`w-1 bg-emerald-400 rounded-full transition-all ${intakeVoice.isListening ? 'animate-bounce h-4' : 'h-2.5'}`} style={{ animationDelay: '150ms' }} />
                      <span className={`w-1 bg-cyan-400 rounded-full transition-all ${intakeVoice.isListening ? 'animate-pulse h-3' : 'h-1.5'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          Guided Step Active
                        </span>
                        <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-900/60 px-2 py-0.5 rounded-md border border-teal-500/40">
                          {GUIDED_STEPS.find(s => s.id === guidedVoiceStep)?.label}
                        </span>
                      </div>
                      {(intakeVoice.interimTranscript || intakeVoice.transcript || intakeVoice.fullText) ? (
                        <p className="text-xs font-mono text-emerald-300 font-bold mt-0.5 truncate">
                          🎙️ Hearing: "{intakeVoice.interimTranscript || intakeVoice.transcript || intakeVoice.fullText}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                          {GUIDED_STEPS.find(s => s.id === guidedVoiceStep)?.prompt} (or press Enter ↵ to advance)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleNextGuidedStep(guidedVoiceStep)}
                      className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
                      title="Confirm and move to next detail (or press Enter on keyboard)"
                    >
                      <span>Next Field [Enter ↵]</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => stopGuidedVoiceIntake(false)}
                      className="text-slate-300 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="Stop Guided Voice Intake (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Stop (Esc)</span>
                    </button>
                  </div>
                </div>

                {/* 5-Step Visual Flow Progression */}
                <div className="grid grid-cols-5 gap-1.5 mt-2.5 pt-2.5 border-t border-teal-500/20 text-[9.5px] font-bold">
                  {GUIDED_STEPS.map((st, idx) => {
                    const isCurrent = guidedVoiceStep === st.id;
                    const isFilled = Boolean(
                      (st.id === 'name' && newPatient.name) ||
                      (st.id === 'age_gender' && (newPatient.age || newPatient.gender)) ||
                      (st.id === 'mobile_number' && newPatient.mobile_number) ||
                      (st.id === 'address' && newPatient.address) ||
                      (st.id === 'chief_complaints' && newPatient.chief_complaints)
                    );
                    return (
                      <div
                        key={st.id}
                        onClick={() => handleToggleSingleFieldIntake(st.id)}
                        className={`py-1 px-1.5 rounded-lg text-center truncate transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-rose-500 text-white font-black ring-2 ring-rose-300 shadow-xs scale-[1.02]'
                            : isFilled
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                        title={`Click to jump to ${st.label}`}
                      >
                        <span>{idx + 1}. {st.id === 'age_gender' ? 'Age/Sex' : st.id === 'chief_complaints' ? 'Reason' : st.id.replace('_', ' ')}</span>
                        {isFilled && !isCurrent && <span> ✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LIVE AUDIO WAVEFORM & TRANSCRIPT PREVIEW PILL */}
            {!guidedVoiceStep && (intakeVoice.isListening || intakeVoice.fullText || intakeVoice.transcript) && (
              <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 border-2 border-teal-500/40 rounded-2xl p-3.5 text-white shadow-xl shadow-teal-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300 ring-4 ring-teal-500/10">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Live Audio Waveform Animated Bars */}
                  <div className="flex items-center gap-1 px-2.5 py-2 bg-teal-900/40 rounded-xl border border-teal-500/30 shrink-0">
                    <span className={`w-1 bg-teal-400 rounded-full transition-all ${intakeVoice.isListening ? 'animate-pulse h-3.5' : 'h-2'}`} />
                    <span className={`w-1 bg-cyan-300 rounded-full transition-all ${intakeVoice.isListening ? 'animate-bounce h-5' : 'h-3'}`} style={{ animationDelay: '100ms' }} />
                    <span className={`w-1 bg-teal-300 rounded-full transition-all ${intakeVoice.isListening ? 'animate-pulse h-6' : 'h-4'}`} style={{ animationDelay: '200ms' }} />
                    <span className={`w-1 bg-emerald-400 rounded-full transition-all ${intakeVoice.isListening ? 'animate-bounce h-4' : 'h-2.5'}`} style={{ animationDelay: '150ms' }} />
                    <span className={`w-1 bg-cyan-400 rounded-full transition-all ${intakeVoice.isListening ? 'animate-pulse h-3' : 'h-1.5'}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {intakeVoice.isListening ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-400">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          Live Listening (Ambient Mic Active)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-teal-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Voice Intake Transcript Captured
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-teal-300/70 border border-teal-500/20 px-1.5 py-0.2 rounded hidden sm:inline">
                        Groq LLM Pipeline
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-100 mt-1 truncate max-w-xl font-medium tracking-tight">
                      <span className="text-teal-400 font-bold">Listening: </span>
                      <span className="text-slate-200">
                        "{intakeVoice.interimTranscript || intakeVoice.transcript || intakeVoice.fullText || 'Ramesh Sharma, 45 saal, severe chest discomfort since morning...'}"
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick Action Controls inside Pill */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                  {intakeVoice.isListening ? (
                    <button
                      type="button"
                      onClick={() => {
                        intakeVoice.stopListening();
                        if (intakeVoice.fullText) handleParseVoiceIntake(intakeVoice.fullText);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Stop & Parse</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        intakeVoice.resetTranscript();
                        intakeVoice.startListening();
                      }}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-teal-400" />
                      <span>Speak Again</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleParseVoiceIntake(intakeVoice.fullText || intakeVoice.transcript || "Ramesh Sharma, 45 saal, male, 9876543210, Indirapuram, severe chest discomfort since morning")}
                    disabled={voiceIntakeParsing}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {voiceIntakeParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>⚡ Auto-Fill Form</span>
                  </button>
                </div>
              </div>
            )}

            {/* SPACIOUS 2-COLUMN FORM (Fills the entire screen width, no awkward blank space, no nested card scroll) */}
            <form onSubmit={handleRegisterPatient} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Form Column: Personal & Contact */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Patient Full Name *</span>
                        {guidedVoiceStep === 'name' && (
                          <span className="text-[9.5px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">
                            🎙️ Speak Name... (Press Enter ↵)
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleSingleFieldIntake('name')}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          guidedVoiceStep === 'name'
                            ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                            : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                        }`}
                        title={guidedVoiceStep === 'name' ? 'Stop mic' : '🎙️ Dictate Name'}
                      >
                        {guidedVoiceStep === 'name' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNextGuidedStep('name');
                        }
                      }}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs placeholder-slate-400 focus:outline-none transition-all font-semibold ${
                        guidedVoiceStep === 'name'
                          ? 'bg-white border-2 border-rose-500 text-slate-950 ring-4 ring-rose-400/25 shadow-sm'
                          : voicePopulatedFields.includes('name')
                          ? 'bg-teal-50/40 border-2 border-teal-400 text-teal-950 focus:bg-white'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500'
                      }`}
                      placeholder="e.g. Rahul Sharma"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>Age *</span>
                          {guidedVoiceStep === 'age_gender' && (
                            <span className="text-[9.5px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">
                              🎙️ Speak Age/Sex
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleSingleFieldIntake('age_gender')}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            guidedVoiceStep === 'age_gender'
                              ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                              : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                          }`}
                          title="🎙️ Dictate Age & Gender (e.g. 32 Male)"
                        >
                          {guidedVoiceStep === 'age_gender' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                      </label>
                      <input
                        ref={ageInputRef}
                        type="number"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNextGuidedStep('age_gender');
                          }
                        }}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs placeholder-slate-400 focus:outline-none transition-all font-semibold ${
                          guidedVoiceStep === 'age_gender'
                            ? 'bg-white border-2 border-rose-500 text-slate-950 ring-4 ring-rose-400/25 shadow-sm'
                            : voicePopulatedFields.includes('age')
                            ? 'bg-teal-50/40 border-2 border-teal-400 text-teal-950 focus:bg-white'
                            : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500'
                        }`}
                        placeholder="Age in Yrs"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Gender *</span>
                      </label>
                      <select
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNextGuidedStep('age_gender');
                          }
                        }}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all font-bold cursor-pointer ${
                          guidedVoiceStep === 'age_gender'
                            ? 'bg-white border-2 border-rose-400 text-slate-950'
                            : voicePopulatedFields.includes('gender')
                            ? 'bg-teal-50/40 border-2 border-teal-400 text-teal-950 focus:bg-white'
                            : !newPatient.gender
                            ? 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 text-slate-400 font-medium'
                            : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 text-slate-700'
                        }`}
                        value={newPatient.gender || ''}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                        required
                      >
                        <option value="" disabled className="text-slate-400">Select Gender</option>
                        <option value="Male" className="text-slate-700 font-bold">Male</option>
                        <option value="Female" className="text-slate-700 font-bold">Female</option>
                        <option value="Other" className="text-slate-700 font-bold">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Mobile Number *</span>
                        {guidedVoiceStep === 'mobile_number' && (
                          <span className="text-[9.5px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">
                            🎙️ Speak 10 Digits... (Enter ↵)
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleSingleFieldIntake('mobile_number')}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          guidedVoiceStep === 'mobile_number'
                            ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                            : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                        }`}
                        title="🎙️ Dictate Mobile Number"
                      >
                        {guidedVoiceStep === 'mobile_number' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    </label>
                    <input
                      ref={mobileInputRef}
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNextGuidedStep('mobile_number');
                        }
                      }}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs placeholder-slate-400 focus:outline-none transition-all font-semibold ${
                        guidedVoiceStep === 'mobile_number'
                          ? 'bg-white border-2 border-rose-500 text-slate-950 ring-4 ring-rose-400/25 shadow-sm'
                          : voicePopulatedFields.includes('mobile_number')
                          ? 'bg-teal-50/40 border-2 border-teal-400 text-teal-950 focus:bg-white'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500'
                      }`}
                      placeholder="10-digit Phone Number"
                      value={newPatient.mobile_number}
                      onChange={(e) => setNewPatient({ ...newPatient, mobile_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Email Address (For Digital Receipts & PDF Handouts)</span>
                      </span>
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-xl px-3.5 py-2.5 text-xs placeholder-slate-400 focus:outline-none transition-all font-medium bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500"
                      placeholder="patient@example.com (Optional)"
                      value={newPatient.email || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Right Form Column: Address & Initial Symptoms */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Residential Address</span>
                        {guidedVoiceStep === 'address' && (
                          <span className="text-[9.5px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">
                            🎙️ Speak City/Address... (Enter ↵)
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleSingleFieldIntake('address')}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          guidedVoiceStep === 'address'
                            ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                            : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                        }`}
                        title="🎙️ Dictate Address"
                      >
                        {guidedVoiceStep === 'address' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    </label>
                    <textarea
                      ref={addressInputRef}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleNextGuidedStep('address');
                        }
                      }}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs placeholder-slate-400 focus:outline-none transition-all font-medium h-[88px] resize-none ${
                        guidedVoiceStep === 'address'
                          ? 'bg-white border-2 border-rose-500 text-slate-950 ring-4 ring-rose-400/25 shadow-sm'
                          : voicePopulatedFields.includes('address')
                          ? 'bg-teal-50/40 border-2 border-teal-400 text-teal-950 focus:bg-white'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500'
                      }`}
                      placeholder="House/Street, Area, City, Pincode"
                      value={newPatient.address}
                      onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Initial Reason for Visit / Chief Complaint (Optional)</span>
                        {guidedVoiceStep === 'chief_complaints' && (
                          <span className="text-[9.5px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">
                            🎙️ Speak Symptoms... (Enter ↵ to Finish)
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleSingleFieldIntake('chief_complaints')}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          guidedVoiceStep === 'chief_complaints'
                            ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                            : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                        }`}
                        title="🎙️ Dictate Reason/Symptoms"
                      >
                        {guidedVoiceStep === 'chief_complaints' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    </label>
                    <input
                      ref={complaintsInputRef}
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNextGuidedStep('chief_complaints');
                        }
                      }}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs placeholder-slate-400 focus:outline-none transition-all font-medium ${
                        guidedVoiceStep === 'chief_complaints'
                          ? 'bg-white border-2 border-rose-500 text-slate-950 ring-4 ring-rose-400/25 shadow-sm'
                          : voicePopulatedFields.includes('chief_complaints')
                          ? 'bg-teal-50/40 border-2 border-teal-400 text-teal-950 focus:bg-white'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500'
                      }`}
                      placeholder="e.g. Fever, stomach pain, routine OPD checkup..."
                      value={newPatient.chief_complaints || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, chief_complaints: e.target.value })}
                    />

                    {/* AI Triage & Suggested Specialty Strip */}
                    {(() => {
                      const triage = analyzeChiefComplaint(newPatient.chief_complaints);
                      if (!triage) return null;
                      return (
                        <div className="mt-2.5 rounded-xl p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 text-white shadow-md animate-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                              <span>AI OPD Triage & Doctor Allotment Guidance</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${triage.priorityBadgeClass}`}>
                              Triage: {triage.priority} Priority
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            <div className="bg-slate-800/80 rounded-lg px-2.5 py-1.5 border border-slate-700/60">
                              <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider">Detected Specialty</span>
                              <span className="font-extrabold text-cyan-300 text-xs">{triage.specialty}</span>
                            </div>
                            <div className="bg-slate-800/80 rounded-lg px-2.5 py-1.5 border border-slate-700/60">
                              <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider">Clinical Guidance</span>
                              <span className="font-medium text-slate-300 text-xs">{triage.note}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  ref={registerBtnRef}
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-400/40 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.99] cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Register Patient Profile
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Consultation Summary & AI Handout Modal */}
      {showSummaryModal && selectedVisit && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <span className="text-teal-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1 font-sans">
                  <Brain className="w-3.5 h-3.5 animate-pulse text-teal-550" />
                  HospiSynAI Clinical Desk & AI Assistant
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Consultation Summary & Patient Handout</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 font-semibold">
                  <span className="bg-slate-200/60 px-2 py-0.5 rounded text-slate-700">Patient: <b className="text-slate-900">{selectedPatient.name}</b> ({selectedPatient.age} Yrs / {selectedPatient.gender})</span>
                  <span className="bg-slate-200/60 px-2 py-0.5 rounded text-slate-700">Visit ID: <b className="text-slate-900">{selectedVisit.visit_id}</b></span>
                  {selectedVisit.doctor && (
                    <span className="bg-teal-50 px-2 py-0.5 rounded text-teal-800">Doctor: <b>{selectedVisit.doctor.name}</b></span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
              {/* Left Pane: Clinical Notes Input Form */}
              <div className="space-y-4 pr-1">
                <h4 className="text-sm font-bold text-slate-900 border-l-4 border-teal-500 pl-2 uppercase tracking-wide flex items-center justify-between gap-1.5 w-full">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Doctor's Clinical Notes
                  </div>
                  <button
                    type="button"
                    onClick={handleAiSuggestTreatment}
                    disabled={aiPrescribeLoading}
                    className={`text-xs font-bold text-white px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                      aiPrescribeLoading
                        ? 'bg-violet-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600'
                    }`}
                  >
                    {aiPrescribeLoading ? (
                      <>
                        <span className="flex gap-0.5">
                          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white" />
                          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white" />
                          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white" />
                        </span>
                        Groq prescribing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Suggest Treatment
                      </>
                    )}
                  </button>
                </h4>
                
                {/* CLINICAL RECORD SECTIONS — COLOR-CODED & CLEARLY DIVIDED FOR DOCTOR */}
                <div className="space-y-3.5">
                  {/* ROW 1: CHIEF COMPLAINTS & WORKING DIAGNOSIS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* CARD 1: CHIEF COMPLAINTS (Warm Amber / Rose Theme) */}
                    <div className="border border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-orange-50/20 to-white rounded-xl p-3 shadow-xs border-l-4 border-l-amber-500 flex flex-col justify-between">
                      <div>
                        <label className="block mb-1.5 flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-[10px]">🩺</span>
                            <span>Chief Complaints</span>
                            {activeClinicalFieldMic === 'chief_complaints' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleClinicalFieldMic('chief_complaints')}
                              className={`p-1 rounded-md transition-all cursor-pointer ${
                                activeClinicalFieldMic === 'chief_complaints'
                                  ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                  : 'text-amber-700 hover:bg-amber-100'
                              }`}
                              title={activeClinicalFieldMic === 'chief_complaints' ? 'Stop mic' : '🎙️ Dictate Chief Complaints'}
                            >
                              {activeClinicalFieldMic === 'chief_complaints' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-[9px] text-amber-800/70 font-semibold italic">mic</span>
                          </div>
                        </label>
                        
                        {/* Quick Complaints Tags */}
                        <div className="flex flex-wrap gap-1 mb-2 max-h-[46px] overflow-y-auto pb-0.5 compact-scroll">
                          {COMMON_COMPLAINTS.map((tag) => {
                            const isSelected = (summaryForm.chief_complaints || '').includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('chief_complaints', tag)}
                                className={`text-[9.5px] px-2 py-0.5 rounded-md border transition-all font-bold ${
                                  isSelected 
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                                    : 'bg-white/80 text-amber-900 border-amber-200/90 hover:bg-amber-100/70'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <textarea
                        className="w-full bg-white/90 border border-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-amber-900/30 focus:outline-none font-medium transition-all h-20 resize-none shadow-2xs"
                        placeholder="e.g. Chronic cough for 3 weeks, mild chest congestion, low-grade fever..."
                        value={summaryForm.chief_complaints}
                        onChange={(e) => setSummaryForm({ ...summaryForm, chief_complaints: e.target.value })}
                      />
                    </div>
     
                    {/* CARD 2: WORKING DIAGNOSIS (Indigo / Blue Theme) */}
                    <div className="border border-indigo-200/90 bg-gradient-to-br from-indigo-50/50 via-blue-50/20 to-white rounded-xl p-3 shadow-xs border-l-4 border-l-indigo-600 flex flex-col justify-between">
                      <div>
                        <label className="block mb-1.5 flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-xs uppercase tracking-wider">
                            <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-800 flex items-center justify-center font-bold text-[10px]">🧠</span>
                            <span>Working Diagnosis</span>
                            {activeClinicalFieldMic === 'diagnosis' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleClinicalFieldMic('diagnosis')}
                            className={`p-1 rounded-md transition-all cursor-pointer ${
                              activeClinicalFieldMic === 'diagnosis'
                                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                : 'text-indigo-700 hover:bg-indigo-100'
                            }`}
                            title={activeClinicalFieldMic === 'diagnosis' ? 'Stop mic' : '🎙️ Dictate Diagnosis'}
                          >
                            {activeClinicalFieldMic === 'diagnosis' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          </button>
                        </label>

                        {/* Quick Common Diagnosis Tags */}
                        <div className="flex flex-wrap gap-1 mb-2 max-h-[46px] overflow-y-auto pb-0.5 compact-scroll">
                          {['URTI', 'Acute Bronchitis', 'Pharyngitis', 'Acute Gastritis', 'Viral Pyrexia', 'Hypertension', 'T2 Diabetes'].map((diag) => {
                            const isSelected = (summaryForm.diagnosis || '').includes(diag);
                            return (
                              <button
                                key={diag}
                                type="button"
                                onClick={() => {
                                  const current = summaryForm.diagnosis || '';
                                  if (current.includes(diag)) {
                                    setSummaryForm({ ...summaryForm, diagnosis: current.replace(diag, '').replace(/,\s*,/g, ',').trim() });
                                  } else {
                                    setSummaryForm({ ...summaryForm, diagnosis: current ? `${current}, ${diag}` : diag });
                                  }
                                }}
                                className={`text-[9.5px] px-2 py-0.5 rounded-md border transition-all font-bold ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                                    : 'bg-white/80 text-indigo-900 border-indigo-200/90 hover:bg-indigo-100/70'
                                }`}
                              >
                                {diag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <textarea
                        className="w-full bg-white/90 border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-indigo-900/30 focus:outline-none font-medium transition-all h-20 resize-none shadow-2xs"
                        placeholder="e.g. Acute Bronchitis secondary to viral infection"
                        value={summaryForm.diagnosis}
                        onChange={(e) => setSummaryForm({ ...summaryForm, diagnosis: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* SECTION SEPARATOR LINE WITH BADGE */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="h-px bg-gradient-to-r from-emerald-300 to-transparent flex-1" />
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 border border-emerald-300 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span>💊</span>
                      <span>Rx Prescription & Dosing Schedule</span>
                    </span>
                    <div className="h-px bg-gradient-to-r from-transparent to-emerald-300 flex-1" />
                  </div>

                  {/* CARD 3: PRESCRIBE MEDICINES (Emerald / Teal Medical Theme) */}
                  <div className="border border-emerald-300/90 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white rounded-xl p-3.5 shadow-xs border-l-4 border-l-emerald-600">
                    <div className="flex justify-between items-center mb-2">
                      <label className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold text-[10px]">Rx</span>
                        <span>Prescription Dosing Builder</span>
                        {activeClinicalFieldMic === 'medicines_list' && (
                          <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                        )}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleClinicalFieldMic('medicines_list')}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            activeClinicalFieldMic === 'medicines_list'
                              ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                              : 'text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={activeClinicalFieldMic === 'medicines_list' ? 'Stop mic' : '🎙️ Dictate Medicines'}
                        >
                          {activeClinicalFieldMic === 'medicines_list' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-[9.5px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                          Catalog Linked
                        </span>
                      </div>
                    </div>
                    
                    {/* Prescription Builder Row */}
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/90 mb-2.5 space-y-2 text-xs shadow-2xs">
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Timing Selector */}
                        <div>
                          <span className="text-[9.5px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-1">Timing</span>
                          <div className="flex gap-1">
                            {['After Meals', 'Empty Stomach'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setPrescTiming(t)}
                                className={`flex-1 text-[10px] py-1 rounded-md font-bold border transition-all ${
                                  prescTiming === t 
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                                }`}
                              >
                                {t === 'After Meals' ? 'Pc (Khane ke Baad)' : 'Ac (Khali Pet)'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Frequency Selector */}
                        <div>
                          <span className="text-[9.5px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-1">Frequency</span>
                          <select
                            value={prescFrequency}
                            onChange={(e) => setPrescFrequency(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                          >
                            <option value="Once Daily (OD)">OD (Once Daily)</option>
                            <option value="Twice Daily (BD)">BD (Twice Daily)</option>
                            <option value="Thrice Daily (TID)">TID (Thrice Daily)</option>
                            <option value="At Bedtime (HS)">HS (At Night)</option>
                            <option value="As Needed (SOS)">SOS (As Needed)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2.5 items-center">
                        {/* Duration Selector */}
                        <div>
                          <span className="text-[9.5px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-1">Duration</span>
                          <select
                            value={prescDuration}
                            onChange={(e) => setPrescDuration(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                          >
                            <option value="3 Days">3 Days</option>
                            <option value="5 Days">5 Days</option>
                            <option value="7 Days">7 Days</option>
                            <option value="10 Days">10 Days</option>
                            <option value="15 Days">15 Days</option>
                            <option value="30 Days">30 Days</option>
                            <option value="1 Day">1 Day</option>
                          </select>
                        </div>
                        {/* Quick Medicine Dropdown select */}
                        <div>
                          <span className="text-[9.5px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-1">Quick Select Medicine</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                const med = MEDICINE_DATASTORE.find(m => m.name === e.target.value);
                                if (med) handleAddMedicineFromSuggest(med);
                                e.target.value = '';
                              }
                            }}
                            className="w-full bg-white border border-emerald-300 rounded-md px-2 py-1 text-[11px] font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 shadow-2xs"
                          >
                            <option value="">-- Click to Select Common Drug --</option>
                            {MEDICINE_DATASTORE.map((m, idx) => (
                              <option key={idx} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Autocomplete Input Search */}
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="🔍 Type medicine name to autocomplete (e.g. Dolo, Pan, Azee, Augmentin...)"
                        className="w-full bg-white border border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none font-semibold transition-all text-slate-800 shadow-2xs"
                        value={medicineSearch}
                        onChange={(e) => setMedicineSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (medicineSuggestions.length > 0) {
                              handleAddMedicineFromSuggest(medicineSuggestions[0]);
                            }
                          }
                        }}
                      />
                      
                      {/* Floating suggestions dropdown */}
                      {medicineSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          {medicineSuggestions.map((med, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddMedicineFromSuggest(med)}
                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-950 transition-colors font-semibold flex justify-between items-center"
                            >
                              <span>{med.name}</span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold shrink-0">{med.dosage.split(' for')[0]}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
 
                    <textarea
                      className="w-full bg-white/95 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 rounded-lg px-2.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono transition-all h-24 resize-none shadow-2xs"
                      placeholder="e.g. 1. Paracetamol 650mg (TID for 3 days)&#10;2. Levocetirizine 5mg (HS for 5 days)"
                      value={summaryForm.medicines_list}
                      onChange={(e) => setSummaryForm({ ...summaryForm, medicines_list: e.target.value })}
                    />
                  </div>

                  {/* SECTION SEPARATOR LINE WITH BADGE */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="h-px bg-gradient-to-r from-cyan-300 to-transparent flex-1" />
                    <span className="text-[10px] font-black text-cyan-800 uppercase tracking-widest bg-cyan-50 border border-cyan-300 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span>🔬</span>
                      <span>Diagnostics & Lifestyle Guidelines</span>
                    </span>
                    <div className="h-px bg-gradient-to-r from-transparent to-cyan-300 flex-1" />
                  </div>

                  {/* ROW 3: RECOMMENDED TESTS & LIFESTYLE ADVICE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* CARD 4: RECOMMENDED TESTS (Cyan / Sky Theme) */}
                    <div className="border border-cyan-200/90 bg-gradient-to-br from-cyan-50/50 via-sky-50/20 to-white rounded-xl p-3 shadow-xs border-l-4 border-l-cyan-600 flex flex-col justify-between">
                      <div>
                        <label className="block mb-1.5 flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-cyan-900 font-extrabold text-xs uppercase tracking-wider">
                            <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-800 flex items-center justify-center font-bold text-[10px]">🧪</span>
                            <span>Recommended Tests</span>
                            {activeClinicalFieldMic === 'tests_list' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleClinicalFieldMic('tests_list')}
                              className={`p-1 rounded-md transition-all cursor-pointer ${
                                activeClinicalFieldMic === 'tests_list'
                                  ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                  : 'text-cyan-700 hover:bg-cyan-100'
                              }`}
                              title={activeClinicalFieldMic === 'tests_list' ? 'Stop mic' : '🎙️ Dictate Tests'}
                            >
                              {activeClinicalFieldMic === 'tests_list' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-[9px] text-cyan-800/70 font-semibold italic">mic</span>
                          </div>
                        </label>
                        
                        {/* Quick Tests Tags */}
                        <div className="flex flex-wrap gap-1 mb-2 max-h-[46px] overflow-y-auto pb-0.5 compact-scroll">
                          {COMMON_TESTS.map((tag) => {
                            const isSelected = (summaryForm.tests_list || '').toLowerCase().includes(tag.toLowerCase());
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('tests_list', tag)}
                                className={`text-[9.5px] px-2 py-0.5 rounded-md border transition-all font-bold ${
                                  isSelected 
                                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs' 
                                    : 'bg-white/80 text-cyan-900 border-cyan-200/90 hover:bg-cyan-100/70'
                                }`}
                              >
                                {tag.split(' (')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <textarea
                        className="w-full bg-white/90 border border-cyan-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-cyan-900/30 focus:outline-none font-medium transition-all h-20 resize-none shadow-2xs"
                        placeholder="e.g. CBC (Complete Blood Count), Chest X-Ray PA View"
                        value={summaryForm.tests_list}
                        onChange={(e) => setSummaryForm({ ...summaryForm, tests_list: e.target.value })}
                      />
                    </div>

                    {/* CARD 5: LIFESTYLE & DIETARY ADVICE (Violet / Purple Theme) */}
                    <div className="border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-violet-50/20 to-white rounded-xl p-3 shadow-xs border-l-4 border-l-purple-600 flex flex-col justify-between">
                      <div>
                        <label className="block mb-1.5 flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-purple-900 font-extrabold text-xs uppercase tracking-wider">
                            <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-800 flex items-center justify-center font-bold text-[10px]">🌱</span>
                            <span>Clinical Advice & Guidelines</span>
                            {activeClinicalFieldMic === 'advice' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleClinicalFieldMic('advice')}
                              className={`p-1 rounded-md transition-all cursor-pointer ${
                                activeClinicalFieldMic === 'advice'
                                  ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                  : 'text-purple-700 hover:bg-purple-100'
                              }`}
                              title={activeClinicalFieldMic === 'advice' ? 'Stop mic' : '🎙️ Dictate Advice'}
                            >
                              {activeClinicalFieldMic === 'advice' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-[9px] text-purple-800/70 font-semibold italic">mic</span>
                          </div>
                        </label>
                        
                        {/* Quick Advice Tags */}
                        <div className="flex flex-wrap gap-1 mb-2 max-h-[46px] overflow-y-auto pb-0.5 compact-scroll">
                          {COMMON_ADVICE.map((tag) => {
                            const isSelected = (summaryForm.advice || '').includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('advice', tag)}
                                className={`text-[9.5px] px-2 py-0.5 rounded-md border transition-all font-bold ${
                                  isSelected 
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs' 
                                    : 'bg-white/80 text-purple-900 border-purple-200/90 hover:bg-purple-100/70'
                                }`}
                              >
                                {tag.length > 18 ? `${tag.slice(0, 16)}...` : tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <textarea
                        className="w-full bg-white/90 border border-purple-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-purple-900/30 focus:outline-none font-medium transition-all h-20 resize-none shadow-2xs"
                        placeholder="e.g. Warm saline gargles thrice daily. Drink plenty of warm water. Avoid cold drinks."
                        value={summaryForm.advice}
                        onChange={(e) => setSummaryForm({ ...summaryForm, advice: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* SECTION SEPARATOR LINE WITH BADGE */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-full">
                      Follow-Up & Confirmation
                    </span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>

                  {/* CARD 6: FOLLOW-UP INSTRUCTIONS (Slate / Dark Theme) */}
                  <div className="border border-slate-300/80 bg-slate-50/90 rounded-xl p-3 shadow-xs border-l-4 border-l-slate-800">
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>Follow-up Date / Instructions</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-400 rounded-lg px-2.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-semibold transition-all shadow-2xs"
                      placeholder="e.g. In 5 days or if symptoms worsen"
                      value={summaryForm.follow_up_date}
                      onChange={(e) => setSummaryForm({ ...summaryForm, follow_up_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Right Pane: AI Consultation Summary */}
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between min-h-[350px]">
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Patient-Friendly Summary Assistant
                    </span>
                    {summaryForm.patient_summary && !summaryGenerating && (
                      <button
                        type="button"
                        onClick={handleGenerateAiSummary}
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 underline transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        Regenerate AI
                      </button>
                    )}
                  </div>

                   {summaryError && (
                    summaryError.includes("Groq API key") ? (
                      <div className="mt-3 bg-violet-50/70 border border-violet-100 rounded-xl p-4 text-slate-700 text-xs font-medium space-y-2.5">
                        <div className="flex items-center gap-1.5 text-violet-700 font-extrabold uppercase tracking-wider text-[10px]">
                          <AlertTriangle className="w-4 h-4 text-violet-600 animate-pulse" />
                          Groq AI Sandbox Setup Required
                        </div>
                        <p className="leading-normal">
                          The AI features require a valid <strong>Groq API Key</strong> to be configured in your environment.
                        </p>
                        <div className="bg-white border border-violet-100 rounded-lg p-2.5 font-mono text-[10px] text-slate-600 leading-relaxed shadow-sm">
                          1. Open the project root <code className="bg-slate-100 px-1 py-0.5 rounded font-sans font-bold">.env</code> file<br />
                          2. Set <code className="bg-slate-100 px-1 py-0.5 rounded text-violet-700 font-bold">GROQ_API_KEY=your_groq_key</code><br />
                          3. Restart Docker Compose or local servers
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          💡 Register for free keys at console.groq.com. Local rule checks are still fully operational.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-semibold leading-relaxed">
                        Error: {summaryError}
                      </div>
                    )
                  )}

                  {summaryGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-5">
                      {/* Groq AI thinking animation */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.1))', border:'1px solid rgba(139,92,246,0.2)'}}>
                          <Brain className="w-8 h-8 text-violet-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                          <span className="thinking-dot w-2 h-2 rounded-full bg-violet-400" />
                          <span className="thinking-dot w-2 h-2 rounded-full bg-violet-400" />
                          <span className="thinking-dot w-2 h-2 rounded-full bg-violet-400" />
                        </div>
                      </div>
                      <div className="text-center space-y-1.5">
                        <p className="text-xs font-bold text-slate-700">Groq LLM is drafting the handout...</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                          Translating medical terms into simple English & Hindi (हिंदी)
                        </p>
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                          <span className="text-[10px] text-violet-500 font-bold uppercase tracking-widest">Powered by Groq · Clinical AI</span>
                        </div>
                      </div>
                    </div>
                  ) : summaryForm.patient_summary ? (() => {
                    // Parse the structured storytelling output into visual sections
                    // Handles both old format [English Summary] and new [English Storytelling Summary]
                    const raw = summaryForm.patient_summary;
                    const englishMatch = raw.match(/\[English(?:[^\]]*Summary|\s+Storytelling\s+Summary)\]([\s\S]*?)(?=\[(?:Hindi|Kannada|Tamil|Telugu|Marathi|Bengali|Gujarati|Malayalam|Punjabi|Odia|Urdu|Native|Translation|Language)[^\]]*\]|$)/i);
                    const nativeMatch = raw.match(/\[(?:Hindi|Kannada|Tamil|Telugu|Marathi|Bengali|Gujarati|Malayalam|Punjabi|Odia|Urdu|Native|Translation|Language)[^\]]*\]([\s\S]*?)$/i);
                    const nativeLangHeaderMatch = raw.match(/\[(Hindi|Kannada|Tamil|Telugu|Marathi|Bengali|Gujarati|Malayalam|Punjabi|Odia|Urdu)(?:\s+Summary|\s+Storytelling)[^\]]*\]/i);
                    const actualNativeLang = nativeLangHeaderMatch ? nativeLangHeaderMatch[1] : selectedLanguage;

                    const englishText = englishMatch ? englishMatch[1].trim() : '';
                    const nativeText = nativeMatch ? nativeMatch[1].trim() : '';
                    
                    // isStructured: detect either plain "Morning:" or emoji-prefixed "☀️ Morning:"
                    const isStructured = englishText && (
                      /morning:/i.test(englishText) || /night:/i.test(englishText)
                    );

                    // parseSection: handles labels with or without leading emoji (e.g. "☀️ Morning" or plain "Morning")
                    const parseSection = (text, labels) => {
                      const result = {};
                      for (const label of labels) {
                        const regex = new RegExp(`(?:[^\\w\\n]*)?${label}[^:\\n]*:[^\\S\\n]*(.+?)(?=\\n[^\\n]*:|$)`, 'is');
                        const m = text.match(regex);
                        result[label] = m ? m[1].trim() : null;
                      }
                      const firstLabel = labels.find(l => new RegExp(l + '[^:\\n]*:', 'i').test(text));
                      if (firstLabel) {
                        const splitIdx = text.search(new RegExp(`[^\\n]*${firstLabel}[^:\\n]*:`, 'i'));
                        if (splitIdx > 0) {
                          result['greeting'] = text.slice(0, splitIdx).trim().split('\n').filter(Boolean).join(' ');
                        }
                      }
                      return result;
                    };

                    const enSections = parseSection(englishText, ['Morning', 'Afternoon', 'Night', 'Watch Out For']);
                    const nativeSections = parseSection(nativeText, ['Morning', 'Afternoon', 'Night', 'Watch Out For']);
                    
                    const slotConfig = [
                      { key: 'Morning', emoji: '☀️', label: 'Morning', color: 'from-amber-50 to-orange-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
                      { key: 'Afternoon', emoji: '🌤️', label: 'Afternoon', color: 'from-sky-50 to-blue-50', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700' },
                      { key: 'Night', emoji: '🌙', label: 'Night', color: 'from-indigo-50 to-violet-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
                      { key: 'Watch Out For', emoji: '⚠️', label: 'Watch Out For', color: 'from-rose-50 to-red-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' },
                    ];

                    const activeSections = viewMode === 'en' ? enSections : nativeSections;
                    const isNative = viewMode === 'native';

                    return (
                      <div className="mt-3 flex-1 flex flex-col space-y-3 overflow-y-auto">
                        {/* Tab header / selector bar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewMode('en')}
                              className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                viewMode === 'en'
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              English
                            </button>
                            {nativeText && (
                              <button
                                type="button"
                                onClick={() => setViewMode('native')}
                                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                  viewMode === 'native'
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {actualNativeLang} Summary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleTriggerPdfPreview}
                              disabled={pdfLoading}
                              className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1 ${
                                viewMode === 'pdf'
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {pdfLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                              Prescription Preview
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                            <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Handout Language:</span>
                            <select
                              value={selectedLanguage}
                              onChange={(e) => {
                                const newLang = e.target.value;
                                setSelectedLanguage(newLang);
                                // Auto-regenerate immediately if a summary already exists
                                if (newLang && summaryForm.patient_summary) {
                                  setSummaryGenerating(true);
                                  setSummaryError('');
                                  fetch(`${API_BASE}/visits/${selectedVisit.id}/summary?generate_ai_summary=true&target_language=${newLang}`, {
                                    method: 'PUT',
                                    headers: getHeaders(),
                                    body: JSON.stringify(summaryForm)
                                  })
                                    .then(res => {
                                      if (!res.ok) return res.json().then(d => { throw new Error(d.detail || 'Failed to generate AI summary'); });
                                      return res.json();
                                    })
                                    .then(updatedVisit => {
                                      setSummaryForm(prev => ({ ...prev, patient_summary: updatedVisit.patient_summary || '' }));
                                      setViewMode('native');
                                      showToast(`Summary regenerated in ${newLang}!`);
                                      handleSelectPatient(selectedPatient.id);
                                    })
                                    .catch(err => {
                                      setSummaryError(err.message);
                                      showToast(err.message, 'error');
                                    })
                                    .finally(() => setSummaryGenerating(false));
                                }
                              }}
                              className="bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Select Language --</option>
                              {INDIAN_LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {viewMode === 'pdf' ? (
                          <div className="flex-1 min-h-[300px] rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden relative shadow-inner">
                            {pdfPreviewUrl ? (
                              <iframe
                                src={pdfPreviewUrl}
                                title="Prescription PDF Preview"
                                className="w-full h-full border-none"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                                <Loader2 className="w-6 h-6 animate-spin text-teal-650 mb-2" />
                                <span className="text-xs font-semibold text-slate-500 font-sans">Loading prescription PDF sheet...</span>
                              </div>
                            )}
                          </div>
                        ) : isStructured ? (
                          <div className="space-y-3">
                            {/* Greeting */}
                            {activeSections.greeting && (
                              <p className="text-xs text-teal-850 font-semibold italic bg-teal-50 border border-teal-100 rounded-xl px-3 py-2 leading-relaxed">
                                💬 {activeSections.greeting}
                              </p>
                            )}
                            
                            {/* Routine Slots Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {slotConfig.map(slot => {
                                const val = activeSections[slot.key];
                                const displayLabel = isNative && NATIVE_LABELS[actualNativeLang]?.[slot.key]
                                  ? NATIVE_LABELS[actualNativeLang][slot.key]
                                  : slot.label;
                                  
                                return val ? (
                                  <div key={slot.key} className={`bg-gradient-to-br ${slot.color} border ${slot.border} rounded-xl p-3 shadow-sm`}>
                                    <div className={`text-[9px] font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${slot.badge} w-fit px-2 py-0.5 rounded-full`}>
                                      <span>{slot.emoji}</span> {displayLabel}
                                    </div>
                                    <p className="text-[10px] text-slate-700 leading-relaxed font-semibold">{val}</p>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ) : (
                          // Fallback for old-format summaries: plain styled display
                          <div className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium" style={{borderLeft: '3px solid #14b8a6', minHeight:'120px'}}>
                            {summaryForm.patient_summary}
                          </div>
                        )}

                        {/* Editable raw textarea for doctor edits */}
                        <details className="group">
                          <summary className="cursor-pointer text-[9px] text-slate-400 font-bold uppercase tracking-wider hover:text-slate-600 transition-colors select-none">
                            ✏️ Edit Raw Summary
                          </summary>
                          <textarea
                            className="mt-1 w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-teal-500 font-medium transition-all resize-none leading-relaxed text-slate-700"
                            style={{borderLeft: '3px solid #14b8a6', minHeight:'120px'}}
                            value={summaryForm.patient_summary}
                            onChange={(e) => setSummaryForm({ ...summaryForm, patient_summary: e.target.value })}
                          />
                        </details>
                      </div>
                    );
                  })() : (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4 space-y-4">
                      <div className="bg-teal-50 p-4 rounded-full border border-teal-100">
                        <Brain className="w-8 h-8 text-teal-600" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Generate Patient-Friendly Consultation Handout</h5>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-normal">
                          Fill out the doctor's clinical notes on the left, select the patient's preferred language, and generate a simplified bilingual routine schedule.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Preferred Language:</span>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-slate-800 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Select Language --</option>
                          {INDIAN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAiSummary}
                        className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        Generate AI Patient Summary
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-2.5 px-5 rounded-xl transition-all text-xs"
              >
                Cancel
              </button>
              
              {summaryForm.patient_summary && (
                <>
                  <button
                    type="button"
                    onClick={() => handleDownloadPrescription(selectedVisit?.id)}
                    disabled={downloadPrescriptionLoading}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95 disabled:opacity-50"
                  >
                    {downloadPrescriptionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Save PDF
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrescriptionEmail(selectedVisit?.id)}
                    disabled={sendingPrescriptionEmailId === selectedVisit?.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Email prescription PDF with calendar invite to patient"
                  >
                    <Mail className="w-4 h-4" />
                    {sendingPrescriptionEmailId === selectedVisit?.id ? 'Sending...' : 'Email to Patient'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedVisit) return;
                      const url = buildMasterGoogleCalendarUrl({
                        medicinesText: selectedVisit.medicines_list,
                        patientName: selectedPatient?.name || 'Patient',
                        doctorName: selectedVisit.doctor?.name || 'Dr. Shweta Grover',
                        hospitalName: 'Vedam Diagnostics'
                      });
                      window.open(url, '_blank');
                      showToast("Opening Google Calendar! Tap 'Save' to save medicine reminders.", "success");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95 cursor-pointer"
                    title="Open Google Calendar directly with daily medicine reminders pre-filled and Save ready"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Set Medicine Reminder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedVisit) return;
                      const url = buildFollowUpGoogleCalendarUrl({
                        followUpDate: selectedVisit.follow_up_date,
                        patientName: selectedPatient?.name || 'Patient',
                        doctorName: selectedVisit.doctor?.name || 'Dr. Shweta Grover',
                        hospitalName: 'Vedam Diagnostics'
                      });
                      window.open(url, '_blank');
                      showToast("Opening Google Calendar for Follow-up! Tap 'Save' to set reminder.", "success");
                    }}
                    className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold py-2.5 px-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95 cursor-pointer"
                    title="1-Click save doctor follow-up appointment in Google Calendar with reminder notification"
                  >
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Set Follow-up Reminder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedVisit) return;
                      downloadClientIcsFile({
                        medicinesText: selectedVisit.medicines_list,
                        followUpDate: selectedVisit.follow_up_date,
                        patientName: selectedPatient?.name || 'Patient',
                        doctorName: selectedVisit.doctor?.name || 'Dr. Shweta Grover',
                        hospitalName: 'Vedam Diagnostics'
                      });
                      showToast("📅 Medicine alarms .ics file downloaded for phone calendar!", "success");
                    }}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95 cursor-pointer"
                    title="Download .ics file for iPhone/Android/Outlook calendar"
                  >
                    <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span>Download .ics</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintSummary}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-teal-500" />
                    Print Handout Sheet
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleSaveSummary}
                disabled={summarySaving}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {summarySaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Notes & Summary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Consultation Handout Sheet */}
      {selectedVisit && (
        <div id="printable-summary-modal" className="hidden print:block p-8 font-sans text-slate-800 bg-white">
          {/* Header branding */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{adminSettingsForm?.hospital_name || "Vedam Diagnostics"}</h1>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">{adminSettingsForm?.logo_text || "Sincere Care..."}</p>
              <div className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-line">
                {adminSettingsForm?.collection_centre || "Collection Centre:\n4 Harilok, Dhanvantari Saket Road,\nMeerut 250003"}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-base font-bold text-slate-800">{selectedVisit.doctor?.name || adminSettingsForm?.doctor_name || "Dr. Shweta Grover"}</h3>
              <p className="text-xs text-slate-500 whitespace-pre-line mt-1">
                {selectedVisit.doctor?.degree || adminSettingsForm?.doctor_degree || "MBBS, MD (Pathology), PhD"}
              </p>
              <p className="text-xs font-bold text-slate-700 mt-2">Contact: {adminSettingsForm?.contact_number || "+91 98765 43210"}</p>
            </div>
          </div>

          {/* Visit details / Patient details */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-slate-50 p-4 rounded-xl text-xs mb-6 border border-slate-100">
            <div><strong>Patient Name:</strong> {selectedPatient.name}</div>
            <div><strong>Patient ID:</strong> {selectedPatient.patient_id}</div>
            <div><strong>Age / Gender:</strong> {selectedPatient.age} Yrs / {selectedPatient.gender}</div>
            <div><strong>Visit ID:</strong> {selectedVisit.visit_id}</div>
            <div><strong>Date:</strong> {new Date(selectedVisit.visit_date).toLocaleString()}</div>
            <div><strong>Follow-up Date:</strong> {summaryForm.follow_up_date || "As advised"}</div>
          </div>

          {/* Clinical notes content */}
          <div className="space-y-5">
            {summaryForm.chief_complaints && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1 mb-1.5">Chief Complaints</h3>
                <p className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">{summaryForm.chief_complaints}</p>
              </div>
            )}

            {summaryForm.diagnosis && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1 mb-1.5">Diagnosis</h3>
                <p className="text-xs text-slate-800 whitespace-pre-line font-bold leading-relaxed">{summaryForm.diagnosis}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {summaryForm.medicines_list && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1 mb-1.5">Prescribed Medicines</h3>
                  <p className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">{summaryForm.medicines_list}</p>
                </div>
              )}

              {summaryForm.tests_list && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1 mb-1.5">Recommended Tests</h3>
                  <p className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">{summaryForm.tests_list}</p>
                </div>
              )}
            </div>

            {summaryForm.advice && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1 mb-1.5">Clinical Advice / Instructions</h3>
                <p className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">{summaryForm.advice}</p>
              </div>
            )}

            {summaryForm.patient_summary && (() => {
              const _raw = summaryForm.patient_summary;
              const _enMatch = _raw.match(/\[English(?:[^\]]*Summary|\s+Storytelling\s+Summary)\]([\s\S]*?)(?=\[Hindi|$)/i);
              const _hiMatch = _raw.match(/\[Hindi\s*Summary[\s\S]*?\]([\s\S]*?)$/i);
              const _enText = _enMatch ? _enMatch[1].trim() : '';
              const _hiText = _hiMatch ? _hiMatch[1].trim() : '';
              const _isStruct = _enText && (/morning:/i.test(_enText) || /night:/i.test(_enText));
              const _slot = (text, label) => {
                // Handle labels with optional parenthetical annotations, e.g. "सुबह (Morning):"
                const m = text.match(new RegExp(`(?:[^\\w\\n]*)?${label}[^:\\n]*:[^\\S\\n]*(.+?)(?=\\n[^\\n]*:|$)`, 'is'));
                return m ? m[1].trim() : null;
              };
              const _greet = (text, labels) => {
                for (const l of labels) {
                  const idx = text.search(new RegExp(`[^\\n]*${l}[^:\\n]*:`, 'i'));
                  if (idx > 0) return text.slice(0, idx).trim().split('\n').filter(Boolean).join(' ');
                }
                return '';
              };
              if (_isStruct) {
                const eg = _greet(_enText, ['Morning','Afternoon','Night','Watch Out For']);
                const printEnSlots = [
                  { emoji: '\u2600\uFE0F', label: 'Morning', content: _slot(_enText, 'Morning'), color: '#fffbeb', border: '#fcd34d' },
                  { emoji: '\uD83C\uDF24\uFE0F', label: 'Afternoon', content: _slot(_enText, 'Afternoon'), color: '#eff6ff', border: '#93c5fd' },
                  { emoji: '\uD83C\uDF19', label: 'Night', content: _slot(_enText, 'Night'), color: '#eef2ff', border: '#a5b4fc' },
                  { emoji: '\u26A0\uFE0F', label: 'Watch Out For', content: _slot(_enText, 'Watch Out For'), color: '#fff1f2', border: '#fca5a5' },
                ].filter(s => s.content);
                const hg = _greet(_hiText, ['\u0938\u0941\u092C\u0939','\u0926\u094B\u092A\u0939\u0930','\u0930\u093E\u0924','Subah','Dopahar','Raat']);
                const printHiSlots = [
                  { emoji: '\u2600\uFE0F', label: '\u0938\u0941\u092C\u0939', content: _slot(_hiText, '\u0938\u0941\u092C\u0939') || _slot(_hiText, 'Subah') },
                  { emoji: '\uD83C\uDF24\uFE0F', label: '\u0926\u094B\u092A\u0939\u0930', content: _slot(_hiText, '\u0926\u094B\u092A\u0939\u0930') || _slot(_hiText, 'Dopahar') },
                  { emoji: '\uD83C\uDF19', label: '\u0930\u093E\u0924', content: _slot(_hiText, '\u0930\u093E\u0924') || _slot(_hiText, 'Raat') },
                  { emoji: '\u26A0\uFE0F', label: '\u0927\u094D\u092F\u093E\u0928 \u0930\u0916\u0947\u0902', content: _slot(_hiText, '\u0907\u0928 \u092C\u093E\u0924\u094B\u0902 \u0915\u093E \u0927\u094D\u092F\u093E\u0928 \u0930\u0916\u0947\u0902') || _slot(_hiText, 'Dhyan Rakhein') },
                ].filter(s => s.content);
                return (
                  <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl mt-6">
                    <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      Patient Daily Routine — AI Generated
                    </h3>
                    {eg && <p className="text-xs italic text-teal-800 font-medium mb-3 leading-relaxed">\uD83D\uDCAC {eg}</p>}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {printEnSlots.map(s => (
                        <div key={s.label} style={{background: s.color, borderLeft: `3px solid ${s.border}`}} className="p-2 rounded-lg">
                          <p className="text-[10px] font-extrabold text-slate-700 mb-0.5">{s.emoji} {s.label}</p>
                          <p className="text-[10px] text-slate-700 leading-relaxed">{s.content}</p>
                        </div>
                      ))}
                    </div>
                    {printHiSlots.length > 0 && (
                      <div className="border-t border-teal-200 pt-3">
                        <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">\u0939\u093F\u0902\u0926\u0940 \u0938\u093E\u0930\u093E\u0902\u0936</p>
                        {hg && <p className="text-[10px] italic text-teal-700 font-medium mb-1.5">{hg}</p>}
                        <div className="space-y-1">
                          {printHiSlots.map(s => (
                            <div key={s.label} className="flex gap-2">
                              <span className="text-[10px] font-bold text-slate-500 w-16 shrink-0">{s.emoji} {s.label}:</span>
                              <p className="text-[10px] text-slate-700 leading-relaxed">{s.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              // Fallback for old/unstructured summaries
              return (
                <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl mt-6">
                  <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Patient-Friendly Consultation Summary
                  </h3>
                  <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                    {summaryForm.patient_summary}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer signoff */}
          <div className="mt-16 flex justify-between items-end border-t border-slate-100 pt-6 text-[10px] text-slate-400">
            <div>
              <p>Generated by HospiSynAI EHR on {new Date().toLocaleString()}</p>
              <p className="italic">Note: This is a patient-friendly consultation summary report.</p>
            </div>
            <div className="text-center w-40">
              <div className="border-b border-slate-300 h-10 w-full mb-1"></div>
              <p className="font-semibold text-slate-600">Authorized Signature</p>
            </div>
          </div>
        </div>
      )}
      {/* ───── Patient Story Modal ───── */}
      {showStoryModal && storyVisit && (() => {
        const raw = storyVisit.patient_summary || '';
        const engMatch = raw.match(/\[English(?:[^\]]*Summary|\s+Storytelling\s+Summary)\]([\s\S]*?)(?=\[Hindi|$)/i);
        const hinMatch = raw.match(/\[Hindi\s*Summary[\s\S]*?\]([\s\S]*?)$/i);
        const engText = engMatch ? engMatch[1].trim() : '';
        const hinText = hinMatch ? hinMatch[1].trim() : '';
        const isStructured = engText && (/morning:/i.test(engText) || /night:/i.test(engText));

        const parseSlot = (text, label) => {
          // Handle labels with optional parenthetical annotations, e.g. "सुबह (Morning):"
          const m = text.match(new RegExp(`(?:[^\\w\\n]*)?${label}[^:\\n]*:[^\\S\\n]*(.+?)(?=\\n[^\\n]*:|$)`, 'is'));
          return m ? m[1].trim() : null;
        };
        const parseGreeting = (text, labels) => {
          for (const l of labels) {
            const idx = text.search(new RegExp(`[^\\n]*${l}[^:\\n]*:`, 'i'));
            if (idx > 0) return text.slice(0, idx).trim().split('\n').filter(Boolean).join(' ');
          }
          return '';
        };

        const enGreeting  = parseGreeting(engText, ['Morning','Afternoon','Night','Watch Out For']);
        const enMorning   = parseSlot(engText, 'Morning');
        const enAfternoon = parseSlot(engText, 'Afternoon');
        const enNight     = parseSlot(engText, 'Night');
        const enWatch     = parseSlot(engText, 'Watch Out For');
        const hiGreeting  = parseGreeting(hinText, ['\u0938\u0941\u092C\u0939','\u0926\u094B\u092A\u0939\u0930','\u0930\u093E\u0924','Subah','Dopahar','Raat','Dhyan Rakhein']);
        const hiSubah     = parseSlot(hinText, '\u0938\u0941\u092C\u0939') || parseSlot(hinText, 'Subah');
        const hiDopahar   = parseSlot(hinText, '\u0926\u094B\u092A\u0939\u0930') || parseSlot(hinText, 'Dopahar');
        const hiRaat      = parseSlot(hinText, '\u0930\u093E\u0924') || parseSlot(hinText, 'Raat');
        const hiDhyan     = parseSlot(hinText, '\u0907\u0928 \u092C\u093E\u0924\u094B\u0902 \u0915\u093E \u0927\u094D\u092F\u093E\u0928 \u0930\u0916\u0947\u0902') || parseSlot(hinText, 'Dhyan Rakhein');

        const enSlots = [
          { emoji: '☀️', label: 'Morning',      content: enMorning,   bg: 'from-amber-400 to-orange-400',   shadow: 'shadow-amber-200',   badge: 'bg-amber-100 text-amber-800' },
          { emoji: '🌤️', label: 'Afternoon',    content: enAfternoon, bg: 'from-sky-400 to-cyan-400',       shadow: 'shadow-sky-200',     badge: 'bg-sky-100 text-sky-800' },
          { emoji: '🌙', label: 'Night',         content: enNight,     bg: 'from-indigo-500 to-violet-500',  shadow: 'shadow-indigo-200',  badge: 'bg-indigo-100 text-indigo-800' },
          { emoji: '⚠️', label: 'Watch Out For', content: enWatch,     bg: 'from-rose-400 to-pink-400',      shadow: 'shadow-rose-200',    badge: 'bg-rose-100 text-rose-800' },
        ].filter(s => s.content);

        const hiSlots = [
          { emoji: '☀️', label: 'सुबह',         content: hiSubah },
          { emoji: '🌤️', label: 'दोपहर',       content: hiDopahar },
          { emoji: '🌙', label: 'रात',           content: hiRaat },
          { emoji: '⚠️', label: 'ध्यान रखें',   content: hiDhyan },
        ].filter(s => s.content);

        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowStoryModal(false); }}
          >
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-t-3xl px-6 py-5 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-white/80" />
                    <span className="text-[10px] font-extrabold text-white/70 uppercase tracking-widest">AI Patient Story</span>
                  </div>
                  <h2 className="text-white text-xl font-black leading-tight">
                    {selectedPatient?.name || storyVisit.reason || 'Your Daily Routine'}
                  </h2>
                  <p className="text-white/70 text-xs font-semibold mt-0.5">
                    Visit: {storyVisit.visit_id} &nbsp;·&nbsp; {new Date(storyVisit.visit_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    {storyVisit.doctor && ` · Dr. ${storyVisit.doctor.name}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowStoryModal(false)}
                  className="text-white/70 hover:text-white transition-colors text-2xl font-light leading-none mt-0.5"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Greeting card */}
                {(enGreeting || !isStructured) && (
                  <div className="bg-teal-50 border border-teal-100 rounded-2xl px-5 py-4">
                    <p className="text-sm text-teal-800 font-semibold leading-relaxed italic">
                      💬 {isStructured ? enGreeting : raw.substring(0, 200)}
                    </p>
                  </div>
                )}

                {/* English daily slots */}
                {isStructured && enSlots.length > 0 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Your Daily Medicine Routine (English)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {enSlots.map(slot => (
                        <div key={slot.label} className={`rounded-2xl p-4 shadow-lg ${slot.shadow} overflow-hidden relative`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${slot.bg} opacity-10 rounded-2xl`} />
                          <div className={`relative z-10`}>
                            <div className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2.5 ${slot.badge}`}>
                              <span className="text-sm">{slot.emoji}</span>
                              {slot.label}
                            </div>
                            <p className="text-sm text-slate-800 font-semibold leading-relaxed">{slot.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hindi section */}
                {isStructured && hiSlots.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">हिंदी सारांश (Hindi Summary)</p>
                    {hiGreeting && (
                      <p className="text-sm text-teal-700 font-semibold italic mb-4 leading-relaxed">💬 {hiGreeting}</p>
                    )}
                    <div className="space-y-3">
                      {hiSlots.map(slot => (
                        <div key={slot.label} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-b-0">
                          <span className="text-xl shrink-0 mt-0.5">{slot.emoji}</span>
                          <div>
                            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">{slot.label}</span>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed mt-0.5">{slot.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback plain text */}
                {!isStructured && raw && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium" style={{borderLeft:'4px solid #14b8a6'}}>
                    {raw}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowStoryModal(false); handleDownloadPrescription(storyVisit.id); }}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Prescription PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowStoryModal(false); handleOpenSummary(storyVisit); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-3 px-4 rounded-xl transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Edit Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* NHA / CGHS Rate Verification Modal */}
      {showRateModal && rateVerificationResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white p-5 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/30 text-blue-100 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-widest border border-blue-400/30">
                    Live Web Reading Agent
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-widest border border-emerald-400/30">
                    Anakin MCP Enabled
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight mt-1 flex items-center gap-2">
                  🌐 NHA & CGHS Government Rate Cap Audit
                </h3>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  Real-time benchmark comparison against Indian National Health Authority rate ceilings.
                </p>
              </div>
              <button
                onClick={() => setShowRateModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              {/* Overview Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Billed</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">₹{rateVerificationResult.total_billed.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Govt NHA Cap Total</p>
                  <p className="text-base font-black text-emerald-700 mt-0.5">₹{rateVerificationResult.total_benchmark.toLocaleString()}</p>
                </div>
                <div className={`border rounded-xl p-3 text-center ${
                  rateVerificationResult.total_savings_opportunity > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider">Overcharge Variance</p>
                  <p className="text-base font-black mt-0.5">
                    {rateVerificationResult.total_savings_opportunity > 0
                      ? `+₹${rateVerificationResult.total_savings_opportunity.toLocaleString()}`
                      : 'Compliant'}
                  </p>
                </div>
              </div>

              {/* Summary Banner */}
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                rateVerificationResult.overall_status === 'overpriced_detected'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                {rateVerificationResult.summary}
              </div>

              {/* Items Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Billed Item</th>
                      <th className="p-3">Billed</th>
                      <th className="p-3">Govt Cap</th>
                      <th className="p-3">Status / Variance</th>
                      <th className="p-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rateVerificationResult.results.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{item.service_name}</p>
                          <p className="text-[10px] text-slate-400">{item.official_name} • {item.authority}</p>
                        </td>
                        <td className="p-3 font-extrabold text-slate-700">₹{item.billed_amount.toFixed(2)}</td>
                        <td className="p-3 font-extrabold text-emerald-700">₹{item.nha_cghs_rate.toFixed(2)}</td>
                        <td className="p-3">
                          {item.status === 'overpriced' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              Overpriced (+₹{item.variance_amount.toFixed(2)})
                            </span>
                          ) : item.status === 'subsidized' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                              Subsidized / Low
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              100% Compliant
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[10px] font-semibold text-slate-500">{item.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
              <span className="text-[11px] font-medium text-slate-500">
                Powered by NHA PM-JAY & Anakin MCP Scraper Engine
              </span>
              <button
                onClick={() => setShowRateModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
