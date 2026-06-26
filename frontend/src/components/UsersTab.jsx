import React from 'react';
import { UserPlus } from 'lucide-react';

export default function UsersTab({
  staffUsers,
  newUserForm,
  setNewUserForm,
  handleCreateStaffUser
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500">Active Hospital User List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs">
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Role Access</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {staffUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.username}</td>
                  <td className="py-3 px-4">{u.name}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      u.role === 'Accountant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-sky-50 text-sky-700 border border-sky-100'
                    }`}>{u.role}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-teal-600" />
          Register Staff Account
        </h3>
        <form onSubmit={handleCreateStaffUser} className="space-y-4">
          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
              placeholder="e.g. ramesh_desk"
              value={newUserForm.username}
              onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
              placeholder="••••••••"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Staff Role Permission</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold text-slate-600"
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
            >
              <option value="Receptionist">Receptionist (Front-Desk Desk)</option>
              <option value="Accountant">Accountant (Payments & Receipts)</option>
              <option value="Admin">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Staff Full Name</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
              placeholder="e.g. Ramesh Kumar"
              value={newUserForm.name}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Save User Account
          </button>
        </form>
      </div>
    </div>
  );
}
