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
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      {/* Receipt Branding configurations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-lg mb-4">Receipt Template Customization Panel</h3>
        <p className="text-slate-500 text-xs mb-6">Modify receipt layout attributes dynamically. Modifying these settings will immediately alter the logo text, header columns, doctor details, and payment lines printed on patient PDF receipts without modifying code.</p>
        
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Hospital / Clinic Name</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                value={adminSettingsForm.hospital_name || ''}
                onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, hospital_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Logo Text / Sub-tagline</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-medium"
                value={adminSettingsForm.logo_text || ''}
                onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, logo_text: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Doctor Name (Left Header Block)</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                value={adminSettingsForm.doctor_name || ''}
                onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, doctor_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Doctor Qualifications (Multiline Text)</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-24 resize-none"
                value={adminSettingsForm.doctor_degree || ''}
                onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, doctor_degree: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Address details (Right Header Block)</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-24 resize-none"
                value={adminSettingsForm.collection_centre || ''}
                onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, collection_centre: e.target.value })}
              />
            </div>

            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Hospital Tel / Contact Number</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold"
                    value={adminSettingsForm.contact_number || ''}
                    onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, contact_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">GST Registration Number</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-mono"
                    value={adminSettingsForm.gst_number || ''}
                    onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, gst_number: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Apply Branding Configurations
          </button>
        </form>
      </div>

      {/* Manage Doctors Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-lg mb-2">Hospital Doctors Directory</h3>
        <p className="text-slate-500 text-xs mb-6">Add, view, edit or remove consulting doctors active in the hospital. These doctors will be available in the visit pop-up selection when registering patient entries.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Doctors List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Doctor Name</th>
                    <th className="px-4 py-3">Qualifications / Degree</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">No doctors configured. Please add one using the form on the right.</td>
                    </tr>
                  ) : (
                    doctors.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-950">{doc.name}</td>
                        <td className="px-4 py-3 whitespace-pre-line text-slate-600">{doc.degree}</td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setEditingDoctor(doc)}
                            className="text-teal-600 hover:text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoctor(doc.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded transition-colors"
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

          {/* Right column: Form */}
          <div>
            {editingDoctor ? (
              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Edit Doctor Details</h4>
                <form onSubmit={handleUpdateDoctor} className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Doctor Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                      value={editingDoctor.name}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Qualifications / Degree (Multiline)</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-24 resize-none"
                      value={editingDoctor.degree}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, degree: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs py-2 rounded shadow transition-all"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDoctor(null)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Add New Doctor</h4>
                <form onSubmit={handleAddDoctor} className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Doctor Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                      placeholder="e.g. Dr. Rajesh Kumar"
                      value={newDoctor.name}
                      onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Qualifications / Degree</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-24 resize-none"
                      placeholder="e.g. MBBS, MD (General Medicine)&#10;Consultant Cardiologist"
                      value={newDoctor.degree}
                      onChange={(e) => setNewDoctor({ ...newDoctor, degree: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs py-2 rounded shadow transition-all"
                  >
                    Add Doctor
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
