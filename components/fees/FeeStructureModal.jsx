import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlinePlus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function FeeStructureModal({ isOpen, onClose, student, currentStructure, onSuccess }) {
  const [mode, setMode] = useState('yearly');
  const [yearlyFee, setYearlyFee] = useState('');
  const [scholarship, setScholarship] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [scheduleType, setScheduleType] = useState('single'); // 'single' | 'custom'
  const [installments, setInstallments] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentStructure) {
      setMode(currentStructure.mode || 'yearly');
      setYearlyFee(currentStructure.yearlyFee ? String(currentStructure.yearlyFee) : '');
      setScholarship(currentStructure.scholarship ? String(currentStructure.scholarship) : '');
      setMonthlyFee(currentStructure.monthlyFee ? String(currentStructure.monthlyFee) : '');
      setRemarks(currentStructure.remarks || '');

      if (Array.isArray(currentStructure.installmentsConfig) && currentStructure.installmentsConfig.length > 0) {
        setScheduleType('custom');
        setInstallments(currentStructure.installmentsConfig);
      } else {
        setScheduleType('single');
        setInstallments([]);
      }
    } else {
      setMode('yearly');
      setYearlyFee('');
      setScholarship('');
      setMonthlyFee('');
      setScheduleType('single');
      setInstallments([]);
      setRemarks('');
    }
  }, [currentStructure, isOpen]);

  if (!isOpen) return null;

  const grossVal = parseFloat(yearlyFee) || 0;
  const scholarVal = parseFloat(scholarship) || 0;
  const netVal = Math.max(0, grossVal - scholarVal);

  const installmentSum = installments.reduce((acc, inst) => acc + (parseFloat(inst.amount) || 0), 0);
  const isInstallmentSumValid = scheduleType !== 'custom' || Math.abs(installmentSum - netVal) < 0.01;

  const handleAddInstallment = () => {
    const nextIdx = installments.length + 1;
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + (nextIdx - 1));
    const dateStr = defaultDate.toISOString().slice(0, 10);

    setInstallments([
      ...installments,
      { title: `Installment ${nextIdx}`, amount: '', dueDate: dateStr }
    ]);
  };

  const handleRemoveInstallment = (idx) => {
    setInstallments(installments.filter((_, i) => i !== idx));
  };

  const handleInstallmentChange = (idx, field, value) => {
    const updated = [...installments];
    updated[idx] = { ...updated[idx], [field]: value };
    setInstallments(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'yearly') {
      if (grossVal <= 0) {
        toast.error('Gross yearly fee must be greater than 0');
        return;
      }
      if (scholarVal > grossVal) {
        toast.error('Scholarship cannot exceed gross yearly fee');
        return;
      }
      if (scheduleType === 'custom') {
        if (installments.length === 0) {
          toast.error('Please add at least one installment row or switch to Single Lumpsum schedule');
          return;
        }
        if (!isInstallmentSumValid) {
          toast.error(`Sum of installments (Rs. ${installmentSum.toLocaleString()}) must equal Net Yearly Fee (Rs. ${netVal.toLocaleString()})`);
          return;
        }
      }
    } else if (mode === 'monthly') {
      if ((parseFloat(monthlyFee) || 0) <= 0) {
        toast.error('Monthly fee must be greater than 0');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        student_id: student._id || student.id,
        session_id: student.session_id,
        mode,
        yearlyFee: grossVal,
        scholarship: scholarVal,
        monthlyFee: parseFloat(monthlyFee) || 0,
        installments: mode === 'yearly' && scheduleType === 'custom' ? installments : [],
        remarks
      };

      const res = await api.post('/fees/structure', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Fee structure configured successfully');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to configure fee structure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-900 border border-surface-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-800 sticky top-0 bg-surface-900 z-10">
          <div>
            <h3 className="text-lg font-bold text-white">Configure Student Fee Structure</h3>
            <p className="text-xs text-surface-400">Student: <span className="text-indigo-400 font-semibold">{student?.name}</span> ({student?.rollNumber})</p>
          </div>
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 transition">
            <HiOutlineX size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Fee Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Select Fee Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('yearly')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  mode === 'yearly'
                    ? 'bg-primary-600/20 border-primary-500 text-primary-400 shadow-md shadow-primary-600/10'
                    : 'bg-surface-800/40 border-surface-700 text-surface-400 hover:text-white'
                }`}
              >
                <HiOutlineCheckCircle size={18} className={mode === 'yearly' ? 'opacity-100' : 'opacity-0'} />
                Yearly Fee Structure
              </button>

              <button
                type="button"
                onClick={() => setMode('monthly')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  mode === 'monthly'
                    ? 'bg-primary-600/20 border-primary-500 text-primary-400 shadow-md shadow-primary-600/10'
                    : 'bg-surface-800/40 border-surface-700 text-surface-400 hover:text-white'
                }`}
              >
                <HiOutlineCheckCircle size={18} className={mode === 'monthly' ? 'opacity-100' : 'opacity-0'} />
                Monthly Fee Structure
              </button>
            </div>
          </div>

          {/* Mode A: Yearly Fee */}
          {mode === 'yearly' && (
            <div className="space-y-5 bg-surface-950/50 p-4 rounded-xl border border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-300 mb-1">Gross Yearly Fee (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={yearlyFee}
                    onChange={(e) => setYearlyFee(e.target.value)}
                    placeholder="e.g. 120000"
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-300 mb-1">Scholarship / Concession (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={scholarship}
                    onChange={(e) => setScholarship(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-300 mb-1">Net Yearly Fee (Rs.)</label>
                  <input
                    type="text"
                    value={`Rs. ${netVal.toLocaleString()}`}
                    readOnly
                    className="w-full bg-surface-800/60 border border-surface-700 rounded-lg text-sm text-emerald-400 font-bold px-3 py-2 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Installment Schedule Option */}
              <div className="pt-2 border-t border-white/5">
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Payment Schedule Option</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-surface-200 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="single"
                      checked={scheduleType === 'single'}
                      onChange={() => setScheduleType('single')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    Single Yearly Obligation (Arbitrary Partial Payments)
                  </label>

                  <label className="flex items-center gap-2 text-sm text-surface-200 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="custom"
                      checked={scheduleType === 'custom'}
                      onChange={() => setScheduleType('custom')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    Custom Installment Schedule
                  </label>
                </div>
              </div>

              {/* Custom Installments Table */}
              {scheduleType === 'custom' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Custom Installments Breakdown</span>
                    <button
                      type="button"
                      onClick={handleAddInstallment}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <HiOutlinePlus size={14} /> Add Installment Row
                    </button>
                  </div>

                  {installments.length === 0 ? (
                    <p className="text-xs text-surface-500 italic py-2 text-center">No custom installments added. Click "Add Installment Row" above.</p>
                  ) : (
                    <div className="space-y-2">
                      {installments.map((inst, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-surface-900 p-2 rounded-lg border border-surface-800">
                          <input
                            type="text"
                            placeholder="Title (e.g. Installment 1)"
                            value={inst.title}
                            onChange={(e) => handleInstallmentChange(idx, 'title', e.target.value)}
                            className="flex-1 bg-surface-950 border border-surface-700 rounded px-2.5 py-1 text-xs text-white"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Amount (Rs.)"
                            value={inst.amount}
                            onChange={(e) => handleInstallmentChange(idx, 'amount', e.target.value)}
                            className="w-32 bg-surface-950 border border-surface-700 rounded px-2.5 py-1 text-xs text-white"
                            required
                          />
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => handleInstallmentChange(idx, 'dueDate', e.target.value)}
                            className="w-36 bg-surface-950 border border-surface-700 rounded px-2 py-1 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveInstallment(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Live Validation Alert */}
                  <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
                    isInstallmentSumValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {isInstallmentSumValid ? <HiOutlineCheckCircle size={16} /> : <HiOutlineExclamationCircle size={16} />}
                      Installment Total: Rs. {installmentSum.toLocaleString()} / Net Fee: Rs. {netVal.toLocaleString()}
                    </span>
                    {!isInstallmentSumValid && (
                      <span>Difference: Rs. {Math.abs(installmentSum - netVal).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode B: Monthly Fee */}
          {mode === 'monthly' && (
            <div className="space-y-4 bg-surface-950/50 p-4 rounded-xl border border-white/5">
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1">Base Monthly Fee (Rs. / month)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1">Remarks / Internal Notes (Optional)</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any specific concession approvals or agreement notes..."
              className="w-full bg-surface-900 border border-surface-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || (mode === 'yearly' && scheduleType === 'custom' && !isInstallmentSumValid)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Save Fee Structure</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
