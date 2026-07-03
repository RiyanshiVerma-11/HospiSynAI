import React from 'react';
import { UserPlus } from 'lucide-react';

export default function UsersTab({
  staffUsers,
  newUserForm,
  setNewUserForm,
  handleCreateStaffUser
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch animate-in fade-in duration-300 h-full md:h-screen md:max-h-[calc(100vh-6.5rem)] md:overflow-hidden min-h-0 pb-2">
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:h-full md:overflow-hidden min-h-[300px]">
        <h3 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider text-slate-500 flex-shrink-0">Active Hospital User List</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100 md:flex-1 md:overflow-y-auto min-h-0 compact-scroll">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-450 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Role Access</th>
                <th className="py-2.5 px-3">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
              {staffUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2 px-3 font-bold text-slate-900">{u.username}</td>
                  <td className="py-2 px-3">{u.name}</td>
                  <td className="py-2 px-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      u.role === 'Accountant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-sky-50 text-sky-700 border border-sky-100'
                    }`}>{u.role}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[10px]">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky-form md:h-full md:overflow-y-auto flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5 flex-shrink-0">
            <UserPlus className="w-4.5 h-4.5 text-teal-600" />
            Register Staff Account
          </h3>
          <p className="text-slate-400 text-[11px] mb-3 flex-shrink-0">Allocate standard credentials and role controls for staff.</p>
          <form onSubmit={handleCreateStaffUser} className="space-y-3">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                placeholder="e.g. ramesh_desk"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                placeholder="••••••••"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-505 text-[10px] font-bold uppercase tracking-wider mb-1">Staff Role Permission</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-655 cursor-pointer"
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              >
                <option value="Receptionist">Receptionist (Front-Desk Desk)</option>
                <option value="Accountant">Accountant (Payments & Receipts)</option>
                <option value="Admin">System Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-505 text-[10px] font-bold uppercase tracking-wider mb-1">Staff Full Name</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                placeholder="e.g. Ramesh Kumar"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              Save User Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
