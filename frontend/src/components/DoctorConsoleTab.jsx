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
  X
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VoiceVisualizer from './VoiceVisualizer';
import PatientVoiceModal from './PatientVoiceModal';

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
  userRole
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
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
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
  const [showPatientVoiceModal, setShowPatientVoiceModal] = useState(false);
  const [patientVerbatimQuote, setPatientVerbatimQuote] = useState('');
  const [activeFieldMic, setActiveFieldMic] = useState(null);

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

  // Save clinical note
  const handleSaveSummary = async () => {
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
        throw new Error(errData.detail || 'Failed to save clinical notes');
      }
      showToast('Clinical consultation notes saved successfully!');
      fetchVisits();
    } catch (err) {
      setSummaryError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSummarySaving(false);
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

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-white text-slate-800 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
      
      {/* Intake Waiting Queue Panel (Left) */}
      <div className="w-full lg:w-[250px] lg:min-w-[250px] bg-slate-50/60 flex flex-col h-full overflow-hidden">
        <div className="p-2.5 flex flex-col h-full overflow-hidden min-h-[300px] lg:min-h-0">
          
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-extrabold text-slate-900 text-xs tracking-tight flex items-center gap-1.5 uppercase">
              <Clock className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              Intake Queue
            </h3>
            <button 
              onClick={fetchVisits} 
              disabled={visitsLoading}
              className="text-[11px] text-teal-600 font-bold hover:underline"
            >
              Refresh
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
              { id: 'Waiting', label: 'Waiting', count: visits.filter(v => v.status !== 'Critical' && v.status !== 'Completed' && !v.diagnosis).length, activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm', inactiveClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70' },
              { id: 'Critical', label: 'Critical', count: visits.filter(v => v.status === 'Critical').length, activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm', inactiveClass: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70 animate-pulse' },
              { id: 'Completed', label: 'Completed', count: visits.filter(v => v.status === 'Completed' || v.diagnosis).length, activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm', inactiveClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70' }
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
                  if (vis.status === 'Critical') {
                    return { label: 'Critical', style: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse font-black' };
                  }
                  if (vis.status === 'Completed' || hasDiagnosis) {
                    return { label: 'Completed', style: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold' };
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
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono uppercase">{vis.visit_id.slice(-8)}</span>
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
              <p className="text-center text-slate-400 text-xs py-8 font-medium">No patients in the queue.</p>
            )}
          </div>

        </div>
      </div>

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
                        ABHA: {selectedVisit.patient.abha_id}
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
                      <option value="Critical">Critical (Emergency)</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </span>
                </div>
              </div>

              <div className="flex gap-2 items-center">
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
                </div>

                <button
                  onClick={() => setSelectedVisit(null)}
                  className="text-slate-600 hover:text-slate-900 text-xs font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-md transition-colors"
                >
                  Close Desk
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 min-h-0 mt-4">
              {activeWorkspaceTab === 'clinical' ? (
                /* Clinical Workspace Grid */
                <div className="h-full overflow-y-auto flex flex-col xl:flex-row gap-6 pr-1 compact-scroll">
                  
                    {/* Left Column: Doctor Entry Forms — 65% width */}
                  <div className="space-y-3.5 pr-2 border-r border-slate-200 xl:w-[65%] xl:flex-shrink-0">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-teal-600" />
                        Clinical Records
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPatientVoiceModal(true)}
                          className="text-[11px] font-extrabold px-3 py-1 rounded-lg shadow-xs transition-all flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white cursor-pointer active:scale-95"
                          title="Patient speaks natural complaints in Hindi/Hinglish -> AI extracts clinical OPD plan"
                        >
                          <Mic className="w-3.5 h-3.5 text-white" />
                          <span>🎙️ मरीज़ की आवाज़ (Patient Voice)</span>
                          <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">AI</span>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        {patientVerbatimQuote && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2 text-xs text-amber-900 flex items-start justify-between gap-2 animate-in fade-in">
                            <div className="flex-1">
                              <span className="font-bold text-amber-800 text-[10px] uppercase tracking-wider block">🗣️ Spoken Patient Statement:</span>
                              <p className="italic font-medium text-[11px] text-amber-950 mt-0.5">{patientVerbatimQuote}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPatientVerbatimQuote('')}
                              className="text-amber-500 hover:text-amber-700 text-xs font-bold shrink-0 p-0.5"
                              title="Dismiss"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            Chief Complaints
                            {activeFieldMic === 'chief_complaints' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setShowPatientVoiceModal(true)}
                              className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer"
                              title="Capture patient complaints directly in Hindi/Hinglish"
                            >
                              <Mic className="w-3 h-3 text-teal-600" />
                              <span>मरीज़ की आवाज़ से भरें</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleFieldMic('chief_complaints')}
                              className={`p-1 rounded-md transition-all ${
                                activeFieldMic === 'chief_complaints'
                                  ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                  : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                              }`}
                              title={activeFieldMic === 'chief_complaints' ? 'Stop mic' : '🎙️ Dictate Chief Complaints'}
                            >
                              {activeFieldMic === 'chief_complaints' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </label>
                        <div className="flex flex-wrap gap-1 mb-1.5 max-h-[46px] overflow-y-auto pb-0.5 compact-scroll">
                          {COMMON_COMPLAINTS.map((tag) => {
                            const isSelected = (summaryForm.chief_complaints || '').includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('chief_complaints', tag)}
                                className={`text-[10px] px-2 py-0.5 rounded border transition-all font-semibold ${
                                  isSelected 
                                    ? 'bg-teal-600 text-white border-teal-600' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                        <textarea
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium transition-all h-18 resize-none"
                          placeholder="Fever, Dry Cough, Throat irritation..."
                          value={summaryForm.chief_complaints}
                          onChange={(e) => setSummaryForm({ ...summaryForm, chief_complaints: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            Diagnosis
                            {activeFieldMic === 'diagnosis' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleFieldMic('diagnosis')}
                            className={`p-1 rounded-md transition-all ${
                              activeFieldMic === 'diagnosis'
                                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                            }`}
                            title={activeFieldMic === 'diagnosis' ? 'Stop mic' : '🎙️ Dictate Diagnosis'}
                          >
                            {activeFieldMic === 'diagnosis' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          </button>
                        </label>
                        <textarea
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium transition-all h-26 resize-none"
                          placeholder="e.g. Upper Respiratory Tract Infection (URTI)"
                          value={summaryForm.diagnosis}
                          onChange={(e) => setSummaryForm({ ...summaryForm, diagnosis: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          Prescribe Medicines
                          {activeFieldMic === 'medicines_list' && (
                            <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleFieldMic('medicines_list')}
                            className={`p-1 rounded-md transition-all ${
                              activeFieldMic === 'medicines_list'
                                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                            }`}
                            title={activeFieldMic === 'medicines_list' ? 'Stop mic' : '🎙️ Dictate Medicines'}
                          >
                            {activeFieldMic === 'medicines_list' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Prescription Builder</span>
                        </div>
                      </label>
                      
                      <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 mb-2 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-1">Timing</span>
                            <div className="flex gap-1">
                              {['After Meals', 'Empty Stomach'].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setPrescTiming(t)}
                                  className={`flex-1 text-[10px] py-1 rounded font-bold border transition-all ${
                                    prescTiming === t 
                                      ? 'bg-teal-600 text-white border-teal-600' 
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {t === 'After Meals' ? 'Pc (After Meals)' : 'Ac (Empty Stomach)'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-1">Frequency</span>
                            <select
                              value={prescFrequency}
                              onChange={(e) => setPrescFrequency(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-teal-500"
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
                          <div>
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-1">Duration</span>
                            <select
                              value={prescDuration}
                              onChange={(e) => setPrescDuration(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-teal-500"
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
                            <span className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider block mb-1">Quick Datastore</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  const med = MEDICINE_DATASTORE.find(m => m.name === e.target.value);
                                  if (med) handleAddMedicineFromSuggest(med);
                                  e.target.value = '';
                                }
                              }}
                              className="w-full bg-white border border-teal-300 rounded-md px-2 py-1 text-[11px] font-bold text-teal-900 focus:outline-none focus:border-teal-500"
                            >
                              <option value="">-- Select Medicine --</option>
                              {MEDICINE_DATASTORE.map((m, idx) => (
                                <option key={idx} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="🔍 Search medicine catalog (e.g. Dolo, Pan, Azee...)"
                          className="w-full bg-white border border-teal-200 rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium transition-all text-slate-800"
                          value={medicineSearch}
                          onChange={(e) => setMedicineSearch(e.target.value)}
                        />
                        
                        {medicineSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                            {medicineSuggestions.map((med, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleAddMedicineFromSuggest(med)}
                                className="w-full text-left px-2.5 py-2 text-xs text-slate-800 hover:bg-teal-50 hover:text-teal-950 transition-colors font-medium flex justify-between items-center"
                              >
                                <span>{med.name}</span>
                                <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-bold shrink-0">{med.dosage.split(' for')[0]}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <textarea
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-normal transition-all h-20 resize-none"
                        placeholder="1. Dolo 650mg - Twice Daily (BD) after meals for 3 Days"
                        value={summaryForm.medicines_list}
                        onChange={(e) => setSummaryForm({ ...summaryForm, medicines_list: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            Recommend Tests
                            {activeFieldMic === 'tests_list' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleFieldMic('tests_list')}
                            className={`p-1 rounded-md transition-all ${
                              activeFieldMic === 'tests_list'
                                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                            }`}
                            title={activeFieldMic === 'tests_list' ? 'Stop mic' : '🎙️ Dictate Tests'}
                          >
                            {activeFieldMic === 'tests_list' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          </button>
                        </label>
                        <div className="flex flex-wrap gap-1 mb-1.5 max-h-[46px] overflow-y-auto pb-0.5 compact-scroll">
                          {COMMON_TESTS.map((tag) => {
                            const isSelected = (summaryForm.tests_list || '').toLowerCase().includes(tag.toLowerCase());
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('tests_list', tag)}
                                className={`text-[10px] px-2 py-0.5 rounded border transition-all font-semibold ${
                                  isSelected 
                                    ? 'bg-teal-600 text-white border-teal-600' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50'
                                }`}
                              >
                                {tag.split(' (')[0]}
                              </button>
                            );
                          })}
                        </div>
                        <textarea
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-normal transition-all h-18 resize-none"
                          placeholder="CBC, Chest X-ray..."
                          value={summaryForm.tests_list}
                          onChange={(e) => setSummaryForm({ ...summaryForm, tests_list: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            Lifestyle Advice
                            {activeFieldMic === 'advice' && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold border border-rose-200 animate-pulse">Listening...</span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleFieldMic('advice')}
                            className={`p-1 rounded-md transition-all ${
                              activeFieldMic === 'advice'
                                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                                : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                            }`}
                            title={activeFieldMic === 'advice' ? 'Stop mic' : '🎙️ Dictate Advice'}
                          >
                            {activeFieldMic === 'advice' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          </button>
                        </label>
                        <div className="flex flex-wrap gap-1 mb-1.5 max-h-[46px] overflow-y-auto pb-0.5 compact-scroll">
                          {COMMON_ADVICE.map((tag) => {
                            const isSelected = (summaryForm.advice || '').includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('advice', tag)}
                                className={`text-[10px] px-2 py-0.5 rounded border transition-all font-semibold ${
                                  isSelected 
                                    ? 'bg-teal-600 text-white border-teal-600' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50'
                                }`}
                              >
                                {tag.length > 18 ? `${tag.slice(0, 16)}...` : tag}
                              </button>
                            );
                          })}
                        </div>
                        <textarea
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-normal transition-all h-18 resize-none"
                          placeholder="Drink warm water, take complete bed rest..."
                          value={summaryForm.advice}
                          onChange={(e) => setSummaryForm({ ...summaryForm, advice: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Follow-up Info</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium transition-all"
                          placeholder="e.g. Return in 5 days or if fever escalates"
                          value={summaryForm.follow_up_date}
                          onChange={(e) => setSummaryForm({ ...summaryForm, follow_up_date: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveSummary}
                          disabled={summarySaving}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          {summarySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Notes
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Summary & Multilingual Handout — 35% width */}
                  <div className="flex-1 space-y-3 pr-1 flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
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
                      <div className="py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2.5">
                        <div>
                          <span className="text-[11px] text-slate-800 font-extrabold uppercase tracking-wider block">Target Indian Language</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-medium">Translates storytelling routines dynamically.</span>
                        </div>
                        <select
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
                          value={selectedLanguage}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setSelectedLanguage(newLang);
                            if (summaryForm.patient_summary) {
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
                          {INDIAN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                          ))}
                        </select>
                      </div>

                      {summaryError && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-rose-800 text-xs font-semibold leading-relaxed">
                          Error: {summaryError}
                        </div>
                      )}

                      {/* Summary Display Box */}
                      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40 min-h-[220px] max-h-[340px] overflow-y-auto compact-scroll font-sans text-xs leading-relaxed space-y-2.5">
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
                            Generate AI Summary ({selectedLanguage})
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
          </div>
        )}
      </div>

      {/* Patient Natural Voice Intake Modal (Hindi / Hinglish / English) */}
      <PatientVoiceModal
        isOpen={showPatientVoiceModal}
        onClose={() => setShowPatientVoiceModal(false)}
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

    </div>
  );
}

