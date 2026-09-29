import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Users,
  Stethoscope,
  HeartPulse,
  Shield,
  ShieldCheck,
  Search,
  X,
  User,
  Key,
  ExternalLink,
  Calendar,
  Filter,
  CheckCircle2,
  Briefcase,
  Mail
} from 'lucide-react';

export default function UsersTab({
  staffUsers = [],
  newUserForm,
  setNewUserForm,
  handleCreateStaffUser,
  doctors = [],
  patients = [],
  setActiveTab,
  setSelectedPatient
}) {
  const [activeCategory, setActiveCategory] = useState('staff'); // 'staff' | 'doctor' | 'patient' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Clean categorization
  const isPatientUser = (u) => u.role === 'Patient' || (u.username && u.username.startsWith('PAT-'));
  const isDoctorUser = (u) => u.role === 'Doctor' || (u.username && (u.username.startsWith('dr.') || u.username.startsWith('dr_') || u.username === 'doctor'));
  const isStaffUser = (u) => !isPatientUser(u) && !isDoctorUser(u);

  const staffList = useMemo(() => staffUsers.filter(isStaffUser), [staffUsers]);
  const doctorList = useMemo(() => staffUsers.filter(isDoctorUser), [staffUsers]);
  const patientList = useMemo(() => staffUsers.filter(isPatientUser), [staffUsers]);

  // Format date helper fixing the 1/1/1970 bug
  const formatUserDate = (dateVal) => {
    if (!dateVal) return 'Initial Setup';
    const d = new Date(dateVal);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1970) {
      return 'Initial Setup';
    }
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter current list based on category & search
  const displayedUsers = useMemo(() => {
    let baseList = [];
    if (activeCategory === 'staff') baseList = staffList;
    else if (activeCategory === 'doctor') baseList = doctorList;
    else if (activeCategory === 'patient') baseList = patientList;
    else baseList = staffUsers;

    if (!searchQuery.trim()) return baseList;

    const q = searchQuery.toLowerCase().trim();
    return baseList.filter(u =>
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  }, [activeCategory, staffList, doctorList, patientList, staffUsers, searchQuery]);

  // Match doctor details if available
  const getDoctorDetails = (u) => {
    if (!doctors || doctors.length === 0) return null;
    const cleanUserName = (u.name || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();
    return doctors.find(d => {
      const cleanDocName = (d.name || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();
      return cleanDocName.includes(cleanUserName) || cleanUserName.includes(cleanDocName);
    });
  };

  // Match patient details if available
  const getPatientDetails = (u) => {
    if (!patients || patients.length === 0) return null;
    return patients.find(p => p.patient_id === u.username || p.name === u.name);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Doctor':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Accountant':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Receptionist':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Patient':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch animate-in fade-in duration-300 h-full md:h-full md:max-h-full md:overflow-hidden min-h-0">
      {/* LEFT 2 COLUMNS: USERS DIRECTORY WITH CATEGORY TABS */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:h-full md:overflow-hidden min-h-[350px]">
        {/* TOP SUMMARY STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategory('staff')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeCategory === 'staff'
                ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-400/30 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Hospital Staff</span>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-lg font-black text-slate-900">{staffList.length}</div>
            <div className="text-[10px] text-slate-500 font-medium truncate">Admin, Front-Desk & Accounts</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('doctor')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeCategory === 'doctor'
                ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/30 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Doctors</span>
              <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-lg font-black text-slate-900">{doctorList.length}</div>
            <div className="text-[10px] text-slate-500 font-medium truncate">Clinical OPD Consultants</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('patient')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeCategory === 'patient'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Patient Logins</span>
              <HeartPulse className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-lg font-black text-slate-900">{patientList.length}</div>
            <div className="text-[10px] text-slate-500 font-medium truncate">Digital Health Portals</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-slate-700/30 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1 opacity-80">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Accounts</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className={`text-lg font-black ${activeCategory === 'all' ? 'text-white' : 'text-slate-900'}`}>
              {staffUsers.length}
            </div>
            <div className="text-[10px] opacity-75 font-medium truncate">All System Credentials</div>
          </button>
        </div>

        {/* CATEGORY TABS AND SEARCH ROW */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3 flex-shrink-0">
          {/* CATEGORY PILL TABS */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveCategory('staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'staff'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-600" />
              <span>Staff Accounts</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === 'staff' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {staffList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('doctor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'doctor'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
              <span>Doctors</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === 'doctor' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {doctorList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('patient')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'patient'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-amber-600" />
              <span>Patient Portals</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === 'patient' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {patientList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>All ({staffUsers.length})</span>
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, name, or role..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* SECTION HEADER INFO */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 flex-shrink-0">
          <div>
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              {activeCategory === 'staff' && (
                <>
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Hospital Staff & Operations Accounts ({displayedUsers.length})</span>
                </>
              )}
              {activeCategory === 'doctor' && (
                <>
                  <Stethoscope className="w-4 h-4 text-purple-600" />
                  <span>OPD & Clinical Doctor Logins ({displayedUsers.length})</span>
                </>
              )}
              {activeCategory === 'patient' && (
                <>
                  <HeartPulse className="w-4 h-4 text-amber-600" />
                  <span>Registered Patient Portals & UHID Logins ({displayedUsers.length})</span>
                </>
              )}
              {activeCategory === 'all' && (
                <>
                  <Users className="w-4 h-4 text-slate-700" />
                  <span>All System Credentials ({displayedUsers.length})</span>
                </>
              )}
            </h4>
            <p className="text-slate-400 text-[10px] mt-0.5">
              {activeCategory === 'staff' && 'Accounts authorized for Administrative, Accounting, and Front-Desk duties.'}
              {activeCategory === 'doctor' && 'Clinical practitioners authorized for patient consultations, voice scribe & e-prescriptions.'}
              {activeCategory === 'patient' && 'Self-service portal credentials for patient bills, prescriptions & smart health cards.'}
              {activeCategory === 'all' && 'Master database user credentials list.'}
            </p>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 md:flex-1 md:overflow-y-auto min-h-0 compact-scroll bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                <th className="py-2.5 px-3">Username / Login</th>
                <th className="py-2.5 px-3">Full Name</th>
                {activeCategory === 'doctor' && <th className="py-2.5 px-3">Degree / Specialty</th>}
                {activeCategory === 'patient' && <th className="py-2.5 px-3">Contact & Email</th>}
                <th className="py-2.5 px-3">Role Access</th>
                <th className="py-2.5 px-3">Created Date</th>
                {activeCategory === 'patient' && <th className="py-2.5 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Users className="w-6 h-6 text-slate-300" />
                      <p className="text-xs font-semibold">No accounts found in this category.</p>
                      {searchQuery && <p className="text-[11px] text-slate-400">Try clearing your search query.</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedUsers.map(u => {
                  const docInfo = isDoctorUser(u) ? getDoctorDetails(u) : null;
                  const patInfo = isPatientUser(u) ? getPatientDetails(u) : null;

                  return (
                    <tr key={u.id || u.username} className="hover:bg-slate-50/70 transition-colors">
                      {/* USERNAME */}
                      <td className="py-2 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {isDoctorUser(u) && <Stethoscope className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />}
                          {isPatientUser(u) && <HeartPulse className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                          {isStaffUser(u) && (
                            u.role === 'Admin' ? <Shield className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" /> :
                            u.role === 'Accountant' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> :
                            <Briefcase className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                          )}
                          <span className="font-mono text-[11px] font-bold text-slate-800">{u.username}</span>
                        </div>
                      </td>

                      {/* FULL NAME */}
                      <td className="py-2 px-3 text-slate-800 font-semibold">
                        {u.name || '—'}
                      </td>

                      {/* DOCTOR SPECIFIC COLUMN */}
                      {activeCategory === 'doctor' && (
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {docInfo ? (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-medium border border-purple-100">
                              {docInfo.degree || 'Consultant Specialist'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">OPD Consultant</span>
                          )}
                        </td>
                      )}

                      {/* PATIENT SPECIFIC COLUMN */}
                      {activeCategory === 'patient' && (
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {patInfo ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800">
                                📱 {patInfo.mobile_number || 'No phone'} {patInfo.age ? `• ${patInfo.age}y` : ''}
                              </span>
                              {patInfo.email ? (
                                <span className="text-[10.5px] text-teal-700 flex items-center gap-1 font-mono font-medium">
                                  <Mail className="w-3 h-3 text-teal-600 flex-shrink-0" />
                                  <span className="truncate max-w-[180px]">{patInfo.email}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No email linked</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">UHID Registered</span>
                          )}
                        </td>
                      )}

                      {/* ROLE BADGE */}
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${getRoleBadge(u.role)}`}>
                          {u.role === 'Admin' ? '👑 Admin' :
                           u.role === 'Doctor' ? '🩺 Doctor' :
                           u.role === 'Accountant' ? '💼 Accountant' :
                           u.role === 'Receptionist' ? '📋 Receptionist' :
                           u.role === 'Patient' ? '🧑‍🦽 Patient' : u.role}
                        </span>
                      </td>

                      {/* CREATED DATE (CLEANED UP) */}
                      <td className="py-2 px-3 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatUserDate(u.created_at)}</span>
                        </div>
                      </td>

                      {/* PATIENT ACTION */}
                      {activeCategory === 'patient' && (
                        <td className="py-2 px-3 text-right">
                          {patInfo && setActiveTab && (
                            <button
                              type="button"
                              onClick={() => {
                                if (setSelectedPatient) setSelectedPatient(patInfo);
                                setActiveTab('search_register');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-200 transition-colors cursor-pointer"
                              title="Open Patient Desk"
                            >
                              <span>Desk</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: REGISTER STAFF OR DOCTOR ACCOUNT FORM */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky-form md:h-full md:overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <UserPlus className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Register Staff Account</h3>
              <p className="text-slate-400 text-[10px]">Create new hospital credentials</p>
            </div>
          </div>

          <div className="p-2.5 bg-teal-50/60 border border-teal-100 rounded-xl mb-3 text-[11px] text-teal-900">
            <p className="font-semibold mb-0.5">Role Permission Guidelines:</p>
            <ul className="text-[10px] space-y-0.5 text-teal-800 list-disc list-inside">
              <li><strong>Receptionist:</strong> OPD Desk, Token Queue & Advance Deposits</li>
              <li><strong>Accountant:</strong> Invoices, Settlements, Refunds & Day-End Book</li>
              <li><strong>Doctor:</strong> Clinical Scribe, Prescriptions & Patient Notes</li>
              <li><strong>Admin:</strong> Complete system settings & user accounts</li>
            </ul>
          </div>

          <form onSubmit={handleCreateStaffUser} className="space-y-3">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                Username / Login ID
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                placeholder="e.g. priya_desk or dr_anand"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                Initial Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  required
                />
                <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                Account Role Permission
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-700 cursor-pointer shadow-2xs"
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              >
                <option value="Receptionist">📋 Receptionist (Front-Desk & Registration)</option>
                <option value="Accountant">💼 Accountant (Billing, Payments & Receipts)</option>
                <option value="Doctor">🩺 Doctor (Clinical Desk & Prescriptions)</option>
                <option value="Admin">👑 System Administrator (Full Hospital Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                Staff / Doctor Full Name
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                placeholder="e.g. Ramesh Kumar or Dr. Anand Varma"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-[0.99] mt-2"
            >
              <UserPlus className="w-4 h-4" />
              Create & Save Account
            </button>
          </form>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">
            HospiSynAI Identity & Access Management • Multi-Role RBAC Security
          </p>
        </div>
      </div>
    </div>
  );
}
