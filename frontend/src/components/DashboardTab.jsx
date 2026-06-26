import React from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  FileText,
  FileSpreadsheet,
  Printer
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

export default function DashboardTab({ metrics, API_BASE, fetchReceiptDetails }) {
  if (!metrics) {
    return (
      <div className="py-12 text-center text-slate-400">
        Loading analytics metrics...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Patients Registered</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics.total_patients}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">+{metrics.today_patients}</span> registered today
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">₹{metrics.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">₹{metrics.today_revenue.toLocaleString('en-IN')}</span> collection today
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Outstanding Dues</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-950">₹{metrics.pending_dues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-rose-500 mt-2 font-semibold">
            Actionable dues collection queue active
          </div>
        </div>

        {/* Collection splits */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Today's Splits</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Cash Collection:</span>
              <span className="font-bold text-slate-900">₹{metrics.cash_collection_today.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Online Collection:</span>
              <span className="font-bold text-slate-900">₹{metrics.online_collection_today.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Refunds Issued:</span>
              <span className="font-bold text-rose-600">₹{metrics.refund_amount_today.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizer Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method distribution Pie */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider text-slate-500">Payment Methods Share</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.keys(metrics.payment_method_breakdown).map(k => ({
                    name: k,
                    value: metrics.payment_method_breakdown[k]
                  })).filter(x => x.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.keys(metrics.payment_method_breakdown).map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={['#0d9488', '#0284c7', '#4f46e5', '#f59e0b', '#ec4899'][idx % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions volume count Bar chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-500">Transactions Count per Method</h3>
            <div className="flex gap-2">
              <a
                href={`${API_BASE}/dashboard/reports/csv`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                title="Export transactions report to CSV format"
              >
                <FileText className="w-3.5 h-3.5" />
                CSV Report
              </a>
              <a
                href={`${API_BASE}/dashboard/reports/excel`}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                title="Export transactions report to Excel format"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel Report
              </a>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.keys(metrics.payment_method_counts).map(k => ({
                  method: k,
                  Count: metrics.payment_method_counts[k]
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Count" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transaction Log */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider text-slate-500">Recent Transactions (Real-Time)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold text-xs">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date/Time</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {metrics.recent_transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-900 font-bold text-xs">{tx.payment_id}</td>
                  <td className="py-3 px-4">{tx.patient_name}</td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded-md font-semibold">{tx.payment_method}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                      tx.payment_type === 'Advance' ? 'bg-sky-50 text-sky-700' :
                      tx.payment_type === 'Refund' ? 'bg-rose-50 text-rose-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>{tx.payment_type}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{tx.payment_date}</td>
                  <td className={`py-3 px-4 text-right font-extrabold ${tx.amount < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {tx.amount < 0 ? '-' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => fetchReceiptDetails(tx.id)}
                      className="text-teal-600 hover:text-teal-800 text-xs font-bold inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {metrics.recent_transactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No transactions recorded yet today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
