import React, { useState, useMemo, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Mic,
  Brain,
  Printer,
  Pill,
  Calendar,
  Activity,
  UserCheck,
  ArrowRight
} from 'lucide-react';

export default function DoctorDashboardTab({
  API_BASE,
  getHeaders,
  showToast,
  patients = [],
  doctors = [],
  setActiveTab,
  handleSelectPatient,
  openDoctorVisitInConsole
}) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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
      console.warn("Failed to load doctor visits:", err);
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

  // Helper: Mutually exclusive clinical status classification
  const getVisitStatusInfo = (vis) => {
    if (!vis) return { statusKey: 'Waiting', label: 'Waiting', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (vis.status === 'Completed' || (vis.diagnosis && vis.medicines_list)) {
      return { statusKey: 'Completed', label: 'Done', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (vis.status === 'In Cabin' || vis.status === 'In Consultation' || vis.status === 'Critical' || (vis.status !== 'Completed' && vis.diagnosis)) {
      return { statusKey: 'In Cabin', label: 'In Cabin', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' };
    }
    return { statusKey: 'Waiting', label: 'Waiting', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' };
  };

  // Filter for current doctor or all OPD if doctor on duty
  const doctorVisits = useMemo(() => {
    return visits;
  }, [visits]);

  // Stable Token Map: assigns a permanent token number to each visit based on chronological arrival order
  const tokenMap = useMemo(() => {
    const sorted = [...doctorVisits].sort((a, b) => {
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
  }, [doctorVisits]);

  const waitingQueue = useMemo(() => {
    return doctorVisits
      .filter(v => getVisitStatusInfo(v).statusKey === 'Waiting')
      .sort((a, b) => new Date(a.visit_date || 0) - new Date(b.visit_date || 0) || a.id - b.id);
  }, [doctorVisits]);

  const inCabin = useMemo(() => {
    return doctorVisits
      .filter(v => getVisitStatusInfo(v).statusKey === 'In Cabin')
      .sort((a, b) => new Date(a.visit_date || 0) - new Date(b.visit_date || 0) || a.id - b.id);
  }, [doctorVisits]);

  const completedVisits = useMemo(() => {
    return doctorVisits
      .filter(v => getVisitStatusInfo(v).statusKey === 'Completed')
      .sort((a, b) => new Date(b.visit_date || 0) - new Date(a.visit_date || 0) || b.id - a.id);
  }, [doctorVisits]);

  // Filtered queue with clinical priority sorting:
  // 1. In Cabin (active consultation)
  // 2. Waiting in Lobby (FIFO - earliest arrival / lowest token first)
  // 3. Completed (most recently prescribed first)
  const filteredQueue = useMemo(() => {
    const matched = doctorVisits.filter(v => {
      const pName = v.patient?.name || '';
      const pMobile = v.patient?.mobile_number || '';
      const diag = v.diagnosis || '';
      const reason = v.reason || '';
      const complaints = v.chief_complaints || '';
      const tokenNum = tokenMap.get(v.id) || '';
      const matchesSearch = 
        !searchQuery ||
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pMobile.includes(searchQuery) ||
        diag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaints.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

      const priorityOrder = { 'In Cabin': 1, 'Waiting': 2, 'Completed': 3 };
      const pA = priorityOrder[statusA] || 2;
      const pB = priorityOrder[statusB] || 2;

      if (pA !== pB) return pA - pB;

      if (statusA === 'Waiting' || statusA === 'In Cabin') {
        // FIFO: earliest check-in first
        return new Date(a.visit_date || 0) - new Date(b.visit_date || 0) || a.id - b.id;
      }
      // Completed: latest completed first
      return new Date(b.visit_date || 0) - new Date(a.visit_date || 0) || b.id - a.id;
    });
  }, [doctorVisits, searchQuery, statusFilter, tokenMap]);

  // Jump to consultation
  const handleStartConsult = (vis) => {
    if (openDoctorVisitInConsole) {
      openDoctorVisitInConsole(vis);
    } else {
      setActiveTab('doctor_console');
    }
  };

  // Call next patient in queue (FIFO order)
  const handleCallNextPatient = () => {
    if (waitingQueue.length > 0) {
      const nextPat = waitingQueue[0];
      handleStartConsult(nextPat);
      const tokenNum = tokenMap.get(nextPat.id) || 1;
      showToast(`Calling Token #${tokenNum}: ${nextPat.patient?.name || 'Next Patient'} into cabin.`);
    } else {
      showToast("Waiting lobby is clear! No pending patients.", "success");
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto compact-scroll p-2.5 md:p-3.5 pb-14 space-y-2.5 animate-in fade-in duration-150">
      
      {/* ── TOP BANNER: DOCTOR OPD CLINICAL COMMAND CENTER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-3 md:p-4 text-white shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 border border-teal-800/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Clinical OPD Active
            </span>
            <span className="text-slate-400 text-[10.5px]">• Chamber 102 / Dr. Shweta Grover</span>
          </div>
          <h2 className="text-base md:text-lg font-bold tracking-tight text-white leading-tight">
            Doctor OPD Clinical Command Center
          </h2>
          <p className="text-slate-300 text-[11px] leading-tight">
            Live patient consultation queue, clinical triage, Voice Scribe dictation, and prescription manager.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleCallNextPatient}
            className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5 text-slate-950" />
            <span>🩺 Call Next Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doctor_console')}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-teal-300" />
            <span>🎙️ Voice Scribe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doctor_console')}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300" />
            <span>📋 Clinical Desk</span>
          </button>

          <button
            type="button"
            onClick={fetchVisits}
            disabled={refreshing}
            className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Refresh OPD Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 4 KEY CLINICAL METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Card 1: Total OPD Queue */}
        <div className="bg-white border border-slate-200 hover:border-teal-400 rounded-xl p-2.5 shadow-2xs transition-all hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total OPD Visits</span>
            <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">{doctorVisits.length}</h3>
            <p className="text-[10px] text-teal-700 font-medium mt-0.5 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Assigned OPD tokens</span>
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
              <span>Ready for consultation</span>
            </p>
          </div>
        </div>

        {/* Card 3: In Doctor Cabin */}
        <div 
          onClick={() => setStatusFilter('In Cabin')}
          className="bg-white border border-slate-200 hover:border-rose-400 rounded-xl p-2.5 shadow-2xs transition-all cursor-pointer hover:shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Cabin</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-rose-600 leading-tight">{inCabin.length}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              <span>Under clinical review</span>
            </p>
          </div>
        </div>

        {/* Card 4: Consultations Done */}
        <div 
          onClick={() => setStatusFilter('Completed')}
          className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-2.5 shadow-2xs transition-all cursor-pointer hover:shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Done / Prescribed</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-emerald-600 leading-tight">{completedVisits.length}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              <span>Prescriptions generated</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN SECTION: LIVE OPD QUEUE + CLINICAL SHORTCUTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
        
        {/* Left 8 Cols: Live OPD Patient Consultation Queue */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-3 md:p-3.5 shadow-2xs space-y-2.5">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-xs md:text-sm flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                Live OPD Patient Consultation Queue
              </h3>
              <p className="text-slate-400 text-[10.5px]">Select any patient to immediately launch consultation, diagnosis & Rx.</p>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search token, patient, symptom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-[11px] font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 w-40 sm:w-48 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center flex-wrap gap-1">
            {[
              { id: 'All', label: 'All OPD Visits', count: doctorVisits.length },
              { id: 'Waiting', label: 'Waiting in Lobby', count: waitingQueue.length },
              { id: 'In Cabin', label: 'In Cabin', count: inCabin.length },
              { id: 'Completed', label: 'Completed', count: completedVisits.length }
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
              const isDone = statusInfo.statusKey === 'Completed';
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
                        <span>Reason: <b className="text-slate-700">{vis.reason || 'General Checkup'}</b></span>
                        {vis.chief_complaints && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="italic truncate text-slate-600">Complaints: {vis.chief_complaints}</span>
                          </>
                        )}
                      </p>

                      <p className="text-[9.5px] text-slate-400 truncate">
                        Visit: {vis.visit_id} • Checked In: {vis.visit_date ? new Date(vis.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartConsult(vis)}
                      className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold text-[11px] px-3 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <Stethoscope className="w-3 h-3 text-slate-950" />
                      <span>{isDone ? 'View Rx' : 'Consult Now'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredQueue.length === 0 && (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p className="text-[11px] font-medium text-slate-600">No patients waiting matching "{statusFilter}".</p>
                <p className="text-[10px]">New OPD patient check-ins will appear here in real time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Quick Rx Presets & Clinical AI Assistant */}
        <div className="lg:col-span-4 space-y-2.5">
          
          {/* Quick OPD Presets Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                Common OPD Rx Formulary
              </h3>
              <span className="text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded-full">
                Quick Guide
              </span>
            </div>

            <div className="space-y-1.5 text-[10.5px]">
              {[
                { name: 'Dolo 650mg (Paracetamol)', dose: '1 Tab TDS after meals × 3d' },
                { name: 'Augmentin 625mg (Amox+Clav)', dose: '1 Tab BD after meals × 5d' },
                { name: 'Pantocid 40mg (Pantoprazole)', dose: '1 Tab OD empty stomach × 7d' },
                { name: 'Montair LC (Montelukast)', dose: '1 Tab HS at bedtime × 5d' },
                { name: 'Azee 500mg (Azithromycin)', dose: '1 Tab OD empty stomach × 3d' }
              ].map((med, i) => (
                <div key={i} className="p-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{med.name}</p>
                    <p className="text-[9.5px] text-slate-500 truncate">{med.dose}</p>
                  </div>
                  <span className="text-[8.5px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded shrink-0">
                    Rx
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical AI Scribe Assistant Widget */}
          <div className="bg-gradient-to-br from-violet-950 via-slate-900 to-slate-900 text-white rounded-2xl p-3 shadow-sm border border-violet-800/40 space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
                AI Clinical Scribe & Multilingual
              </span>
              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Groq 70B
              </span>
            </div>

            <p className="text-[10.5px] text-slate-300 leading-normal">
              Dictate clinical notes in English or Hindi. Groq AI auto-translates prescriptions into 11 regional Indian languages with morning/afternoon/night storytelling summaries.
            </p>

            <button
              type="button"
              onClick={() => setActiveTab('doctor_console')}
              className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white font-bold text-[11px] py-1.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Mic className="w-3 h-3" />
              <span>Launch Voice Scribe Console</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
