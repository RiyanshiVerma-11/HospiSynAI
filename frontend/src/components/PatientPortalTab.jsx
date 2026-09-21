import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  FileText,
  Download,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Stethoscope,
  Pill,
  Shield,
  Sparkles,
  RefreshCw,
  LogOut,
  Phone,
  MapPin,
  Hash,
  User,
  Receipt,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Printer,
  Check,
  Copy,
  Send,
  AlertTriangle,
  QrCode,
  Bell
} from 'lucide-react';
import MedicineCalendarModal from './MedicineCalendarModal';
import { buildMasterGoogleCalendarUrl, buildFollowUpGoogleCalendarUrl } from '../utils/calendarService';

export default function PatientPortalTab({
  API_BASE,
  STATIC_BASE = '',
  getHeaders,
  showToast,
  currentUser,
  handleLogout,
  setActiveTab,
  activeSubTab: externalSubTab,
  setActiveSubTab: externalSetSubTab,
  onDataLoaded
}) {
  const [data, setData] = useState({ patient: null, visits: [], bills: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [localSubTab, setLocalSubTab] = useState('prescriptions'); // 'prescriptions' | 'bills' | 'health_card' | 'profile'
  const activeSubTab = externalSubTab || localSubTab;
  const setActiveSubTab = externalSetSubTab || setLocalSubTab;
  const [sendingEmailVisitId, setSendingEmailVisitId] = useState(null);
  const [sendingEmailBillId, setSendingEmailBillId] = useState(null);
  const [downloadingPdfVisitId, setDownloadingPdfVisitId] = useState(null);
  const [expandedVisitId, setExpandedVisitId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg: '' }
  const [copiedUhid, setCopiedUhid] = useState(false);
  const [calendarModalVisit, setCalendarModalVisit] = useState(null);

  const fetchRecords = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_BASE}/patient-portal/my-records`, {
        headers: getHeaders ? getHeaders() : {}
      });

      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        if (onDataLoaded) onDataLoaded(payload);
        // Expand the most recent visit by default if available
        if (payload.visits && payload.visits.length > 0 && expandedVisitId === null) {
          setExpandedVisitId(payload.visits[0].id);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Unable to retrieve patient health records');
      }
    } catch (err) {
      console.error("Patient portal fetch error:", err);
      if (showToast) showToast(err.message, 'error');
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDownloadPrescription = async (visitId) => {
    try {
      setDownloadingPdfVisitId(visitId);
      const res = await fetch(`${API_BASE}/visits/${visitId}/prescription-pdf`, {
        headers: getHeaders ? getHeaders() : {}
      });

      if (res.ok) {
        const result = await res.json();
        const url = `${STATIC_BASE || ''}${result.pdf_path}`;
        window.open(url, '_blank');
        if (showToast) showToast('Prescription PDF opened for printing/download');
      } else {
        throw new Error('Failed to generate prescription PDF');
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setDownloadingPdfVisitId(null);
    }
  };

  const handleSendPrescriptionEmail = async (visitId) => {
    try {
      setSendingEmailVisitId(visitId);
      const res = await fetch(`${API_BASE}/visits/${visitId}/send-prescription-email`, {
        method: 'POST',
        headers: getHeaders ? getHeaders() : {}
      });

      const resData = await res.json();
      if (res.ok) {
        const msg = resData.message || 'Prescription and calendar reminder dispatched to your email!';
        if (showToast) showToast(`📧 ${msg}`, 'success');
        setFeedback({ type: 'success', msg });
      } else {
        throw new Error(resData.detail || 'Email dispatch failed. Please check your registered email.');
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSendingEmailVisitId(null);
    }
  };

  const handleSendInvoiceEmail = async (billId) => {
    try {
      setSendingEmailBillId(billId);
      const res = await fetch(`${API_BASE}/bills/${billId}/send-invoice-email`, {
        method: 'POST',
        headers: getHeaders ? getHeaders() : {}
      });

      const resData = await res.json();
      if (res.ok) {
        const msg = resData.message || 'Invoice receipt sent to your email!';
        if (showToast) showToast(`🧾 ${msg}`, 'success');
        setFeedback({ type: 'success', msg });
      } else {
        throw new Error(resData.detail || 'Failed to email invoice receipt.');
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSendingEmailBillId(null);
    }
  };

  const patient = data.patient || {};
  const visits = data.visits || [];
  const bills = data.bills || [];

  // Metrics
  const totalBilled = bills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);
  const totalBalance = bills.reduce((sum, b) => sum + (Number(b.balance_amount) || 0), 0);

  // Active or waiting visit
  const activeVisit = visits.find(v => v.status === 'Waiting' || v.status === 'In-Consultation');

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-600 dark:text-slate-300 font-medium">
          Loading your secure health records...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto compact-scroll p-3 sm:p-5 md:p-6 pb-24">
      <div className="space-y-5 max-w-7xl mx-auto">

        {/* ----------------------------------------------------
            LIVE OPD QUEUE TOKEN ALERT (Only shown when an active consultation is in queue)
            ---------------------------------------------------- */}
        {activeVisit && activeVisit.status !== 'Completed' && (
          <div className="flex items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-4 py-2.5 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live OPD Queue: Token <strong>#{activeVisit.token_number || 'OPD'}</strong></span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 font-bold">{activeVisit.status}</span>
            </div>
            <button
              onClick={() => setActiveSubTab('prescriptions')}
              className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
            >
              View Consultation →
            </button>
          </div>
        )}

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`p-3 rounded-xl flex items-center justify-between gap-3 border text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
              <span>{feedback.msg}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="font-semibold opacity-75 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* ----------------------------------------------------
            PORTAL SUB-NAVIGATION TABS (MOBILE & DESKTOP 4-TAB ROW)
            ---------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {/* Tab 1: Prescriptions */}
            <button
              onClick={() => setActiveSubTab('prescriptions')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'prescriptions'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-500" />
              <span>Prescriptions & Consultations</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-mono">
                {visits.length}
              </span>
            </button>

            {/* Tab 2: Bills */}
            <button
              onClick={() => setActiveSubTab('bills')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'bills'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-teal-500" />
              <span>Bills & Receipts</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                {bills.length}
              </span>
            </button>

            {/* Tab 3: Smart Health Pass */}
            <button
              onClick={() => setActiveSubTab('health_card')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'health_card'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-teal-500" />
              <span>Smart Health Pass</span>
            </button>

            {/* Tab 4: Proper Profile Section */}
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-teal-500" />
              <span>Patient Profile</span>
            </button>
          </div>

          {/* Quick Summary Pill */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Total Billed: <strong className="text-slate-800 dark:text-white">₹{totalBilled.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Paid: <strong className="text-emerald-600 dark:text-emerald-400">₹{totalPaid.toLocaleString()}</strong></span>
            {totalBalance > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Due: ₹{totalBalance.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------
            SUB-TAB 4: DEDICATED PROPER PATIENT PROFILE SECTION
            ---------------------------------------------------- */}
        {activeSubTab === 'profile' && (
          <div className="space-y-6 max-w-4xl mx-auto py-2">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg shadow-teal-600/20 flex-shrink-0">
                    {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {patient.name || 'Nisha Patel'}
                      </h2>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full inline-flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Patient
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Patient Identification Number: <span className="font-mono font-bold text-slate-900 dark:text-white">{patient.patient_id}</span>
                    </p>
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={fetchRecords}
                    disabled={refreshing}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Records</span>
                  </button>
                  {handleLogout && (
                    <button
                      onClick={handleLogout}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 text-xs sm:text-sm font-bold border border-rose-200 dark:border-rose-800 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Patient Core Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">UHID Number</span>
                      <button
                        onClick={() => {
                          if (patient?.patient_id) {
                            navigator.clipboard.writeText(patient.patient_id);
                            setCopiedUhid(true);
                            setTimeout(() => setCopiedUhid(false), 2000);
                          }
                        }}
                        className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy UHID"
                      >
                        {copiedUhid ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-base block">{patient.patient_id}</span>
                  </div>
                  <span className="text-[10px] text-teal-600 font-semibold mt-2 block">Official Hospital Identifier</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Demographics</span>
                    <span className="font-black text-slate-900 dark:text-white text-base block">{patient.age} yrs • {patient.gender}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-2 block">Age & Gender Profile</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered Contact</span>
                    <span className="font-black text-slate-900 dark:text-white text-base block">{patient.mobile_number || '9900011122'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-2 block">Mobile Verification Active</span>
                </div>

                {/* Additional Row: Digital Identity & Records Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Smart Health Pass</span>
                    <span className="font-mono font-bold text-teal-800 dark:text-teal-300 text-sm block">
                      {patient.patient_id}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-2 block">Verified Hospital Identity</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinical Activity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                      {visits.length} Consultation{visits.length !== 1 ? 's' : ''} • {bills.length} Invoice{bills.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-2 block">Active Patient Record</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Residential Address</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm block truncate">
                      {patient.address || 'Civil Lines, Raipur, Chhattisgarh'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-2 block">Primary Registered Address</span>
                </div>
              </div>

              {/* Auto-Delivery Email Highlight Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50/50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20 border border-teal-200 dark:border-teal-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-600/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Prescriptions & bills are auto-delivered to:</p>
                    <p className="text-sm sm:text-base font-black text-teal-950 dark:text-teal-200 font-mono mt-0.5">
                      {patient.email || 'riyanshi.verma.5356@gmail.com'}
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                      ✓ Automated medicine calendar reminders (.ics) and prescription PDFs are sent directly to this inbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSubTab('health_card')}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    View Health Pass
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ----------------------------------------------------
          SUB-TAB 1: PRESCRIPTIONS & OPD CONSULTATIONS
          ---------------------------------------------------- */}
      {activeSubTab === 'prescriptions' && (
        <div className="space-y-6">
          {visits.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Consultations Recorded Yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
                Your clinical prescriptions, diagnosis, and doctor advice will appear here once your OPD consultation is completed.
              </p>
            </div>
          ) : (
            visits.map((vis, idx) => {
              const isExpanded = expandedVisitId === vis.id;
              const visitDate = vis.visit_date ? new Date(vis.visit_date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Recent Visit';

              return (
                <div
                  key={vis.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
                >
                  {/* Card Header Bar */}
                  <div
                    onClick={() => setExpandedVisitId(isExpanded ? null : vis.id)}
                    className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                            {vis.doctor ? vis.doctor.name : 'Consulting Doctor'}
                          </h3>
                          {vis.doctor?.degree && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {vis.doctor.degree}
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300">
                            Token #{vis.token_number || vis.visit_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {visitDate}
                          </span>
                          <span>•</span>
                          <span>Reason: <strong>{vis.reason || 'OPD Checkup'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {vis.diagnosis && (
                        <span className="hidden sm:inline-block px-3 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                          {vis.diagnosis}
                        </span>
                      )}
                      <div className="text-slate-400 dark:text-slate-500">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content Details */}
                  {isExpanded && (
                    <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-6">
                      {/* Clinical Diagnosis & Complaints */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vis.diagnosis && (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                              Clinical Diagnosis
                            </span>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {vis.diagnosis}
                            </p>
                          </div>
                        )}
                        {vis.chief_complaints && (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                              Reported Symptoms / Complaints
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {vis.chief_complaints}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Prescribed Medications */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="w-4 h-4 text-teal-500" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Prescribed Medications
                          </h4>
                        </div>

                        {vis.medicines_list ? (
                          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="space-y-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200 font-sans">
                              {vis.medicines_list}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No specific medicines noted in record.</p>
                        )}
                      </div>

                      {/* Recommended Diagnostic Tests */}
                      {vis.tests_list && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-cyan-500" />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                              Advised Diagnostic Lab Tests
                            </h4>
                          </div>
                          <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs sm:text-sm text-cyan-900 dark:text-cyan-200">
                            {vis.tests_list}
                          </div>
                        </div>
                      )}

                      {/* Doctor Advice */}
                      {vis.advice && (
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Doctor's Advice & Lifestyle Guidance
                          </span>
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {vis.advice}
                          </div>
                        </div>
                      )}

                      {/* AI Patient Summary in Regional Language / Hinglish */}
                      {vis.patient_summary && (
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-950/40 dark:via-slate-900 dark:to-cyan-950/40 border border-teal-200 dark:border-teal-800 p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-2 text-teal-800 dark:text-teal-300 font-bold text-sm">
                            <Sparkles className="w-4 h-4 text-teal-500" />
                            <span>Patient Care Instructions (आसान भाषा में सारांश)</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                            {vis.patient_summary}
                          </p>
                        </div>
                      )}

                      {/* Follow-up date reminder */}
                      {vis.follow_up_date && (
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Calendar className="w-4 h-4 text-amber-600" />
                            <span>
                              Next Follow-up Consultation: <strong>{vis.follow_up_date}</strong>
                            </span>
                          </div>
                          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                            🗓️ Calendar invite attached in email
                          </span>
                        </div>
                      )}

                      {/* Bottom Action Buttons */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
                        {/* Direct Follow-up Reminder Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = buildFollowUpGoogleCalendarUrl({
                              followUpDate: vis.follow_up_date,
                              patientName: patient?.name || 'Nisha Patel',
                              doctorName: vis.doctor?.name || 'Dr. Shweta Grover',
                              hospitalName: 'Vedam Diagnostics'
                            });
                            window.open(url, '_blank');
                            if (showToast) showToast('Opening Google Calendar for Follow-up! Tap the blue "Save" button to set reminder.', 'success');
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                          title="1-Click save doctor follow-up appointment in Google Calendar with reminder notification"
                        >
                          <Calendar className="w-4 h-4 text-indigo-100" />
                          <span>Set Reminder for Follow-ups</span>
                        </button>

                        {/* Medicine Reminders & Full Schedule Modal */}
                        <button
                          type="button"
                          onClick={() => setCalendarModalVisit(vis)}
                          className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                          title="View dosage timings, add Google Calendar alarms or download .ics for phone"
                        >
                          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Set Reminder for Medicines</span>
                        </button>

                        <button
                          onClick={() => handleDownloadPrescription(vis.id)}
                          disabled={downloadingPdfVisitId === vis.id}
                          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"
                        >
                          <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                          {downloadingPdfVisitId === vis.id ? 'Preparing PDF...' : 'Download Prescription PDF'}
                        </button>

                        <button
                          onClick={() => handleSendPrescriptionEmail(vis.id)}
                          disabled={sendingEmailVisitId === vis.id}
                          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-50"
                        >
                          <Mail className="w-4 h-4" />
                          {sendingEmailVisitId === vis.id ? 'Sending Email...' : 'Email My Prescription'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-TAB 2: BILLS & PAYMENT RECEIPTS
          ---------------------------------------------------- */}
      {activeSubTab === 'bills' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Total Invoiced
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{totalBilled.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Amount Paid
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{totalPaid.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Outstanding Balance
              </span>
              <div className={`text-2xl font-bold ${totalBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                ₹{totalBalance.toLocaleString()}
              </div>
            </div>
          </div>

          {bills.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Invoices Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
                All completed consultation charges, laboratory tests, and receipt invoices will be listed here.
              </p>
            </div>
          ) : (
            bills.map((bill, idx) => {
              const billDate = bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Recent';

              const isPaid = (bill.payment_status || '').toLowerCase() === 'paid';
              const isPartial = (bill.payment_status || '').toLowerCase().includes('partial');

              return (
                <div
                  key={bill.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-mono font-bold text-base text-slate-900 dark:text-white">
                          {bill.bill_id}
                        </h4>
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                          isPaid
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : isPartial
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        }`}>
                          {bill.payment_status || 'Pending'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                        Generated on {billDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Total Amount</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          ₹{Number(bill.total_amount).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSendInvoiceEmail(bill.id)}
                        disabled={sendingEmailBillId === bill.id}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-teal-600/20 active:scale-95 disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {sendingEmailBillId === bill.id ? 'Sending...' : 'Email Receipt'}
                      </button>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  {bill.items && bill.items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500">
                            <th className="pb-2 font-medium">Service / Clinical Item</th>
                            <th className="pb-2 font-medium">Category</th>
                            <th className="pb-2 font-medium text-center">Qty</th>
                            <th className="pb-2 font-medium text-right">Price</th>
                            <th className="pb-2 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {bill.items.map((it, i) => (
                            <tr key={it.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 font-medium text-slate-900 dark:text-white">{it.service_name}</td>
                              <td className="py-2.5 text-slate-500">{it.category || 'General'}</td>
                              <td className="py-2.5 text-center">{it.quantity || 1}</td>
                              <td className="py-2.5 text-right font-mono">₹{Number(it.unit_price).toLocaleString()}</td>
                              <td className="py-2.5 text-right font-mono font-semibold">₹{Number(it.total_price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Payment Breakdown Bar */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4">
                      <span>Paid: <strong className="text-emerald-600 dark:text-emerald-400">₹{Number(bill.paid_amount).toLocaleString()}</strong></span>
                      <span>Balance Due: <strong className="text-amber-600 dark:text-amber-400">₹{Number(bill.balance_amount).toLocaleString()}</strong></span>
                    </div>
                    <span className="text-slate-500 italic">
                      Vedam Diagnostics & Hospital · GST-compliant Healthcare Invoice
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-TAB 3: SMART HEALTH PASS
          ---------------------------------------------------- */}
      {activeSubTab === 'health_card' && (
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {/* Card Mockup */}
          <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-teal-500/30 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl pointer-events-none"></div>

            {/* Top brand */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-teal-400" />
                <div>
                  <h4 className="font-bold text-sm tracking-wide">HospiSynAI Smart Health Pass</h4>
                  <span className="text-[10px] text-teal-300/80 uppercase tracking-wider block">Verified Hospital Identity • Instant Check-In</span>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-white/10 rounded-lg text-[11px] font-mono font-semibold text-teal-200 border border-white/15">
                SMART PASS
              </div>
            </div>

            {/* Middle patient details */}
            <div className="py-6 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-teal-500/20 border-2 border-teal-400/40 flex items-center justify-center text-3xl font-black text-teal-300 shadow-inner flex-shrink-0">
                {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-white">{patient.name || 'Patient'}</h3>
                <div className="text-xs text-teal-200 font-mono">
                  UHID: <strong className="text-white">{patient.patient_id}</strong>
                </div>
                <div className="text-xs text-slate-300">
                  {patient.age} yrs • {patient.gender}
                </div>
                {patient.mobile_number && (
                  <div className="text-xs text-slate-400">
                    Ph: {patient.mobile_number}
                  </div>
                )}
              </div>
            </div>

            {/* Smart Pass ID & Real Scannable QR Code */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Digital Patient ID</span>
                <span className="text-xs font-mono font-bold text-teal-300 block truncate">
                  {patient.patient_id}
                </span>
                <span className="text-[9.5px] text-teal-400/90 font-semibold mt-1 inline-flex items-center gap-1">
                  <span>●</span> Scannable Live Pass
                </span>
              </div>

              {/* Real QR Code linking to https://hospi-syn-ai.vercel.app/ */}
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-1.5 shadow-lg flex items-center justify-center flex-shrink-0 group relative cursor-pointer hover:scale-105 transition-transform"
                title="Scan with phone camera or click to open live HospiSynAI portal"
                onClick={() => window.open('https://hospi-syn-ai.vercel.app/', '_blank')}
              >
                <img
                  src="/qr-code.png"
                  alt="HospiSynAI Live Web App QR Code"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="text-center space-y-1.5 max-w-sm">
            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1.5">
              <span>📱 Scan with any phone camera to launch live web portal</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Verified digital pass linked directly to <strong>hospi-syn-ai.vercel.app</strong> for instant OPD token issuance and prescription access.
            </p>
          </div>
        </div>
      )}

      {/* Medicine Calendar & Alarms Sync Modal */}
      {calendarModalVisit && (
        <MedicineCalendarModal
          isOpen={!!calendarModalVisit}
          onClose={() => setCalendarModalVisit(null)}
          visit={calendarModalVisit}
          patientName={patient.name || 'Nisha Patel'}
          doctorName={calendarModalVisit.doctor?.name || 'Dr. Shweta Grover'}
          hospitalName="Vedam Diagnostics"
          showToast={showToast}
        />
      )}
      </div>
    </div>
  );
}
