'use strict';
'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSpeakerphone,
  HiOutlineMail,
  HiOutlineDeviceMobile,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineFilter
} from 'react-icons/hi';

export default function MessagesTab({ collegeId, collegeName }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const [form, setForm] = useState({
    subject: '',
    message: '',
    channel: 'both',
    recipients: 'admin'
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/super-admin/colleges/${collegeId}/messages`);
      if (res.data?.success) {
        setDeliveries(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load message history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) {
      fetchDeliveries();
    }
  }, [collegeId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Subject and message are required.');
      return;
    }

    try {
      setSending(true);
      const res = await api.post(`/super-admin/colleges/${collegeId}/messages`, form);
      if (res.data?.success) {
        toast.success(res.data.message || 'Message sent successfully.');
        setIsModalOpen(false);
        setForm({
          subject: '',
          message: '',
          channel: 'both',
          recipients: 'admin'
        });
        fetchDeliveries();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (deliveryId) => {
    try {
      setRetryingId(deliveryId);
      const res = await api.post(`/super-admin/colleges/${collegeId}/messages/${deliveryId}/retry`);
      if (res.data?.success) {
        toast.success('Message redelivered successfully.');
        fetchDeliveries();
      } else {
        toast.error(res.data?.message || 'Retry failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retry delivery');
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Send Button */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">College Administrative Notices</h3>
          <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
            Send formal communications directly to {collegeName}&rsquo;s administration via in-app alerts and official emails.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm self-start sm:self-auto"
        >
          <HiOutlinePlus size={16} />
          Send Message
        </button>
      </div>

      {/* Deliveries History */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Delivery Log</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60">
            {deliveries.length} Records
          </span>
        </div>

        {deliveries.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No messages sent to this college yet. Use &ldquo;Send Message&rdquo; above to dispatch administrative notices.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-white/[0.06] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Subject & Message</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-800 dark:text-white">{d.subject || 'Administrative Notice'}</div>
                      <div className="text-[11px] text-slate-500 dark:text-white/50 line-clamp-2 mt-0.5">{d.content}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-700 dark:text-white/80">{d.recipient_email || 'Portal User'}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{d.recipient_role || 'Staff'}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-white/70">
                        {d.channel === 'email' ? (
                          <>
                            <HiOutlineMail size={14} className="text-sky-500" />
                            Email
                          </>
                        ) : (
                          <>
                            <HiOutlineSpeakerphone size={14} className="text-indigo-500" />
                            In-App
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {d.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          <HiOutlineCheckCircle size={12} />
                          Delivered
                        </span>
                      ) : d.status === 'failed' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                            <HiOutlineXCircle size={12} />
                            Failed
                          </span>
                          {d.error && (
                            <div className="text-[10px] text-rose-500 max-w-xs truncate" title={d.error}>
                              {d.error}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                          <HiOutlineClock size={12} />
                          Queued
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {d.status === 'failed' && d.channel === 'email' && (
                        <button
                          onClick={() => handleRetry(d.id)}
                          disabled={retryingId === d.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.1] transition"
                        >
                          <HiOutlineRefresh size={12} className={retryingId === d.id ? 'animate-spin' : ''} />
                          {retryingId === d.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── SEND MESSAGE MODAL ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Send Notice to {collegeName}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <form onSubmit={handleSend} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Important Subscription Renewal Notice"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Channel</label>
                  <select
                    value={form.channel}
                    onChange={e => setForm({ ...form, channel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="both">Both (In-App & Email)</option>
                    <option value="email">Email Only</option>
                    <option value="in_app">In-App Notice Only</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Recipients</label>
                  <select
                    value={form.recipients}
                    onChange={e => setForm({ ...form, recipients: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="admin">College Administrator</option>
                    <option value="principal">Principal</option>
                    <option value="both">Admin & Principal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">Message Content</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write message content here..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-600 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  {sending ? 'Sending...' : 'Dispatch Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
