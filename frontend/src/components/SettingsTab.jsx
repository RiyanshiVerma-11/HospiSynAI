import React from 'react';
import { CheckCircle, PlusCircle } from 'lucide-react';

export default function SettingsTab({
  adminSettingsForm,
  setAdminSettingsForm,
  doctors,
  editingDoctor,
  setEditingDoctor,
  newDoctor,
  setNewDoctor,
  handleSaveSettings,
  handleDeleteDoctor,
  handleUpdateDoctor,
  handleAddDoctor
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch animate-in fade-in duration-300 h-full md:h-screen md:max-h-[calc(100vh-6.5rem)] md:overflow-hidden min-h-0 pb-2">
      {/* Receipt Branding configurations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm md:h-full md:overflow-y-auto flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-2">Receipt Template Customization</h3>
          <p className="text-slate-500 text-[10px] mb-3">Modify receipt layout attributes dynamically. Modifying these settings will immediately alter the logo text, header columns, doctor details, and payment lines printed on patient PDF receipts without modifying code.</p>
          
          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                  value={adminSettingsForm.hospital_name || ''}
                  onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, hospital_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Logo Text / Sub-tagline</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium"
                  value={adminSettingsForm.logo_text || ''}
                  onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, logo_text: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Doctor Name (Left Block)</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                  value={adminSettingsForm.doctor_name || ''}
                  onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, doctor_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Branding Qualifications</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-16 resize-none"
                  value={adminSettingsForm.doctor_degree || ''}
                  onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, doctor_degree: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Address details (Right Block)</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-16 resize-none"
                  value={adminSettingsForm.collection_centre || ''}
                  onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, collection_centre: e.target.value })}
                />
              </div>

              <div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Hospital Tel / Contact Number</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-semibold"
                      value={adminSettingsForm.contact_number || ''}
                      onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, contact_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">GST Registration Number</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-mono"
                      value={adminSettingsForm.gst_number || ''}
                      onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, gst_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-teal-500 hover:bg-teal-650 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs self-start"
            >
              <CheckCircle className="w-4 h-4" />
              Apply Branding
            </button>
          </form>

          {/* Live PDF Receipt Preview */}
          <div className="mt-5 pt-5 border-t border-slate-150">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Live Receipt Template Preview</h4>
                <p className="text-slate-400 text-[9px] mt-0.5">Real-time A5 Landscape layout visualization (what prints on patient PDFs)</p>
              </div>
              <span className="bg-teal-50 text-teal-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-teal-100 animate-pulse">Live Preview</span>
            </div>

            <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-200/80 flex justify-center">
              {/* Paper Mockup */}
              <div className="w-full max-w-[540px] bg-white border border-slate-300 shadow-sm rounded-lg p-4 font-sans text-slate-700 flex flex-col justify-between aspect-[1.414] select-none">
                {/* Letterhead Header */}
                <div className="grid grid-cols-3 gap-2 items-start pb-2 border-b border-dashed border-slate-200">
                  {/* Left Block: Doctor Details */}
                  <div className="text-left leading-normal">
                    <p className="font-bold text-slate-900 text-[9px]">{adminSettingsForm.doctor_name || 'Dr. Shweta Grover'}</p>
                    <div className="text-slate-505 text-[7px] whitespace-pre-line leading-snug font-medium mt-0.5">
                      {adminSettingsForm.doctor_degree || 'MBBS, MD (Pathology), PhD\nConsultant Pathologist'}
                    </div>
                  </div>

                  {/* Center Block: Hospital Logo & Name */}
                  <div className="text-center flex flex-col items-center">
                    <svg className="w-9 h-5 text-teal-700 mb-0.5" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 5L20 25L30 15L40 25L50 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="font-black text-teal-700 text-[9.5px] leading-none uppercase tracking-wide">{adminSettingsForm.hospital_name || 'Vedam Diagnostics'}</p>
                    <p className="text-slate-400 text-[5.5px] leading-tight mt-0.5 italic font-medium">{adminSettingsForm.logo_text || 'Sincere Care...'}</p>
                  </div>

                  {/* Right Block: Address details */}
                  <div className="text-right leading-snug text-slate-505 text-[7px] font-medium font-sans">
                    <div className="whitespace-pre-line">
                      {adminSettingsForm.collection_centre || 'Collection Centre:\n4 Harilok, Dhanvantari Saket Road, Meerut'}
                    </div>
                    {adminSettingsForm.contact_number && <p className="mt-0.5">Tel: {adminSettingsForm.contact_number}</p>}
                    {adminSettingsForm.gst_number && <p>GSTIN: {adminSettingsForm.gst_number}</p>}
                  </div>
                </div>

                {/* Receipt Subheader Bar */}
                <div className="flex justify-between items-center py-1.5 border-t border-b border-slate-100 mt-1.5 text-[7.5px] font-bold text-slate-500">
                  <span><b>Dated:</b> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} 10:30 AM</span>
                  <span className="font-black text-teal-700 text-[8.5px] uppercase tracking-wider">Advance Receipt</span>
                  <span><b>No:</b> PAY-20260704-00128</span>
                </div>

                {/* Fields Block */}
                <div className="space-y-3 my-3 flex-1 text-[8.5px]">
                  <div className="flex items-end gap-1.5">
                    <span className="font-bold text-slate-400 whitespace-nowrap">Received with thanks from</span>
                    <span className="flex-1 font-bold text-slate-800 border-b border-slate-200 pb-0.5 leading-none">Jane Doe (Female, 32 Yrs) [ID: PT-84920]</span>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="font-bold text-slate-400 whitespace-nowrap">A sum of Rupees</span>
                    <span className="flex-1 font-bold text-slate-800 border-b border-slate-200 pb-0.5 leading-none">Five Thousand Rupees Only</span>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="font-bold text-slate-400 whitespace-nowrap">As</span>
                    <span className="flex-1 text-slate-700 border-b border-slate-200 pb-0.5 leading-none font-medium">UPI (Ref: UPI9823748293) as Advance for Visit: VS-20260704-0001 (Routine Checkup)</span>
                  </div>
                </div>

                {/* Footer Box */}
                <div className="flex justify-between items-end mt-1">
                  {/* Amount Box */}
                  <div className="bg-slate-50 border border-teal-600 rounded-md px-3 py-1.5 text-teal-700 font-extrabold text-[12px] shadow-sm leading-none flex items-center justify-center">
                    Rs. 5,000.00
                  </div>
                  {/* Dues statement */}
                  <div className="text-[7.5px] text-rose-600 font-bold text-center leading-normal max-w-[200px] bg-rose-50 border border-rose-100 rounded px-2 py-1">
                    Total Billed: ₹7,500.00  |  Paid: ₹5,000.00  |  Dues: ₹2,500.00
                  </div>
                  {/* Signature */}
                  <div className="text-right flex flex-col items-center">
                    <div className="w-24 border-t border-slate-300 pt-1 text-[7.5px] font-bold text-slate-500 uppercase text-center">
                      Authorized Signature
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Manage Doctors Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm md:h-full md:overflow-y-auto flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">Consulting Doctors Directory</h3>
          <p className="text-slate-500 text-[10px] mb-3">Add, view, edit or remove consulting doctors active in the hospital. These doctors will be available in the visit pop-up selection when registering patient entries.</p>

          <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-48 overflow-y-auto compact-scroll flex-shrink-0">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-455 font-bold uppercase tracking-wider text-[9px]">
                <tr>
                  <th className="px-3 py-2">Doctor Name</th>
                  <th className="px-3 py-2">Qualifications</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-3 py-6 text-center text-slate-400 italic">No doctors configured.</td>
                  </tr>
                ) : (
                  doctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-bold text-slate-950">{doc.name}</td>
                      <td className="px-3 py-2 whitespace-pre-line text-slate-500 text-[11px]">{doc.degree}</td>
                      <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingDoctor(doc)}
                          className="text-teal-600 hover:text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoctor(doc.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-slate-150 pt-3">
          {editingDoctor ? (
            <div className="border border-slate-200 rounded-xl p-3 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Edit Doctor Details</h4>
              <form onSubmit={handleUpdateDoctor} className="space-y-3">
                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Doctor Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                    value={editingDoctor.name}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Qualifications / Degree (Multiline)</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-16 resize-none"
                    value={editingDoctor.degree}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, degree: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs py-1.5 rounded shadow transition-all"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDoctor(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-xs py-1.5 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-3 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Add New Doctor</h4>
              <form onSubmit={handleAddDoctor} className="space-y-3">
                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Doctor Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Qualifications / Degree</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-16 resize-none"
                    placeholder="e.g. MBBS, MD (General Medicine)&#10;Consultant Cardiologist"
                    value={newDoctor.degree}
                    onChange={(e) => setNewDoctor({ ...newDoctor, degree: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs py-1.5 rounded shadow transition-all"
                >
                  Add Doctor
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
