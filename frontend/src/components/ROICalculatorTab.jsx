import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Coins, 
  Layers, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

export default function ROICalculatorTab() {
  // Input states
  const [dailyPatients, setDailyPatients] = useState(50);
  const [manPrescriptionTime, setManPrescriptionTime] = useState(10); // in minutes
  const [manBillingTime, setManBillingTime] = useState(6); // in minutes
  const [billingErrorRate, setBillingErrorRate] = useState(4); // percentage (e.g. 4%)
  const [avgLeakageCost, setAvgLeakageCost] = useState(450); // in INR per error
  
  // Static pricing configs
  const starterPrice = 1999;
  const growthPrice = 4999;
  
  // Memoized Calculations
  const metrics = useMemo(() => {
    // 1. Time Savings
    const aiPrescriptionTime = 2.5; // minutes with AI suggester
    const aiBillingTime = 1.5; // minutes with AI suggester/recommender
    
    const prescriptionMinsSavedPerDay = dailyPatients * (manPrescriptionTime - aiPrescriptionTime);
    const billingMinsSavedPerDay = dailyPatients * (manBillingTime - aiBillingTime);
    const totalMinsSavedPerDay = prescriptionMinsSavedPerDay + billingMinsSavedPerDay;
    
    const monthlyHoursSaved = Math.round((totalMinsSavedPerDay * 30) / 60);
    const yearlyHoursSaved = Math.round((totalMinsSavedPerDay * 365) / 60);
    
    // 2. Financial Leakage Savings
    const errorsPerMonth = Math.round(dailyPatients * 30 * (billingErrorRate / 100));
    const monthlyLeakagePrevented = errorsPerMonth * avgLeakageCost;
    const yearlyLeakagePrevented = monthlyLeakagePrevented * 12;
    
    // 3. ROI Metrics
    const selectedSaaSPrice = dailyPatients > 60 ? growthPrice : starterPrice;
    const netMonthlySavings = monthlyLeakagePrevented - selectedSaaSPrice;
    const roiPercentage = Math.round((netMonthlySavings / selectedSaaSPrice) * 100);
    const paybackPeriodDays = Math.round((selectedSaaSPrice / (monthlyLeakagePrevented / 30)));

    return {
      monthlyHoursSaved,
      yearlyHoursSaved,
      monthlyLeakagePrevented,
      yearlyLeakagePrevented,
      selectedSaaSPrice,
      netMonthlySavings,
      roiPercentage,
      paybackPeriodDays: Math.max(1, paybackPeriodDays)
    };
  }, [dailyPatients, manPrescriptionTime, manBillingTime, billingErrorRate, avgLeakageCost]);

  return (
    <div className="h-full md:h-full md:max-h-full overflow-y-auto pr-2 min-h-0 compact-scroll space-y-6 pb-6 animate-slide-up">
      
      {/* Dynamic Header Block (No heavy card container, borderless modern presentation) */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 pb-5 border-b border-slate-200/60">
        <div className="max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> ROI & Analytics Workspace
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
            Hospital Productivity & <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">Savings Calculator</span>
          </h2>
          <p className="text-slate-500 text-xs leading-relaxed font-semibold">
            Evaluate time-reclamation and revenue leak prevention by running live simulations. HospiSynAI automates workflows, enforces real-time tax rules, and generates vernacular layouts, replacing standard manual overhead with clear ROI.
          </p>
        </div>
        
        {/* Minimalist GST Compliance Panel (modern flat styling) */}
        <div className="w-full lg:max-w-xs bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col justify-between shrink-0 hover:shadow-sm transition-all duration-300">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Indian GST Compliance</h4>
            </div>
            <ul className="space-y-1.5 text-[10px] text-slate-600 font-bold">
              <li className="flex justify-between"><span>OPD Consults:</span><span className="text-teal-600">0% GST</span></li>
              <li className="flex justify-between"><span>ICU / CCU Rent:</span><span className="text-teal-600">0% GST</span></li>
              <li className="flex justify-between"><span>AC Room Rent (&gt;₹5k):</span><span className="text-violet-600">5% GST</span></li>
              <li className="flex justify-between"><span>Aesthetics/Cosmetics:</span><span className="text-rose-600">18% GST</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Simulation Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Control Desk (Manual baselines sliders - high tech sleek inputs container) */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <Coins className="w-4 h-4 text-teal-650" />
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Simulation Inputs</h4>
          </div>
          
          <div className="space-y-5">
            {/* Input 1: Daily Patients */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                <span>Daily Patients Load</span>
                <span className="text-teal-600 text-[11px] font-black">{dailyPatients} patients</span>
              </div>
              <input 
                type="range" min="10" max="200" step="5"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                value={dailyPatients}
                onChange={(e) => setDailyPatients(parseInt(e.target.value))}
              />
            </div>

            {/* Input 2: Manual Prescription Time */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                <span>Manual Prescription (mins)</span>
                <span className="text-slate-700 text-[11px] font-black">{manPrescriptionTime} mins</span>
              </div>
              <input 
                type="range" min="5" max="30" step="1"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                value={manPrescriptionTime}
                onChange={(e) => setManPrescriptionTime(parseInt(e.target.value))}
              />
            </div>

            {/* Input 3: Manual Billing Time */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                <span>Manual Invoice Checks (mins)</span>
                <span className="text-slate-700 text-[11px] font-black">{manBillingTime} mins</span>
              </div>
              <input 
                type="range" min="3" max="20" step="1"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                value={manBillingTime}
                onChange={(e) => setManBillingTime(parseInt(e.target.value))}
              />
            </div>

            {/* Input 4: Billing Leakage Error Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                <span>Billing Error Rate</span>
                <span className="text-rose-500 text-[11px] font-black">{billingErrorRate}% of bills</span>
              </div>
              <input 
                type="range" min="1" max="15" step="1"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                value={billingErrorRate}
                onChange={(e) => setBillingErrorRate(parseInt(e.target.value))}
              />
            </div>

            {/* Input 5: Average Leakage Cost */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                <span>Average Leakage Cost</span>
                <span className="text-slate-700 text-[11px] font-black">₹{avgLeakageCost}</span>
              </div>
              <input 
                type="range" min="100" max="1500" step="50"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                value={avgLeakageCost}
                onChange={(e) => setAvgLeakageCost(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Telemetry metrics & pricing models grid (Right Column) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Dashboard Telemetry (Modern borderless glowing items) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Telemetry 1: Time Saved */}
            <div className="bg-gradient-to-br from-teal-500/5 to-white border border-teal-500/20 rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-teal-655" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Monthly Time Reclaimed</span>
                <p className="text-2xl font-black bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">{metrics.monthlyHoursSaved} Hours</p>
                <span className="text-[10px] font-bold text-slate-450">({metrics.yearlyHoursSaved} Hours Saved/Year)</span>
              </div>
            </div>

            {/* Telemetry 2: Leakage Savings */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white border border-emerald-500/20 rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-650" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Revenue Leaks Prevented</span>
                <p className="text-2xl font-black text-emerald-600">₹{metrics.monthlyLeakagePrevented.toLocaleString('en-IN')}</p>
                <span className="text-[10px] font-bold text-slate-450">(₹{metrics.yearlyLeakagePrevented.toLocaleString('en-IN')} Saved/Year)</span>
              </div>
            </div>

            {/* Telemetry 3: Expected ROI */}
            <div className="bg-gradient-to-br from-violet-500/5 to-white border border-violet-500/20 rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-violet-650" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Monthly Platform ROI</span>
                <p className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">+{metrics.roiPercentage}%</p>
                <span className="text-[10px] font-bold text-slate-450">(Based on software pricing)</span>
              </div>
            </div>

            {/* Telemetry 4: Payback Period */}
            <div className="bg-gradient-to-br from-amber-500/5 to-white border border-amber-500/20 rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-amber-650" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Payback Period</span>
                <p className="text-2xl font-black text-slate-800">{metrics.paybackPeriodDays} Days</p>
                <span className="text-[10px] font-bold text-slate-450">(Time to offset subscription)</span>
              </div>
            </div>

          </div>

          {/* Pricing Models (Modern styled blocks) */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-655" />
              Dynamic SaaS Licensing Models
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Starter Tier */}
              <div className={`rounded-2xl p-4 flex flex-col justify-between border transition-all duration-300 ${
                metrics.selectedSaaSPrice === starterPrice 
                  ? 'border-teal-500 bg-teal-50/5 ring-1 ring-teal-500/20 shadow-md translate-y-[-2px]' 
                  : 'border-slate-150 bg-slate-50/30 hover:border-slate-250 hover:bg-slate-50'
              }`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded uppercase tracking-wider">Starter</span>
                    {metrics.selectedSaaSPrice === starterPrice && <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />}
                  </div>
                  <h5 className="font-extrabold text-slate-850 text-xs">Single Doctor Clinic</h5>
                  <p className="text-[9px] text-slate-450 leading-relaxed font-semibold">Ideal for small neighborhood clinics with single physicians.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-baseline gap-1">
                  <span className="text-lg font-black text-slate-900">₹1,999</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">/ Mo</span>
                </div>
              </div>

              {/* Growth Tier */}
              <div className={`rounded-2xl p-4 flex flex-col justify-between border transition-all duration-300 ${
                metrics.selectedSaaSPrice === growthPrice 
                  ? 'border-violet-500 bg-violet-50/5 ring-1 ring-violet-500/20 shadow-md translate-y-[-2px]' 
                  : 'border-slate-150 bg-slate-50/30 hover:border-slate-250 hover:bg-slate-50'
              }`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded uppercase tracking-wider">Growth / Pro</span>
                    {metrics.selectedSaaSPrice === growthPrice && <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />}
                  </div>
                  <h5 className="font-extrabold text-slate-850 text-xs">OPD & Diagnostics</h5>
                  <p className="text-[9px] text-slate-455 leading-relaxed font-semibold">Ideal for multi-specialty centers and active diagnostic laboratories.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-baseline gap-1">
                  <span className="text-lg font-black text-slate-900">₹4,999</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">/ Mo</span>
                </div>
              </div>

              {/* Enterprise Tier */}
              <div className="rounded-2xl p-4 flex flex-col justify-between border border-slate-150 bg-slate-50/30 hover:border-slate-250 hover:bg-slate-50 transition-all duration-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">Enterprise</span>
                  </div>
                  <h5 className="font-extrabold text-slate-850 text-xs">Hospital Chain</h5>
                  <p className="text-[9px] text-slate-450 leading-relaxed font-semibold">Multi-branch database synchronization & custom server deployment.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                  <span className="text-xs font-black text-slate-700">Custom Contract</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
