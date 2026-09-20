import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Globe,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  ArrowRight,
  User,
  Loader2
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parsePatientVoiceClient } from '../utils/clinicalNLPClient';

/**
 * PatientVoiceModal
 * Modular ambient patient speech intake component.
 * Listens to patient's natural colloquial complaints in Hindi, Hinglish, or English,
 * and uses the Clinical AI Engine to extract Chief Complaints, Diagnosis, Rx, and Tests
 * without requiring the doctor to re-dictate or re-type.
 */
export default function PatientVoiceModal({
  inline = false,
  autoStart = true,
  isOpen,
  onClose,
  onPopulate,
  patientContext = {},
  API_BASE,
  getHeaders,
  showToast
}) {
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [customText, setCustomText] = useState('');
  const [activeTab, setActiveTab] = useState('speak'); // 'speak' | 'preview'

  const {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    error,
    startListening,
    stopListening,
    resetTranscript,
    lang,
    setLang,
    isSupported,
    requestPermission
  } = useSpeechRecognition({ defaultLang: 'hi-IN' });

  const spokenText = (transcript + ' ' + interimTranscript).trim() || customText;

  // Real Indian Patient Complaint Demo Chips (Exact clinical scenarios)
  const DEMO_CHIPS = [
    {
      title: "बुखार, सर्दी, खांसी, सिरदर्द (User Audio)",
      text: "मुझे पिछले 2 दिन से fever था और मेरे को cold है, cough है, सर में भी बहुत दर्द हो रहा है",
      tag: "Viral URTI",
      lang: "hi-IN"
    },
    {
      title: "Hinglish Acute Febrile",
      text: "Doctor sahab pichle 2 din se tez bukhar hai, thand lag rahi hai, sar me dard hai aur gale me kharash hai",
      tag: "Febrile Illness",
      lang: "en-IN"
    },
    {
      title: "पेट दर्द, उल्टी और दस्त (Gastroenteritis)",
      text: "पेट में बहुत तेज मरोड़ और दर्द है, 2 दिन से उल्टी और दस्त आ रहे हैं, कुछ भी खाया नहीं जा रहा",
      tag: "Gastroenteritis",
      lang: "hi-IN"
    },
    {
      title: "छाती में भारीपन और सांस फूलना",
      text: "3 दिन से छाती में भारीपन है, सूखी खांसी आ रही है और तेज चलने पर सांस फूलती है",
      tag: "Chest / Bronchial",
      lang: "hi-IN"
    }
  ];

  // Parse patient speech via Backend Clinical AI or Instant Client Engine
  const handleParseSpeech = async (overrideText, autoPopulate = true) => {
    const textToAnalyze = (overrideText || spokenText).trim();
    if (!textToAnalyze) {
      showToast('कृपया पहले बोलें या कोई सैंपल चिप चुनें (Please speak or select a sample chip first)', 'warning');
      return;
    }

    if (isListening) stopListening();
    setIsParsing(true);

    let data = null;

    try {
      const headers = getHeaders ? getHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE}/visits/ai-parse-consultation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transcript: textToAnalyze,
          age: patientContext?.age,
          gender: patientContext?.gender,
          mode: 'patient_voice'
        })
      });

      if (res.ok) {
        data = await res.json();
      } else {
        console.warn('Backend response not OK, using instant client NLP engine');
        data = parsePatientVoiceClient(textToAnalyze, patientContext?.age, patientContext?.gender);
      }
    } catch (err) {
      console.warn('Backend fetch error, using instant client NLP engine:', err);
      data = parsePatientVoiceClient(textToAnalyze, patientContext?.age, patientContext?.gender);
    }

    if (!data) {
      data = parsePatientVoiceClient(textToAnalyze, patientContext?.age, patientContext?.gender);
    }

    setParsedResult(data);
    setIsParsing(false);

    // DIRECTLY ADD TO DESK (Satisfies "just do add")
    if (autoPopulate && onPopulate) {
      onPopulate(data);
      showToast('✅ सीधे क्लिनिकल फॉर्म में भर दिया गया! (Directly Added to Desk)', 'success');
    }
  };

  // Close modal and view desk
  const handleDoneAndClose = () => {
    if (parsedResult && onPopulate) {
      onPopulate(parsedResult);
    }
    showToast('✅ Consultation desk updated!', 'success');
    onClose();
  };

  // Auto-start recording immediately on open - ZERO extra clicks!
  useEffect(() => {
    if (isOpen) {
      resetTranscript();
      setParsedResult(null);
      setCustomText('');
      setActiveTab('speak');
      if (autoStart) {
        const timer = setTimeout(() => {
          try {
            startListening({ customLang: 'hi-IN' });
          } catch (err) {
            console.warn('Auto start mic notice:', err);
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    } else {
      if (isListening) stopListening();
    }
  }, [isOpen, autoStart]);

  if (!isOpen) return null;

  const cardContent = (
    <div className={`bg-slate-900 border ${inline ? 'border-2 border-emerald-500/50 rounded-2xl shadow-xl w-full my-2' : 'border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[92vh]'} overflow-hidden flex flex-col text-slate-100 animate-in fade-in ${inline ? 'slide-in-from-top-2' : ''} duration-200`}>
        
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Mic className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">मरीज़ की आवाज़ (Patient Live Voice Intake)</h3>
                <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" /> AI Auto-Extract
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {patientContext?.name ? (
                  <span>Patient: <b className="text-slate-200">{patientContext.name}</b> ({patientContext.age || '--'} Yrs, {patientContext.gender || '--'})</span>
                ) : (
                  <span>Patient speaks natural complaints in Hindi / Hinglish ➔ AI extracts OPD plan</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 compact-scroll flex-1">
          
          {/* Smart Auto-Adapting Language Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-950/70 rounded-xl border border-teal-500/25 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-extrabold text-teal-300">
                🤖 Auto-Adapting Multi-Lingual:
              </span>
              <span className="text-slate-300 font-medium text-[11.5px]">
                Hindi • Hinglish • English (मरीज़ सीधे अपनी स्वाभाविक भाषा में बोलें, कोई सेटिंग बदलने की ज़रूरत नहीं)
              </span>
            </div>
            <span className="text-[10px] font-bold text-teal-300/90 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800/60">
              Zero Config
            </span>
          </div>

          {/* Voice Waveform & Live Recording Console */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    मरीज़ बोल रहे हैं... (Listening live • Auto-detecting)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                    माइक्रोफ़ोन तैयार है (Ready)
                  </span>
                )}
              </div>

              {/* Waveform Bars */}
              <div className="flex items-center gap-1 h-6 px-2.5 bg-slate-900 rounded-lg border border-slate-800">
                {Array.from({ length: 16 }).map((_, i) => {
                  const barH = isListening
                    ? Math.max(4, Math.round(20 * Math.min(1, (audioLevel || 0.25) * 2.2) * (Math.sin(i * 0.8) * 0.4 + 0.6)))
                    : 3;
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isListening ? 'bg-gradient-to-t from-teal-400 to-emerald-300' : 'bg-slate-700'
                      }`}
                      style={{ height: `${barH}px` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Live Spoken Transcript Display */}
            <div className="min-h-[64px] max-h-[110px] overflow-y-auto bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 text-xs font-medium leading-relaxed compact-scroll">
              {spokenText ? (
                <p className="text-slate-100">
                  <span className="text-teal-400 font-bold mr-1.5">Patient Spoke:</span>
                  "{spokenText}"
                </p>
              ) : (
                <p className="text-slate-500 italic">
                  {isListening ? (
                    <span>🎙️ मरीज़ अब बोल सकते हैं... जैसे: "मुझे 2 दिन से बुखार और सूखी खांसी है, सिर में दर्द है..."</span>
                  ) : (
                    <span>"Start Speaking" पर क्लिक करें या नीचे दिए गए किसी भी 1-Click चिप पर क्लिक करें...</span>
                  )}
                </p>
              )}
            </div>

            {/* Mic Controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopListening();
                      if (spokenText) {
                        handleParseSpeech(spokenText, true);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    🛑 Done & Auto-Fill Desk (बोलना पूरा हुआ)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      resetTranscript();
                      setParsedResult(null);
                      startListening({ customLang: 'hi-IN' });
                    }}
                    className="bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-slate-950 font-bold" />
                    🎙️ Speak Again (फिर से बोलें)
                  </button>
                )}

                {spokenText && (
                  <button
                    type="button"
                    onClick={() => {
                      resetTranscript();
                      setCustomText('');
                      setParsedResult(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Extract & Add Button */}
              <button
                type="button"
                onClick={() => handleParseSpeech()}
                disabled={isParsing || !spokenText}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>AI Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>⚡ AI Auto-Fill Desk</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mic error notice */}
          {error && (
            <div className="bg-rose-950/80 border border-rose-600/80 rounded-xl p-3 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-300">{error}</p>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  💡 Chrome/Edge address bar me <code>localhost:3001</code> ke paas Lock/Tune icon par click karke Microphone ko <b>Allow</b> karein.
                </p>
              </div>
              {requestPermission && (
                <button
                  type="button"
                  onClick={requestPermission}
                  className="bg-rose-700 hover:bg-rose-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg shrink-0"
                >
                  Allow Mic
                </button>
              )}
            </div>
          )}

          {/* Extracted Clinical Plan Preview Card — IMMEDIATELY VISIBLE AT THE TOP */}
          {parsedResult && (
            <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-2xl p-4 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200">
              
              {/* SUCCESS BANNER: DIRECTLY ADDED TO DESK */}
              <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-300">क्लिनिकल प्लान फॉर्म में भर दिया गया है!</h4>
                    <p className="text-[10.5px] text-slate-300 font-medium">
                      Chief Complaints, Diagnosis, Medicines aur Tests सीधे कंसल्टेशन डेस्क में जुड़ चुके हैं।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDoneAndClose}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0 cursor-pointer justify-center"
                >
                  <span>Done (डेस्क देखें)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Extracted Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Chief Complaints */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Chief Complaints (Medical English)
                  </span>
                  <p className="text-slate-100 font-semibold">{parsedResult.chief_complaints || 'None extracted'}</p>
                </div>

                {/* Working Diagnosis */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Working Diagnosis
                  </span>
                  <p className="text-slate-100 font-semibold">{parsedResult.diagnosis || 'None'}</p>
                </div>

                {/* Suggested Medicines */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 sm:col-span-2">
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Pill className="w-3 h-3" /> Prescribe Medicines (Indian OPD Dosing)
                  </span>
                  <pre className="text-slate-200 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                    {parsedResult.medicines_list || 'None'}
                  </pre>
                </div>

                {/* Indicated Tests */}
                {parsedResult.tests_list && (
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 sm:col-span-2">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <FlaskConical className="w-3 h-3" /> Indicated Lab / Diagnostic Tests
                    </span>
                    <pre className="text-slate-200 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                      {parsedResult.tests_list}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Real OPD Preset Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>⚡ Quick Indian Patient Demo Chips (Click to test instantly):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCustomText(chip.text);
                    setSelectedLang(chip.lang);
                    handleParseSpeech(chip.text, true);
                  }}
                  className="text-left bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/50 p-2.5 rounded-xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors">
                      {chip.title}
                    </span>
                    <span className="text-[9.5px] font-bold bg-teal-500/10 text-teal-400 px-1.5 py-0.2 rounded border border-teal-500/20">
                      {chip.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic font-sans">
                    "{chip.text}"
                  </p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Doctor can manually edit any populated fields anytime</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
  );

  if (inline) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {cardContent}
    </div>
  );
}
