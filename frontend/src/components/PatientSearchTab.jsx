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
  Copy
} from 'lucide-react';

const MEDICINE_DATASTORE = [
  // Paracetamol variants
  { name: 'Paracetamol 650mg (Dolo 650)', dosage: '1 tablet TID after meals for 3 days' },
  { name: 'Paracetamol 500mg (Crocin)', dosage: '1 tablet TID after meals for 3 days' },
  { name: 'Paracetamol Syrup 120mg/5ml', dosage: '5ml TID for 3 days' },
  
  // Antibiotics & Antivirals
  { name: 'Azithromycin 500mg (Azee)', dosage: '1 tablet OD before food for 3 days' },
  { name: 'Amoxicillin + Clavulanic Acid 625mg (Augmentin)', dosage: '1 tablet BD after meals for 5 days' },
  { name: 'Cefixime 200mg (Taxim-O)', dosage: '1 tablet BD after meals for 5 days' },
  { name: 'Ofloxacin + Ornidazole (O2)', dosage: '1 tablet BD after meals for 5 days' },
  { name: 'Acyclovir 400mg', dosage: '1 tablet 5 times daily for 5 days' },
  
  // Cough, Cold & Antihistamines
  { name: 'Levocetirizine 5mg (Levocet)', dosage: '1 tablet HS (night) for 5 days' },
  { name: 'Cetirizine 10mg (Okacet)', dosage: '1 tablet HS (night) for 5 days' },
  { name: 'Montelukast + Levocetirizine (Montair LC)', dosage: '1 tablet HS (night) for 7 days' },
  { name: 'Cough Syrup (Ascoril LS)', dosage: '5ml TID for 5 days' },
  { name: 'Cough Syrup (Grilinctus)', dosage: '5ml TID for 5 days' },
  { name: 'Phenylephrine + Chlorpheniramine (Solvin Cold)', dosage: '1 tablet TID for 3 days' },
  
  // Antacids & Gastrointestinal
  { name: 'Pantoprazole 40mg (Pan 40)', dosage: '1 tablet OD before breakfast for 10 days' },
  { name: 'Omeprazole 20mg (Omez)', dosage: '1 tablet OD before breakfast for 7 days' },
  { name: 'Ranitidine 150mg (Rantac)', dosage: '1 tablet BD before food for 5 days' },
  { name: 'Antacid Gel Syrup (Digene)', dosage: '10ml after meals for 5 days' },
  { name: 'ORS (Oral Rehydration Salts)', dosage: 'Dissolve in 1L water, sip throughout day' },
  { name: 'Loperamide 2mg (Lopamide)', dosage: '1 tablet after loose motion (max 4/day)' },
  
  // Painkillers & Anti-inflammatories
  { name: 'Ibuprofen 400mg (Brufen)', dosage: '1 tablet BD after meals as needed' },
  { name: 'Aceclofenac + Paracetamol (Zerodol-P)', dosage: '1 tablet BD after meals for 3 days' },
  { name: 'Diclofenac Gel 1% (Volini)', dosage: 'Apply locally 3-4 times daily' },
  { name: 'Tramadol + Paracetamol (Ultracet)', dosage: '1 tablet BD after meals for pain' },

  // Chronic (Diabetes, BP, Thyroid, etc.)
  { name: 'Metformin 500mg (Glycomet)', dosage: '1 tablet BD after meals' },
  { name: 'Amlodipine 5mg (Amlong)', dosage: '1 tablet OD in morning' },
  { name: 'Telmisartan 40mg (Telma 40)', dosage: '1 tablet OD in morning' },
  { name: 'Thyroxine Sodium 50mcg (Thyronorm)', dosage: '1 tablet OD early morning empty stomach' },
  { name: 'Atorvastatin 10mg (Atorva)', dosage: '1 tablet HS (night)' },
  
  // Vitamins & Supplements
  { name: 'Vitamin C 500mg (Limcee)', dosage: '1 tablet daily (chewable) for 15 days' },
  { name: 'Vitamin D3 60K UI (Calcirol)', dosage: '1 sachet/capsule weekly with milk for 4 weeks' },
  { name: 'B-Complex + Zinc (Becosules)', dosage: '1 capsule OD after lunch for 10 days' },
  { name: 'Iron + Folic Acid (Autrin)', dosage: '1 capsule OD after meals for 30 days' },
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

  // Auto-filter medicine suggestions
  React.useEffect(() => {
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
    const newline = `${nextNum}. ${med.name} - ${med.dosage}`;
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

                                  {/* Total Summary */}
                                  <div className="flex justify-between items-center pt-2 px-1">
                                    <div>
                                      <span className="text-xs text-slate-500">Subtotal:</span>
                                      <span className="font-extrabold text-slate-900 ml-2">₹{billItems.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                                    </div>
                                    <button
                                      onClick={() => handleCreateBill(vis.id)}
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
                <h4 className="text-sm font-bold text-slate-900 border-l-4 border-teal-500 pl-2 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Doctor's Clinical Notes
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1.5">Chief Complaints</label>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-20 resize-none"
                      placeholder="e.g. Acute Bronchitis secondary to viral infection"
                      value={summaryForm.diagnosis}
                      onChange={(e) => setSummaryForm({ ...summaryForm, diagnosis: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1.5 flex justify-between items-center">
                      <span>Prescribed Medicines</span>
                      <span className="text-[10px] text-teal-600 font-bold lowercase bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">(search helper active)</span>
                    </label>
                    
                    {/* Autocomplete Input Helper */}
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="🔍 Type medicine name (e.g. Dolo, Pan, Azee...)"
                        className="w-full bg-teal-50/40 border border-teal-100 rounded-lg px-2.5 py-1 text-xs placeholder-teal-600/40 focus:outline-none focus:bg-white focus:border-teal-500 font-semibold transition-all text-slate-800"
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
                              <span className="text-[10px] text-teal-600 bg-teal-50/60 px-1.5 py-0.5 rounded font-normal shrink-0">{med.dosage}</span>
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
                    <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1.5">Recommended Tests</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all h-28 resize-none"
                      placeholder="e.g. CBC (Complete Blood Count), Chest X-Ray PA View"
                      value={summaryForm.tests_list}
                      onChange={(e) => setSummaryForm({ ...summaryForm, tests_list: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-1.5">Clinical Advice / Lifestyle Instructions</label>
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
                    <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
                        <Brain className="w-6 h-6 text-teal-600 absolute top-3 left-3 animate-pulse" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-slate-700 animate-pulse">Drafting English & Hindi summary...</p>
                        <p className="text-xs text-slate-500">Distilling clinical terms, medicines, and advice</p>
                      </div>
                    </div>
                  ) : summaryForm.patient_summary ? (
                    <div className="mt-4 flex-1 flex flex-col">
                      <label className="block text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-2">Generated Patient-Friendly Summary (Editable)</label>
                      <textarea
                        className="w-full flex-1 bg-white border border-slate-200 rounded-xl p-3 text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium transition-all resize-none leading-relaxed text-slate-700 border-l-3 border-l-teal-500"
                        value={summaryForm.patient_summary}
                        onChange={(e) => setSummaryForm({ ...summaryForm, patient_summary: e.target.value })}
                      />
                    </div>
                  ) : (
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
                <button
                  type="button"
                  onClick={handlePrintSummary}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95"
                >
                  <Printer className="w-4 h-4 text-teal-500" />
                  Print Handout Sheet
                </button>
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

            {summaryForm.patient_summary && (
              <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl mt-6">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Patient-Friendly Consultation Summary
                </h3>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                  {summaryForm.patient_summary}
                </div>
              </div>
            )}
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
    </div>
  );
}
