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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
      {/* Services catalog list (Left 2 cols) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500">Service Standards & Price Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold text-xs">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Service Item Name</th>
                <th className="py-3 px-4 text-right">Standard Price</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <span className="bg-teal-50 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase border border-teal-100">{s.category}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-950">₹{s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingService(s)}
                      className="text-teal-600 hover:text-teal-800 text-xs font-bold bg-teal-50 px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold bg-rose-50 px-2 py-1 rounded"
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
      <div className="space-y-8">
        {/* Editing Service */}
        {editingService ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Edit Service Standards</h3>
            <form onSubmit={handleUpdateService} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Category</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold text-slate-600"
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
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Service Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Standard Pricing (₹)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-900"
                  value={editingService.price}
                  onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Save Updates
                </button>
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* New Service Form */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-600" />
              Add Standard Service
            </h3>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Category</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold text-slate-600"
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
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Service Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                  placeholder="e.g. Ultrasound Abdomen PA View"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Standard Price (₹)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-900"
                  placeholder="e.g. 1500"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Add to Catalog List
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
