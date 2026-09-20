import React, { useState, useMemo } from 'react';
import { PlusCircle, Search, Filter, X } from 'lucide-react';

const SERVICE_CATEGORIES = [
  "Doctor Consultation",
  "OPD Charges",
  "IPD Charges",
  "ICU Charges",
  "Laboratory Tests",
  "Radiology/X-Ray/MRI",
  "Pharmacy/Medicines",
  "Other Hospital Services"
];

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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    (services || []).forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return (services || []).filter(s => {
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      const matchSearch = !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch animate-in fade-in duration-300 h-full md:h-full md:max-h-full md:overflow-hidden min-h-0">
      {/* Services catalog list (Left 2 cols) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:h-full md:overflow-hidden min-h-[300px]">
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Service Standards & Price Table</h3>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full">
                {filteredServices.length} {filteredServices.length === 1 ? 'Service' : 'Services'}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">
              Standardized hospital procedures, OPD consults, and investigation charges
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[130px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {(selectedCategory !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-xl border border-rose-200/60 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 md:flex-1 md:overflow-y-auto min-h-0 compact-scroll">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10">
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1">
                      <Filter className="w-2.5 h-2.5 text-teal-600" />
                      <span>Category</span>
                    </span>
                    <select
                      className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-teal-500 shadow-2xs"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      title="Filter by category"
                    >
                      <option value="All">All ({services.length})</option>
                      {SERVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat} ({categoryCounts[cat] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="py-2.5 px-3">Service Item Name</th>
                <th className="py-2.5 px-3 text-right">Standard Price</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
              {filteredServices.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="bg-teal-50 text-teal-800 text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-teal-100">{s.category}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-900 font-bold">{s.name}</td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-950">₹{s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-3 text-center space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditingService(s)}
                      className="text-teal-700 hover:text-teal-900 text-[10px] font-black bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-100 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id)}
                      className="text-rose-600 hover:text-rose-800 text-[10px] font-black bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400 font-medium text-xs">
                    No services found for category <b className="text-slate-600">"{selectedCategory}"</b>
                    {searchQuery && ` matching "${searchQuery}"`}.
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                        className="text-teal-600 hover:underline font-bold text-xs cursor-pointer"
                      >
                        Show All Categories
                      </button>
                    </div>
                  </td>
                </tr>
              )}
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
