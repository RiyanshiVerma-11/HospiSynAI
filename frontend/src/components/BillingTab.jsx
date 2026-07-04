import React from 'react';
import {
  CreditCard,
  CheckCircle,
  RotateCcw,
  Copy,
  Search,
  X
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
  handleIssueRefund,
  viewingPayment,
  setViewingPayment,
  STATIC_BASE
}) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredBills = unpaidBills.filter(bill => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    
    const billId = (bill.bill_id || '').toLowerCase();
    const patientName = (bill.patient_name || '').toLowerCase();
    const status = (bill.payment_status || '').toLowerCase();
    const grandTotal = String(bill.grand_total || '');
    const balanceAmount = String(bill.balance_amount || '');
    const dateStr = new Date(bill.created_at).toLocaleDateString().toLowerCase();

    return billId.includes(q) ||
           patientName.includes(q) ||
           status.includes(q) ||
           grandTotal.includes(q) ||
           balanceAmount.includes(q) ||
           dateStr.includes(q);
  });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch animate-in fade-in duration-300 h-full md:h-full md:max-h-full md:overflow-hidden min-h-0">
      {/* Left 2 Cols: Unpaid Bills Queue & Processing History */}
      <div className="lg:col-span-2 flex flex-col gap-4 md:h-full md:min-h-0">
        {/* Payment Processing Workspace */}
        {activeBillForPayment ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300 flex-shrink-0">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <span className="text-amber-600 font-bold text-[10px] uppercase tracking-wider font-sans">Payment Collection Workspace</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">Invoice: {activeBillForPayment.bill_id}</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Patient Visit: <b>{activeBillForPayment.visit_id}</b> | Total Billed: <b>₹{activeBillForPayment.grand_total.toLocaleString()}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBillForPayment(null)}
                className="text-slate-500 hover:text-slate-700 text-[10px] font-bold bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Close Desk
              </button>
            </div>

            {/* Previous Payments list */}
            {activeBillForPayment.payments && activeBillForPayment.payments.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 space-y-2 flex-shrink-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Previous Transactions</span>
                <div className="grid grid-cols-1 gap-1.5 max-h-24 overflow-y-auto">
                  {activeBillForPayment.payments.map((pay) => (
                    <div key={pay.id} className="flex justify-between items-center bg-white border border-slate-150 rounded-lg p-2 shadow-sm text-[10px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 select-all">{pay.payment_id}</span>
                        <span className="text-[9px] text-slate-400 font-sans">({pay.payment_method})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-teal-655 font-sans text-xs">₹{pay.amount_paid.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pay.payment_id);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-sans font-bold px-2 py-0.5 rounded transition-colors text-[9px] flex items-center gap-0.5"
                          title="Copy Payment ID"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Details Form */}
            <form onSubmit={handleRecordBillPayment} className="space-y-3 flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Amount to Collect (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-extrabold text-slate-950"
                    max={activeBillForPayment.balance_amount}
                    min="1"
                    value={paymentForm.amount_paid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                    required
                  />
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">Remaining balance due: ₹{activeBillForPayment.balance_amount.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-600 cursor-pointer"
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
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Transaction Ref (UPI/Card Txn ID)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium"
                    placeholder="Reference string"
                    value={paymentForm.transaction_reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <CheckCircle className="w-4 h-4" />
                Process Payment & Print Receipt
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-xs font-semibold">Select a Patient in Patient Desk tab to build bills, or select active balance queue invoices below to collect payments.</p>
          </div>
        )}

        {/* Complete Pending Dues Invoice Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-3 flex-shrink-0">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Unpaid / Partial Invoices Queue</h3>
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
              <input type="text"
                placeholder="Search Bill ID or Patient..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-7 py-1 text-[10px] font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all text-slate-700"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-650">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100 md:flex-1 md:overflow-y-auto min-h-0 compact-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                  <th className="py-2.5 px-3">Bill ID</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                {filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 text-slate-900 font-bold text-xs">{bill.bill_id}</td>
                    <td className="py-2 px-3">{bill.patient_name}</td>
                    <td className="py-2 px-3 text-slate-450 text-[10px]">{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        bill.payment_status === 'Partial Paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>{bill.payment_status}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">₹{bill.grand_total.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-extrabold text-rose-600">₹{bill.balance_amount.toLocaleString()}</td>
                    <td className="py-2 px-3 text-center">
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
                        className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold px-2.5 py-1.5 rounded transition-all border border-teal-100 shadow-sm"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-450 font-medium italic">
                      {unpaidBills.length === 0 
                        ? "All patient invoices are fully paid and cleared!" 
                        : "No invoices match your search query."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Col: Issuing Refunds Panel OR PDF Receipt Preview */}
      <div className="lg:col-span-1 flex flex-col gap-4 md:h-full md:min-h-0">
        {viewingPayment && viewingPayment.receipt ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm md:h-full flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-shrink-0">
              <span className="text-teal-650 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
                Receipt Preview
              </span>
              <button
                onClick={() => setViewingPayment(null)}
                className="text-slate-500 hover:text-slate-700 text-[10px] font-bold bg-slate-50 border border-slate-200 px-2 py-1 rounded shadow-sm transition-all"
              >
                Close Preview
              </button>
            </div>
            
            <div className="flex-1 min-h-[300px] my-3 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden relative">
              <iframe
                src={`${STATIC_BASE}${viewingPayment.receipt.pdf_path}?t=${Date.now()}`}
                title="Receipt PDF Preview"
                className="w-full h-full border-none"
              />
            </div>

            <div className="flex gap-2 flex-shrink-0 pt-2 border-t border-slate-100">
              <a
                href={`${STATIC_BASE}${viewingPayment.receipt.pdf_path}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl text-center shadow-sm block transition-all"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky-form md:h-full md:overflow-y-auto flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <RotateCcw className="w-4.5 h-4.5 text-rose-600 animate-spin-reverse-slow" />
                Refund Desk
              </h3>
              <p className="text-slate-400 text-[11px] mb-3 font-semibold">Re-verify the receipt details and amount prior to issuing refund payouts.</p>
              <form onSubmit={handleIssueRefund} className="space-y-3">
                <div>
                  <label className="block text-slate-505 text-[10px] font-bold uppercase tracking-wider mb-1">Source Transaction ID (PAY-xxx)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                    placeholder="PAY-YYYYMMDD-XXXXX"
                    value={refundForm.payment_id}
                    onChange={(e) => setRefundForm({ ...refundForm, payment_id: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-505 text-[10px] font-bold uppercase tracking-wider mb-1">Refund Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-slate-900"
                    placeholder="Amount to return"
                    value={refundForm.amount_refunded}
                    onChange={(e) => setRefundForm({ ...refundForm, amount_refunded: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-505 text-[10px] font-bold uppercase tracking-wider mb-1">Reason for Refund</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium h-20 resize-none"
                    placeholder="e.g. Laboratory Test cancelled by consulting physician"
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Issue Refund Receipt
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

