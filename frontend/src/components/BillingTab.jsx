import React from 'react';
import {
  CreditCard,
  CheckCircle,
  RotateCcw,
  Copy
} from 'lucide-react';

export default function BillingTab({
  userRole,
  activeBillForPayment,
  setActiveBillForPayment,
  paymentForm,
  setPaymentForm,
  unpaidBills,
  refundForm,
  setRefundForm,
  handleRecordBillPayment,
  handleIssueRefund
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
      {/* Left 2 Cols: Unpaid Bills Queue & Processing History */}
      <div className="xl:col-span-2 space-y-8">
        {/* Payment Processing Workspace */}
        {activeBillForPayment ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-amber-600 font-bold text-xs uppercase tracking-wider font-sans">Payment Collection Workspace</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Invoice: {activeBillForPayment.bill_id}</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Patient Visit: <b>{activeBillForPayment.visit_id}</b> | Total Billed: <b>₹{activeBillForPayment.grand_total.toLocaleString()}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBillForPayment(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancel Workspace
              </button>
            </div>

            {/* Previous Payments list with copy buttons */}
            {activeBillForPayment.payments && activeBillForPayment.payments.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Previous Transactions / Payments</span>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {activeBillForPayment.payments.map((pay) => (
                    <div key={pay.id} className="flex justify-between items-center bg-white border border-slate-150 rounded-lg p-2 shadow-sm text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 select-all">{pay.payment_id}</span>
                        <span className="text-[10px] text-slate-400 font-sans">({pay.payment_method})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-teal-600 font-sans">₹{pay.amount_paid.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pay.payment_id);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans font-bold px-2 py-1 rounded transition-colors text-[10px] flex items-center gap-1"
                          title="Copy Payment ID"
                        >
                          <Copy className="w-3 h-3 text-slate-500" />
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Details Form */}
            <form onSubmit={handleRecordBillPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Amount to Collect (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-extrabold text-slate-950"
                    max={activeBillForPayment.balance_amount}
                    min="1"
                    value={paymentForm.amount_paid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Remaining balance due: ₹{activeBillForPayment.balance_amount.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Payment Method</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold text-slate-600"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Transaction Reference (UPI/Card Txn ID)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium"
                    placeholder="Reference string"
                    value={paymentForm.transaction_reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Process Payment (Generate Receipt & PDF)
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
            <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-semibold">Select a Patient in Patient Desk tab to create bills, register visits, or select active balance queue invoices to process payments.</p>
          </div>
        )}

        {/* Complete Pending Dues Invoice Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500">Unpaid / Partial Invoices Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold text-xs">
                  <th className="py-3 px-4">Bill ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {unpaidBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-900 font-bold text-xs">{bill.bill_id}</td>
                    <td className="py-3 px-4">{bill.patient_name}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        bill.payment_status === 'Partial Paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>{bill.payment_status}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">₹{bill.grand_total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">₹{bill.balance_amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveBillForPayment(bill);
                          setPaymentForm({
                            amount_paid: bill.balance_amount.toString(),
                            payment_method: 'UPI',
                            transaction_reference: ''
                          });
                        }}
                        className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-teal-100 transition-colors"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {unpaidBills.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">All generated patient invoices are cleared and paid!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Col: Issuing Refunds Panel */}
      <div className="space-y-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            Refund Desk
          </h3>
          <form onSubmit={handleIssueRefund} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Source Transaction ID (PAY-xxx)</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                placeholder="PAY-YYYYMMDD-XXXXX"
                value={refundForm.payment_id}
                onChange={(e) => setRefundForm({ ...refundForm, payment_id: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Refund Amount (₹)</label>
              <input
                type="number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-slate-900"
                placeholder="Amount to return"
                value={refundForm.amount_refunded}
                onChange={(e) => setRefundForm({ ...refundForm, amount_refunded: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Reason for Refund</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium h-20 resize-none"
                placeholder="e.g. Laboratory Test CBC Cancelled by Doctor"
                value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Issue Refund Receipt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
