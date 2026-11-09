'use client';

import PlanBadge from '@/components/common/PlanBadge';
import Icon from '@/components/Icon';
import {
  HiOutlineMail,
  HiOutlineRefresh,
  HiOutlineBan,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

export default function InvitationsTable({
  filteredInvitations = [],
  onOpenInviteModal,
  onResend,
  onCancel,
  onCopy,
  copied,
}) {
  if (filteredInvitations.length === 0) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center size-12 rounded-2xl bg-b-surface1 text-t-tertiary">
          <HiOutlineMail size={24} />
        </div>
        <p className="text-sub-title-1 font-bold text-t-primary">
          No invitations found
        </p>
        <p className="mt-1 text-body-2 text-t-secondary max-w-sm mx-auto">
          Generate single-use token invitations for new institutions to self-onboard.
        </p>
        <button
          type="button"
          onClick={onOpenInviteModal}
          className="btn-primary text-caption mt-4 inline-flex items-center gap-2 cursor-pointer"
        >
          <Icon name="plus" className="!size-4 fill-white" />
          <span>Invite First College</span>
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse table-auto">
        <thead>
          <tr className="border-b border-s-subtle text-caption font-semibold text-t-tertiary uppercase tracking-wider bg-b-depth2/50">
            <th className="py-3.5 pl-6 pr-4 min-w-[240px] text-left">Official Email</th>
            <th className="py-3.5 px-3 w-36 shrink-0 text-left whitespace-nowrap">Selected Plan</th>
            <th className="py-3.5 px-3 w-32 shrink-0 text-left whitespace-nowrap">Status</th>
            <th className="py-3.5 px-3 w-44 shrink-0 text-left whitespace-nowrap">Expires At</th>
            <th className="py-3.5 pl-3 pr-6 w-36 shrink-0 text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-s-subtle text-body-2">
          {filteredInvitations.map((inv) => {
            const invId = inv._id || inv.id;
            return (
              <tr
                key={invId}
                className="hover:bg-b-highlight transition-colors"
              >
                <td className="py-4 pl-6 pr-4 min-w-[240px]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-9 rounded-xl bg-b-surface1 border border-s-subtle text-t-secondary shrink-0">
                      <HiOutlineMail size={16} />
                    </div>
                    <span className="font-semibold text-t-primary text-sub-title-2">
                      {inv.email}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-3 w-36 shrink-0 whitespace-nowrap">
                  <PlanBadge plan={inv.planId || 'starter'} />
                </td>

                <td className="py-4 px-3 w-32 shrink-0 whitespace-nowrap">
                  <span
                    className={`label capitalize ${
                      inv.status === 'accepted'
                        ? 'label-green'
                        : inv.status === 'pending'
                        ? 'label-yellow'
                        : 'label-red'
                    }`}
                  >
                    {inv.status === 'accepted' && (
                      <HiOutlineCheckCircle size={13} />
                    )}
                    {inv.status === 'pending' && (
                      <HiOutlineClock size={13} />
                    )}
                    {inv.status === 'expired' && (
                      <HiOutlineExclamationCircle size={13} />
                    )}
                    {inv.status === 'cancelled' && (
                      <HiOutlineBan size={13} />
                    )}
                    <span>{inv.status}</span>
                  </span>
                </td>

                <td className="py-4 px-3 w-44 shrink-0 whitespace-nowrap text-caption font-mono tabular-nums text-t-secondary">
                  {inv.expiresAt
                    ? new Date(inv.expiresAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>

                <td className="py-4 pl-3 pr-6 w-36 shrink-0 text-right whitespace-nowrap">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    {inv.status === 'pending' && (
                      <>
                        {inv.inviteUrl && (
                          <button
                            type="button"
                            onClick={() => onCopy(inv.inviteUrl)}
                            title="Copy Invitation Link"
                            aria-label="Copy Invitation Link"
                            className="p-2 rounded-xl text-t-secondary hover:text-t-primary hover:bg-b-surface1 transition-colors cursor-pointer"
                          >
                            {copied ? (
                              <HiOutlineCheck size={16} className="text-[#00a656]" />
                            ) : (
                              <HiOutlineClipboardCopy size={16} />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onResend(invId)}
                          title="Resend Invitation (Fresh 48h)"
                          aria-label="Resend Invitation"
                          className="p-2 rounded-xl text-t-secondary hover:text-primary-01 hover:bg-b-surface1 transition-colors cursor-pointer"
                        >
                          <HiOutlineRefresh size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancel(invId)}
                          title="Cancel Invitation"
                          aria-label="Cancel Invitation"
                          className="p-2 rounded-xl text-t-secondary hover:text-primary-03 hover:bg-b-surface1 transition-colors cursor-pointer"
                        >
                          <HiOutlineBan size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

