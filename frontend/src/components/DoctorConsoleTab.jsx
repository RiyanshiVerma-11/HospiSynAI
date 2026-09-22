import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  UserCheck,
  FileText,
  Sparkles,
  Brain,
  Save,
  Loader2,
  Printer,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Download,
  CheckCircle,
  Clock,
  Mic,
  MicOff,
  Volume2,
  X,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
  Columns,
  Maximize2,
  Minimize2,
  ExternalLink
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VoiceVisualizer from './VoiceVisualizer';
import PatientVoiceModal from './PatientVoiceModal';
import { buildMasterGoogleCalendarUrl, buildFollowUpGoogleCalendarUrl, downloadClientIcsFile } from '../utils/calendarService';

const MEDICINE_DATASTORE = [
  { name: 'Dolo 650mg (Paracetamol)', dosage: 'Once Daily (OD), After Meals for 3 Days' },
  { name: 'Crocin 500mg (Paracetamol)', dosage: 'Thrice Daily (TID), After Meals for 3 Days' },
  { name: 'Calpol 650mg (Paracetamol)', dosage: 'Thrice Daily (TID), After Meals for 3 Days' },
  { name: 'Combiflam (Ibuprofen + Paracetamol)', dosage: 'Twice Daily (BD), After Meals for 3 Days' },
  { name: 'Zerodol-P (Aceclofenac + Paracetamol)', dosage: 'Twice Daily (BD), After Meals for 3 Days' },
  { name: 'Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Azee 500mg (Azithromycin)', dosage: 'Once Daily (OD), Empty Stomach for 3 Days' },
  { name: 'Augmentin 625mg (Amoxicillin + Clavulanate)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Taxim-O 200mg (Cefixime)', dosage: 'Twice Daily (BD), After Meals for 5 Days' },
  { name: 'Pan 40mg (Pantoprazole)', dosage: 'Once Daily (OD), Empty Stomach for 10 Days' },
  { name: 'Pantocid 40mg (Pantoprazole)', dosage: 'Once Daily (OD), Empty Stomach for 14 Days' },
  { name: 'Omez 20mg (Omeprazole)', dosage: 'Once Daily (OD), Empty Stomach for 7 Days' },
  { name: 'Levocet 5mg (Levocetirizine)', dosage: 'Once Daily (OD), At Bedtime (HS) for 5 Days' },
  { name: 'Montair LC (Montelukast + Levocetirizine)', dosage: 'Once Daily (OD), At Bedtime (HS) for 7 Days' },
  { name: 'Ascoril LS Syrup', dosage: '5ml Thrice Daily (TID), After Meals for 5 Days' },
  { name: 'Glycomet 500mg (Metformin)', dosage: 'Twice Daily (BD), After Meals (Long-term)' },
  { name: 'Telma 40mg (Telmisartan)', dosage: 'Once Daily (OD), In Morning (Long-term)' },
  { name: 'Atorva 10mg (Atorvastatin)', dosage: 'Once Daily (OD), At Bedtime (HS) (Long-term)' }
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

export default function DoctorConsoleTab({
  API_BASE,
  getHeaders,
  showToast,
  userRole,
  sidebarCollapsed,
  setSidebarCollapsed
}) {
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form state
  const [summaryForm, setSummaryForm] = useState({
    diagnosis: '',
    chief_complaints: '',
    medicines_list: '',
    tests_list: '',
    advice: '',
    follow_up_date: '',
    patient_summary: '',
    status: 'Waiting'
  });

  // Action states
  const [aiPrescribeLoading, setAiPrescribeLoading] = useState(false);
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [summarySaving, setSummarySaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('clinical'); // 'clinical' | 'pdf'
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');

  // Medicine Autocomplete Builder states
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [prescTiming, setPrescTiming] = useState('After Meals');
  const [prescFrequency, setPrescFrequency] = useState('Twice Daily (BD)');
  const [prescDuration, setPrescDuration] = useState('3 Days');

  // Voice Consultation Scribe & Inline Dictation States
  const [showAmbientScribe, setShowAmbientScribe] = useState(false);
  const [ambientScribeParsing, setAmbientScribeParsing] = useState(false);
  const [showPatientVoiceInline, setShowPatientVoiceInline] = useState(false);
  const [patientVerbatimQuote, setPatientVerbatimQuote] = useState('');
  const [activeFieldMic, setActiveFieldMic] = useState(null);

  // Horizontal Resizing & Queue Collapse states
  const [queueWidth, setQueueWidth] = useState(() => {
    const saved = localStorage.getItem('hospisyn_queue_width');
    return saved ? parseInt(saved, 10) : 260;
  });
  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [isDraggingQueue, setIsDraggingQueue] = useState(false);
  const [autoCollapseOnSelect, setAutoCollapseOnSelect] = useState(() => {
    const saved = localStorage.getItem('hospisyn_auto_collapse_queue');
    return saved !== null ? saved === 'true' : true;
  });

  // Desk Inner Sections Resizing & Layout (Clinical Records vs. Bilingual Handout)
  const [recordsWidthPct, setRecordsWidthPct] = useState(() => {
    const saved = localStorage.getItem('hospisyn_records_width_pct');
    return saved ? parseInt(saved, 10) : 62;
  });
  const [deskLayoutMode, setDeskLayoutMode] = useState('split'); // 'split' | 'full-records' | 'full-handout'
  const [isDraggingDeskSplit, setIsDraggingDeskSplit] = useState(false);

  const containerRef = useRef(null);
  const deskContainerRef = useRef(null);

  // Dragging Queue Splitter (Horizontally enlarge or shrink the queue)
  useEffect(() => {
    if (!isDraggingQueue) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth < 140) {
        setQueueCollapsed(true);
      } else {
        setQueueCollapsed(false);
        const clampedWidth = Math.max(180, Math.min(newWidth, 540));
        setQueueWidth(clampedWidth);
        localStorage.setItem('hospisyn_queue_width', clampedWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsDraggingQueue(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingQueue]);

  // Dragging Desk Splitter (between Clinical Records and Handout)
  useEffect(() => {
    if (!isDraggingDeskSplit) return;

    const handleMouseMove = (e) => {
      if (!deskContainerRef.current) return;
      const rect = deskContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const pct = Math.round((relativeX / rect.width) * 100);
      const clampedPct = Math.max(38, Math.min(pct, 82));
      setRecordsWidthPct(clampedPct);
      localStorage.setItem('hospisyn_records_width_pct', clampedPct.toString());
    };

    const handleMouseUp = () => {
      setIsDraggingDeskSplit(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDeskSplit]);

  const ambientVoice = useSpeechRecognition({ defaultLang: 'en-IN' });
  const fieldVoice = useSpeechRecognition({ defaultLang: 'en-IN' });

  // Handle auto-populating consultation form from patient's natural voice
  const handlePopulateFromPatientVoice = (parsed) => {
    if (!parsed) return;
    setActiveWorkspaceTab('clinical');
    setSummaryForm(prev => ({
      ...prev,
      chief_complaints: parsed.chief_complaints || prev.chief_complaints,
      diagnosis: parsed.diagnosis || prev.diagnosis,
      medicines_list: parsed.medicines_list || prev.medicines_list,
      tests_list: parsed.tests_list || prev.tests_list,
      advice: parsed.advice || prev.advice,
      follow_up_date: parsed.follow_up_date || prev.follow_up_date
    }));
    if (parsed.patient_verbatim) {
      setPatientVerbatimQuote(parsed.patient_verbatim);
    }
  };

  const fieldBaseTextRef = useRef('');

  // Handle live dictation into specific field without duplicate compounding
  useEffect(() => {
    if (activeFieldMic && fieldVoice.transcript) {
      const spokenText = fieldVoice.transcript.trim();
      const base = fieldBaseTextRef.current ? fieldBaseTextRef.current.trim() : '';
      setSummaryForm(prev => {
        if (!base) {
          return { ...prev, [activeFieldMic]: spokenText };
        }
        const separator = (activeFieldMic === 'chief_complaints' || activeFieldMic === 'advice') ? ', ' : '\n';
        return { ...prev, [activeFieldMic]: `${base}${separator}${spokenText}` };
      });
    }
  }, [fieldVoice.transcript, activeFieldMic]);

  const handleToggleFieldMic = (fieldName) => {
    if (activeFieldMic === fieldName) {
      fieldVoice.stopListening();
      setActiveFieldMic(null);
      fieldBaseTextRef.current = '';
      showToast(`Finished dictating into ${fieldName.replace('_', ' ')}.`);
    } else {
      if (ambientVoice.isListening) ambientVoice.stopListening();
      fieldVoice.stopListening();
      setActiveFieldMic(fieldName);
      fieldBaseTextRef.current = summaryForm[fieldName] || '';
      fieldVoice.resetTranscript();
      fieldVoice.startListening();
      showToast(`🎙️ Dictating into ${fieldName.replace('_', ' ')}... Speak now.`);
    }
  };

  const clientHeuristicParseConsultation = (text) => {
    const lower = text.toLowerCase();
    const clean = text.trim();
    const complaints = [];
    for (const comp of ['fever', 'cough', 'sore throat', 'dry cough', 'productive cough', 'headache', 'body pain', 'stomach ache', 'vomiting', 'loose motions', 'chest pain', 'weakness', 'chills', 'running nose']) {
      if (lower.includes(comp)) complaints.push(comp.charAt(0).toUpperCase() + comp.slice(1));
    }
    let dx = '';
    const dxMatch = text.match(/(?:diagnosis|impression|assessment|suspected)\s*(?:is|as)?\s*[:\-]?\s*([^.,\n]+)/i);
    if (dxMatch) dx = dxMatch[1].trim();
    else if (lower.includes('fever') && lower.includes('cough')) dx = 'Acute Upper Respiratory Tract Infection (URTI)';
    else if (lower.includes('fever')) dx = 'Acute Febrile Illness';
    
    const meds = [];
    if (lower.includes('dolo') || lower.includes('paracetamol')) meds.push('1. Dolo 650mg — Thrice Daily (TID), After Meals for 3 Days (SOS)');
    if (lower.includes('augmentin') || lower.includes('amoxicillin')) meds.push(`${meds.length + 1}. Augmentin 625mg — Twice Daily (BD), After Meals for 5 Days`);
    if (lower.includes('azee') || lower.includes('azithromycin')) meds.push(`${meds.length + 1}. Azee 500mg — Once Daily (OD), Empty Stomach for 3 Days`);
    if (lower.includes('pan') || lower.includes('pantocid')) meds.push(`${meds.length + 1}. Pan 40mg — Once Daily (OD), Empty Stomach for 10 Days`);
    if (lower.includes('montair') || lower.includes('levocet')) meds.push(`${meds.length + 1}. Montair LC — Once Daily (OD), At Bedtime (HS) for 7 Days`);

    const tests = [];
    if (lower.includes('cbc') || lower.includes('blood count')) tests.push('1. CBC (Complete Blood Count)');
    if (lower.includes('x-ray') || lower.includes('xray')) tests.push(`${tests.length + 1}. Chest X-Ray PA View`);
    if (lower.includes('sugar') || lower.includes('glucose')) tests.push(`${tests.length + 1}. Blood Sugar (Fasting & PP)`);
    if (lower.includes('urine')) tests.push(`${tests.length + 1}. Urine RE/ME`);
    if (lower.includes('dengue')) tests.push(`${tests.length + 1}. Dengue NS1 Antigen & Serology`);

    return {
      chief_complaints: complaints.length > 0 ? complaints.join(', ') : clean.slice(0, 80),
      diagnosis: dx || 'Acute Febrile Illness',
      medicines_list: meds.length > 0 ? meds.join('\n') : '1. Dolo 650mg — Thrice Daily (TID), After Meals for 3 Days (SOS)',
      tests_list: tests.length > 0 ? tests.join('\n') : '1. CBC (Complete Blood Count)',
      advice: '1. Drink warm fluids frequently\n2. Complete bed rest for 2-3 days\n3. Warm saline gargles',
      follow_up_date: 'Review after 3 days or if fever > 102°F persists'
    };
  };

  const handleParseAmbientScribe = async (customText) => {
    const textToParse = (customText || ambientVoice.fullText).trim();
    if (!textToParse) {
      showToast('Please speak consultation or click a demo sample chip first.', 'warning');
      return;
    }

    setAmbientScribeParsing(true);
    ambientVoice.stopListening();

    try {
      const res = await fetch(`${API_BASE}/visits/ai-parse-consultation`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          transcript: textToParse,
          age: selectedVisit?.patient?.age,
          gender: selectedVisit?.patient?.gender
        })
      });

      let parsed = null;
      if (res.ok) {
        parsed = await res.json();
      } else {
        parsed = clientHeuristicParseConsultation(textToParse);
      }

      if (parsed) {
        setSummaryForm(prev => ({
          ...prev,
          chief_complaints: parsed.chief_complaints || prev.chief_complaints,
          diagnosis: parsed.diagnosis || prev.diagnosis,
          medicines_list: parsed.medicines_list || prev.medicines_list,
          tests_list: parsed.tests_list || prev.tests_list,
          advice: parsed.advice || prev.advice,
          follow_up_date: parsed.follow_up_date || prev.follow_up_date
        }));
        showToast('🎙️ Clinical consultation parsed! Fields auto-populated. Review and adjust details.');
      }
    } catch (err) {
      console.warn('Consultation parse fetch fallback:', err);
      const parsed = clientHeuristicParseConsultation(textToParse);
      if (parsed) {
        setSummaryForm(prev => ({ ...prev, ...parsed }));
        showToast('Consultation processed! Please review details.');
      }
    } finally {
      setAmbientScribeParsing(false);
    }
  };

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

  const STATIC_BASE = import.meta.env.VITE_STATIC_BASE_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? "http://localhost:5000" 
      : "https://hospisyn-backend.onrender.com");

  // Fetch active visits
  const fetchVisits = async () => {
    setVisitsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/visits`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to load patient queue");
      const data = await res.json();
      setVisits(data);
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setVisitsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleSelectVisit = (visit) => {
    setSelectedVisit(visit);
    // Auto collapse sidebar so doctor gets maximum uncluttered screen space
    if (setSidebarCollapsed) setSidebarCollapsed(true);
    // Auto collapse intake queue as requested so doctor gets immediate full-width workspace
    if (autoCollapseOnSelect) {
      setQueueCollapsed(true);
    }
    setSummaryForm({
      diagnosis: visit.diagnosis || '',
      chief_complaints: visit.chief_complaints || '',
      medicines_list: visit.medicines_list || '',
      tests_list: visit.tests_list || '',
      advice: visit.advice || '',
      follow_up_date: visit.follow_up_date || '',
      patient_summary: visit.patient_summary || '',
      status: visit.status || 'Waiting'
    });
    setSummaryError('');
    setMedicineSearch('');
    setMedicineSuggestions([]);
    setPdfPreviewUrl('');
    setActiveWorkspaceTab('clinical');
  };

  const handleCloseDesk = () => {
    setSelectedVisit(null);
    // Expand queue back so doctor can pick next patient
    setQueueCollapsed(false);
  };

  // Toggle quick tag helpers
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

  // Auto-filter medicine suggestions
  useEffect(() => {
    if (!medicineSearch.trim()) {
      setMedicineSuggestions([]);
      return;
    }
    const query = medicineSearch.toLowerCase().trim();
    const filtered = MEDICINE_DATASTORE.filter(med => 
      med.name.toLowerCase().includes(query)
    ).slice(0, 5);
    setMedicineSuggestions(filtered);
  }, [medicineSearch]);

  const handleAddMedicineFromSuggest = (med) => {
    const currentText = summaryForm.medicines_list || '';
    const lines = currentText.split('\n').map(line => line.trim()).filter(Boolean);
    const nextNum = lines.length + 1;
    const formattedDosage = `${prescFrequency}, ${prescTiming} for ${prescDuration}`;
    const newline = `${nextNum}. ${med.name} - ${formattedDosage}`;
    const updated = currentText ? `${currentText.trim()}\n${newline}` : newline;
    
    setSummaryForm(prev => ({ ...prev, medicines_list: updated }));
    setMedicineSearch('');
    setMedicineSuggestions([]);
  };

  // AI Suggest Treatment (Groq Llama)
  const handleAiSuggestTreatment = async () => {
    if (!summaryForm.chief_complaints.trim()) {
      showToast('Please enter Chief Complaints first to give AI clinical context.', 'warning');
      return;
    }
    setAiPrescribeLoading(true);
    setSummaryError('');
    try {
      const response = await fetch(`${API_BASE}/visits/ai-suggest-treatment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          chief_complaints: summaryForm.chief_complaints,
          diagnosis: summaryForm.diagnosis,
          age: selectedVisit.patient ? selectedVisit.patient.age : null,
          gender: selectedVisit.patient ? selectedVisit.patient.gender : null
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
      showToast('AI treatment plan loaded! Review and adjust details.');
    } catch (e) {
      console.error(e);
      setSummaryError(e.message);
      showToast(e.message, 'error');
    } finally {
      setAiPrescribeLoading(false);
    }
  };

  // AI Summary & Vernacular narrative
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
      showToast('AI Bilingual summary generated successfully!');
      fetchVisits(); // refresh records
    } catch (err) {
      setSummaryError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSummaryGenerating(false);
    }
  };

  // Find next waiting/scheduled/arrived patient in queue
  const getNextWaitingPatient = () => {
    if (!visits || visits.length === 0) return null;
    return visits.find(v => 
      v.id !== selectedVisit?.id && 
      (v.status || '').toLowerCase() !== 'completed'
    );
  };

  const nextWaitingPatient = getNextWaitingPatient();

  // Call next patient into the cabin
  const handleCallNextPatient = async (targetVisit) => {
    const nextV = targetVisit || getNextWaitingPatient();
    if (!nextV) {
      showToast('All caught up! No more waiting patients in queue.', 'info');
      return;
    }

    try {
      // Mark next patient as In-Consultation
      await fetch(`${API_BASE}/visits/${nextV.id}/summary`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'In-Consultation' })
      });
    } catch {
      // Non-blocking
    }

    handleSelectVisit({ ...nextV, status: 'In-Consultation' });
    const tokenDisplay = nextV.token_number ? `Token #${nextV.token_number}` : nextV.visit_id.slice(-6);
    showToast(`⏭️ Called ${tokenDisplay} (${nextV.patient?.name || 'Patient'}) into consultation cabin!`, 'success');
    fetchVisits();
  };

  // Save clinical note - automatically marks as Completed
  const handleSaveSummary = async (autoComplete = true) => {
    setSummarySaving(true);
    setSummaryError('');
    const newStatus = autoComplete ? 'Completed' : (summaryForm.status || 'Completed');
    const payload = {
      ...summaryForm,
      status: newStatus
    };
    try {
      const res = await fetch(`${API_BASE}/visits/${selectedVisit.id}/summary`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to save clinical notes');
      }
      setSummaryForm(prev => ({ ...prev, status: newStatus }));
      setSelectedVisit(prev => prev ? ({ ...prev, status: newStatus }) : null);
      showToast('✓ Clinical notes saved and marked as Completed!', 'success');
      await fetchVisits();
    } catch (err) {
      setSummaryError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSummarySaving(false);
    }
  };

  // 1-Click Save Current Consultation AND Call Next Patient
  const handleSaveAndCallNext = async () => {
    await handleSaveSummary(true);
    const nextV = getNextWaitingPatient();
    if (nextV) {
      setTimeout(() => {
        handleCallNextPatient(nextV);
      }, 400);
    } else {
      showToast('All waiting patients completed for today! 🎉', 'info');
    }
  };

  // Embedded PDF compiler
  const handleTriggerPdfPreview = async () => {
    if (!selectedVisit) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`${API_BASE}/visits/${selectedVisit.id}/prescription-pdf`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to compile prescription PDF sheet.");
      const data = await res.json();
      
      // Force URL refresh with cache breaker parameter
      setPdfPreviewUrl(`${STATIC_BASE}${data.pdf_path}?t=${Date.now()}`);
      setActiveWorkspaceTab('pdf');
      showToast("Prescription PDF rendered in side-desk!");
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendPrescriptionEmail = async () => {
    if (!selectedVisit) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`${API_BASE}/visits/${selectedVisit.id}/send-prescription-email`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to email prescription.");
      showToast(data.message || "Prescription and calendar invite emailed to patient!", "success");
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Filter queue
  const filteredQueue = visits.filter(v => {
    const matchesSearch = 
      v.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.visit_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.patient?.mobile_number && v.patient.mobile_number.includes(searchQuery));
      
    if (!matchesSearch) return false;
    if (statusFilter === 'All') return true;
    
    const hasDiagnosis = !!v.diagnosis;
    let visitStatus = 'Waiting';
    if (v.status === 'Critical') {
      visitStatus = 'Critical';
    } else if (v.status === 'Completed' || hasDiagnosis) {
      visitStatus = 'Completed';
    }
    
    return visitStatus === statusFilter;
  });

  const criticalCount = visits.filter(v => v.status === 'Critical').length;
  const waitingCount = visits.filter(v => v.status !== 'Critical' && v.status !== 'Completed' && !v.diagnosis).length;
  const completedCount = visits.filter(v => v.status === 'Completed' || v.diagnosis).length;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col lg:flex-row h-full w-full bg-white text-slate-800 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 relative ${
        isDraggingQueue || isDraggingDeskSplit ? 'select-none' : ''
      }`}
    >
      
      {/* Intake Waiting Queue Panel (Left) */}
      {queueCollapsed ? (
        /* Collapsed Slim Dock Rail with Direct Triage Badges */
        <div className="hidden lg:flex w-14 min-w-[56px] bg-slate-50 border-r border-slate-200 flex-col items-center py-2.5 px-1 flex-shrink-0 select-none z-10 transition-all justify-between">
          
          {/* Top: Expand Toggle + Critical & Waiting Badges */}
          <div className="flex flex-col items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setQueueCollapsed(false)}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-teal-500 text-slate-600 hover:text-teal-700 shadow-xs transition-all flex items-center justify-center group cursor-pointer"
              title="Expand Intake Queue (कतार खोलें)"
            >
              <PanelLeftOpen className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </button>

            {/* Red Critical (Emergency) Badge */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Critical');
                setQueueCollapsed(false);
              }}
              className={`w-full py-2 px-0.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer group ${
                criticalCount > 0 
                  ? 'bg-rose-50 border-rose-300 hover:bg-rose-100 shadow-xs ring-1 ring-rose-400/50' 
                  : 'bg-white border-slate-200/90 hover:border-rose-300 opacity-60 hover:opacity-100'
              }`}
              title={`🚨 Critical Patients: ${criticalCount} (Click to view)`}
            >
              <div className="relative flex items-center justify-center">
                <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
                {criticalCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping absolute -top-0.5 -right-1" />
                )}
              </div>
              <span className={`text-xs font-black mt-0.5 leading-none ${criticalCount > 0 ? 'text-rose-700 font-mono' : 'text-slate-500'}`}>
                {criticalCount}
              </span>
              <span className="text-[7.5px] font-black uppercase tracking-tighter text-rose-600 mt-0.5 leading-none">
                Crit
              </span>
            </button>

            {/* Yellow / Amber Waiting Badge */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Waiting');
                setQueueCollapsed(false);
              }}
              className="w-full py-2 px-0.5 rounded-xl border bg-amber-50 border-amber-300 hover:bg-amber-100 shadow-xs transition-all cursor-pointer group"
              title={`⏳ Waiting Patients: ${waitingCount} (Click to view)`}
            >
              <Clock className="w-4 h-4 text-amber-600 group-hover:rotate-45 transition-transform" />
              <span className="text-xs font-black text-amber-800 mt-0.5 leading-none font-mono">
                {waitingCount}
              </span>
              <span className="text-[7.5px] font-black uppercase tracking-tighter text-amber-700 mt-0.5 leading-none">
                Wait
              </span>
            </button>
          </div>

          {/* Middle: Rotated Text Label */}
          <div 
            onClick={() => setQueueCollapsed(false)}
            className="my-auto flex flex-col items-center cursor-pointer group py-2"
            title="Click to expand queue"
          >
            <span className="text-[9.5px] font-black uppercase text-slate-400 group-hover:text-teal-700 [writing-mode:vertical-lr] rotate-180 tracking-widest">
              Intake Queue
            </span>
          </div>

          {/* Bottom: Total Patients Counter */}
          <div className="w-full flex flex-col items-center pt-1 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setQueueCollapsed(false);
              }}
              className="flex flex-col items-center w-full py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={`Total Patients in Queue: ${visits.length}`}
            >
              <span className="text-[8px] font-black uppercase text-slate-400 leading-none mb-0.5">
                Total
              </span>
              <span className="text-[11px] font-black bg-slate-900 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-xs">
                {visits.length}
              </span>
            </button>
          </div>

        </div>
      ) : (
        /* Expanded Intake Queue Panel (Horizontally Resizable via Drag) */
        <div 
          style={{ width: `${queueWidth}px`, minWidth: `${queueWidth}px` }}
          className="w-full lg:w-auto bg-slate-50/60 flex flex-col h-full overflow-hidden flex-shrink-0 transition-[width] duration-75"
        >
          <div className="p-2.5 flex flex-col h-full overflow-hidden min-h-[300px] lg:min-h-0">
            
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-tight flex items-center gap-1.5 uppercase">
                <Clock className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                Intake Queue
                <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full">
                  {visits.length}
                </span>
              </h3>
              <div className="flex items-center gap-1">
                <button 
                  onClick={fetchVisits} 
                  disabled={visitsLoading}
                  className="text-[11px] text-teal-600 font-bold hover:underline cursor-pointer"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setQueueCollapsed(true)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                  title="Hide Queue (फुल स्क्रीन डेस्क)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Auto-Hide Setting */}
            <div className="flex items-center justify-between mb-2 px-1 py-0.5 bg-slate-100/70 rounded text-[10px] text-slate-600 font-medium">
              <span className="truncate">Auto-hide on patient click</span>
              <button
                type="button"
                onClick={() => {
                  const next = !autoCollapseOnSelect;
                  setAutoCollapseOnSelect(next);
                  localStorage.setItem('hospisyn_auto_collapse_queue', next.toString());
                }}
                className={`w-7 h-3.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  autoCollapseOnSelect ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
                title={autoCollapseOnSelect ? 'Auto-hide is ON (Patient click collapses queue)' : 'Auto-hide is OFF'}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            <div className="relative mb-2 flex-shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium transition-all"
                placeholder="Search Queue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-1 mb-2 flex-shrink-0">
              {[
                { id: 'All', label: 'All', count: visits.length, activeClass: 'bg-slate-900 text-white border-slate-900', inactiveClass: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100' },
                { id: 'Waiting', label: 'Waiting', count: waitingCount, activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm', inactiveClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70' },
                { id: 'Critical', label: 'Critical', count: criticalCount, activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm', inactiveClass: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70 animate-pulse' },
                { id: 'Completed', label: 'Completed', count: completedCount, activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm', inactiveClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70' }
              ].map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setStatusFilter(chip.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-all flex items-center gap-1 ${
                    statusFilter === chip.id ? chip.activeClass : chip.inactiveClass
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className={`text-[9.5px] px-1 py-0.2 rounded-full ${statusFilter === chip.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                    {chip.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Intake queue listings */}
            <div className="space-y-1.5 md:flex-1 md:overflow-y-auto pr-1 min-h-0 compact-scroll">
              {visitsLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-1.5" />
                  <span className="text-[11px] text-slate-500 font-semibold">Loading intake queue...</span>
                </div>
              ) : (
                filteredQueue.map((vis) => {
                  const hasDiagnosis = !!vis.diagnosis;
                  const getStatusDetails = () => {
                    if (vis.status === 'Critical' || vis.triage_severity === 'Urgent') {
                      return { label: 'Urgent / Critical', style: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse font-black' };
                    }
                    if (vis.status === 'In-Consultation') {
                      return { label: 'In Cabin', style: 'bg-teal-100 text-teal-800 border-teal-300 font-bold' };
                    }
                    if (vis.status === 'Arrived') {
                      return { label: 'Arrived', style: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold ring-1 ring-emerald-400/40' };
                    }
                    if (vis.status === 'Completed' || hasDiagnosis) {
                      return { label: 'Completed', style: 'bg-slate-100 text-slate-600 border-slate-200 font-medium' };
                    }
                    return { label: 'Waiting', style: 'bg-amber-100 text-amber-800 border-amber-200 font-bold' };
                  };
                  const statusInfo = getStatusDetails();
                  return (
                    <div
                      key={vis.id}
                      onClick={() => handleSelectVisit(vis)}
                      className={`p-2 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                        selectedVisit?.id === vis.id
                          ? 'border-teal-500 bg-white shadow-sm ring-1 ring-teal-500/30'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-white bg-white/70'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          {vis.token_number && (
                            <span className="text-[10px] font-black bg-teal-700 text-white px-1.5 py-0.2 rounded shadow-xs">
                              #{vis.token_number}
                            </span>
                          )}
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono uppercase">{vis.visit_id.slice(-8)}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">{vis.patient?.name || 'Unknown Patient'}</h4>
                        <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium leading-none">
                          {vis.patient?.age} Yrs • {vis.patient?.gender} • {vis.patient?.mobile_number}
                        </p>
                        {vis.reason && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 font-medium truncate">"{vis.reason}"</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {!visitsLoading && filteredQueue.length === 0 && (
                <div className="text-center py-8 px-2 space-y-2">
                  <p className="text-slate-400 text-xs font-medium">No patients in the queue.</p>
                  <button
                    type="button"
                    onClick={fetchVisits}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    Refresh Queue
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Draggable Resizer Splitter between Queue and Workspace */}
      {!queueCollapsed && (
        <div
          onMouseDown={() => setIsDraggingQueue(true)}
          onDoubleClick={() => setQueueCollapsed(true)}
          className={`hidden lg:flex w-2 hover:w-2.5 bg-slate-200 hover:bg-teal-500 cursor-col-resize transition-colors items-center justify-center relative group select-none flex-shrink-0 z-10 ${
            isDraggingQueue ? 'bg-teal-600 w-2.5 ring-2 ring-teal-400/40' : ''
          }`}
          title="Drag horizontally to resize sections • Double click to collapse"
        >
          <div className="h-8 w-1 rounded-full bg-slate-400 group-hover:bg-white flex flex-col justify-between py-1 transition-colors pointer-events-none">
            <div className="w-0.5 h-0.5 rounded-full bg-slate-600 mx-auto" />
            <div className="w-0.5 h-0.5 rounded-full bg-slate-600 mx-auto" />
            <div className="w-0.5 h-0.5 rounded-full bg-slate-600 mx-auto" />
          </div>
        </div>
      )}

      {/* Workspace Panel (Right) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {selectedVisit ? (
          <div className="p-3 md:p-3.5 flex flex-col h-full overflow-hidden min-h-[400px] lg:min-h-0 animate-in fade-in duration-150">
            
            {/* Consultation Intake Header - Compact SaaS Layout */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 flex-shrink-0 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-black text-slate-900">{selectedVisit.patient?.name}</h2>
                  <span className="text-teal-700 font-extrabold text-[10px] uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Active Consultation</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-600 text-xs mt-0.5 font-medium">
                  <span>Age: <b className="text-slate-900">{selectedVisit.patient?.age} Yrs</b></span>
                  <span>•</span>
                  <span>Gender: <b className="text-slate-900">{selectedVisit.patient?.gender}</b></span>
                  <span>•</span>
                  <span>Visit ID: <b className="text-slate-900 font-mono">{selectedVisit.visit_id}</b></span>
                  {selectedVisit.patient?.abha_id && (
                    <>
                      <span>•</span>
                      <span className="bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded text-[11px] font-bold">
                        Health ID: {selectedVisit.patient.abha_id}
                      </span>
                    </>
                  )}
                  <span className="flex items-center gap-1 ml-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Triage:</span>
                    <select
                      value={summaryForm.status || 'Waiting'}
                      onChange={async (e) => {
                        const nextStatus = e.target.value;
                        setSummaryForm(prev => ({ ...prev, status: nextStatus }));
                        try {
                          const res = await fetch(`${API_BASE}/visits/${selectedVisit.id}/summary`, {
                            method: 'PUT',
                            headers: getHeaders(),
                            body: JSON.stringify({
                              ...summaryForm,
                              status: nextStatus
                            })
                          });
                          if (!res.ok) throw new Error("Failed to update visit triage status");
                          showToast(`Triage status updated to ${nextStatus}!`);
                          fetchVisits();
                        } catch (err) {
                          showToast(err.message, 'error');
                        }
                      }}
                      className={`text-[11px] font-bold rounded border px-2 py-0.5 cursor-pointer focus:outline-none transition-all ${
                        summaryForm.status === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold' :
                        summaryForm.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="Waiting">Waiting</option>
                      <option value="Arrived">🟢 Arrived (In Waiting Area)</option>
                      <option value="In-Consultation">🔵 In Consultation</option>
                      <option value="Critical">🚨 Critical (Emergency)</option>
                      <option value="Completed">✓ Completed</option>
                    </select>
                  </span>
                </div>
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                {/* Direct Call Next Patient Button */}
                {nextWaitingPatient && (
                  <button
                    type="button"
                    onClick={() => handleCallNextPatient()}
                    className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-3 py-1 rounded-md flex items-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95 transition cursor-pointer"
                    title={`Call Next Patient: Token #${nextWaitingPatient.token_number || nextWaitingPatient.id} (${nextWaitingPatient.patient?.name || 'Patient'})`}
                  >
                    <span>⏭️ Next: Token #{nextWaitingPatient.token_number || nextWaitingPatient.id}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Queue Toggle Button */}
                <button
                  type="button"
                  onClick={() => setQueueCollapsed(prev => !prev)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                    queueCollapsed
                      ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={queueCollapsed ? 'Show Queue (मरीज़ लिस्ट देखें)' : 'Hide Queue (पूरा स्क्रीन खोलें)'}
                >
                  {queueCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5 text-teal-600" /> : <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{queueCollapsed ? `Queue (${visits.length})` : 'Hide Queue'}</span>
                </button>

                {/* Desk Layout Mode Selector */}
                {activeWorkspaceTab === 'clinical' && (
                  <div className="hidden sm:flex border border-slate-200 rounded-md p-0.5 bg-slate-50 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setDeskLayoutMode('split')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                        deskLayoutMode === 'split'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Split View (Clinical Records + Handout side by side)"
                    >
                      <Columns className="w-3 h-3 text-teal-600" />
                      <span>Split</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeskLayoutMode('full-records')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                        deskLayoutMode === 'full-records'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Full Clinical Desk (Maximum room for Prescriptions, Complaints, Diagnosis)"
                    >
                      <Maximize2 className="w-3 h-3 text-indigo-600" />
                      <span>Rx Desk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeskLayoutMode('full-handout')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                        deskLayoutMode === 'full-handout'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Full Handout Focus (Patient Instructions & Routine)"
                    >
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Handout</span>
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 rounded-md p-0.5 bg-slate-50 flex gap-1">
                  <button
                    onClick={() => setActiveWorkspaceTab('clinical')}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition-all ${
                      activeWorkspaceTab === 'clinical'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Clinical Desk
                  </button>
                  <button
                    onClick={handleTriggerPdfPreview}
                    disabled={pdfLoading}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                      activeWorkspaceTab === 'pdf'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                    Prescription Preview
                  </button>

                  <button
                    onClick={handleSendPrescriptionEmail}
                    disabled={sendingEmail}
                    className="text-xs font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer disabled:opacity-50"
                    title="Send prescription PDF and calendar invite to patient's email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {sendingEmail ? 'Sending...' : 'Email to Patient'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeVisit) return;
                      const url = buildMasterGoogleCalendarUrl({
                        medicinesText: activeVisit.medicines_list,
                        patientName: selectedPatient?.name || 'Patient',
                        doctorName: 'Dr. Shweta Grover',
                        hospitalName: 'Vedam Diagnostics'
                      });
                      window.open(url, '_blank');
                      showToast("Opening Google Calendar! Tap 'Save' to save medicine reminders.", "success");
                    }}
                    className="text-xs font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer"
                    title="Open Google Calendar directly with daily medicine reminders pre-filled and Save ready"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Set Medicine Reminder
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeVisit) return;
                      const url = buildFollowUpGoogleCalendarUrl({
                        followUpDate: activeVisit.follow_up_date,
                        patientName: selectedPatient?.name || 'Patient',
                        doctorName: 'Dr. Shweta Grover',
                        hospitalName: 'Vedam Diagnostics'
                      });
                      window.open(url, '_blank');
                      showToast("Opening Google Calendar for Follow-up! Tap 'Save' to set reminder.", "success");
                    }}
                    className="text-xs font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                    title="1-Click save doctor follow-up appointment in Google Calendar with reminder notification"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Set Follow-up Reminder
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeVisit) return;
                      downloadClientIcsFile({
                        medicinesText: activeVisit.medicines_list,
                        followUpDate: activeVisit.follow_up_date,
                        patientName: selectedPatient?.name || 'Patient',
                        doctorName: 'Dr. Shweta Grover',
                        hospitalName: 'Vedam Diagnostics'
                      });
                      showToast("📅 Medicine schedule .ics downloaded for phone calendar!", "success");
                    }}
                    className="text-xs font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                    title="Download medicine reminders calendar invite with recurring alarms"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .ics
                  </button>
                </div>

                <button
                  onClick={handleCloseDesk}
                  className="text-slate-600 hover:text-slate-900 text-xs font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-md transition-colors cursor-pointer"
                >
                  Close Desk
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 min-h-0 mt-2 overflow-hidden">
              {activeWorkspaceTab === 'clinical' ? (
                /* Clinical Workspace Grid with Resizable Splitter */
                <div 
                  ref={deskContainerRef}
                  className="h-full overflow-y-auto flex flex-col xl:flex-row gap-0 pr-1 compact-scroll relative"
                >
                  
                  {/* Left Column: Doctor Entry Forms */}
                  <div 
                    style={{ 
                      width: deskLayoutMode === 'full-records' ? '100%' : deskLayoutMode === 'full-handout' ? '0%' : undefined,
                      flex: deskLayoutMode === 'split' ? `0 0 ${recordsWidthPct}%` : undefined,
                      display: deskLayoutMode === 'full-handout' ? 'none' : 'block'
                    }}
                    className="space-y-2 pr-2 border-r border-slate-200/70 xl:overflow-y-auto compact-scroll transition-all duration-75"
                  >
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-teal-600" />
                        Clinical Records
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPatientVoiceInline(prev => !prev);
                            if (!showPatientVoiceInline) setShowAmbientScribe(false);
                          }}
                          className={`text-[11px] font-extrabold px-3 py-1 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            showPatientVoiceInline
                              ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                          }`}
                          title="Patient speaks natural complaints in Hindi/Hinglish -> AI auto-adapts & extracts clinical OPD plan"
                        >
                          {showPatientVoiceInline ? <X className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-white" />}
                          <span>{showPatientVoiceInline ? 'Close Voice' : '🎙️ मरीज़ की आवाज़ (Patient Voice)'}</span>
                          <span className={showPatientVoiceInline ? 'bg-rose-200 text-rose-800 text-[9px] px-1.5 py-0.2 rounded-full font-bold' : 'bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold'}>AI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAmbientScribe(prev => !prev);
                            if (!showAmbientScribe) {
                              ambientVoice.resetTranscript();
                            } else {
                              ambientVoice.stopListening();
                            }
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs transition-all flex items-center gap-1.5 ${
                            showAmbientScribe
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                          }`}
                        >
                          {showAmbientScribe ? <X className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-teal-600" />}
                          {showAmbientScribe ? 'Close Scribe' : '🎙️ Doctor Scribe'}
                        </button>

                        <button
                          type="button"
                          onClick={handleAiSuggestTreatment}
                          disabled={aiPrescribeLoading}
                          className={`text-[11px] font-bold text-white px-2.5 py-1 rounded-lg shadow-xs transition-all flex items-center gap-1.5 ${
                            aiPrescribeLoading
                              ? 'bg-violet-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                          }`}
                        >
                          {aiPrescribeLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              AI Prescribing...
                            </>
                          ) : (
                            <>
                              <Brain className="w-3.5 h-3.5 text-violet-100" />
                              AI Suggest Treatment
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline Ambient Patient Voice Module (Integrated directly in the Clinical Desk) */}
                    {showPatientVoiceInline && (
                      <PatientVoiceModal
                        inline={true}
                        autoStart={true}
                        isOpen={showPatientVoiceInline}
                        onClose={() => setShowPatientVoiceInline(false)}
                        onPopulate={handlePopulateFromPatientVoice}
                        patientContext={{
                          name: selectedVisit?.patient?.name,
                          age: selectedVisit?.patient?.age,
                          gender: selectedVisit?.patient?.gender,
                          visitId: selectedVisit?.visit_id
                        }}
                        API_BASE={API_BASE}
                        getHeaders={getHeaders}
                        showToast={showToast}
                      />
                    )}

                    {/* Ambient Voice Consultation Scribe Module */}
                    {showAmbientScribe && (
                      <div className="bg-slate-900 rounded-2xl p-3.5 text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-2.5 border border-slate-800">
                        <VoiceVisualizer
                          isListening={ambientVoice.isListening}
                          audioLevel={ambientVoice.audioLevel}
                          transcript={ambientVoice.transcript}
                          interimTranscript={ambientVoice.interimTranscript}
                          onStart={() => ambientVoice.startListening()}
                          onStop={() => {
                            ambientVoice.stopListening();
                            if (ambientVoice.fullText) handleParseAmbientScribe(ambientVoice.fullText);
                          }}
                          onReset={() => ambientVoice.resetTranscript()}
                          onSelectSample={(sample) => {
                            ambientVoice.setTranscript(sample);
                            handleParseAmbientScribe(sample);
                          }}
                          placeholder="Speak complete consultation (complaints, diagnosis, medicines, lab tests, advice)..."
                          sampleGuide="Symptoms/Complaints ➔ Working Diagnosis ➔ Medicines + Dosing ➔ Tests ➔ Advice"
                          sampleChips={[
                            {
                              label: "Acute Bronchitis (Augmentin + Dolo)",
                              text: "Patient has high fever and productive cough for 3 days. Working diagnosis acute bronchitis. Prescribe Augmentin 625 twice daily after food for 5 days and Dolo 650 SOS. Order CBC and Chest X-ray. Advise saline gargle and complete rest."
                            },
                            {
                              label: "Acute Pharyngitis (Azithromycin)",
                              text: "Patient reports severe throat pain and fever for 2 days. Working diagnosis acute pharyngitis. Prescribe Azee 500 once daily before food for 3 days and Dolo 650 TID. Recommend CBC. Advise warm salt water gargle."
                            },
                            {
                              label: "Gastroenteritis (Stomach Pain)",
                              text: "Patient presents with acute stomach ache, nausea and loose motions. Suspected acute gastroenteritis. Prescribe Pan 40 once daily empty stomach and ORS fluids. Order KFT and Stool examination. Advise light diet."
                            }
                          ]}
                        />

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                          <div className="text-[11px] text-slate-400 font-medium">
                            {ambientScribeParsing ? (
                              <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                AI parsing consultation note...
                              </span>
                            ) : ambientVoice.fullText ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Dictation captured. Ready to auto-populate!
                              </span>
                            ) : (
                              <span>Microphone ready. Continuous listening enabled.</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleParseAmbientScribe()}
                            disabled={ambientScribeParsing || !ambientVoice.fullText.trim()}
                            className="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                            {ambientScribeParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-teal-950" />}
                            ⚡ Auto-Populate Clinical Desk
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CLINICAL RECORD SECTIONS — COMPACT, COLOR-CODED & CLEARLY DIVIDED */}
                    <div className="space-y-2">
                      {/* ROW 1: CHIEF COMPLAINTS & WORKING DIAGNOSIS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        
                        {/* CARD 1: CHIEF COMPLAINTS (Warm Amber / Rose Theme) */}
                        <div className="border border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-orange-50/20 to-white rounded-lg p-2 sm:p-2.5 shadow-2xs border-l-4 border-l-amber-500 flex flex-col justify-between">
                          <div>
                            {patientVerbatimQuote && (
                              <div className="bg-amber-100/80 border border-amber-300 rounded-md p-1.5 mb-1.5 text-xs text-amber-950 flex items-start justify-between gap-1.5 animate-in fade-in">
                                <div className="flex-1">
                                  <span className="font-extrabold text-amber-800 text-[9.5px] uppercase tracking-wider block flex items-center gap-1">
                                    <span>🗣️</span> Spoken Statement:
                                  </span>
                                  <p className="italic font-semibold text-[10.5px] text-amber-950 mt-0.5 leading-snug">{patientVerbatimQuote}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPatientVerbatimQuote('')}
                                  className="text-amber-600 hover:text-amber-900 text-xs font-bold shrink-0 p-0.5 cursor-pointer"
                                  title="Dismiss quote"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            
                            <label className="block mb-1 flex justify-between items-center">
                              <span className="flex items-center gap-1 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                                <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-[10px]">🩺</span>
                                <span>Chief Complaints</span>
                                {activeFieldMic === 'chief_complaints' && (
                                  <span className="text-[9px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                                )}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowPatientVoiceInline(prev => !prev);
                                    if (!showPatientVoiceInline) setShowAmbientScribe(false);
                                  }}
                                  className={`text-[9.5px] font-bold border px-1.5 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                                    showPatientVoiceInline
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/80 border-amber-300'
                                  }`}
                                  title="1-Click Patient Voice: Auto-adapts Hindi/Hinglish and fills complaints"
                                >
                                  <Mic className="w-3 h-3 text-amber-700" />
                                  <span>आवाज़</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFieldMic('chief_complaints')}
                                  className={`p-1 rounded transition-all cursor-pointer ${
                                    activeFieldMic === 'chief_complaints'
                                      ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                      : 'text-amber-700 hover:bg-amber-100'
                                  }`}
                                  title={activeFieldMic === 'chief_complaints' ? 'Stop mic' : '🎙️ Dictate Chief Complaints'}
                                >
                                  {activeFieldMic === 'chief_complaints' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </label>

                            {/* Quick complaints chips */}
                            <div className="flex flex-wrap gap-1 mb-1 max-h-[34px] overflow-y-auto pb-0.5 compact-scroll">
                              {COMMON_COMPLAINTS.map((tag) => {
                                const isSelected = (summaryForm.chief_complaints || '').includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleToggleTag('chief_complaints', tag)}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-all font-bold ${
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
                            className="w-full bg-white/90 border border-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-400 rounded-md px-2 py-1 text-xs text-slate-800 placeholder-amber-900/30 focus:outline-none font-medium transition-all h-14 resize-none shadow-2xs"
                            placeholder="e.g. High fever for 3 days, dry cough, severe throat irritation..."
                            value={summaryForm.chief_complaints}
                            onChange={(e) => setSummaryForm({ ...summaryForm, chief_complaints: e.target.value })}
                          />
                        </div>

                        {/* CARD 2: WORKING DIAGNOSIS (Indigo / Blue Theme) */}
                        <div className="border border-indigo-200/90 bg-gradient-to-br from-indigo-50/50 via-blue-50/20 to-white rounded-lg p-2 sm:p-2.5 shadow-2xs border-l-4 border-l-indigo-600 flex flex-col justify-between">
                          <div>
                            <label className="block mb-1 flex justify-between items-center">
                              <span className="flex items-center gap-1 text-indigo-900 font-extrabold text-xs uppercase tracking-wider">
                                <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-800 flex items-center justify-center font-bold text-[10px]">🧠</span>
                                <span>Working Diagnosis</span>
                                {activeFieldMic === 'diagnosis' && (
                                  <span className="text-[9px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleFieldMic('diagnosis')}
                                className={`p-1 rounded transition-all cursor-pointer ${
                                  activeFieldMic === 'diagnosis'
                                    ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                    : 'text-indigo-700 hover:bg-indigo-100'
                                }`}
                                title={activeFieldMic === 'diagnosis' ? 'Stop mic' : '🎙️ Dictate Diagnosis'}
                              >
                                {activeFieldMic === 'diagnosis' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                              </button>
                            </label>

                            {/* Quick Common Diagnosis Tags */}
                            <div className="flex flex-wrap gap-1 mb-1 max-h-[34px] overflow-y-auto pb-0.5 compact-scroll">
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
                                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-all font-bold ${
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
                            className="w-full bg-white/90 border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-md px-2 py-1 text-xs text-slate-800 placeholder-indigo-900/30 focus:outline-none font-medium transition-all h-14 resize-none shadow-2xs"
                            placeholder="e.g. Acute Viral Bronchitis with Mild Dehydration"
                            value={summaryForm.diagnosis}
                            onChange={(e) => setSummaryForm({ ...summaryForm, diagnosis: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* SECTION SEPARATOR LINE */}
                      <div className="flex items-center gap-2 my-0.5">
                        <div className="h-px bg-emerald-200 flex-1" />
                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1 shadow-2xs">
                          <span>💊</span>
                          <span>Rx Prescription & Schedule</span>
                        </span>
                        <div className="h-px bg-emerald-200 flex-1" />
                      </div>

                      {/* CARD 3: PRESCRIBE MEDICINES (Emerald / Teal Medical Theme) */}
                      <div className="border border-emerald-300/90 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white rounded-lg p-2 sm:p-2.5 shadow-2xs border-l-4 border-l-emerald-600">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="flex items-center gap-1 text-emerald-900 font-extrabold text-xs uppercase tracking-wider">
                            <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold text-[10px]">Rx</span>
                            <span>Prescription Dosing Builder</span>
                            {activeFieldMic === 'medicines_list' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleFieldMic('medicines_list')}
                              className={`p-1 rounded transition-all cursor-pointer ${
                                activeFieldMic === 'medicines_list'
                                  ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                  : 'text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={activeFieldMic === 'medicines_list' ? 'Stop mic' : '🎙️ Dictate Medicines'}
                            >
                              {activeFieldMic === 'medicines_list' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300">
                              Catalog Linked
                            </span>
                          </div>
                        </div>

                        {/* Prescription Parameter Tiles */}
                        <div className="bg-white/80 p-1.5 sm:p-2 rounded-lg border border-emerald-200/90 mb-1.5 space-y-1.5 text-xs shadow-2xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-0.5">Timing</span>
                              <div className="flex gap-1">
                                {['After Meals', 'Empty Stomach'].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setPrescTiming(t)}
                                    className={`flex-1 text-[9.5px] py-0.5 rounded font-bold border transition-all ${
                                      prescTiming === t 
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {t === 'After Meals' ? 'Pc (After Food)' : 'Ac (Empty Stomach)'}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-0.5">Frequency</span>
                              <select
                                value={prescFrequency}
                                onChange={(e) => setPrescFrequency(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10.5px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                              >
                                <option value="Once Daily (OD)">OD (Once Daily)</option>
                                <option value="Twice Daily (BD)">BD (Twice Daily)</option>
                                <option value="Thrice Daily (TID)">TID (Thrice Daily)</option>
                                <option value="At Bedtime (HS)">HS (At Bedtime)</option>
                                <option value="As Needed (SOS)">SOS (As Needed)</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 items-center">
                            <div>
                              <span className="text-[9px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-0.5">Duration</span>
                              <select
                                value={prescDuration}
                                onChange={(e) => setPrescDuration(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10.5px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                              >
                                <option value="3 Days">3 Days</option>
                                <option value="5 Days">5 Days</option>
                                <option value="7 Days">7 Days</option>
                                <option value="10 Days">10 Days</option>
                                <option value="15 Days">15 Days</option>
                                <option value="30 Days">30 Days</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-[9px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-0.5">Quick Select Medicine</span>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const med = MEDICINE_DATASTORE.find(m => m.name === e.target.value);
                                    if (med) handleAddMedicineFromSuggest(med);
                                    e.target.value = '';
                                  }
                                }}
                                className="w-full bg-white border border-emerald-300 rounded px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 shadow-2xs"
                              >
                                <option value="">-- Click to Select Common Drug --</option>
                                {MEDICINE_DATASTORE.map((m, idx) => (
                                  <option key={idx} value={m.name}>{m.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Search Medicine Catalog */}
                        <div className="relative mb-1.5">
                          <input
                            type="text"
                            placeholder="🔍 Type medicine name to autocomplete (e.g. Dolo, Augmentin, Pan, Azee...)"
                            className="w-full bg-white border border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 rounded-md px-2 py-1 text-xs placeholder-slate-400 focus:outline-none font-semibold transition-all text-slate-800 shadow-2xs"
                            value={medicineSearch}
                            onChange={(e) => setMedicineSearch(e.target.value)}
                          />
                          
                          {medicineSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 z-50 mt-0.5 bg-white border border-slate-300 rounded-lg shadow-xl max-h-44 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-150">
                              {medicineSuggestions.map((med, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleAddMedicineFromSuggest(med)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-800 hover:bg-emerald-50 hover:text-emerald-950 transition-colors font-semibold flex justify-between items-center"
                                >
                                  <span>{med.name}</span>
                                  <span className="text-[9.5px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold shrink-0">{med.dosage.split(' for')[0]}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <textarea
                          className="w-full bg-white/95 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 rounded-md px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono transition-all h-16 resize-none shadow-2xs"
                          placeholder="1. Dolo 650mg - Twice Daily (BD) after meals for 3 Days&#10;2. Pan 40mg - Once Daily (OD) empty stomach for 5 Days"
                          value={summaryForm.medicines_list}
                          onChange={(e) => setSummaryForm({ ...summaryForm, medicines_list: e.target.value })}
                        />
                      </div>

                      {/* SECTION SEPARATOR LINE */}
                      <div className="flex items-center gap-2 my-0.5">
                        <div className="h-px bg-cyan-200 flex-1" />
                        <span className="text-[9px] font-black text-cyan-800 uppercase tracking-wider bg-cyan-50 border border-cyan-200 px-2 py-0.2 rounded-full flex items-center gap-1 shadow-2xs">
                          <span>🔬</span>
                          <span>Diagnostics & Lifestyle Guidelines</span>
                        </span>
                        <div className="h-px bg-cyan-200 flex-1" />
                      </div>

                      {/* ROW 3: RECOMMENDED TESTS & LIFESTYLE ADVICE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        
                        {/* CARD 4: RECOMMENDED TESTS (Cyan / Sky Theme) */}
                        <div className="border border-cyan-200/90 bg-gradient-to-br from-cyan-50/50 via-sky-50/20 to-white rounded-lg p-2 sm:p-2.5 shadow-2xs border-l-4 border-l-cyan-600 flex flex-col justify-between">
                          <div>
                            <label className="block mb-1 flex justify-between items-center">
                              <span className="flex items-center gap-1 text-cyan-900 font-extrabold text-xs uppercase tracking-wider">
                                <span className="w-4 h-4 rounded bg-cyan-500/20 text-cyan-800 flex items-center justify-center font-bold text-[10px]">🧪</span>
                                <span>Diagnostic Tests</span>
                                {activeFieldMic === 'tests_list' && (
                                  <span className="text-[9px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleFieldMic('tests_list')}
                                className={`p-1 rounded transition-all cursor-pointer ${
                                  activeFieldMic === 'tests_list'
                                    ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                    : 'text-cyan-700 hover:bg-cyan-100'
                                }`}
                                title={activeFieldMic === 'tests_list' ? 'Stop mic' : '🎙️ Dictate Tests'}
                              >
                                {activeFieldMic === 'tests_list' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                              </button>
                            </label>

                            {/* Quick Tests Chips */}
                            <div className="flex flex-wrap gap-1 mb-1 max-h-[34px] overflow-y-auto pb-0.5 compact-scroll">
                              {COMMON_TESTS.map((tag) => {
                                const isSelected = (summaryForm.tests_list || '').toLowerCase().includes(tag.toLowerCase());
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleToggleTag('tests_list', tag)}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-all font-bold ${
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
                            className="w-full bg-white/90 border border-cyan-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-400 rounded-md px-2 py-1 text-xs text-slate-800 placeholder-cyan-900/30 focus:outline-none font-medium transition-all h-14 resize-none shadow-2xs"
                            placeholder="e.g. CBC, Chest X-ray PA View, Blood Sugar Fasting..."
                            value={summaryForm.tests_list}
                            onChange={(e) => setSummaryForm({ ...summaryForm, tests_list: e.target.value })}
                          />
                        </div>

                        {/* CARD 5: LIFESTYLE & DIET ADVICE (Violet / Purple Theme) */}
                        <div className="border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-violet-50/20 to-white rounded-lg p-2 sm:p-2.5 shadow-2xs border-l-4 border-l-purple-600 flex flex-col justify-between">
                          <div>
                            <label className="block mb-1 flex justify-between items-center">
                              <span className="flex items-center gap-1 text-purple-900 font-extrabold text-xs uppercase tracking-wider">
                                <span className="w-4 h-4 rounded bg-purple-500/20 text-purple-800 flex items-center justify-center font-bold text-[10px]">🌱</span>
                                <span>Lifestyle & Dietary Advice</span>
                                {activeFieldMic === 'advice' && (
                                  <span className="text-[9px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleFieldMic('advice')}
                                className={`p-1 rounded transition-all cursor-pointer ${
                                  activeFieldMic === 'advice'
                                    ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                    : 'text-purple-700 hover:bg-purple-100'
                                }`}
                                title={activeFieldMic === 'advice' ? 'Stop mic' : '🎙️ Dictate Advice'}
                              >
                                {activeFieldMic === 'advice' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                              </button>
                            </label>

                            {/* Quick Advice Chips */}
                            <div className="flex flex-wrap gap-1 mb-1 max-h-[34px] overflow-y-auto pb-0.5 compact-scroll">
                              {COMMON_ADVICE.map((tag) => {
                                const isSelected = (summaryForm.advice || '').includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleToggleTag('advice', tag)}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-all font-bold ${
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
                            className="w-full bg-white/90 border border-purple-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-400 rounded-md px-2 py-1 text-xs text-slate-800 placeholder-purple-900/30 focus:outline-none font-medium transition-all h-14 resize-none shadow-2xs"
                            placeholder="e.g. Drink lukewarm water, take complete bed rest for 3 days, avoid oily food..."
                            value={summaryForm.advice}
                            onChange={(e) => setSummaryForm({ ...summaryForm, advice: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* SECTION SEPARATOR LINE */}
                      <div className="flex items-center gap-2 my-0.5">
                        <div className="h-px bg-slate-200 flex-1" />
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.2 rounded border border-slate-200">
                          Follow-Up & Confirmation
                        </span>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>

                      {/* CARD 6: FOLLOW-UP & SAVE BUTTON (Slate / Dark Theme) */}
                      <div className="border border-slate-300/80 bg-slate-50/90 rounded-lg p-2 sm:p-2.5 shadow-2xs border-l-4 border-l-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                          <div>
                            <label className="block text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-600" />
                              <span>Follow-up Instructions / Date</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-400 rounded-md px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-semibold transition-all shadow-2xs"
                              placeholder="e.g. Return in 5 days or immediately if fever escalates"
                              value={summaryForm.follow_up_date}
                              onChange={(e) => setSummaryForm({ ...summaryForm, follow_up_date: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveSummary(true)}
                              disabled={summarySaving}
                              className="flex-1 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 hover:from-slate-800 hover:to-teal-900 text-white font-extrabold text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                              title="Save clinical notes and mark consultation as Completed"
                            >
                              {summarySaving ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5 text-teal-300" />
                                  <span>Save Notes (Completed)</span>
                                </>
                              )}
                            </button>

                            {nextWaitingPatient && (
                              <button
                                type="button"
                                onClick={handleSaveAndCallNext}
                                disabled={summarySaving}
                                className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-[0.99] transition cursor-pointer"
                                title="Saves current consultation and immediately calls next waiting patient into cabin"
                              >
                                <span>Save & Call Next (Token #{nextWaitingPatient.token_number || nextWaitingPatient.id}) ➔</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Internal Splitter Bar between Clinical Records and Bilingual Handout */}
                  {deskLayoutMode === 'split' && (
                    <div
                      onMouseDown={() => setIsDraggingDeskSplit(true)}
                      className={`hidden xl:flex w-2 hover:w-2.5 bg-slate-200/80 hover:bg-teal-500 cursor-col-resize transition-all items-center justify-center group select-none flex-shrink-0 mx-1 rounded ${
                        isDraggingDeskSplit ? 'bg-teal-600 w-2.5 ring-2 ring-teal-400/40' : ''
                      }`}
                      title="Drag horizontally to adjust sections width"
                    >
                      <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors pointer-events-none" />
                    </div>
                  )}

                  {/* Right Column: AI Summary & Multilingual Handout */}
                  <div 
                    style={{ 
                      display: deskLayoutMode === 'full-records' ? 'none' : 'flex'
                    }}
                    className="flex-1 space-y-2 pl-1 pr-1 flex flex-col justify-between min-h-[300px] xl:overflow-y-auto compact-scroll transition-all duration-75"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-teal-600" />
                          Bilingual Daily Routine Handout
                        </span>
                        {summaryForm.patient_summary && !summaryGenerating && (
                          <button
                            type="button"
                            onClick={handleGenerateAiSummary}
                            className="text-[11px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 underline font-sans"
                          >
                            Regenerate
                          </button>
                        )}
                      </div>

                      {/* Language Selection */}
                      <div className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10.5px] text-slate-800 font-extrabold uppercase tracking-wider block">Target Indian Language</span>
                          <span className="text-[9.5px] text-slate-500 block leading-tight font-medium">Translates storytelling routines dynamically.</span>
                        </div>
                        <select
                          className="bg-white border border-slate-300 rounded-md px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
                          value={selectedLanguage}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setSelectedLanguage(newLang);
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
                                  showToast(`Summary regenerated in ${newLang}!`);
                                  fetchVisits();
                                })
                                .catch(err => {
                                  setSummaryError(err.message);
                                  showToast(err.message, 'error');
                                })
                                .finally(() => setSummaryGenerating(false));
                            }
                          }}
                        >
                          <option value="">-- Select Language --</option>
                          {INDIAN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                          ))}
                        </select>
                      </div>

                      {summaryError && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-rose-800 text-xs font-semibold leading-relaxed">
                          Error: {summaryError}
                        </div>
                      )}

                      {/* Summary Display Box */}
                      <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/40 min-h-[160px] max-h-[260px] overflow-y-auto compact-scroll font-sans text-xs leading-relaxed space-y-2">
                        {summaryGenerating ? (
                          <div className="h-full flex flex-col items-center justify-center py-10 space-y-2">
                            <Brain className="w-7 h-7 text-teal-600 animate-pulse" />
                            <div className="flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                              <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Generating bilingual instructions...</span>
                            </div>
                          </div>
                        ) : (
                          summaryForm.patient_summary ? (
                            <div className="whitespace-pre-line font-medium text-slate-800 text-xs leading-relaxed">
                              {summaryForm.patient_summary}
                            </div>
                          ) : (
                            <div className="py-10 text-center text-slate-400 italic space-y-1.5 font-medium">
                              <Sparkles className="w-7 h-7 mx-auto text-slate-400" />
                              <p className="text-xs text-slate-600 font-bold">Bilingual storytelling prescription summary not compiled yet.</p>
                              <p className="text-[11px] font-normal not-italic text-slate-400">Click the generate button below to request AI translation.</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2.5 pt-2.5 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleGenerateAiSummary}
                        disabled={summaryGenerating || summarySaving}
                        className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        {summaryGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Analyzing Clinical Notes...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            {selectedLanguage ? `Generate AI Summary (${selectedLanguage})` : 'Generate AI Summary'}
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                </div>
              ) : (
                /* PDF Previewer IFrame */
                <div className="h-full flex flex-col bg-slate-50 rounded-lg border border-slate-200 overflow-hidden relative">
                  {pdfPreviewUrl ? (
                    <iframe
                      src={pdfPreviewUrl}
                      title="Prescription PDF Document Previewer"
                      className="w-full h-full border-none md:flex-1"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full space-y-3">
                      <Printer className="w-9 h-9 text-slate-400" />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">No PDF Preview Active</h4>
                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-sm mt-1 font-semibold">
                          Click compile prescription preview above to generate the PDF receipt.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Empty Workspace Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/20 h-full">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-4 shadow-xs">
              <Brain className="w-8 h-8 text-teal-600 animate-pulse" />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Doctor's Consultation Console</h3>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-md mt-2 font-semibold">
              Select an active patient check-in from the <strong>Intake Queue</strong> list on the left to write clinical diagnoses, run safety checks, and compile bilingual patient-friendly handout guides.
            </p>
            {queueCollapsed && (
              <button
                type="button"
                onClick={() => setQueueCollapsed(false)}
                className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
                <span>Open Intake Queue ({visits.length} Patients)</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

