import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  Database, 
  Check, 
  X, 
  Maximize2, 
  Minimize2, 
  ArrowRight,
  Wifi,
  Play
} from 'lucide-react';

export default function DemoTour({ API_BASE, onSeedSuccess, setActiveTab, setSelectedPatientById }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Step 1: Auto-Seed SIPS Sandbox",
      desc: "Instantly seed 4 test patients with clinical histories (pediatric, duplicate audits, AC Room GST) and 5 past ledger items to populate dashboard charts.",
      actionLabel: "⚡ Seed Sandbox Data",
      action: async () => {
        setIsSeeding(true);
        try {
          const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
          if (!res.ok) throw new Error("Seeding failed");
          const data = await res.json();
          setSeedDone(true);
          if (onSeedSuccess) onSeedSuccess("Mock evaluation patients and financial ledger seeded successfully!");
          setCurrentStep(1); // Auto move to next step
        } catch (err) {
          console.error(err);
        } finally {
          setIsSeeding(false);
        }
      }
    },
    {
      title: "Step 2: AI Revenue Analyst",
      desc: "Go to the Dashboard tab. Locate the 'Groq AI Revenue Analyst' card. It dynamically reads today's financial ledger, digital splits, and unpaid dues to produce business insights.",
      actionLabel: "Go to Dashboard",
      action: () => {
        setActiveTab('dashboard');
      }
    },
    {
      title: "Step 3: Pediatric Safety Audit",
      desc: "Go to Patient Search & Desk. Search for 'Aarav Sharma' (8 yrs old). Click 'AI Suggest Treatment' or create a bill with Augmentin 625mg adult tablet. Run the Billing Auditor to check safety warnings.",
      actionLabel: "Go to Patient Desk",
      action: () => {
        setActiveTab('search_register');
      }
    },
    {
      title: "Step 4: Real-time GST Audit",
      desc: "Search for patient 'Rajesh Malhotra'. Add 'Semi-Private Room Rent' set to ₹5,500/day. Run 'AI Billing Audit' to verify the 5% GST tax compliance warn and check 0% exemptions on Ambulance.",
      actionLabel: "Open Patient Desk",
      action: () => {
        setActiveTab('search_register');
      }
    },
    {
      title: "Step 5: Business ROI & GST",
      desc: "Open the 'ROI & Business Model' tab in the sidebar. Play with patient volume sliders to calculate clinic savings, inspect GST brackets, and pitch SIPS business plans.",
      actionLabel: "Go to ROI Desk",
      action: () => {
        setActiveTab('roi_calculator');
      }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (steps[currentStep + 1].action && currentStep === 0) {
        // Don't auto-run seed, let them click
      } else if (steps[currentStep + 1].action) {
        steps[currentStep + 1].action();
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (steps[currentStep - 1].action) {
        steps[currentStep - 1].action();
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden font-sans">
      
      {/* Collapsed floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#090d1a] border border-teal-500/30 text-white rounded-2xl px-4 py-3 shadow-2xl hover:bg-slate-900 active:scale-95 transition-all group animate-bounce-subtle"
          style={{ boxShadow: '0 10px 30px -10px rgba(20, 184, 166, 0.4)' }}
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">SIPS Evaluation Tour</span>
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div 
          className="bg-[#090d1a] border border-teal-500/30 text-white w-80 max-w-sm rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          style={{ boxShadow: '0 20px 50px -15px rgba(20, 184, 166, 0.3)' }}
        >
          {/* Header */}
          <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-200">SIPS Pitch Companion</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 flex-1 space-y-4">
            
            {/* Step Counter */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-teal-400">Step {currentStep + 1} of {steps.length}</span>
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded px-1.5 py-0.5 text-[8px] font-mono">
                <Wifi className="w-2.5 h-2.5 animate-pulse" /> Sandbox Live
              </span>
            </div>

            {/* Step Details */}
            <div>
              <h4 className="font-extrabold text-sm text-slate-100">{steps[currentStep].title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2 font-medium">
                {steps[currentStep].desc}
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2">
              {currentStep === 0 ? (
                <button
                  onClick={steps[0].action}
                  disabled={isSeeding}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    seedDone 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-teal-500 text-white hover:bg-teal-600 shadow-md shadow-teal-500/20 active:scale-[0.98]'
                  }`}
                >
                  {isSeeding ? (
                    <>
                      <Database className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing Sandbox Tables...</span>
                    </>
                  ) : seedDone ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Sandbox Seeded!</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>{steps[0].actionLabel}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={steps[currentStep].action}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-850 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{steps[currentStep].actionLabel}</span>
                </button>
              )}
            </div>

          </div>

          {/* Navigation Controls */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-900 flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <span className="text-[10px] text-slate-600 font-bold font-mono">
              {currentStep + 1} / {steps.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
