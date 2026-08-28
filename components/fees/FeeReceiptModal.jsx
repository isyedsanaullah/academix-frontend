import React from 'react';
import { HiOutlineX, HiOutlinePrinter, HiOutlineCheckCircle } from 'react-icons/hi';

export default function FeeReceiptModal({ isOpen, onClose, payment, fee, student }) {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const paidAmt = Number(payment.amount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white text-surface-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Screen Only Header */}
        <div className="flex items-center justify-between p-4 bg-surface-900 text-white print:hidden">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <HiOutlineCheckCircle className="text-emerald-400" size={18} />
            Payment Receipt
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <HiOutlinePrinter size={15} /> Print Receipt
            </button>
            <button onClick={onClose} className="p-1 text-surface-400 hover:text-white rounded-lg transition">
              <HiOutlineX size={20} />
            </button>
          </div>
        </div>

        {/* Receipt Voucher Body (Printable) */}
        <div className="p-8 space-y-6 text-surface-900 print:p-6" id="receipt-printable-area">
          {/* Institution Branding Header */}
          <div className="border-b-2 border-surface-900 pb-4 text-center space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight uppercase">College E-Services Management System</h2>
            <p className="text-xs font-semibold text-surface-600">OFFICIAL FEE PAYMENT RECEIPT</p>
            <div className="inline-block px-3 py-1 bg-surface-100 rounded-full font-mono text-xs font-bold text-surface-800 mt-1">
              Receipt No: {payment.receiptNumber}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-surface-500 font-medium">Student Name</p>
              <p className="font-bold text-sm text-surface-900">{student?.name || 'Student'}</p>
              <p className="text-surface-600">s/o {student?.fatherName || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-surface-500 font-medium">Roll Number</p>
              <p className="font-mono font-bold text-sm text-surface-900">{student?.rollNumber || '-'}</p>
              <p className="text-surface-600">{student?.class} — {student?.section}</p>
            </div>
          </div>

          {/* Payment Particulars Table */}
          <div className="border border-surface-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-surface-100 font-bold border-b border-surface-200 text-surface-700">
                <tr>
                  <th className="p-2.5 text-left">Description / Particulars</th>
                  <th className="p-2.5 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                <tr>
                  <td className="p-2.5 font-medium">{fee?.title || fee?.month || 'Academic Fee Payment'}</td>
                  <td className="p-2.5 text-right font-bold">Rs. {paidAmt.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Details Footer */}
          <div className="bg-surface-50 p-3.5 rounded-lg border border-surface-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-surface-500">Date & Time:</span>
              <span className="font-semibold">{new Date(payment.createdAt || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Payment Method:</span>
              <span className="font-semibold uppercase">{payment.paymentMethod || 'cash'}</span>
            </div>
            {payment.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-surface-500">Reference / Txn No:</span>
                <span className="font-mono font-semibold">{payment.referenceNumber}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-surface-200">
              <span className="font-bold text-surface-900">Total Paid Amount:</span>
              <span className="font-extrabold text-sm text-emerald-700">Rs. {paidAmt.toLocaleString()}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 flex justify-between items-end text-xs text-surface-500">
            <div className="text-center w-36 border-t border-surface-400 pt-1">
              Depositor Signature
            </div>
            <div className="text-center w-36 border-t border-surface-400 pt-1">
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
