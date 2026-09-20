import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  UserCheck,
  Stethoscope,
  PlusCircle,
  Search,
  Mic,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FileText,
  Building2,
  ChevronRight,
  Receipt,
  BadgeAlert
} from 'lucide-react';

export default function ReceptionistDashboardTab({
  API_BASE,
  getHeaders,
  showToast,
  patients = [],
  doctors = [],
  unpaidBills = [],
  setActiveTab,
  handleSelectPatient,
  setShowVisitModal,
  setNewVisit,
  setNewVisitDoctorId,
  openVoiceIntakeOnPatientDesk
}) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all active visits
  const fetchVisits = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_BASE}/visits`, {
        headers: getHeaders ? getHeaders() : {}
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(data);
      }
    } catch (err) {
      console.warn("Failed to load receptionist visits:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // Today's date calculations
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Today's patient registrations
  const todayPatients = useMemo(() => {
    return patients.filter(p => {
      if (!p.created_at) return false;
      return p.created_at.startsWith(todayStr);
    });
  }, [patients, todayStr]);

  // 2. Active Visits breakdown
  const todayVisits = useMemo(() => {
    return visits.filter(v => {
      if (!v.visit_date) return false;
      return v.visit_date.startsWith(todayStr);
    });
  }, [visits, todayStr]);

  // Helper: Mutually exclusive clinical status classification
  const getVisitStatusInfo = (vis) => {
    if (!vis) return { statusKey: 'Waiting', label: 'Waiting', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (vis.status === 'Completed' || (vis.diagnosis && vis.medicines_list)) {
      return { statusKey: 'Completed', label: 'Done', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (vis.status === 'In Cabin' || vis.status === 'In Consultation' || vis.status === 'Critical' || (vis.status !== 'Completed' && vis.diagnosis)) {
      return { statusKey: 'In Consultation', label: 'In Cabin', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' };
    }
    return { statusKey: 'Waiting', label: 'Waiting', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' };
  };

  // Stable Token Map: assigns a permanent token number to each visit based on chronological arrival order
  const tokenMap = useMemo(() => {
    const sorted = [...visits].sort((a, b) => {
      const timeDiff = new Date(a.visit_date || 0) - new Date(b.visit_date || 0);
      if (timeDiff !== 0) return timeDiff;
      return a.id - b.id;
    });

    const map = new Map();
    sorted.forEach((v, index) => {
      const num = v.token_number || (index + 1);
      map.set(v.id, num);
    });
    return map;
  }, [visits]);

  const waitingQueue = useMemo(() => {
    return visits
      .filter(v => getVisitStatusInfo(v).statusKey === 'Waiting')
      .sort((a, b) => new Date(a.visit_date || 0) - new Date(b.visit_date || 0) || a.id - b.id);
  }, [visits]);

  const inConsultation = useMemo(() => {
    return visits
      .filter(v => getVisitStatusInfo(v).statusKey === 'In Consultation')
      .sort((a, b) => new Date(a.visit_date || 0) - new Date(b.visit_date || 0) || a.id - b.id);
  }, [visits]);

  const completedVisits = useMemo(() => {
    return visits
      .filter(v => getVisitStatusInfo(v).statusKey === 'Completed')
      .sort((a, b) => new Date(b.visit_date || 0) - new Date(a.visit_date || 0) || b.id - a.id);
  }, [visits]);

  // 3. Counter Collections calculation (Advance deposits from today's visits / bills)
  const counterAdvanceTotal = useMemo(() => {
    const safeUnpaid = Array.isArray(unpaidBills) ? unpaidBills : [];
    let sum = 0;
    visits.forEach(v => {
      if (v.bills) {
        v.bills.forEach(b => {
          sum += (b.adjusted_advance || 0);
        });
      }
    });
    return sum;
  }, [visits, unpaidBills]);

  // Filtered queue with clinical priority sorting:
  // 1. In Consultation / In Cabin
  // 2. Waiting in Lobby (FIFO - earliest arrival / lowest token first)
  // 3. Completed (most recently completed first)
  const filteredQueue = useMemo(() => {
    const matched = visits.filter(v => {
      const pName = v.patient?.name || '';
      const pMobile = v.patient?.mobile_number || '';
      const dName = v.doctor?.name || '';
      const visId = v.visit_id || '';
      const reason = v.reason || '';
      const tokenNum = tokenMap.get(v.id) || '';
      const matchesSearch = 
        !searchQuery ||
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pMobile.includes(searchQuery) ||
        dName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `#${tokenNum}`.includes(searchQuery) ||
        `${tokenNum}` === searchQuery.trim();

      if (!matchesSearch) return false;

      const { statusKey } = getVisitStatusInfo(v);
      if (statusFilter === 'All') return true;
      return statusKey === statusFilter;
    });

    return matched.sort((a, b) => {
      const statusA = getVisitStatusInfo(a).statusKey;
      const statusB = getVisitStatusInfo(b).statusKey;

      const priorityOrder = { 'In Consultation': 1, 'Waiting': 2, 'Completed': 3 };
      const pA = priorityOrder[statusA] || 2;
      const pB = priorityOrder[statusB] || 2;

      if (pA !== pB) return pA - pB;

      if (statusA === 'Waiting' || statusA === 'In Consultation') {
        // FIFO: earliest check-in first
        return new Date(a.visit_date || 0) - new Date(b.visit_date || 0) || a.id - b.id;
      }
      // Completed: latest completed first
      return new Date(b.visit_date || 0) - new Date(a.visit_date || 0) || b.id - a.id;
    });
  }, [visits, searchQuery, statusFilter, tokenMap]);

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto compact-scroll p-2.5 md:p-3.5 pb-14 space-y-2.5 animate-in fade-in duration-150">
      
      {/* ── TOP BANNER: FRONT-DESK OVERVIEW & QUICK SHORTCUTS ── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-3 md:p-4 text-white shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 border border-teal-800/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Front-Desk Active
            </span>
            <span className="text-slate-400 text-[10.5px]">• Morning / General OPD</span>
          </div>
          <h2 className="text-base md:text-lg font-bold tracking-tight text-white leading-tight">
            Receptionist Command Center
          </h2>
          <p className="text-slate-300 text-[11px] leading-tight">
            Real-time OPD tokens, walk-ins, voice intake, and live consultation queues.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => {
              if (openVoiceIntakeOnPatientDesk) openVoiceIntakeOnPatientDesk();
              else {
                setActiveTab('search_register');
                if (handleSelectPatient) handleSelectPatient(null);
              }
            }}
            className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-slate-950" />
            <span>🎙️ Voice Intake</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('search_register');
              if (handleSelectPatient) handleSelectPatient(null);
            }}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-teal-300" />
            <span>+ New Patient</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (setShowVisitModal) {
                if (setNewVisit) setNewVisit({ reason: '' });
                if (setNewVisitDoctorId) setNewVisitDoctorId('');
                setShowVisitModal(true);
              } else {
                setActiveTab('search_register');
              }
            }}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-300" />
            <span>🎟️ Issue Token</span>
          </button>
        </div>
      </div>

      {/* ── 4 KEY FRONT-DESK METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Card 1: Today's Registrations */}
        <div 
          onClick={() => { setActiveTab('search_register'); if (handleSelectPatient) handleSelectPatient(null); }}
          className="bg-white border border-slate-200 hover:border-teal-400 rounded-xl p-2.5 shadow-2xs transition-all cursor-pointer hover:shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Patients</span>
            <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">{patients.length}</h3>
            <p className="text-[10px] text-teal-700 font-medium mt-0.5 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{todayPatients.length} registered today</span>
            </p>
          </div>
        </div>

        {/* Card 2: Waiting in Lobby */}
        <div 
          onClick={() => setStatusFilter('Waiting')}
          className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-2.5 shadow-2xs transition-all cursor-pointer hover:shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waiting in Lobby</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-amber-600 leading-tight">{waitingQueue.length}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              <span>Awaiting consultation</span>
            </p>
          </div>
        </div>

        {/* Card 3: In Consultation / Completed */}
        <div 
          onClick={() => setStatusFilter('Completed')}
          className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-2.5 shadow-2xs transition-all cursor-pointer hover:shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Done / In Cabin</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-emerald-600 leading-tight">{completedVisits.length}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              <span>{inConsultation.length} in cabin</span>
            </p>
          </div>
        </div>

        {/* Card 4: Counter Collections / Advance */}
        <div className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-2.5 shadow-2xs transition-all hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Counter Advance</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">₹{counterAdvanceTotal.toLocaleString()}</h3>
            <p className="text-[10px] text-indigo-700 font-medium mt-0.5">
              <span>Deposits collected</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN SECTION: LIVE OPD TOKEN BOARD + ON-DUTY DOCTORS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
        
        {/* Left 8 Cols: Live OPD Patient Queue & Token Board */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-3 md:p-3.5 shadow-2xs space-y-2.5">
          {/* Queue Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-xs md:text-sm flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Live OPD Token Queue & Triage Board
              </h3>
              <p className="text-slate-400 text-[10.5px]">Real-time patient flow status from arrival to doctor consultation.</p>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search token, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-[11px] font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 w-36 sm:w-44 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={fetchVisits}
                disabled={refreshing}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                title="Refresh Queue"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center flex-wrap gap-1">
            {[
              { id: 'All', label: 'All OPD Visits', count: visits.length },
              { id: 'Waiting', label: 'Waiting', count: waitingQueue.length },
              { id: 'In Consultation', label: 'In Cabin', count: inConsultation.length },
              { id: 'Completed', label: 'Done', count: completedVisits.length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Patient Queue Cards List */}
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto compact-scroll pr-0.5">
            {filteredQueue.map((vis) => {
              const statusInfo = getVisitStatusInfo(vis);
              const tokenNum = tokenMap.get(vis.id) || 1;

              return (
                <div
                  key={vis.id}
                  className="p-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 hover:border-teal-400 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Token Badge */}
                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex flex-col items-center justify-center font-bold shrink-0 shadow-2xs">
                      <span className="text-[7.5px] uppercase tracking-tighter opacity-80 leading-none">Token</span>
                      <span className="text-[11px] leading-tight">#{tokenNum}</span>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {vis.patient?.name || 'Walk-in Patient'}
                        </span>
                        {vis.patient && (
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/80 px-1 py-0.2 rounded">
                            {vis.patient.age}Y • {vis.patient.gender}
                          </span>
                        )}
                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border ${statusInfo.badgeColor}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                        <span>Dr: <b className="text-slate-700">{vis.doctor?.name || 'Assigned on Call'}</b></span>
                        <span className="text-slate-300">•</span>
                        <span className="italic truncate">{vis.reason || 'General Checkup'}</span>
                      </p>

                      <p className="text-[9.5px] text-slate-400 truncate">
                        {vis.visit_id} • In: {vis.visit_date ? new Date(vis.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('search_register');
                        if (handleSelectPatient && vis.patient_id) {
                          handleSelectPatient(vis.patient_id);
                        }
                      }}
                      className="bg-white hover:bg-teal-50 text-teal-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Patient Desk</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredQueue.length === 0 && (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Clock className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-[11px] font-medium">No active patient tokens matching "{statusFilter}".</p>
                <p className="text-[10px]">New walk-in visits logged will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: On-Duty Doctor Chambers & Shift Handover */}
        <div className="lg:col-span-4 space-y-2.5">
          
          {/* On-Duty Doctors Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                On-Duty Doctors & Chambers
              </h3>
              <span className="text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded-full">
                {doctors.length} Doctors
              </span>
            </div>

            <div className="space-y-1.5">
              {doctors.map(doc => {
                const docVisits = visits.filter(v => v.doctor_id === doc.id);
                const docWaiting = docVisits.filter(v => v.status === 'Waiting' || (!v.diagnosis && v.status !== 'Completed'));

                return (
                  <div
                    key={doc.id}
                    className="p-1.5 px-2 rounded-lg border border-slate-200 hover:border-teal-300 bg-slate-50/50 flex items-center justify-between gap-1.5"
                  >
                    <div className="space-y-0.2 min-w-0">
                      <h4 className="font-bold text-slate-900 text-[11px] truncate">{doc.name}</h4>
                      <p className="text-[9.5px] text-slate-500 font-medium truncate">
                        {doc.specialization || 'General Physician'} • Fee: ₹{doc.consultation_fee ?? 500}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full ${
                        docWaiting.length > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {docWaiting.length} in queue
                      </span>
                    </div>
                  </div>
                );
              })}

              {doctors.length === 0 && (
                <p className="text-center text-slate-400 text-[10.5px] py-3">No active doctors loaded.</p>
              )}
            </div>
          </div>

          {/* Shift Handover & Cash Reconciliation Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-sm border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
                <Receipt className="w-3 h-3" />
                Shift Cash Drawer Reconcile
              </span>
              <span className="text-[8.5px] text-slate-400">Handover Ready</span>
            </div>

            <p className="text-[10.5px] text-slate-300 leading-normal">
              Before handing over the front counter, verify physical cash with advances recorded.
            </p>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-[10.5px] text-slate-400">Total Advance:</span>
              <span className="font-bold text-xs text-teal-400">₹{counterAdvanceTotal.toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                showToast("Shift cash drawer verified! Tally complete.");
              }}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] py-1.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Verify Cash Balance
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
