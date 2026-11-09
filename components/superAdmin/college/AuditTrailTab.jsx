'use client';

import {
  HiOutlineRefresh,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';

export default function AuditTrailTab({
  auditLogs = [],
  loadingAudit = false,
  onRefresh,
}) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Entitlement & Subscription Audit Trail</h3>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">
            Immutable, append-only history of plan changes, status updates, and feature overrides for this college.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loadingAudit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
        >
          <HiOutlineRefresh size={14} className={loadingAudit ? 'animate-spin' : ''} />
          Refresh Logs
        </button>
      </div>

      {loadingAudit ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06]">
          <CollegesHubLoader size="sm" text="Loading audit history..." minHeight="min-h-[140px]" />
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
          <HiOutlineDocumentText size={32} className="mx-auto text-slate-300 dark:text-white/20" />
          <p className="text-sm font-bold text-slate-700 dark:text-white/70">No Audit Events Recorded</p>
          <p className="text-xs text-slate-400 dark:text-white/40">
            Any plan modifications, status changes, or feature overrides will be permanently logged here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-white/40 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">State Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {auditLogs.map(log => {
                  let badge = { label: log.action, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
                  if (log.action === 'plan_change') {
                    badge = { label: 'Plan Change', bg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' };
                  } else if (log.action === 'feature_override') {
                    badge = { label: 'Feature Override', bg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' };
                  } else if (log.action === 'status_change') {
                    badge = { label: 'Status Change', bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' };
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-white/60">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-white/80 font-medium">
                        {log.actorId ? `User (${log.actorId.slice(0, 8)}...)` : 'Super Admin / System'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-white/60 max-w-xs truncate">
                        {log.reason || <span className="text-slate-400 italic">None provided</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-white/60 font-mono text-[11px]">
                        {log.action === 'plan_change' ? (
                          <span>
                            <span className="line-through text-slate-400">{log.before?.plan || 'none'}</span>
                            {' → '}
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{log.after?.plan}</span>
                          </span>
                        ) : log.action === 'status_change' ? (
                          <span>
                            <span className="line-through text-slate-400">{log.before?.status || 'none'}</span>
                            {' → '}
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{log.after?.status}</span>
                          </span>
                        ) : (
                          <details className="cursor-pointer">
                            <summary className="text-indigo-600 dark:text-indigo-400 hover:underline">View details</summary>
                            <pre className="mt-1 p-2 rounded bg-slate-100 dark:bg-black/30 text-[10px] max-w-md overflow-x-auto">
                              {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

