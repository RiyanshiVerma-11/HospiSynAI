import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  FileText,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  BarChart2,
  PieChart as PieIcon,
  Download,
  X,
  Sparkles,
  Brain,
  TrendingDown,
  Zap,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';

const CHART_COLORS = ['#14b8a6', '#8b5cf6', '#6366f1', '#f59e0b', '#fb7185'];

/* ── Count-up hook ─────────────────────────────────────────── */
function useCountUp(target, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled || !target) { setValue(target); return; }
    let start = null;
    const from = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);
  return value;
}

/* ── Skeleton card ─────────────────────────────────────────── */
function SkeletonKPI() {
  return (
    <div className="premium-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton w-9 h-9 rounded-xl" />
      </div>
      <div className="skeleton h-8 w-36 rounded mb-3" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="premium-card p-6">
      <div className="skeleton h-3 w-32 rounded mb-6" />
      <div className="skeleton h-52 w-full rounded-xl" />
    </div>
  );
}

/* ── AI Insight Card ────────────────────────────────────────── */
function AIInsightCard({ API_BASE }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsight = async (isRefresh = false) => {
    const token = sessionStorage.getItem('token');
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/dashboard/ai-insight`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setInsight(data);
    } catch (e) {
      setError('AI insight unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInsight(); }, []);

  const sentimentColor = {
    positive: 'text-emerald-300',
    negative: 'text-rose-300',
    neutral: 'text-slate-300'
  }[insight?.sentiment] || 'text-slate-300';

  const sentimentIcon = {
    positive: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    negative: <TrendingDown className="w-4 h-4 text-rose-400" />,
    neutral: <Zap className="w-4 h-4 text-amber-400" />
  }[insight?.sentiment] || null;

  return (
    <div className="ai-insight-card animate-pulse-violet p-4 animate-slide-up animate-slide-up-delay-4 md:h-full md:min-h-0 flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-300" />
          </div>
          <div>
            <p className="text-violet-300 text-[10px] font-bold uppercase tracking-widest">Groq AI · Revenue Analyst</p>
            <p className="text-white text-xs font-semibold">Smart Business Insight</p>
          </div>
        </div>
        <button
          onClick={() => fetchInsight(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          title="Refresh AI insight"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Scrollable Content Wrapper */}
      <div className="flex-1 overflow-y-auto pr-1 relative z-10 compact-scroll min-h-0 my-2">
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <div className="flex gap-1">
              <span className="thinking-dot w-2 h-2 rounded-full bg-violet-400" />
              <span className="thinking-dot w-2 h-2 rounded-full bg-violet-400" />
              <span className="thinking-dot w-2 h-2 rounded-full bg-violet-400" />
            </div>
            <span className="text-violet-300 text-xs font-medium">Analyzing revenue data with Groq LLM...</span>
          </div>
        ) : error ? (
          <p className="text-slate-400 text-xs py-3">{error}</p>
        ) : insight ? (
          <div className="space-y-3">
            {/* Metric highlight badge */}
            {insight.metric_highlight && insight.metric_highlight !== '—' && (
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5">
                {sentimentIcon}
                <span className={`text-xs font-bold ${sentimentColor}`}>{insight.metric_highlight}</span>
              </div>
            )}
            {/* Main insight */}
            <p className="text-slate-200 text-xs leading-relaxed font-medium bg-slate-900/40 p-3 rounded-xl border border-white/5">{insight.insight}</p>
            {/* Recommended action */}
            {insight.action && (
              <div className="flex items-start gap-2 bg-teal-500/10 border border-teal-500/20 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                <p className="text-teal-300 text-[11px] font-semibold leading-relaxed">{insight.action}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Powered by badge */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 relative z-10 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-455 animate-pulse" />
          <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Powered by Groq · Llama 3.3 70B</span>
        </div>
        <span className="text-slate-500 text-[8px] font-bold bg-white/5 rounded px-1.5 py-0.5">Real-time Analysis</span>
      </div>
    </div>
  );
}

/* ── Main DashboardTab ─────────────────────────────────────── */
export default function DashboardTab({ metrics, metricsError, API_BASE, fetchReceiptDetails }) {
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartView, setChartView] = useState('count');
  const [highlightedCard, setHighlightedCard] = useState('all');
  const [exportLoading, setExportLoading] = useState(null);

  // Count-up values
  const animPatients = useCountUp(metrics?.total_patients, 1000, !!metrics);
  const animRevenue = useCountUp(metrics?.total_revenue, 1300, !!metrics);
  const animDues = useCountUp(metrics?.pending_dues, 1100, !!metrics);
  const animToday = useCountUp(metrics?.today_revenue, 1000, !!metrics);

  const filteredTransactions = useMemo(() => {
    if (!metrics) return [];
    return metrics.recent_transactions.filter(tx => {
      const matchesSearch =
        tx.payment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.patient_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMethod = selectedMethod === 'All' || tx.payment_method === selectedMethod;
      const matchesType = selectedType === 'All' || tx.payment_type === selectedType;
      let matchesCard = true;
      if (highlightedCard === 'revenue') matchesCard = tx.payment_type !== 'Refund' && tx.amount > 0;
      else if (highlightedCard === 'refunds') matchesCard = tx.payment_type === 'Refund' || tx.amount < 0;
      else if (highlightedCard === 'advance') matchesCard = tx.payment_type === 'Advance';
      return matchesSearch && matchesMethod && matchesType && matchesCard;
    });
  }, [metrics, searchQuery, selectedMethod, selectedType, highlightedCard]);

  const methodPieData = useMemo(() => {
    if (!metrics) return [];
    return Object.keys(metrics.payment_method_breakdown)
      .map(k => ({ name: k, value: metrics.payment_method_breakdown[k] }))
      .filter(x => x.value > 0);
  }, [metrics]);

  const methodBarData = useMemo(() => {
    if (!metrics) return [];
    return Object.keys(metrics.payment_method_counts).map(k => ({
      method: k,
      Count: metrics.payment_method_counts[k],
      Revenue: metrics.payment_method_breakdown[k] || 0
    }));
  }, [metrics]);

  const toggleCardHighlight = (cardName) => {
    setHighlightedCard(prev => prev === cardName ? 'all' : cardName);
  };

  const downloadReport = async (type) => {
    const token = sessionStorage.getItem('token');
    setExportLoading(type);
    try {
      const res = await fetch(`${API_BASE}/dashboard/reports/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'csv'
        ? `hospisyn_report_${new Date().toISOString().slice(0, 10)}.csv`
        : `hospisyn_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExportLoading(null);
    }
  };

  // ── Error state ──
  if (metricsError) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <p className="text-slate-800 font-bold">Dashboard failed to load</p>
        <p className="text-slate-400 text-sm max-w-sm">{metricsError}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-bold text-teal-600 bg-teal-50 border border-teal-200 px-5 py-2.5 rounded-xl hover:bg-teal-100 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // ── Skeleton loading state ──
  if (!metrics) {
    return (
      <div className="space-y-8">
        {/* KPI skeleton row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map(i => <SkeletonKPI key={i} />)}
        </div>
        {/* AI insight skeleton */}
        <div className="skeleton h-40 rounded-2xl" />
        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart />
          <div className="lg:col-span-2"><SkeletonChart /></div>
        </div>
        {/* Table skeleton */}
        <div className="premium-card p-6">
          <div className="skeleton h-3 w-40 rounded mb-6" />
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex gap-4 mb-4">
              <div className="skeleton h-8 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full md:max-h-full overflow-y-auto md:overflow-hidden min-h-0">

      {/* ── KPI Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">

        {/* Patients */}
        <div
          onClick={() => toggleCardHighlight('advance')}
          className={`premium-card stat-card-teal p-4 cursor-pointer select-none animate-slide-up animate-slide-up-delay-1 ${
            highlightedCard === 'advance' ? 'ring-2 ring-teal-500/30' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Patients Registered</span>
            <div className={`p-1.5 rounded-lg transition-colors ${highlightedCard === 'advance' ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600'}`}>
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight count-reveal">
            {Math.round(animPatients).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span className="font-bold text-teal-600">+{metrics.today_patients}</span> new today
          </div>
        </div>

        {/* Revenue */}
        <div
          onClick={() => toggleCardHighlight('revenue')}
          className={`premium-card stat-card-emerald p-4 cursor-pointer select-none animate-slide-up animate-slide-up-delay-2 ${
            highlightedCard === 'revenue' ? 'ring-2 ring-emerald-500/30' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Revenue</span>
            <div className={`p-1.5 rounded-lg transition-colors ${highlightedCard === 'revenue' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight count-reveal">
            ₹{Math.round(animRevenue).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span className="font-bold text-emerald-600">₹{Math.round(animToday).toLocaleString('en-IN')}</span> collected today
          </div>
        </div>

        {/* Dues */}
        <div className="premium-card stat-card-amber p-4 animate-slide-up animate-slide-up-delay-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Outstanding Dues</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight count-reveal">
            ₹{Math.round(animDues).toLocaleString('en-IN')}
          </div>
          <div className="text-[9px] text-rose-500 mt-1.5 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            Collection pending
          </div>
        </div>

        {/* Collections split */}
        <div
          onClick={() => toggleCardHighlight('refunds')}
          className={`premium-card stat-card-violet p-4 cursor-pointer select-none animate-slide-up animate-slide-up-delay-4 ${
            highlightedCard === 'refunds' ? 'ring-2 ring-violet-500/30' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Today's Split</span>
            <div className={`p-1.5 rounded-lg transition-colors ${highlightedCard === 'refunds' ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-600'}`}>
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Cash</span>
              <span className="font-bold text-slate-800">₹{metrics.cash_collection_today.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Online</span>
              <span className="font-bold text-slate-800">₹{metrics.online_collection_today.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
              <span className="font-bold text-slate-400">Refunds</span>
              <span className="font-bold text-rose-500">-₹{metrics.refund_amount_today.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Workspace Grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:flex-1 md:min-h-0">

        {/* Left Column: Charts & Insight (1/3 width) */}
        <div className="flex flex-col gap-4 md:h-full md:min-h-0 md:overflow-y-auto compact-scroll">
          {/* Pie chart */}
          <div className="premium-card p-4 animate-slide-up flex-shrink-0 flex flex-col justify-between h-[210px] md:h-[220px]">
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <PieIcon className="w-3.5 h-3.5 text-teal-500" />
              <h3 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">Payment Mix</h3>
            </div>
            <div className="flex-1 min-h-0">
              {methodPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodPieData}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={60}
                      paddingAngle={3} dataKey="value"
                    >
                      {methodPieData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                  No revenue data recorded yet
                </div>
              )}
            </div>
          </div>

          {/* AI Insight Card */}
          <div className="md:flex-1 md:min-h-[260px] flex flex-col">
            <AIInsightCard API_BASE={API_BASE} />
          </div>
        </div>

        {/* Right Column: Bar Chart & Ledger (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4 md:h-full md:min-h-0 md:overflow-y-auto compact-scroll">
          {/* Bar chart */}
          <div className="premium-card p-4 flex-shrink-0 flex flex-col h-[210px] md:h-[220px] animate-slide-up animate-slide-up-delay-1">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-teal-500" />
                <h3 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">Method Breakdown</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle */}
                <div className="bg-slate-100 p-0.5 rounded-lg flex">
                  {['count','revenue'].map(v => (
                    <button key={v} type="button"
                      onClick={() => setChartView(v)}
                      className={`text-[9px] font-extrabold px-2 py-1 rounded transition-all ${
                        chartView === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >{v === 'count' ? 'Txn Count' : 'Revenue ₹'}</button>
                  ))}
                </div>
                {/* Export */}
                <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                  <button type="button" onClick={() => downloadReport('csv')} disabled={exportLoading === 'csv'}
                    className="hover:bg-slate-200/60 p-1 rounded text-slate-600 transition-colors disabled:opacity-50" title="CSV Export">
                    {exportLoading === 'csv'
                      ? <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      : <FileText className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => downloadReport('excel')} disabled={exportLoading === 'excel'}
                    className="hover:bg-emerald-100/60 p-1 rounded text-emerald-700 transition-colors disabled:opacity-50" title="Excel Export">
                    {exportLoading === 'excel'
                      ? <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      : <FileSpreadsheet className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodBarData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="method" tickLine={false} axisLine={false}
                    style={{ fontSize: '9px', fontWeight: '700', fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false}
                    style={{ fontSize: '9px', fontWeight: '500', fill: '#cbd5e1' }} />
                  <Tooltip
                    formatter={(v) => [chartView === 'revenue' ? `₹${v.toLocaleString('en-IN')}` : v,
                      chartView === 'revenue' ? 'Revenue' : 'Count']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey={chartView === 'count' ? 'Count' : 'Revenue'}
                    fill={chartView === 'count' ? '#14b8a6' : '#8b5cf6'}
                    radius={[4, 4, 0, 0]} maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Transactions Table ───────────────────────── */}
          <div className="premium-card p-4 md:flex-1 md:min-h-[320px] md:overflow-hidden flex flex-col animate-slide-up animate-slide-up-delay-2">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-teal-500" />
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Collections Ledger</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {filteredTransactions.length} txn{filteredTransactions.length !== 1 ? 's' : ''} shown
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[150px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
                  <input type="text"
                    placeholder="Search patient, txn..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1 text-[10px] font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)} />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                {/* Method */}
                <select
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none focus:border-teal-500 cursor-pointer"
                  value={selectedMethod} onChange={e => setSelectedMethod(e.target.value)}>
                  <option value="All">All Methods</option>
                  {['Cash','UPI','Card','Net Banking','Wallet'].map(m => <option key={m}>{m}</option>)}
                </select>
                {/* Type */}
                <select
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none focus:border-teal-500 cursor-pointer"
                  value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                  <option value="All">All Types</option>
                  {['Advance','Full','Partial','Refund'].map(t => <option key={t}>{t}</option>)}
                </select>
                {/* Clear */}
                {(selectedMethod !== 'All' || selectedType !== 'All' || searchQuery || highlightedCard !== 'all') && (
                  <button type="button"
                    onClick={() => { setSelectedMethod('All'); setSelectedType('All'); setSearchQuery(''); setHighlightedCard('all'); }}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 transition-colors">
                    <X className="w-2.5 h-2.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Active focus banner */}
            {highlightedCard !== 'all' && (
              <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-1.5 flex justify-between items-center text-[10px] font-semibold text-teal-800 mt-2 flex-shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                  Filtered by: <b className="uppercase ml-0.5">{highlightedCard}</b>
                </span>
                <button onClick={() => setHighlightedCard('all')}
                  className="text-teal-655 hover:text-teal-900 font-extrabold uppercase text-[9px] tracking-wider">
                  Reset
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 md:flex-1 md:overflow-y-auto mt-2 min-h-0 compact-scroll">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                    {['Txn ID','Patient','Method','Type','Date/Time','Amount','Receipt'].map((h, i) => (
                      <th key={h} className={`py-2 px-3 ${i === 6 ? 'text-center' : ''} ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTransactions.map((tx, idx) => (
                    <tr key={tx.id}
                      className="hover:bg-slate-50/60 transition-colors animate-slide-up"
                      style={{ animationDelay: `${idx * 15}ms` }}>
                      <td className="py-2 px-3 font-mono font-extrabold text-slate-800 text-[10px]">{tx.payment_id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{tx.patient_name}</td>
                      <td className="py-2 px-3">
                        <span className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-bold">{tx.payment_method}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          tx.payment_type === 'Advance' ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : tx.payment_type === 'Refund' ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>{tx.payment_type}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 font-medium text-[10px]">{tx.payment_date}</td>
                      <td className={`py-2 px-3 text-right font-extrabold ${tx.amount < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
                        {tx.amount < 0 ? '-' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button onClick={() => fetchReceiptDetails(tx.id)}
                          className="text-teal-600 hover:text-teal-800 text-[10px] font-bold inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100 border border-teal-100 px-2 py-1 rounded transition-all">
                          <Printer className="w-3 h-3" /> Print
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-slate-400 font-medium italic text-xs">
                        No transactions match your current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

