import React, { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';

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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col lg:flex-row items-slate animate-in fade-in duration-300 h-full md:h-full md:max-h-full md:overflow-hidden min-h-0 text-slate-800 overflow-hidden">
      
      {/* Intake Waiting Queue Panel (Left) */}
      <div className="w-full lg:w-[280px] lg:min-w-[280px] border-b lg:border-b-0 lg:border-r border-slate-150 flex flex-col h-full bg-slate-50/20">
        <div className="p-4 flex flex-col h-full overflow-hidden min-h-[300px] lg:min-h-0">
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-4.5 h-4.5 text-teal-600 animate-pulse" />
              Intake Queue
            </h3>
            <button 
              onClick={fetchVisits} 
              disabled={visitsLoading}
              className="text-[10px] text-teal-600 font-bold hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="relative mb-3 flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-semibold transition-all"
              placeholder="Search Queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap gap-1 mb-3 flex-shrink-0">
            {[
              { id: 'All', label: 'All', count: visits.length, activeClass: 'bg-slate-900 text-white border-slate-900', inactiveClass: 'bg-slate-100 text-slate-650 border-slate-200 hover:bg-slate-200' },
              { id: 'Waiting', label: 'Waiting', count: visits.filter(v => v.status !== 'Critical' && v.status !== 'Completed' && !v.diagnosis).length, activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm', inactiveClass: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50' },
              { id: 'Critical', label: 'Critical', count: visits.filter(v => v.status === 'Critical').length, activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm', inactiveClass: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100/50 animate-pulse' },
              { id: 'Completed', label: 'Completed', count: visits.filter(v => v.status === 'Completed' || v.diagnosis).length, activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm', inactiveClass: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50' }
            ].map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                className={`text-[9px] px-2 py-0.5 rounded-lg border font-extrabold transition-all flex items-center gap-1 ${
                  statusFilter === chip.id ? chip.activeClass : chip.inactiveClass
                }`}
              >
                <span>{chip.label}</span>
                <span className={`text-[8px] px-1 rounded-full ${statusFilter === chip.id ? 'bg-white/20 text-white' : 'bg-slate-250/50 text-slate-600'}`}>
                  {chip.count}
                </span>
              </button>
            ))}
          </div>

          {/* Intake queue listings */}
          <div className="space-y-2 md:flex-1 md:overflow-y-auto pr-1 min-h-0 compact-scroll">
            {visitsLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-1" />
                <span className="text-[10px] text-slate-450 font-semibold">Loading intake queue...</span>
              </div>
            ) : (
              filteredQueue.map((vis) => {
                const hasDiagnosis = !!vis.diagnosis;
                const getStatusDetails = () => {
                  if (vis.status === 'Critical') {
                    return { label: 'Critical (Emergency)', style: 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse font-extrabold' };
                  }
                  if (vis.status === 'Completed' || hasDiagnosis) {
                    return { label: 'Completed', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
                  }
                  return { label: 'Waiting', style: 'bg-amber-50 text-amber-700 border-amber-100' };
                };
                const statusInfo = getStatusDetails();
                return (
                  <div
                    key={vis.id}
                    onClick={() => handleSelectVisit(vis)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                      selectedVisit?.id === vis.id
                        ? 'border-teal-500 bg-teal-50/20 shadow-sm'
                        : 'border-slate-100 hover:border-slate-350 hover:bg-slate-50/50 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">{vis.visit_id.slice(-8)}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${statusInfo.style}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{vis.patient?.name || 'Unknown Patient'}</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5 font-semibold">
                        {vis.patient?.age} Yrs • {vis.patient?.gender} • {vis.patient?.mobile_number}
                      </p>
                      {vis.reason && (
                        <p className="text-[10px] text-slate-500 italic mt-1 font-medium truncate">"{vis.reason}"</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {!visitsLoading && filteredQueue.length === 0 && (
              <p className="text-center text-slate-450 text-xs py-8">No patients in the queue.</p>
            )}
          </div>

        </div>
      </div>

      {/* Workspace Panel (Right) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {selectedVisit ? (
          <div className="p-4 flex flex-col h-full overflow-hidden min-h-[400px] lg:min-h-0 animate-in fade-in duration-150">
            
            {/* Consultation Intake Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 flex-shrink-0 flex-wrap gap-2">
              <div>
                <span className="text-teal-650 font-bold text-[10px] uppercase tracking-wider font-sans">Active Consultation Workspace</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedVisit.patient?.name}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-400 text-xs mt-0.5 font-semibold">
                  <span>Age: <b>{selectedVisit.patient?.age} Yrs</b></span>
                  <span>Gender: <b>{selectedVisit.patient?.gender}</b></span>
                  {selectedVisit.patient?.abha_id && (
                    <span className="bg-teal-50 border border-teal-100 text-teal-700 px-1.5 py-0.5 rounded text-[10px] font-black">
                      ABHA Verified: {selectedVisit.patient.abha_id}
                    </span>
                  )}
                  <span>Visit ID: <b>{selectedVisit.visit_id}</b></span>
                  <span className="flex items-center gap-1.5 ml-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">Triage:</span>
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
                      className={`text-[10px] font-black rounded border px-2 py-0.5 cursor-pointer focus:outline-none transition-all ${
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

              <div className="flex gap-2">
                <div className="border border-slate-200 rounded-lg p-0.5 bg-slate-50 flex">
                  <button
                    onClick={() => setActiveWorkspaceTab('clinical')}
                    className={`text-[10px] font-bold px-3 py-1 rounded transition-all ${
                      activeWorkspaceTab === 'clinical'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Clinical Desk
                  </button>
                  <button
                    onClick={handleTriggerPdfPreview}
                    disabled={pdfLoading}
                    className={`text-[10px] font-bold px-3 py-1 rounded transition-all flex items-center gap-1 ${
                      activeWorkspaceTab === 'pdf'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {pdfLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                    Prescription Preview
                  </button>
                </div>

                <button
                  onClick={() => setSelectedVisit(null)}
                  className="text-slate-500 hover:text-slate-800 text-[10px] font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Close Desk
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 min-h-0 mt-3">
              {activeWorkspaceTab === 'clinical' ? (
                /* Clinical Workspace Grid */
                <div className="h-full overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-4 pr-1 compact-scroll">
                  
                  {/* Left Column: Doctor Entry Forms */}
                  <div className="space-y-4 pr-1 border-r border-slate-100">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-150">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-teal-650" />
                        Clinical Records
                      </span>
                      <button
                        type="button"
                        onClick={handleAiSuggestTreatment}
                        disabled={aiPrescribeLoading}
                        className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                          aiPrescribeLoading
                            ? 'bg-violet-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600'
                        }`}
                      >
                        {aiPrescribeLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1 flex justify-between items-center">
                          <span>Chief Complaints</span>
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2 max-h-[45px] overflow-y-auto pb-1 compact-scroll">
                          {COMMON_COMPLAINTS.map((tag) => {
                            const isSelected = (summaryForm.chief_complaints || '').includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('chief_complaints', tag)}
                                className={`text-[8px] px-1.5 py-0.5 rounded-full border transition-all font-semibold ${
                                  isSelected 
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                    : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-teal-55'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-20 resize-none"
                          placeholder="Fever, Dry Cough, Throat irritation..."
                          value={summaryForm.chief_complaints}
                          onChange={(e) => setSummaryForm({ ...summaryForm, chief_complaints: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Diagnosis</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-28 resize-none"
                          placeholder="e.g. Upper Respiratory Tract Infection (URTI)"
                          value={summaryForm.diagnosis}
                          onChange={(e) => setSummaryForm({ ...summaryForm, diagnosis: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1 flex justify-between items-center">
                        <span>Prescribe Medicines</span>
                        <span className="text-[9px] text-teal-600 font-bold bg-teal-50 px-1 rounded border border-teal-100">Prescription Builder</span>
                      </label>
                      
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 mb-2 space-y-1.5 shadow-sm text-[10px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Timing</span>
                            <div className="flex gap-1">
                              {['After Meals', 'Empty Stomach'].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setPrescTiming(t)}
                                  className={`flex-1 text-[8px] py-0.5 rounded font-bold border transition-all ${
                                    prescTiming === t 
                                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                      : 'bg-white text-slate-650 border-slate-200'
                                  }`}
                                >
                                  {t === 'After Meals' ? 'Pc (Post Cibum)' : 'Ac (Ante Cibum)'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Frequency</span>
                            <select
                              value={prescFrequency}
                              onChange={(e) => setPrescFrequency(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-teal-500 font-bold text-slate-705"
                            >
                              <option value="Once Daily (OD)">OD (Once Daily)</option>
                              <option value="Twice Daily (BD)">BD (Twice Daily)</option>
                              <option value="Thrice Daily (TID)">TID (Thrice Daily)</option>
                              <option value="At Bedtime (HS)">HS (At Night)</option>
                              <option value="As Needed (SOS)">SOS (As Needed)</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 items-center">
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Duration</span>
                            <select
                              value={prescDuration}
                              onChange={(e) => setPrescDuration(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-teal-500 font-bold text-slate-705"
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
                            <span className="text-[8px] text-teal-650 font-bold uppercase tracking-wider block mb-0.5">Quick Datastore</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  const med = MEDICINE_DATASTORE.find(m => m.name === e.target.value);
                                  if (med) handleAddMedicineFromSuggest(med);
                                  e.target.value = '';
                                }
                              }}
                              className="w-full bg-white border border-teal-200 rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-teal-500 font-bold text-teal-800"
                            >
                              <option value="">-- Add Med --</option>
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
                          className="w-full bg-teal-50/30 border border-teal-100 rounded-lg px-2.5 py-1.5 text-xs placeholder-teal-600/40 focus:outline-none focus:bg-white focus:border-teal-500 font-semibold transition-all text-slate-800"
                          value={medicineSearch}
                          onChange={(e) => setMedicineSearch(e.target.value)}
                        />
                        
                        {medicineSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                            {medicineSuggestions.map((med, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleAddMedicineFromSuggest(med)}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors font-semibold flex justify-between items-center"
                              >
                                <span>{med.name}</span>
                                <span className="text-[10px] text-teal-600 bg-teal-55 px-1.5 py-0.5 rounded font-normal shrink-0">{med.dosage.split(' for')[0]}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-24 resize-none"
                        placeholder="1. Dolo 650mg - Twice Daily (BD) after meals for 3 Days"
                        value={summaryForm.medicines_list}
                        onChange={(e) => setSummaryForm({ ...summaryForm, medicines_list: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1 flex justify-between items-center">
                          <span>Recommend Tests</span>
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2 max-h-[45px] overflow-y-auto pb-1 compact-scroll">
                          {COMMON_TESTS.map((tag) => {
                            const isSelected = (summaryForm.tests_list || '').toLowerCase().includes(tag.toLowerCase());
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('tests_list', tag)}
                                className={`text-[8px] px-1.5 py-0.5 rounded-full border transition-all font-semibold ${
                                  isSelected 
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                    : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-teal-55'
                                }`}
                              >
                                {tag.split(' (')[0]}
                              </button>
                            );
                          })}
                        </div>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-20 resize-none"
                          placeholder="CBC, Chest X-ray..."
                          value={summaryForm.tests_list}
                          onChange={(e) => setSummaryForm({ ...summaryForm, tests_list: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-455 font-extrabold uppercase tracking-wider mb-1 flex justify-between items-center">
                          <span>Lifestyle Advice</span>
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2 max-h-[45px] overflow-y-auto pb-1 compact-scroll">
                          {COMMON_ADVICE.map((tag) => {
                            const isSelected = (summaryForm.advice || '').includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag('advice', tag)}
                                className={`text-[8px] px-1.5 py-0.5 rounded-full border transition-all font-semibold ${
                                  isSelected 
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                    : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-teal-55'
                                }`}
                              >
                                {tag.length > 15 ? `${tag.slice(0, 13)}...` : tag}
                              </button>
                            );
                          })}
                        </div>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-20 resize-none"
                          placeholder="Drink warm water, take complete bed rest..."
                          value={summaryForm.advice}
                          onChange={(e) => setSummaryForm({ ...summaryForm, advice: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="block text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1">Follow-up Info</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-semibold transition-all"
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
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {summarySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Notes
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Summary & Multilingual Handout */}
                  <div className="space-y-4 pr-1 flex flex-col justify-between h-full min-h-[350px]">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-150">
                        <span className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-teal-650" />
                          Bilingual Daily Routine Handout
                        </span>
                        {summaryForm.patient_summary && !summaryGenerating && (
                          <button
                            type="button"
                            onClick={handleGenerateAiSummary}
                            className="text-[10px] text-teal-650 hover:text-teal-700 font-bold flex items-center gap-1 underline font-sans"
                          >
                            Regenerate
                          </button>
                        )}
                      </div>

                      {/* Language Selection */}
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                        <div>
                          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Target Indian Language</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-semibold">Translates storytelling routines dynamically.</span>
                        </div>
                        <select
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none font-bold text-slate-700 cursor-pointer shadow-sm"
                          value={selectedLanguage}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setSelectedLanguage(newLang);
                            // Auto-regenerate immediately if a summary already exists
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
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-semibold leading-relaxed">
                          Error: {summaryError}
                        </div>
                      )}

                      {/* Summary Display Box */}
                      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 min-h-[220px] max-h-[350px] overflow-y-auto compact-scroll font-sans text-xs leading-relaxed space-y-3 shadow-inner">
                        {summaryGenerating ? (
                          <div className="h-full flex flex-col items-center justify-center py-12 space-y-2">
                            <Brain className="w-8 h-8 text-teal-600 animate-pulse" />
                            <div className="flex items-center gap-1">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                              <span className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">Generating bilingual instructions...</span>
                            </div>
                          </div>
                        ) : (
                          summaryForm.patient_summary ? (
                            <div className="whitespace-pre-line font-semibold text-slate-750">
                              {summaryForm.patient_summary}
                            </div>
                          ) : (
                            <div className="py-12 text-center text-slate-400 italic space-y-2 font-medium">
                              <Sparkles className="w-6 h-6 mx-auto text-slate-350" />
                              <p>Bilingual storytelling prescription summary not compiled yet.</p>
                              <p className="text-[10px] font-normal not-italic text-slate-400">Click the generate button below to request AI translation.</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleGenerateAiSummary}
                        disabled={summaryGenerating || summarySaving}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
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
                <div className="h-full flex flex-col bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative">
                  {pdfPreviewUrl ? (
                    <iframe
                      src={pdfPreviewUrl}
                      title="Prescription PDF Document Previewer"
                      className="w-full h-full border-none md:flex-1"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full space-y-3">
                      <Printer className="w-8 h-8 text-slate-350" />
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">No PDF Preview Active</h4>
                        <p className="text-[10px] text-slate-450 leading-relaxed max-w-sm mt-1 font-semibold">
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/10 h-full">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4 shadow-sm">
              <Brain className="w-8 h-8 text-teal-605 animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Doctor's Consultation Console</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mt-2 font-semibold">
              Select an active patient check-in from the <strong>Intake Queue</strong> list on the left to write clinical diagnoses, run safety checks, and compile bilingual patient-friendly handout guides.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
