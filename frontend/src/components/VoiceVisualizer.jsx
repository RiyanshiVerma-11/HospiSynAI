import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, RefreshCw, CheckCircle2, Globe } from 'lucide-react';

export default function VoiceVisualizer({
  isListening,
  audioLevel = 0,
  transcript = '',
  interimTranscript = '',
  error = null,
  permissionState = 'prompt',
  isSupported = true,
  lang = 'en-IN',
  setLang,
  onRequestPermission,
  onStart,
  onStop,
  onReset,
  onSelectSample,
  placeholder = 'Spoken words will appear here in real time...',
  sampleChips = [],
  sampleGuide = 'Name, Age, Gender, Mobile Number, City, Complaint'
}) {
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Timer while recording
  useEffect(() => {
    let interval = null;
    if (isListening) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // 24 animated bars for waveform
  const numBars = 24;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl w-full">
      {/* Top Bar: Action Buttons, Language Selector & Waveform */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Prominent Start / Stop Listening Button */}
          {isListening ? (
            <button
              type="button"
              onClick={onStop}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 animate-pulse shadow-md transition-all active:scale-95 cursor-pointer"
              title="Click to stop listening and extract details"
            >
              <MicOff className="w-4 h-4" />
              <span>Stop & Process ({formatTimer(timerSeconds)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              title="Click to start listening to your microphone"
            >
              <Mic className="w-4 h-4 text-slate-950" />
              <span>Start Listening</span>
            </button>
          )}

          {/* Language Toggle Pills */}
          {setLang && (
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {[
                { code: 'en-IN', label: 'English (India)' },
                { code: 'hi-IN', label: 'Hindi (हिंदी)' },
                { code: 'en-US', label: 'English (US)' }
              ].map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                    lang === item.code
                      ? 'bg-teal-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audio Waveform Canvas */}
        <div className="flex items-center gap-1 h-9 px-3 bg-slate-950/80 rounded-xl border border-slate-800/80 self-stretch md:self-auto justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1.5 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-slate-400" />
            Live
          </span>
          {Array.from({ length: numBars }).map((_, i) => {
            const waveVariation = Math.sin((i + 1) * 1.5) * 0.4 + 0.6;
            const dynamicHeight = isListening
              ? Math.max(5, Math.round(28 * Math.min(1, (audioLevel || 0.18) * 2.2) * waveVariation))
              : 4;

            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isListening
                    ? 'bg-gradient-to-t from-teal-500 to-cyan-300 shadow-xs shadow-teal-500/50'
                    : 'bg-slate-700'
                }`}
                style={{ height: `${dynamicHeight}px` }}
              />
            );
          })}
        </div>
      </div>

      {/* Microphone Permission / Network Warning Banner (Displayed when error occurs) */}
      {error && (
        <div className="mt-3 bg-rose-950/80 border-2 border-rose-500/80 rounded-xl p-3 text-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-rose-300">Microphone Notice</p>
              <p className="text-[11px] text-rose-200/90 mt-0.5">{error}</p>
              <p className="text-[10.5px] text-amber-300 mt-1 font-semibold">
                💡 To allow: In your browser address bar next to <code>localhost:3001</code>, click the 🔒 / 🎛️ icon, set <b>Microphone</b> to <b>Allow</b>, then click Retry.
              </p>
            </div>
          </div>
          {onRequestPermission && (
            <button
              type="button"
              onClick={onRequestPermission}
              className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Allow & Test Mic
            </button>
          )}
        </div>
      )}

      {/* Recommended Flow Banner (User Speaking Guide) */}
      <div className="mt-3 bg-teal-950/40 border border-teal-800/50 rounded-xl p-2.5 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed text-teal-200">
          <span className="font-bold text-teal-300 uppercase tracking-wide">Speaking Flow: </span>
          <span className="font-mono bg-teal-900/60 px-1.5 py-0.5 rounded text-teal-100 font-semibold">
            {sampleGuide}
          </span>
        </div>
      </div>

      {/* Real-time Live Transcript Area */}
      <div className="mt-3 bg-slate-950 rounded-xl p-3 border border-slate-800/90 min-h-[64px] max-h-32 overflow-y-auto font-sans text-xs leading-relaxed compact-scroll">
        {transcript || interimTranscript ? (
          <p className="text-slate-100">
            {transcript}
            {interimTranscript && (
              <span className="text-teal-400 italic"> {interimTranscript}</span>
            )}
          </p>
        ) : (
          <p className="text-slate-500 italic flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-slate-600" />
            {isListening ? 'Listening... Speak now!' : placeholder}
          </p>
        )}
      </div>

      {/* Quick 1-Click Simulation / Sample Chips */}
      {sampleChips && sampleChips.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            💡 Quick Demo Chips (Click to test without speaking):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSample && onSelectSample(chip.text)}
                className="text-[10px] bg-slate-800/90 hover:bg-teal-900/50 hover:text-teal-200 hover:border-teal-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/80 transition-all text-left truncate max-w-full font-medium flex items-center gap-1 cursor-pointer"
                title={`Simulate: "${chip.text}"`}
              >
                <span className="text-teal-400 font-bold">▶</span>
                <span className="truncate">{chip.label || chip.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
