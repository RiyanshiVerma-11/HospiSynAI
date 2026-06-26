import React from 'react';

export default function AuditLogsTab({ auditLogs }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-300">
      <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500">Security & Operational Logs Audit Table</h3>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-semibold text-xs sticky top-0 bg-white z-10">
              <th className="py-3 px-4">Log ID</th>
              <th className="py-3 px-4">Staff User</th>
              <th className="py-3 px-4">Action Token</th>
              <th className="py-3 px-4">Entity Table</th>
              <th className="py-3 px-4">Entity ID</th>
              <th className="py-3 px-4">Execution Timestamp</th>
              <th className="py-3 px-4">Operation Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {auditLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 text-slate-400 font-bold text-xs">{log.id}</td>
                <td className="py-3 px-4 text-slate-950 font-bold">{log.user_name}</td>
                <td className="py-3 px-4">
                  <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded-md font-bold text-xs">{log.action}</span>
                </td>
                <td className="py-3 px-4 text-slate-500 font-mono text-xs">{log.target_table}</td>
                <td className="py-3 px-4 text-slate-500 font-mono text-xs">{log.target_id}</td>
                <td className="py-3 px-4 text-slate-400 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                <td className="py-3 px-4 text-slate-600 font-normal max-w-xs truncate" title={log.details}>{log.details}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">No actions recorded in audit trail.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
