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
  Download
} from 'lucide-react';

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

export default function PatientSearchTab({
  API_BASE,
  getHeaders,
  showToast,
  adminSettingsForm,
  userRole,
  searchQuery,
  setSearchQuery,
  patients,
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

  const [downloadPrescriptionLoading, setDownloadPrescriptionLoading] = React.useState(false);
  const STATIC_BASE = import.meta.env.VITE_STATIC_BASE_URL || 'http://localhost:5000';

  // Story View State
  const [showStoryModal, setShowStoryModal] = React.useState(false);
  const [storyVisit, setStoryVisit] = React.useState(null);
  const [summaryTab, setSummaryTab] = React.useState('clinical'); // 'clinical' | 'story'

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
    setSummaryGenerating(true);
    setSummaryError('');
    try {
      const res = await fetch(`${API_BASE}/visits/${selectedVisit.id}/summary?generate_ai_summary=true`, {
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
      {/* Search and Registration block (Left 2 cols) */}
      <div className="xl:col-span-2 space-y-8">
        {/* Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Patient Finder</h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                placeholder="Search ID, Name, Mobile, Invoice..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchPatients(e.target.value);
                }}
              />
            </div>
            <button
              onClick={() => fetchPatients(searchQuery)}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Search
            </button>
          </div>

          {/* Patients Search Results list */}
          <div className="mt-6 space-y-3 max-h-96 overflow-y-auto pr-1">
            {patients.map((pat) => (
              <div
                key={pat.id}
                onClick={() => handleSelectPatient(pat.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  selectedPatient?.id === pat.id
                    ? 'border-teal-500 bg-teal-50/20 shadow-sm'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{pat.name}</span>
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{pat.gender}</span>
                    <span className="text-slate-400 text-xs">{pat.age} Yrs</span>
                  </div>
                  <p className="text-slate-400 text-xs font-semibold">Mobile: {pat.mobile_number} | ID: {pat.patient_id}</p>
                </div>
                <div className="text-teal-600 font-bold text-xs flex items-center justify-center gap-1 bg-white border border-slate-100 px-2.5 py-1.5 rounded-lg shadow-sm self-start sm:self-auto">
                  View Profile &rarr;
                </div>
              </div>
            ))}
            {patients.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">No matching patient profiles found. Use the panel on the right to register.</p>
            )}
          </div>
        </div>

        {/* Selected Patient Workspace */}
        {selectedPatient && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Patient Quick Header Details */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-teal-600 font-bold text-xs uppercase tracking-wider font-sans">Patient Workspace</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">{selectedPatient.name}</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Age: <b>{selectedPatient.age}</b> | Gender: <b>{selectedPatient.gender}</b> | Mobile: <b>{selectedPatient.mobile_number}</b> | ID: <b>{selectedPatient.patient_id}</b>
                </p>
                {selectedPatient.address && (
                  <p className="text-slate-500 text-xs mt-1">Address: {selectedPatient.address}</p>
                )}
              </div>
              {userRole === 'Admin' && (
                <button
                  onClick={() => handleSoftDeletePatient(selectedPatient.id)}
                  className="text-rose-600 hover:text-rose-800 text-xs font-semibold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Profile
                </button>
              )}
            </div>

            {/* Create Visit Panel */}
            {['Admin', 'Receptionist'].includes(userRole) && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Consultation Entry</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Record a new visit or pathology reference under an active doctor.</p>
                </div>
                <button
                  onClick={() => {
                    setNewVisit({ reason: '' });
                    setNewVisitDoctorId('');
                    setShowVisitModal(true);
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 justify-center whitespace-nowrap active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  Log Consultation / Visit
                </button>
              </div>
            )}

            {/* Patient Visit Log List */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Patient Visits & Invoices Grid
              </h3>
              <div className="space-y-4">
                {selectedPatient.visits?.map((vis) => {
                  const visitBills = patientHistory.filter(b => b.visit_id === vis.id);
                  return (
                    <div key={vis.id} className="border border-slate-200 rounded-xl p-4 space-y-4 hover:border-teal-200 bg-white transition-all shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-slate-400 text-xs font-semibold">Visit ID: <b className="text-slate-800">{vis.visit_id}</b></span>
                            <button
                              type="button"
                              onClick={() => handleOpenSummary(vis)}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Clinical Notes & AI Summary</span>
                            </button>
                            {vis.patient_summary && (
                              <button
                                type="button"
                                onClick={() => handleOpenStory(vis)}
                                className="bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 text-violet-700 border border-violet-200 font-bold text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Patient Story</span>
                              </button>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 text-sm mt-0.5">Reason: {vis.reason || 'Not Specified'}</p>
                          {vis.doctor && (
                            <p className="text-xs text-teal-700 font-bold mt-0.5">Consulting Doctor: <span className="text-slate-800">{vis.doctor.name}</span></p>
                          )}
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Date: {new Date(vis.visit_date).toLocaleString()}</p>
                        </div>
                        
                        {/* Advance Payment creation for receptionist */}
                        {['Admin', 'Receptionist'].includes(userRole) && visitBills.length === 0 && (
                          <div className="border border-teal-100 bg-teal-50/30 p-3 rounded-lg flex flex-col gap-2">
                            <span className="text-xs text-teal-700 font-extrabold uppercase tracking-wider">Record Advance Deposit</span>
                            <form onSubmit={(e) => handleRecordAdvance(e, vis.id)} className="flex items-center gap-2 flex-wrap">
                              <input
                                type="number"
                                className="w-24 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500 font-bold text-slate-800"
                                placeholder="₹ Amount"
                                value={newAdvancePayment.amount_paid}
                                onChange={(e) => setNewAdvancePayment({ ...newAdvancePayment, amount_paid: e.target.value })}
                                required
                              />
                              <select
                                className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none font-semibold text-slate-600"
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
                                className="w-28 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none font-medium text-slate-800"
                                placeholder="Ref No (Optional)"
                                value={newAdvancePayment.transaction_reference}
                                onChange={(e) => setNewAdvancePayment({ ...newAdvancePayment, transaction_reference: e.target.value })}
                              />
                              <button
                                type="submit"
                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3 py-1 rounded"
                              >
                                Save Deposit
                              </button>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Bills table linked to this visit */}
                      <div className="space-y-2">
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Invoices / Bills:</div>
                        {visitBills.map(bill => (
                          <div key={bill.id} className="border border-slate-100 rounded-lg p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{bill.bill_id}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  bill.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  bill.payment_status === 'Partial Paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>{bill.payment_status}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                                Total: ₹{bill.grand_total.toLocaleString()} | Adjusted Advance: ₹{bill.advance_applied.toLocaleString()} | Outstanding: <b className="text-slate-700 font-bold">₹{bill.balance_amount.toLocaleString()}</b>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
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
                                  className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-teal-100 transition-colors"
                                >
                                  Record Payment
                                </button>
                              )}

                              {/* Print/Download Receipts button if any payment exists */}
                              {bill.payments?.map(pay => (
                                <div key={pay.id} className="flex items-center gap-1">
                                  <button
                                    onClick={() => fetchReceiptDetails(pay.id)}
                                    className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:bg-slate-50 transition-colors"
                                    title={`View receipt for transaction ${pay.payment_id}`}
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="font-mono text-[10px]">{pay.payment_id}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(pay.payment_id);
                                    }}
                                    className="bg-white border border-slate-200 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                    title="Copy Payment ID"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              {/* Soft delete invoice */}
                              {userRole === 'Admin' && (
                                <button
                                  onClick={() => handleSoftDeleteBill(bill.id)}
                                  className="text-rose-600 hover:text-rose-800 p-1.5 rounded bg-rose-50 hover:bg-rose-100 transition-colors"
                                  title="Cancel invoice"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Create bill button for receptionist */}
                        {['Admin', 'Receptionist'].includes(userRole) && visitBills.length === 0 && (
                          <div className="border border-dashed border-slate-300 p-4 rounded-lg bg-slate-50/20 text-center">
                            <p className="text-slate-500 text-sm mb-3">No bills generated for this visit. Open billing builder below.</p>
                            
                            {/* BILL BUILDER COMPONENT */}
                            <div className="text-left bg-white border border-slate-200/80 rounded-xl p-4 space-y-4">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
                                <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Multi-Item Bill Creator</h5>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => fetchAiRecommendations(vis.id, vis.reason)}
                                    disabled={aiRecommendationsLoading}
                                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 shadow-sm ${
                                      aiRecommendationsLoading
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 border border-teal-200'
                                    }`}
                                  >
                                    {aiRecommendationsLoading && aiRecommenderVisitId === vis.id ? (
                                      <>
                                        <span className="animate-spin w-2.5 h-2.5 border-t-2 border-teal-600 rounded-full inline-block"></span>
                                        Analyzing...
                                      </>
                                    ) : (
                                      <>✨ AI Test Suggester</>
                                    )}
                                  </button>
                                  <span className="text-xs text-teal-600 font-bold bg-teal-50 px-2.5 py-1.5 rounded border border-teal-200">Active Catalog Linked</span>
                                </div>
                              </div>

                              {/* AI Recommendations Section */}
                              {aiRecommenderVisitId === vis.id && (aiRecommendations.length > 0 || aiRecommendationsLoading || aiExplanation) && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                      <span>✦ AI Smart Suggestions</span>
                                      {aiRecommendationsLoading && (
                                        <span className="text-[10px] text-teal-500 font-normal normal-case animate-pulse">(fetching recommendations...)</span>
                                      )}
                                    </span>
                                    {aiRecommendations.length > 0 && (
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          setAiRecommendations([]);
                                          setAiExplanation('');
                                          setAiRecommenderVisitId(null);
                                        }}
                                        className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                                      >
                                        Clear AI suggestions
                                      </button>
                                    )}
                                  </div>

                                  {aiRecommendationsLoading ? (
                                    <div className="py-4 text-center space-y-2">
                                      <div className="w-5 h-5 border-t-2 border-b-2 border-teal-605 rounded-full animate-spin mx-auto text-teal-650"></div>
                                      <p className="text-xs text-slate-500 font-semibold">Consulting doctor assistant for {selectedPatient.gender}, {selectedPatient.age} yrs...</p>
                                    </div>
                                  ) : (
                                    <>
                                      {aiRecommendations.length === 0 && !aiExplanation ? (
                                        <p className="text-xs text-slate-500 italic">No recommendations found. Try refining symptoms/visit reason.</p>
                                      ) : (
                                        <div className="space-y-3">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {aiRecommendations.map((item, index) => (
                                              <div key={index} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-teal-500 hover:shadow transition-all duration-200">
                                                <div>
                                                  <div className="flex justify-between items-start gap-2">
                                                    <span className="font-bold text-slate-800 text-xs leading-tight">{item.service_name}</span>
                                                    <span className="font-extrabold text-teal-600 text-xs whitespace-nowrap">₹{item.price}</span>
                                                  </div>
                                                  <p className="text-xs text-slate-500 leading-relaxed mt-2 font-medium">"{item.reason}"</p>
                                                </div>
                                                <div className="mt-3 flex justify-end">
                                                  <button
                                                    type="button"
                                                    onClick={() => addRecommendedItem(item)}
                                                    className="bg-teal-650 hover:bg-teal-705 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                                  >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Add to Bill
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {aiExplanation && (
                                            <div className="text-xs bg-teal-50/50 border border-teal-100 rounded-xl p-3 text-slate-600 font-medium italic leading-relaxed border-l-4 border-teal-500">
                                              <strong className="text-teal-800 font-bold not-italic">Clinical Analysis:</strong> {aiExplanation}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Service item selector */}
                              <div className="flex gap-3 flex-wrap items-end">
                                <div className="flex-1 min-w-[200px]">
                                  <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Select Service</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    value={selectedServiceId}
                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                  >
                                    <option value="">-- Choose from Catalog --</option>
                                    {availableServices.map(s => (
                                      <option key={s.id} value={s.id}>{s.category} ➔ {s.name} (₹{s.price})</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="w-32">
                                  <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Price Override</label>
                                  <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                                    placeholder="Price (₹)"
                                    value={customItemPrice}
                                    onChange={(e) => setCustomItemPrice(e.target.value)}
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={addBillItem}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1 shadow-sm h-[38px] self-end"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add
                                </button>
                              </div>

                              {/* Active items list for this bill */}
                              {billItems.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                  <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Bill Line Items</span>
                                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/30">
                                    {billItems.map((item, index) => (
                                      <div key={index} className="flex justify-between items-center py-2 px-3 text-xs">
                                        <div>
                                          <span className="font-semibold text-slate-800">{item.service_name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="font-extrabold text-slate-900">₹{item.amount.toLocaleString()}</span>
                                          <button
                                            onClick={() => removeBillItem(index)}
                                            className="text-rose-600 hover:text-rose-800 transition-colors p-1"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* AI Billing Auditor */}
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mt-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                        <Brain className="w-4 h-4 text-violet-500 animate-pulse" />
                                        <span>AI Billing Auditor</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => runAnomalyCheck(vis)}
                                        disabled={anomalyCheckLoading}
                                        className="bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                      >
                                        {anomalyCheckLoading ? (
                                          <>
                                            <span className="animate-spin w-2.5 h-2.5 border-t-2 border-violet-600 rounded-full inline-block"></span>
                                            Auditing...
                                          </>
                                        ) : (
                                          <>
                                            <Search className="w-3 h-3" />
                                            Run AI Audit
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {anomalyResult ? (
                                      <div className={`p-2.5 rounded-xl text-xs flex flex-col gap-1.5 transition-all border ${
                                        anomalyResult.status === 'clear'
                                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                                          : anomalyResult.status === 'warning'
                                          ? 'bg-amber-50/50 border-amber-200 text-amber-800'
                                          : 'bg-rose-50/50 border-rose-200 text-rose-800'
                                      }`}>
                                        <div className="flex items-center gap-1.5 font-bold">
                                          {anomalyResult.status === 'clear' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                          {anomalyResult.status === 'warning' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                                          {anomalyResult.status === 'critical' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                                          <span className="uppercase text-[9px] tracking-wider font-black">
                                            Status: {anomalyResult.status}
                                          </span>
                                        </div>
                                        <p className="font-bold text-[11px] leading-snug">{anomalyResult.summary}</p>
                                        {anomalyResult.issues && anomalyResult.issues.length > 0 && (
                                          <ul className="list-disc pl-4 space-y-1 mt-0.5 font-semibold text-[10px]">
                                            {anomalyResult.issues.map((issue, idx) => (
                                              <li key={idx}>{issue}</li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-400 font-semibold">Verify invoice for duplicate tests, suspicious charges, or age discrepancies before generating.</p>
                                    )}
                                  </div>

                                  {/* Total Summary */}
                                  <div className="flex justify-between items-center pt-3 px-1 border-t border-slate-100 mt-2">
                                    <div>
                                      <span className="text-xs text-slate-500 font-bold">Subtotal:</span>
                                      <span className="font-extrabold text-slate-900 ml-2">₹{billItems.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (anomalyResult && !anomalyResult.safe_to_proceed) {
                                          const proceed = window.confirm(`⚠️ AI Auditor WARNING:\n${anomalyResult.summary}\n\nIssues:\n${anomalyResult.issues.map(i => '- ' + i).join('\n')}\n\nAre you sure you want to generate this invoice anyway?`);
                                          if (!proceed) return;
                                        }
                                        handleCreateBill(vis.id);
                                      }}
                                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all"
                                    >
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
                  <p className="text-center text-slate-400 text-xs py-4">No logged visits or consultations for this patient yet. Use the Log Visit panel above.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Register Patient Profile form (Right col) */}
      {['Admin', 'Receptionist'].includes(userRole) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            New Registration
          </h3>
          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Patient Full Name</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                placeholder="e.g. Rahul Sharma"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Age</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                  placeholder="Age in Yrs"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Gender</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold text-slate-600"
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Mobile Number</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                placeholder="10-digit Phone"
                value={newPatient.mobile_number}
                onChange={(e) => setNewPatient({ ...newPatient, mobile_number: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Residential Address</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium h-20 resize-none"
                placeholder="Street, City, pincode"
                value={newPatient.address}
                onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Save Patient Profile
            </button>
          </form>
        </div>
      )}

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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1 flex justify-between items-center">
                      <span>Chief Complaints</span>
                      <span className="text-[9px] text-slate-400 font-semibold italic">click to toggle</span>
                    </label>
                    
                    {/* Quick Complaints Tags */}
                    <div className="flex flex-wrap gap-1 mb-2 max-h-[50px] overflow-y-auto pb-1">
                      {COMMON_COMPLAINTS.map((tag) => {
                        const isSelected = (summaryForm.chief_complaints || '').includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag('chief_complaints', tag)}
                            className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-all font-semibold ${
                              isSelected 
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-20 resize-none"
                      placeholder="e.g. Chronic cough for 3 weeks, mild chest congestion, low-grade fever..."
                      value={summaryForm.chief_complaints}
                      onChange={(e) => setSummaryForm({ ...summaryForm, chief_complaints: e.target.value })}
                    />
                  </div>
 
                  <div>
                    <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1.5">Diagnosis</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-28 resize-none"
                      placeholder="e.g. Acute Bronchitis secondary to viral infection"
                      value={summaryForm.diagnosis}
                      onChange={(e) => setSummaryForm({ ...summaryForm, diagnosis: e.target.value })}
                    />
                  </div>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1 flex justify-between items-center">
                      <span>Prescribed Medicines</span>
                      <span className="text-[10px] text-teal-600 font-bold lowercase bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">(autocomplete & builder active)</span>
                    </label>
                    
                    {/* Prescription Builder Row */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-250 mb-2 space-y-1.5 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Timing Selector */}
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Timing</span>
                          <div className="flex gap-1">
                            {['After Meals', 'Empty Stomach'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setPrescTiming(t)}
                                className={`flex-1 text-[9px] py-1 rounded font-bold border transition-all ${
                                  prescTiming === t 
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {t === 'After Meals' ? 'Pc (Khane ke Baad)' : 'Ac (Khali Pet)'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Frequency Selector */}
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Frequency</span>
                          <select
                            value={prescFrequency}
                            onChange={(e) => setPrescFrequency(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-teal-500 font-bold text-slate-700"
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
                        {/* Duration Selector */}
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Duration</span>
                          <select
                            value={prescDuration}
                            onChange={(e) => setPrescDuration(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-teal-500 font-bold text-slate-700"
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
                          <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider block mb-0.5">Quick Add</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                const med = MEDICINE_DATASTORE.find(m => m.name === e.target.value);
                                if (med) handleAddMedicineFromSuggest(med);
                                e.target.value = '';
                              }
                            }}
                            className="w-full bg-white border border-teal-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-teal-500 font-bold text-teal-800"
                          >
                            <option value="">-- Add Med --</option>
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
                        placeholder="🔍 Search medicine name (e.g. Dolo, Pan, Azee...)"
                        className="w-full bg-teal-50/40 border border-teal-100 rounded-lg px-2.5 py-1.5 text-xs placeholder-teal-600/40 focus:outline-none focus:bg-white focus:border-teal-500 font-semibold transition-all text-slate-800"
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
                        <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          {medicineSuggestions.map((med, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddMedicineFromSuggest(med)}
                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors font-semibold flex justify-between items-center"
                            >
                              <span>{med.name}</span>
                              <span className="text-[10px] text-teal-600 bg-teal-50/60 px-1.5 py-0.5 rounded font-normal shrink-0">{med.dosage.split(' for')[0]}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
 
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-28 resize-none"
                      placeholder="e.g. 1. Paracetamol 650mg (TID for 3 days)&#10;2. Levocetirizine 5mg (HS for 5 days)"
                      value={summaryForm.medicines_list}
                      onChange={(e) => setSummaryForm({ ...summaryForm, medicines_list: e.target.value })}
                    />
                  </div>
 
                  <div>
                    <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1 flex justify-between items-center">
                      <span>Recommended Tests</span>
                      <span className="text-[9px] text-slate-400 font-semibold italic">click to toggle</span>
                    </label>
                    
                    {/* Quick Tests Tags */}
                    <div className="flex flex-wrap gap-1 mb-2 max-h-[50px] overflow-y-auto pb-1">
                      {COMMON_TESTS.map((tag) => {
                        const isSelected = (summaryForm.tests_list || '').toLowerCase().includes(tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag('tests_list', tag)}
                            className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-all font-semibold ${
                              isSelected 
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                            }`}
                          >
                            {tag.split(' (')[0]}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-28 resize-none"
                      placeholder="e.g. CBC (Complete Blood Count), Chest X-Ray PA View"
                      value={summaryForm.tests_list}
                      onChange={(e) => setSummaryForm({ ...summaryForm, tests_list: e.target.value })}
                    />
                  </div>
                </div>
 
                <div>
                  <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1 flex justify-between items-center">
                    <span>Clinical Advice / Lifestyle Instructions</span>
                    <span className="text-[9px] text-slate-400 font-semibold italic">click to toggle</span>
                  </label>
                  
                  {/* Quick Advice Tags */}
                  <div className="flex flex-wrap gap-1 mb-2 max-h-[50px] overflow-y-auto pb-1">
                    {COMMON_ADVICE.map((tag) => {
                      const isSelected = (summaryForm.advice || '').includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag('advice', tag)}
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-all font-semibold ${
                            isSelected 
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                          }`}
                        >
                          {tag.length > 25 ? `${tag.slice(0, 23)}...` : tag}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-20 resize-none"
                    placeholder="e.g. Warm saline gargles thrice daily. Drink plenty of warm water. Avoid cold drinks."
                    value={summaryForm.advice}
                    onChange={(e) => setSummaryForm({ ...summaryForm, advice: e.target.value })}
                  />
                </div>
 
                <div>
                  <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1.5">Follow-up Date / Instructions</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-semibold transition-all"
                    placeholder="e.g. In 5 days or if symptoms worsen"
                    value={summaryForm.follow_up_date}
                    onChange={(e) => setSummaryForm({ ...summaryForm, follow_up_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Pane: AI Consultation Summary */}
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-150 flex flex-col justify-between min-h-[350px]">
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-155">
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
                    <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-semibold leading-relaxed">
                      Error: {summaryError}
                    </div>
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
                          <span className="text-[10px] text-violet-500 font-bold uppercase tracking-widest">Powered by Groq · Llama 3.3 70B</span>
                        </div>
                      </div>
                    </div>
                  ) : summaryForm.patient_summary ? (() => {
                    // Parse the structured storytelling output into visual sections
                    // Handles both old format [English Summary] and new [English Storytelling Summary]
                    const raw = summaryForm.patient_summary;
                    const englishMatch = raw.match(/\[English(?:[^\]]*Summary|\s+Storytelling\s+Summary)\]([\s\S]*?)(?=\[Hindi|$)/i);
                    const hindiMatch = raw.match(/\[Hindi\s*Summary[\s\S]*?\]([\s\S]*?)$/i);
                    const englishText = englishMatch ? englishMatch[1].trim() : '';
                    const hindiText = hindiMatch ? hindiMatch[1].trim() : '';
                    // isStructured: detect either plain "Morning:" or emoji-prefixed "☀️ Morning:"
                    const isStructured = englishText && (
                      /morning:/i.test(englishText) || /night:/i.test(englishText)
                    );

                    // parseSection: handles labels with or without leading emoji (e.g. "☀️ Morning" or plain "Morning")
                    // Also handles "सुबह (Morning):" where the label has a parenthetical annotation
                    const parseSection = (text, labels) => {
                      const result = {};
                      for (const label of labels) {
                        // Match: optional non-word/non-newline prefix, then label, then optional annotation chars (not : or \n), then :
                        const regex = new RegExp(`(?:[^\\w\\n]*)?${label}[^:\\n]*:[^\\S\\n]*(.+?)(?=\\n[^\\n]*:|$)`, 'is');
                        const m = text.match(regex);
                        result[label] = m ? m[1].trim() : null;
                      }
                      // greeting = first line before any labeled section
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
                    // Hindi new labels: "सुबह (Morning)", "दोपहर (Afternoon)", "रात (Night)", "इन बातों का ध्यान रखें"
                    // Also support old Hindi labels: Subah, Dopahar, Raat, Dhyan Rakhein
                    const hiSections = parseSection(hindiText, [
                      'सुबह', 'दोपहर', 'रात', 'इन बातों का ध्यान रखें',
                      'Subah', 'Dopahar', 'Raat', 'Dhyan Rakhein'
                    ]);

                    const slotConfig = [
                      { key: 'Morning', emoji: '☀️', label: 'Morning', color: 'from-amber-50 to-orange-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
                      { key: 'Afternoon', emoji: '🌤️', label: 'Afternoon', color: 'from-sky-50 to-blue-50', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700' },
                      { key: 'Night', emoji: '🌙', label: 'Night', color: 'from-indigo-50 to-violet-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
                      { key: 'Watch Out For', emoji: '⚠️', label: 'Watch Out For', color: 'from-rose-50 to-red-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' },
                    ];

                    // Hindi slot config: new labels take priority, fallback to old romanized keys
                    const hiSlotConfig = [
                      { key: 'सुबह', fallbackKey: 'Subah', emoji: '☀️', label: 'सुबह', color: 'from-amber-50 to-orange-50', border: 'border-amber-200' },
                      { key: 'दोपहर', fallbackKey: 'Dopahar', emoji: '🌤️', label: 'दोपहर', color: 'from-sky-50 to-blue-50', border: 'border-sky-200' },
                      { key: 'रात', fallbackKey: 'Raat', emoji: '🌙', label: 'रात', color: 'from-indigo-50 to-violet-50', border: 'border-indigo-200' },
                      { key: 'इन बातों का ध्यान रखें', fallbackKey: 'Dhyan Rakhein', emoji: '⚠️', label: 'ध्यान रखें', color: 'from-rose-50 to-red-50', border: 'border-rose-200' },
                    ];

                    return (
                      <div className="mt-3 flex-1 flex flex-col space-y-3 overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">AI Storytelling Summary</label>
                          <span className="flex items-center gap-1 bg-violet-50 border border-violet-100 text-violet-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
                            EN + हिंदी Daily Routine
                          </span>
                        </div>

                        {isStructured ? (
                          <div className="space-y-2">
                            {/* English greeting */}
                            {enSections.greeting && (
                              <p className="text-xs text-teal-800 font-semibold italic bg-teal-50 border border-teal-100 rounded-xl px-3 py-2 leading-relaxed">
                                💬 {enSections.greeting}
                              </p>
                            )}
                            {/* English daily slots */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {slotConfig.map(slot => enSections[slot.key] && (
                                <div key={slot.key} className={`bg-gradient-to-br ${slot.color} border ${slot.border} rounded-xl p-2.5`}>
                                  <div className={`text-[9px] font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1 ${slot.badge} w-fit px-1.5 py-0.5 rounded-full`}>
                                    <span>{slot.emoji}</span> {slot.label}
                                  </div>
                                  <p className="text-[10px] text-slate-700 leading-relaxed font-medium">{enSections[slot.key]}</p>
                                </div>
                              ))}
                            </div>

                            {hindiText && (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">हिंदी सारांश</p>
                                <div className="space-y-1">
                                  {hiSlotConfig.map(slot => {
                                    const val = hiSections[slot.key] || hiSections[slot.fallbackKey];
                                    return val ? (
                                      <div key={slot.key} className={`flex gap-2 items-start`}>
                                        <span className="text-[10px] font-bold text-slate-500 w-20 shrink-0">{slot.emoji} {slot.label}:</span>
                                        <p className="text-[10px] text-slate-700 leading-relaxed">{val}</p>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
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
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-4 space-y-4">
                      <div className="bg-teal-50 p-4 rounded-full border border-teal-100">
                        <Brain className="w-8 h-8 text-teal-600" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Generate Patient-Friendly Consultation Handout</h5>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal">
                          Fill out the doctor's clinical notes on the left and click below to automatically translate and explain the prescription, diagnosis, and advice in simple English and Hindi.
                        </p>
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
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 font-bold py-2.5 px-5 rounded-xl transition-all text-xs"
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
    </div>
  );
}
