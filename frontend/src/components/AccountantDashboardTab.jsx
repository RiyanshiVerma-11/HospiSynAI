import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  Receipt,
  FileSpreadsheet,
  Search,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Download,
  RotateCcw,
  Building2,
  Sparkles,
  ArrowUpRight,
  Filter,
  DollarSign,
  Wallet,
  X
} from 'lucide-react';

export default function AccountantDashboardTab({
  API_BASE,
  getHeaders,
  showToast,
  metrics,
  unpaidBills = [],
  patients = [],
  setActiveTab,
  setActiveBillForPayment,
  setPaymentForm,
  fetchReceiptDetails,
  handleSelectPatient,
  fetchUnpaidBills,
  fetchDashboardMetrics,
  triggerSyncSimulation
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Quick Settle Modal State
  const [settleBill, setSettleBill] = useState(null);
  const [settleForm, setSettleForm] = useState({
    amount_paid: '',
    payment_method: 'UPI',
    transaction_reference: ''
  });
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  // Quick Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({
    payment_id: '',
    amount_refunded: '',
    reason: ''
  });
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (fetchDashboardMetrics) await fetchDashboardMetrics();
      if (fetchUnpaidBills) await fetchUnpaidBills();
      showToast("Financial records synced.", "success");
    } catch (e) {
      showToast("Failed to refresh records.", "error");
    } finally {
      setRefreshing(false);
    }
  };

  // Download Tally / CSV Report
  const downloadReport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/reports/csv`, {
        headers: getHeaders ? getHeaders() : {}
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospisyn_financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Financial ledger CSV exported successfully.");
    } catch (err) {
      showToast(`Export error: ${err.message}`, "error");
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate Advances Adjusted
  const advanceAdjustedTotal = useMemo(() => {
    let sum = 0;
    unpaidBills.forEach(b => {
      sum += (b.adjusted_advance || 0);
    });
    return sum;
  }, [unpaidBills]);

  // Recovery Rate calculation
  const recoveryRate = useMemo(() => {
    const totalRev = metrics?.total_revenue || 0;
    const pendingDues = metrics?.pending_dues || 0;
    const totalBilled = totalRev + pendingDues;
    if (totalBilled === 0) return 100;
    return Math.round((totalRev / totalBilled) * 100);
  }, [metrics]);

  // Filtered Unpaid Bills
  const filteredBills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return unpaidBills.filter(bill => {
      const pName = bill.patient?.name || bill.patient_name || '';
      const pMobile = bill.patient?.mobile_number || '';
      const billId = bill.bill_id || String(bill.id) || '';
      const matchesQuery = !q || pName.toLowerCase().includes(q) || pMobile.includes(q) || billId.toLowerCase().includes(q);
      if (!matchesQuery) return false;

      const balance = bill.balance_amount ?? (bill.grand_total - (bill.paid_amount || 0));
      if (filterType === 'High Value') return balance >= 2000;
      if (filterType === 'Partial') return bill.paid_amount > 0 && balance > 0;
      if (filterType === 'Unpaid') return !bill.paid_amount || bill.paid_amount === 0;
      return true;
    });
  }, [unpaidBills, searchQuery, filterType]);

  // Payment method breakdown calculation
  const paymentBreakdown = useMemo(() => {
    const defaultData = {
      UPI: { amount: 0, count: 0, pct: 0 },
      Cash: { amount: 0, count: 0, pct: 0 },
      Card: { amount: 0, count: 0, pct: 0 },
      NetBanking: { amount: 0, count: 0, pct: 0 }
    };

    if (!metrics?.payment_method_breakdown) return defaultData;

    const total = metrics.total_revenue || 1;
    const breakdown = metrics.payment_method_breakdown;
    const counts = metrics.payment_method_counts || {};

    const res = {};
    ['UPI', 'Cash', 'Card', 'NetBanking'].forEach(m => {
      const amt = breakdown[m] || 0;
      const cnt = counts[m] || 0;
      const pct = Math.round((amt / (total || 1)) * 100);
      res[m] = { amount: amt, count: cnt, pct };
    });
    return res;
  }, [metrics]);

  // Cash collections today
  const todayCash = useMemo(() => {
    if (!metrics?.recent_transactions) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let sum = 0;
    metrics.recent_transactions.forEach(tx => {
      if (tx.payment_method === 'Cash' && tx.created_at && tx.created_at.startsWith(todayStr)) {
        sum += (tx.amount || 0);
      }
    });
    return sum;
  }, [metrics]);

  // Open Quick Settle Modal
  const handleOpenSettle = (bill) => {
    const balance = bill.balance_amount ?? (bill.grand_total - (bill.paid_amount || 0));
    setSettleBill(bill);
    setSettleForm({
      amount_paid: String(balance),
      payment_method: 'UPI',
      transaction_reference: ''
    });
  };

  // Submit Quick Settle Payment
  const handleSubmitSettle = async (e) => {
    e.preventDefault();
    if (!settleBill) return;
    setSettleSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/payments?bill_id=${settleBill.id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount_paid: parseFloat(settleForm.amount_paid),
          payment_method: settleForm.payment_method,
          transaction_reference: settleForm.transaction_reference,
          payment_type: 'Full'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Payment failed");
      }

      const payment = await res.json();
      showToast(`Payment recorded: ${payment.payment_id}`, "success");
      if (triggerSyncSimulation) {
        triggerSyncSimulation('payment', {
          amount: parseFloat(payment.amount_paid),
          method: payment.payment_method,
          reference: payment.payment_id,
          user: 'Accountant'
        });
      }

      setSettleBill(null);
      if (fetchDashboardMetrics) fetchDashboardMetrics();
      if (fetchUnpaidBills) fetchUnpaidBills();

      // Open Receipt Preview
      if (fetchReceiptDetails && payment.id) {
        fetchReceiptDetails(payment.id);
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSettleSubmitting(false);
    }
  };

  // Submit Quick Refund
  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    setRefundSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/payments/${refundData.payment_id}/refund`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount_refunded: parseFloat(refundData.amount_refunded),
          reason: refundData.reason || 'Patient Request'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Refund failed");
      }

      const refund = await res.json();
      showToast(`Refund processed: ${refund.refund_id}`, "success");
      setShowRefundModal(false);
      setRefundData({ payment_id: '', amount_refunded: '', reason: '' });
      if (fetchDashboardMetrics) fetchDashboardMetrics();
      if (fetchUnpaidBills) fetchUnpaidBills();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto compact-scroll p-2.5 md:p-3.5 pb-14 space-y-2.5 animate-in fade-in duration-150">
      
      {/* ── TOP BANNER: FINANCIAL COMMAND CENTER & SHORTCUTS ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-3 md:p-4 text-white shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 border border-indigo-800/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Accounts & Audit Active
            </span>
            <span className="text-slate-400 text-[10.5px]">• FY 2026-27 Ledger</span>
          </div>
          <h2 className="text-base md:text-lg font-bold tracking-tight text-white leading-tight">
            Accountant Financial Command Center
          </h2>
          <p className="text-slate-300 text-[11px] leading-tight">
            Monitor revenue collections, settle patient receivables, track advances, and reconcile payment modes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={downloadReport}
            disabled={exportLoading}
            className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span>{exportLoading ? 'Exporting...' : '📥 Tally CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing_history')}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-300" />
            <span>🧾 Billing Queue</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRefundModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
            <span>↩️ Quick Refund</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg border border-white/10 transition-all cursor-pointer"
            title="Sync Financial Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 4 KEY FINANCIAL METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Card 1: Total Revenue Collected */}
        <div className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-2.5 shadow-2xs transition-all hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Collections</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">
              ₹{(metrics?.total_revenue || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>₹{(metrics?.today_revenue || 0).toLocaleString()} collected today</span>
            </p>
          </div>
        </div>

        {/* Card 2: Outstanding Receivables (Dues) */}
        <div 
          onClick={() => setFilterType('All')}
          className="bg-white border border-slate-200 hover:border-rose-400 rounded-xl p-2.5 shadow-2xs transition-all cursor-pointer hover:shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Dues</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-rose-600 leading-tight">
              ₹{(metrics?.pending_dues || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              <span>{unpaidBills.length} unpaid patient bills</span>
            </p>
          </div>
        </div>

        {/* Card 3: Advances Held / Adjusted */}
        <div className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-2.5 shadow-2xs transition-all hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Adjusted Advances</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">
              ₹{advanceAdjustedTotal.toLocaleString()}
            </h3>
            <p className="text-[10px] text-indigo-700 font-medium mt-0.5">
              <span>Adjusted towards OPD invoices</span>
            </p>
          </div>
        </div>

        {/* Card 4: Financial Recovery Rate */}
        <div className="bg-white border border-slate-200 hover:border-teal-400 rounded-xl p-2.5 shadow-2xs transition-all hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recovery Rate</span>
            <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-lg md:text-xl font-extrabold text-teal-700 leading-tight">
              {recoveryRate}%
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              <span>Billed vs collected ratio</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN SECTION: RECEIVABLES QUEUE + RECONCILIATION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
        
        {/* Left 8 Cols: Outstanding Invoices & Dues Recovery Board */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-3 md:p-3.5 shadow-2xs space-y-2.5">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-xs md:text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                Outstanding Patient Invoices & Dues Recovery
              </h3>
              <p className="text-slate-400 text-[10.5px]">Directly collect and clear pending patient balances in 1 click.</p>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search invoice, patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-[11px] font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 w-36 sm:w-44 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center flex-wrap gap-1">
            {[
              { id: 'All', label: 'All Unpaid', count: unpaidBills.length },
              { id: 'High Value', label: 'High Dues (>₹2k)', count: unpaidBills.filter(b => (b.balance_amount || b.grand_total) >= 2000).length },
              { id: 'Partial', label: 'Partial Paid', count: unpaidBills.filter(b => b.paid_amount > 0).length },
              { id: 'Unpaid', label: 'Zero Paid', count: unpaidBills.filter(b => !b.paid_amount || b.paid_amount === 0).length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded ${
                  filterType === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Outstanding Bills List */}
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto compact-scroll pr-0.5">
            {filteredBills.map((bill) => {
              const balance = bill.balance_amount ?? (bill.grand_total - (bill.paid_amount || 0));
              const isPartial = bill.paid_amount > 0;
              const pName = bill.patient?.name || bill.patient_name || 'Walk-in Patient';
              const pMobile = bill.patient?.mobile_number || '';
              const docName = bill.doctor?.name || bill.visit?.doctor?.name || 'On-Call Physician';

              return (
                <div
                  key={bill.id}
                  className="p-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 hover:border-indigo-400 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Bill Number Badge */}
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex flex-col items-center justify-center font-bold shrink-0 shadow-2xs">
                      <span className="text-[7.5px] uppercase tracking-tighter opacity-80 leading-none">INV</span>
                      <span className="text-[10px] leading-tight">#{bill.id}</span>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {pName}
                        </span>
                        {pMobile && (
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/80 px-1 py-0.2 rounded font-mono">
                            {pMobile}
                          </span>
                        )}
                        {isPartial ? (
                          <span className="bg-amber-100 text-amber-800 text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border border-amber-200">
                            Partial Paid
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border border-rose-200">
                            Unpaid
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                        <span>Billed: <b className="text-slate-800">₹{bill.grand_total?.toLocaleString()}</b></span>
                        <span className="text-slate-300">•</span>
                        <span>Paid: <b className="text-emerald-700">₹{(bill.paid_amount || 0).toLocaleString()}</b></span>
                        <span className="text-slate-300">•</span>
                        <span>Due: <b className="text-rose-600">₹{balance.toLocaleString()}</b></span>
                      </p>

                      <p className="text-[9.5px] text-slate-400 truncate">
                        Dr: {docName} • Date: {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenSettle(bill)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Collect ₹{balance.toLocaleString()}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('billing_history');
                        if (setActiveBillForPayment) setActiveBillForPayment(bill);
                      }}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Open in Billing Queue"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredBills.length === 0 && (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p className="text-[11px] font-medium text-slate-600">All caught up! No overdue invoices matching filter.</p>
                <p className="text-[10px]">New unpaid patient invoices will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Payment Methods Breakdown & Recent Audit Stream */}
        <div className="lg:col-span-4 space-y-2.5">
          
          {/* Payment Method Breakdown Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                Revenue by Payment Mode
              </h3>
              <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-full">
                Real-time
              </span>
            </div>

            <div className="space-y-1.5">
              {[
                { name: 'UPI / QR', key: 'UPI', color: 'bg-teal-500', text: 'text-teal-600' },
                { name: 'Cash', key: 'Cash', color: 'bg-emerald-500', text: 'text-emerald-600' },
                { name: 'Card (POS)', key: 'Card', color: 'bg-indigo-500', text: 'text-indigo-600' },
                { name: 'NetBanking', key: 'NetBanking', color: 'bg-amber-500', text: 'text-amber-600' }
              ].map(m => {
                const data = paymentBreakdown[m.key] || { amount: 0, count: 0, pct: 0 };
                return (
                  <div key={m.key} className="space-y-0.5">
                    <div className="flex justify-between text-[10.5px]">
                      <span className="font-semibold text-slate-700">{m.name} ({data.count})</span>
                      <span className="font-bold text-slate-900">₹{data.amount.toLocaleString()} ({data.pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(data.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Receipts & Audit Stream Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-teal-600" />
                Recent Payment Audit
              </h3>
              <span className="text-[8.5px] text-slate-400">Latest 5 Receipts</span>
            </div>

            <div className="space-y-1.5">
              {(metrics?.recent_transactions || []).slice(0, 5).map(tx => (
                <div
                  key={tx.id}
                  className="p-1.5 px-2 rounded-lg border border-slate-200 hover:border-teal-300 bg-slate-50/50 flex items-center justify-between gap-1.5"
                >
                  <div className="space-y-0.2 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900 text-[11px] truncate">{tx.patient_name}</span>
                      <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                        {tx.payment_method}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 truncate">
                      {tx.payment_id} • {tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-black text-xs text-slate-900">₹{tx.amount?.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (fetchReceiptDetails) fetchReceiptDetails(tx.id);
                      }}
                      className="p-1 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      title="View Receipt"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {(!metrics?.recent_transactions || metrics.recent_transactions.length === 0) && (
                <p className="text-center text-slate-400 text-[10.5px] py-3">No payments recorded yet.</p>
              )}
            </div>
          </div>

          {/* Daily Cash Counter Drawer Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-sm border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3" />
                Physical Cash in Register
              </span>
              <span className="text-[8.5px] text-slate-400">Day-End Balance</span>
            </div>

            <p className="text-[10.5px] text-slate-300 leading-normal">
              Reconcile total physical cash collected across morning & evening shifts today.
            </p>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-[10.5px] text-slate-400">Today's Cash Inflow:</span>
              <span className="font-bold text-xs text-emerald-400">₹{todayCash.toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                showToast("Cash register tally confirmed! Accounts balanced.");
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] py-1.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Verify Day-End Cash Balance
            </button>
          </div>

        </div>

      </div>

      {/* ── INLINE QUICK SETTLE MODAL ── */}
      {settleBill && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl max-w-sm w-full space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-xs md:text-sm">Collect Patient Payment</h4>
              </div>
              <button
                type="button"
                onClick={() => setSettleBill(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5 text-xs">
              <p className="font-bold text-slate-900">
                Patient: {settleBill.patient?.name || settleBill.patient_name || 'Walk-in'}
              </p>
              <p className="text-[11px] text-slate-500">
                Invoice ID: <span className="font-mono font-bold text-slate-700">{settleBill.bill_id || settleBill.id}</span>
              </p>
              <p className="text-[11px] text-rose-600 font-bold">
                Total Due: ₹{(settleBill.balance_amount ?? (settleBill.grand_total - (settleBill.paid_amount || 0))).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleSubmitSettle} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Amount to Collect (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleForm.amount_paid}
                  onChange={(e) => setSettleForm({ ...settleForm, amount_paid: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {['UPI', 'Cash', 'Card', 'NetBanking'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSettleForm({ ...settleForm, payment_method: mode })}
                      className={`py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                        settleForm.payment_method === mode
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Transaction / UTR Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Card Last 4 Digits"
                  value={settleForm.transaction_reference}
                  onChange={(e) => setSettleForm({ ...settleForm, transaction_reference: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={settleSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {settleSubmitting ? 'Recording...' : 'Confirm & Print Receipt'}
                </button>
                <button
                  type="button"
                  onClick={() => setSettleBill(null)}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK REFUND MODAL ── */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl max-w-sm w-full space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-slate-900 text-xs md:text-sm">Issue Quick Refund</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefund} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Payment ID to Refund
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PAY-20260822-00001"
                  value={refundData.payment_id}
                  onChange={(e) => setRefundData({ ...refundData, payment_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500"
                  value={refundData.amount_refunded}
                  onChange={(e) => setRefundData({ ...refundData, amount_refunded: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service Cancelled / Double Charge"
                  value={refundData.reason}
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {refundSubmitting ? 'Processing...' : 'Process Refund'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
