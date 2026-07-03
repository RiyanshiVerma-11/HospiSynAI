import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Coins, 
  ArrowRight, 
  Layers, 
  Zap, 
  Sparkles, 
  Users, 
  Building, 
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
    <div className="space-y-8 animate-slide-up pb-16">
      
      {/* Upper Grid: Business Pitch Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Productivity & Savings Overview Card */}
        <div className="premium-card p-6 lg:col-span-2 flex flex-col justify-between bg-white text-slate-800 border border-slate-200 shadow-md rounded-2xl">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-150 text-teal-600 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Productivity Overview
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              Hospital Productivity & <span className="gradient-text-teal">Savings Desk</span>
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6 font-semibold">
              HospiSynAI acts as an active clinical and financial assistant. By automating OPD reception workflows, auditing billing codes against Indian GST compliance standards, and generating vernacular daily routine summaries, the platform turns routine administrative tasks into measurable time and cost savings.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Efficiency Target</span>
              <span className="text-xs text-slate-800 font-black">98.5% Accuracy</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Time Reclaimed</span>
              <span className="text-xs text-teal-600 font-black">AI Assisted Flow</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Operational Mode</span>
              <span className="text-xs text-violet-600 font-black">Hybrid Auditing</span>
            </div>
          </div>
        </div>

        {/* Indian GST Rules Card */}
        <div className="premium-card p-6 border border-slate-200 bg-white text-slate-800 flex flex-col justify-between shadow-md rounded-2xl">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Real-time Indian GST Rules</h4>
            </div>
            
            <ul className="space-y-2 text-[11px] text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span><strong>Consultation & Diagnosis</strong>: 0% GST (Tax-Exempt)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span><strong>ICU / CCU / NICU Rooms</strong>: 0% GST</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span><strong>Other Room Rent</strong>: 5% GST on AC rooms &gt; ₹5,000/day</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span><strong>Ambulance Transfers</strong>: 0% GST (Tax-Free)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span><strong>Cosmetic/Plastic Surgery</strong>: 18% GST (unless reconstructive)</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] text-slate-500 leading-normal font-semibold mt-4">
            💡 The auditor checks these categories dynamically before printing receipts, preventing manual tax billing audit risks.
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Calculator Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Left Hand Side: Dynamic Inputs */}
        <div className="premium-card p-6 bg-white border border-slate-200 shadow-md space-y-6 rounded-2xl">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Coins className="w-4 h-4 text-teal-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">Manual Operational Baselines</h4>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-2">
              Set your clinic's average manual statistics (<strong>before HospiSynAI</strong>) to dynamically project saved time and caught revenue leaks.
            </p>
          </div>

          {/* Input 1: Daily Patients */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Daily Patient Load (OPD)</label>
              <span className="text-xs font-black text-slate-800">{dailyPatients} Patients</span>
            </div>
            <input 
              type="range" min="10" max="200" step="5"
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
              value={dailyPatients}
              onChange={(e) => setDailyPatients(parseInt(e.target.value))}
            />
          </div>

          {/* Input 2: Manual Prescription Time */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Manual Prescription Write (Per Patient)</label>
              <span className="text-xs font-black text-slate-800">{manPrescriptionTime} Mins</span>
            </div>
            <input 
              type="range" min="5" max="30" step="1"
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
              value={manPrescriptionTime}
              onChange={(e) => setManPrescriptionTime(parseInt(e.target.value))}
            />
          </div>

          {/* Input 3: Manual Billing Time */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Manual Billing & GST Check (Per Invoice)</label>
              <span className="text-xs font-black text-slate-800">{manBillingTime} Mins</span>
            </div>
            <input 
              type="range" min="3" max="20" step="1"
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
              value={manBillingTime}
              onChange={(e) => setManBillingTime(parseInt(e.target.value))}
            />
          </div>

          {/* Input 4: Billing Leakage Error Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Manual Billing Error Rate (%)</label>
              <span className="text-xs font-black text-rose-600">{billingErrorRate}% of bills</span>
            </div>
            <input 
              type="range" min="1" max="15" step="1"
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
              value={billingErrorRate}
              onChange={(e) => setBillingErrorRate(parseInt(e.target.value))}
            />
          </div>

          {/* Input 5: Average Leakage Cost */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Avg. Revenue Leakage (Per Mistake)</label>
              <span className="text-xs font-black text-slate-800">₹{avgLeakageCost} INR</span>
            </div>
            <input 
              type="range" min="100" max="1500" step="50"
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
              value={avgLeakageCost}
              onChange={(e) => setAvgLeakageCost(parseInt(e.target.value))}
            />
          </div>

        </div>

        {/* Right Hand Side: Outputs and Metrics */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Outputs Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Cards 1: Time Saved */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Time Saved</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{metrics.monthlyHoursSaved} Hours</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">({metrics.yearlyHoursSaved} hours / year)</p>
              </div>
            </div>

            {/* Cards 2: Financial Leakage Saved */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Leakages Prevented</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">₹{metrics.monthlyLeakagePrevented.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">(₹{metrics.yearlyLeakagePrevented.toLocaleString('en-IN')} / year)</p>
              </div>
            </div>

            {/* Cards 3: ROI Percentage */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expected Monthly ROI</p>
                <p className="text-xl font-black text-violet-600 mt-0.5">+{metrics.roiPercentage}%</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">(Based on active subscription cost)</p>
              </div>
            </div>

            {/* Cards 4: Payback Period */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payback Period</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{metrics.paybackPeriodDays} Days</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">(Time to recover software licensing cost)</p>
              </div>
            </div>

          </div>

          {/* Pricing Tiers Presentation Block */}
          <div className="premium-card p-6 bg-white border border-slate-200 shadow-md rounded-2xl">
            <h4 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" /> HospiSynAI SaaS Licensing & Pricing Tiers
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tier 1 */}
              <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                metrics.selectedSaaSPrice === starterPrice ? 'border-teal-500 bg-teal-50/10 ring-2 ring-teal-500/10' : 'border-slate-150 bg-slate-50/50'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-wide">Starter</span>
                    {metrics.selectedSaaSPrice === starterPrice && <span className="text-[8px] font-bold text-white bg-teal-500 px-1.5 py-0.5 rounded">Active Selection</span>}
                  </div>
                  <h5 className="font-extrabold text-slate-800 text-sm mt-2">Single Doctor OPD</h5>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">Ideal for small neighborhood clinics with single physicians.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                  <span className="text-base font-black text-slate-950">₹1,999</span>
                  <span className="text-[10px] text-slate-500 font-medium"> / Month</span>
                </div>
              </div>

              {/* Tier 2 */}
              <div className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                metrics.selectedSaaSPrice === growthPrice ? 'border-teal-500 bg-teal-50/10 ring-2 ring-teal-500/10' : 'border-slate-150 bg-slate-50/50'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wide text-violet-600">Growth / Pro</span>
                    {metrics.selectedSaaSPrice === growthPrice && <span className="text-[8px] font-bold text-white bg-teal-500 px-1.5 py-0.5 rounded">Active Selection</span>}
                  </div>
                  <h5 className="font-extrabold text-slate-800 text-sm mt-2">OPD / Diagnostics Center</h5>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">Ideal for multi-specialty centers and active diagnostic laboratories.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                  <span className="text-base font-black text-slate-950">₹4,999</span>
                  <span className="text-[10px] text-slate-500 font-medium"> / Month</span>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="border border-slate-150 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">Enterprise</span>
                  </div>
                  <h5 className="font-extrabold text-slate-800 text-sm mt-2">Hospital Chain Licensing</h5>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">Multi-branch database synchronization & custom server deployment.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                  <span className="text-xs font-bold text-slate-600">Custom Contract</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
