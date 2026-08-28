import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlinePrinter, HiOutlineClock, HiOutlineReceiptTax } from 'react-icons/hi';
import api from '@/services/api';

export default function PaymentHistoryModal({ isOpen, onClose, fee, student, onPrintReceipt }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && fee) {
      fetchHistory();
    }
  }, [isOpen, fee]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fees/${fee._id || fee.id}/payments`);
      setPayments(res.data.data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !fee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-900 border border-surface-700/80 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-800 bg-surface-900 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HiOutlineClock className="text-indigo-400" size={20} />
              Payment History
            </h3>
            <p className="text-xs text-surface-400">
              Obligation: <span className="text-white font-semibold">{fee.title || fee.month}</span> — Student: <span className="text-indigo-400 font-semibold">{student?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 transition">
            <HiOutlineX size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <HiOutlineReceiptTax size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No payments recorded for this fee obligation yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p._id || p.id} className="bg-surface-950/70 p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {p.receiptNumber}
                      </span>
                      <span className="text-xs text-surface-400 capitalize bg-surface-800 px-2 py-0.5 rounded">
                        {p.paymentMethod || 'cash'}
                      </span>
                    </div>
                    <p className="text-[11px] text-surface-400">
                      {new Date(p.createdAt).toLocaleString()}
                      {p.referenceNumber ? ` • Ref: ${p.referenceNumber}` : ''}
                    </p>
                    {p.remarks && <p className="text-xs text-surface-300 italic">"{p.remarks}"</p>}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-emerald-400">Rs. {Number(p.amount).toLocaleString()}</p>
                    {onPrintReceipt && (
                      <button
                        onClick={() => onPrintReceipt(p)}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold mt-1"
                      >
                        <HiOutlinePrinter size={13} /> Print Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-800 bg-surface-900/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
