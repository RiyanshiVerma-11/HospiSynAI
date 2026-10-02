import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Tv,
  Users,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Stethoscope,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Bell
} from 'lucide-react';

// Web Audio API Synthesizer for Hospital Announcement Chime (No audio asset files needed!)
function playHospitalChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Two-tone chime: D5 (587.33Hz) -> A5 (880.00Hz)
    const now = ctx.currentTime;
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.25);
    gain2.gain.setValueAtTime(0, now + 0.25);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.9);
  } catch (err) {
    console.warn("Audio chime playback error:", err);
  }
}

export default function WaitingRoomTvDisplay({
  API_BASE,
  getHeaders,
  hospitalName = "Vedam Diagnostics",
  onExit
}) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevServingTokenRef = useRef(null);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Queue Fetcher & Live Polling (every 5 seconds)
  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_BASE}/visits`, {
        headers: getHeaders ? getHeaders() : {}
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("TV Queue polling error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const pollInterval = setInterval(fetchQueue, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  // Filter today's visits (Primary)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => {
    if (!v.visit_date) return false;
    return v.visit_date.startsWith(todayStr);
  });

  // Smart fallback: If no visits registered today yet, display the latest active queue session
  const isShowingLatestSession = todayVisits.length === 0 && visits.length > 0;
  const displayVisits = todayVisits.length > 0 ? todayVisits : visits;

  // Helper to extract clean integer token number
  const getTokenNum = (v) => {
    if (typeof v.token_number === 'number' && !isNaN(v.token_number)) return v.token_number;
    const parsed = parseInt(v.token_number, 10);
    if (!isNaN(parsed)) return parsed;
    return v.id || 999999;
  };

  // Triage priority: Emergency / Critical (1) > Urgent (2) > Normal (3)
  const getTriagePrio = (v) => {
    const sev = (v.triage_severity || '').toLowerCase();
    const st = (v.status || '').toLowerCase();
    if (sev === 'critical' || sev === 'emergency' || st === 'critical') return 1;
    if (sev === 'urgent' || st === 'urgent') return 2;
    return 3;
  };

  // Status priority: Arrived in waiting area (1) > Waiting (2) > Scheduled (3)
  const getQueueStatusPrio = (v) => {
    const st = (v.status || '').toLowerCase();
    if (st === 'arrived') return 1;
    if (st === 'waiting') return 2;
    if (st === 'scheduled') return 3;
    return 4;
  };

  // Identify currently serving visit (Doctor is consulting this patient in the cabin)
  // If multiple, lowest token number takes cabin spotlight
  const activeInCabin = displayVisits
    .filter(v => {
      const st = (v.status || '').toLowerCase();
      return st === 'in-consultation' || st === 'in cabin';
    })
    .sort((a, b) => getTokenNum(a) - getTokenNum(b));

  const currentlyServing = activeInCabin[0] || null;

  // Upcoming Waiting Queue (NEXT IN LINE):
  // 1. Critical/Emergency jumps to front
  // 2. Normal cases: LOWER token number comes FIRST (Ascending FIFO: Token 1 before Token 2)
  const upcomingQueue = displayVisits
    .filter(v => {
      if (currentlyServing && v.id === currentlyServing.id) return false;
      const st = (v.status || '').toLowerCase();
      return st !== 'completed' && st !== 'cancelled' && st !== 'in-consultation' && st !== 'in cabin';
    })
    .sort((a, b) => {
      const prioA = getTriagePrio(a);
      const prioB = getTriagePrio(b);
      // Emergency / Critical jumps ahead
      if (prioA !== prioB) return prioA - prioB;

      // Physically arrived in lobby vs yet to arrive
      const statA = getQueueStatusPrio(a);
      const statB = getQueueStatusPrio(b);
      if (statA !== statB) return statA - statB;

      // Normal order: Lower token number FIRST (Token 1 before Token 2)
      return getTokenNum(a) - getTokenNum(b);
    })
    .slice(0, 8);

  // Detect token change and trigger chime
  useEffect(() => {
    const currentTokenId = currentlyServing ? (currentlyServing.token_number || currentlyServing.id) : null;
    if (
      currentTokenId &&
      prevServingTokenRef.current !== null &&
      prevServingTokenRef.current !== currentTokenId &&
      soundEnabled
    ) {
      playHospitalChime();
    }
    prevServingTokenRef.current = currentTokenId;
  }, [currentlyServing, soundEnabled]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden font-sans">
      {/* Top TV Broadcast Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-teal-500/20">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{hospitalName}</span>
              <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live OPD Desk
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Outpatient Token Display & Patient Queue System</p>
          </div>
        </div>

        {/* Live Clock & TV Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xl md:text-2xl font-mono font-bold text-teal-300">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {currentTime.toLocaleDateString([], { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(prev => !prev);
                if (!soundEnabled) playHospitalChime();
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
              }`}
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Toggle Fullscreen for Waiting Room TV"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-xs font-bold text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
              >
                Exit TV View
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Waiting Room Screen Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">
        
        {/* Left Column: Big "NOW SERVING" Spotlight (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 rounded-3xl border-2 border-teal-500/40 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-teal-400 bg-teal-400/10 border border-teal-400/20 px-3.5 py-1 rounded-full flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                NOW SERVING IN CABIN
              </span>

              <span className="text-xs text-slate-400 font-bold">
                Doctor Chamber 1
              </span>
            </div>

            {currentlyServing ? (
              <div className="space-y-4 my-auto py-4">
                <div className="inline-block">
                  <div className="text-slate-400 text-xs md:text-sm uppercase tracking-wider font-bold mb-1">
                    Please Proceed To Cabin
                  </div>
                  <div className="text-6xl md:text-8xl lg:text-9xl font-black font-mono tracking-tight text-white flex items-baseline gap-2">
                    <span className="text-teal-400 text-4xl md:text-5xl">#</span>
                    <span>{currentlyServing.token_number || currentlyServing.id}</span>
                  </div>
                </div>

                {/* Patient & Doctor Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Patient Name</span>
                    <h2 className="text-2xl md:text-3xl font-black text-white">
                      {currentlyServing.patient?.name || 'Walk-in Patient'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Visit ID: <span className="font-mono text-teal-300 font-bold">{currentlyServing.visit_id}</span>
                    </p>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5 space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center sm:justify-end gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                      Consulting Physician
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-teal-200">
                      {currentlyServing.doctor?.name || 'Dr. Shweta Grover'}
                    </h3>
                    <p className="text-[11px] text-slate-400 max-w-xs truncate">
                      {currentlyServing.doctor?.degree || 'Senior Consultant'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-auto py-16 text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                  <Clock className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-slate-300">Doctor Chamber Ready</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  The next token will appear here as soon as the doctor calls the patient.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Cabin Status Indicator */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Real-time OPD Token Queue • Verified System</span>
            </span>
            <span className="font-mono text-teal-400 font-bold">
              {todayVisits.length > 0 ? `Total Today: ${todayVisits.length} Visits` : `Active Queue: ${displayVisits.length} Visits`}
            </span>
          </div>
        </section>

        {/* Right Column: Upcoming Queue Board (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col bg-slate-900/60 rounded-3xl border border-slate-800 p-5 md:p-6 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>NEXT IN LINE (कृपया तैयार रहें)</span>
            </h2>
            <span className="text-xs bg-slate-800 text-teal-300 font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
              {upcomingQueue.length} Waiting
            </span>
          </div>

          {/* Token Cards Grid */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1 compact-scroll">
            {upcomingQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <CheckCircle className="w-10 h-10 text-emerald-500/50 mb-2" />
                <p className="text-sm font-bold text-slate-400">All Registered Patients Served</p>
                <p className="text-xs text-slate-500 mt-1">New walk-ins will appear on this board immediately upon token issuance.</p>
              </div>
            ) : (
              upcomingQueue.map((v, idx) => (
                <div
                  key={v.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    idx === 0
                      ? 'bg-gradient-to-r from-teal-950/60 to-slate-900 border-teal-500/50 shadow-md ring-1 ring-teal-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Big Token Number Pill */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 shadow-sm ${
                      idx === 0
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-800 text-white'
                    }`}>
                      <span className="text-[8px] uppercase tracking-tighter opacity-80 leading-none">Token</span>
                      <span className="text-base font-mono leading-tight">#{v.token_number || v.id}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {v.patient?.name || 'Walk-in'}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] bg-teal-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                            Next
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        Dr. {v.doctor?.name ? v.doctor.name.replace('Dr. ', '') : 'Assigned Consultant'} • {v.reason || 'General Checkup'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                      {v.status === 'Arrived' ? 'In Lobby' : 'Waiting'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Waiting Room Tip Footer */}
          <div className="pt-3 border-t border-slate-800 shrink-0 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Bell className="w-3 h-3 text-teal-400" />
              <span>Please keep your previous prescription and reports handy when your token is called.</span>
            </p>
          </div>
        </section>

      </main>

      {/* Bottom News/Hospital Marquee Ticker */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="bg-teal-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
            NOTICE
          </span>
          <span className="truncate text-slate-300">
            🏥 Emergency Assistance & Ambulance: +91 98765 43210 &nbsp;•&nbsp; Free Wi-Fi in Waiting Lobby: "HospiSyn_Guest" &nbsp;•&nbsp; Digital prescriptions available on patient portal & WhatsApp
          </span>
        </div>
        <div className="shrink-0 font-mono text-[11px] text-teal-400/80 hidden md:block">
          HospiSynAI v1.0 • Smart Clinic Network
        </div>
      </footer>
    </div>
  );
}
