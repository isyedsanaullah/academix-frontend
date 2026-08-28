import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineCurrencyDollar, HiOutlineShieldCheck, HiOutlineDocumentText } from 'react-icons/hi';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function RecordPaymentModal({ isOpen, onClose, fee, student, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    if (fee && isOpen) {
      const remaining = Math.max(0, (fee.totalAmount || 0) - (fee.paidAmount || 0));
      setAmount(remaining > 0 ? String(remaining) : '');
      setPaymentMethod('cash');
      setReferenceNumber('');
      setRemarks('');
      // Generate unique idempotency key for this payment modal session
      setIdempotencyKey(`IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    }
  }, [fee, isOpen]);

  if (!isOpen || !fee) return null;

  const totalAmt = Number(fee.totalAmount) || 0;
  const paidAmt = Number(fee.paidAmount) || 0;
  const remainingBal = Math.max(0, totalAmt - paidAmt);

  const payVal = parseFloat(amount) || 0;
  const newBal = Math.max(0, remainingBal - payVal);
  const isValidAmount = payVal > 0 && payVal <= remainingBal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidAmount) {
      if (payVal <= 0) {
        toast.error('Payment amount must be greater than zero');
      } else {
        toast.error(`Payment amount cannot exceed remaining balance (Rs. ${remainingBal.toLocaleString()})`);
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fee_id: fee._id || fee.id,
        amount: payVal,
        paymentMethod,
        referenceNumber,
        remarks,
        idempotencyKey
      };

      const res = await api.put(`/fees/${fee._id || fee.id}/payment`, payload);
      if (res.data.success) {
        toast.success('Payment recorded successfully');
        onSuccess?.(res.data.data?.payment || res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record payment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-900 border border-surface-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-800 bg-surface-900">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HiOutlineCurrencyDollar className="text-emerald-400" size={22} />
              Record Fee Payment
            </h3>
            <p className="text-xs text-surface-400">
              Student: <span className="text-indigo-400 font-semibold">{student?.name}</span> ({student?.rollNumber})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 transition">
            <HiOutlineX size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Obligation Details Card */}
          <div className="bg-surface-950/60 p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-surface-400 font-medium">Obligation Item</span>
              <span className="text-white font-bold">{fee.title || fee.month}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-surface-400">Total Obligation</span>
              <span className="text-surface-200">Rs. {totalAmt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-surface-400">Already Paid</span>
              <span className="text-emerald-400 font-semibold">Rs. {paidAmt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
              <span className="text-surface-300 font-bold uppercase tracking-wider">Outstanding Balance</span>
              <span className="text-rose-400 font-extrabold text-sm">Rs. {remainingBal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1">Payment Amount (Rs.)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={remainingBal}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Max payable: ${remainingBal}`}
                className="w-full bg-surface-950 border border-surface-700 rounded-xl text-base font-bold text-white px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setAmount(String(remainingBal))}
                className="absolute right-2 top-2 px-2.5 py-1 text-[11px] font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30"
              >
                Pay Full Balance
              </button>
            </div>
            <p className="text-[11px] text-surface-400 mt-1">
              New Remaining Balance after payment: <strong className="text-white">Rs. {newBal.toLocaleString()}</strong>
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-surface-950 border border-surface-700 rounded-xl text-sm text-white px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="cash">Cash Payment</option>
              <option value="bank">Bank Transfer / Online</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Portal</option>
            </select>
          </div>

          {/* Reference Number (conditional or optional) */}
          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1">Reference / Transaction / Cheque No (Optional)</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. TXN-9948271 or Cheque #0049"
              className="w-full bg-surface-950 border border-surface-700 rounded-xl text-sm text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1">Remarks (Optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Paid at campus office counter"
              className="w-full bg-surface-950 border border-surface-700 rounded-xl text-sm text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !isValidAmount}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <HiOutlineShieldCheck size={16} />
              <span>Confirm & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
