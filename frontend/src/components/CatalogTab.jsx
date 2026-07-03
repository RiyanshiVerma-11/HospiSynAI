import React from 'react';
import { PlusCircle } from 'lucide-react';

export default function CatalogTab({
  services,
  editingService,
  setEditingService,
  newService,
  setNewService,
  handleDeleteService,
  handleUpdateService,
  handleAddService
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch animate-in fade-in duration-300 h-full md:h-screen md:max-h-[calc(100vh-6.5rem)] md:overflow-hidden min-h-0 pb-2">
      {/* Services catalog list (Left 2 cols) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:h-full md:overflow-hidden min-h-[300px]">
        <h3 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider text-slate-500 flex-shrink-0">Service Standards & Price Table</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100 md:flex-1 md:overflow-y-auto min-h-0 compact-scroll">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-455 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Service Item Name</th>
                <th className="py-2.5 px-3 text-right">Standard Price</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2 px-3">
                    <span className="bg-teal-50 text-teal-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-teal-100">{s.category}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-900 font-semibold">{s.name}</td>
                  <td className="py-2 px-3 text-right font-extrabold text-slate-950">₹{s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 px-3 text-center space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditingService(s)}
                      className="text-teal-600 hover:text-teal-800 text-[10px] font-bold bg-teal-50 px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id)}
                      className="text-rose-600 hover:text-rose-800 text-[10px] font-bold bg-rose-50 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Form container (Right col) */}
      <div className="lg:col-span-1 flex flex-col gap-4 md:h-full md:min-h-0">
        {/* Editing Service */}
        {editingService ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky-form md:h-full md:overflow-y-auto flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Edit Service Standards</h3>
              <p className="text-slate-400 text-[11px] mb-3">Modify name or billing price for catalog item.</p>
              <form onSubmit={handleUpdateService} className="space-y-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-600 cursor-pointer"
                    value={editingService.category}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  >
                    <option value="Doctor Consultation">Doctor Consultation</option>
                    <option value="OPD Charges">OPD Charges</option>
                    <option value="IPD Charges">IPD Charges</option>
                    <option value="ICU Charges">ICU Charges</option>
                    <option value="Laboratory Tests">Laboratory Tests</option>
                    <option value="Radiology/X-Ray/MRI">Radiology/X-Ray/MRI</option>
                    <option value="Pharmacy/Medicines">Pharmacy/Medicines</option>
                    <option value="Other Hospital Services">Other Hospital Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Service Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Standard Pricing (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-900"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded-xl shadow-sm transition-all text-xs"
                  >
                    Save Updates
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingService(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-3 rounded-xl transition-all text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* New Service Form */
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky-form md:h-full md:overflow-y-auto flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                <PlusCircle className="w-4.5 h-4.5 text-teal-600" />
                Add Standard Service
              </h3>
              <p className="text-slate-400 text-[11px] mb-3">Introduce a standard clinic service to catalog.</p>
              <form onSubmit={handleAddService} className="space-y-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-600 cursor-pointer"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  >
                    <option value="Doctor Consultation">Doctor Consultation</option>
                    <option value="OPD Charges">OPD Charges</option>
                    <option value="IPD Charges">IPD Charges</option>
                    <option value="ICU Charges">ICU Charges</option>
                    <option value="Laboratory Tests">Laboratory Tests</option>
                    <option value="Radiology/X-Ray/MRI">Radiology/X-Ray/MRI</option>
                    <option value="Pharmacy/Medicines">Pharmacy/Medicines</option>
                    <option value="Other Hospital Services">Other Hospital Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-505 text-[10px] font-bold uppercase tracking-wider mb-1">Service Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                    placeholder="e.g. Ultrasound Abdomen"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Standard Price (₹)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-900"
                    placeholder="e.g. 1500"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add to Catalog List
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
