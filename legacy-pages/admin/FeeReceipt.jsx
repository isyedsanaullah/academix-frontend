import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineArrowLeft, HiOutlinePrinter } from 'react-icons/hi';

const FeeReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/fees/${id}`);
        const feeData = data.data;
        if (feeData && feeData.student_id) {
          if (typeof feeData.student_id === 'string') {
            try {
              const studentRes = await api.get(`/students/${feeData.student_id}`);
              feeData.student_id = studentRes.data.data;
            } catch (err) {
              console.error('Failed to fetch student details:', err);
            }
          } else if (typeof feeData.student_id === 'object' && !feeData.student_id.name && feeData.student_id._id) {
            try {
              const studentRes = await api.get(`/students/${feeData.student_id._id}`);
              feeData.student_id = studentRes.data.data;
            } catch (err) {
              console.error('Failed to fetch student details:', err);
            }
          }
        }
        setFee(feeData);
      } catch (err) {
        toast.error('Failed to load receipt details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!fee) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-surface-400">Receipt record not found</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  const student = fee.student_id;
  const collegeName = user?.college?.name || 'Vital Group of Colleges';
  const collegeCode = user?.college?.code || 'VGC';

  const getRomanPart = (cls) => {
    if (!cls) return '';
    const lowercase = cls.toLowerCase();
    if (lowercase.includes('part 2') || lowercase.includes('part ii') || lowercase.includes('2')) {
      return 'II';
    }
    return 'I';
  };

  const studentClass = student
    ? [
        student.group,
        getRomanPart(student.class) ? `(${getRomanPart(student.class)})` : '',
        `(${student.section || 'A'})`
      ].filter(Boolean).join(' ')
    : '-';

  const receiptDate = fee.paidDate || fee.createdAt || new Date();
  const formattedDate = new Date(receiptDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatReceiptMonth = (monthStr) => {
    if (!monthStr) return '-';
    const parts = monthStr.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1]) - 1;
      const date = new Date(year, monthIndex);
      return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    return monthStr;
  };

  const renderStamp = () => {
    const status = fee.status;
    let text = 'UNPAID';
    let colorClass = 'border-rose-500 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20';
    if (status === 'paid') {
      text = 'PAID';
      colorClass = 'border-emerald-500 text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20';
    } else if (status === 'partial') {
      text = 'PARTIAL';
      colorClass = 'border-amber-500 text-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
    }

    return (
      <div className={`border-4 border-double rounded-xl px-4 py-1.5 font-mono text-lg font-extrabold tracking-widest uppercase transform -rotate-12 select-none shrink-0 ${colorClass}`}>
        {text}
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header and Print Control bar */}
      <div className="flex items-center justify-between no-print bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <HiOutlineArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden md:inline">
            Press Ctrl + P to print directly or click the button.
          </span>
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <HiOutlinePrinter size={18} /> Print Receipt
          </button>
        </div>
      </div>

      {/* Main Printable Receipt Card Container */}
      <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 p-6 sm:p-8 rounded-3xl shadow-2xl no-print">
        <div
          id="receipt"
          className="bg-white text-slate-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-xl border border-slate-100 print:shadow-none print:rounded-none print:max-w-none print:border-none print:p-0 print:text-black"
        >
          {/* Top College Header Block */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-5 mb-6 relative">
            <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 leading-none">
                {collegeName}
              </h1>
              <p className="text-xs font-bold tracking-widest text-indigo-600 leading-none uppercase">
                COLLEGE CODE: {collegeCode}
              </p>
              <p className="text-[10px] text-slate-500 leading-none font-medium">
                Academix Campus Management Network Platform
              </p>
            </div>
            {renderStamp()}
          </div>

          <div className="text-center mb-6">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-widest uppercase border-y border-slate-200 py-1.5 bg-slate-50">
              OFFICIAL PAYMENT RECEIPT
            </h2>
          </div>

          {/* Student & Receipt Metadata Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs leading-relaxed text-slate-700">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                STUDENT PARTICULARS
              </p>
              <p>
                <span className="font-bold text-slate-900">Student Name:</span>{' '}
                <span className="font-semibold text-slate-900">{student?.name || '-'}</span>
              </p>
              <p>
                <span className="font-bold text-slate-900">Roll Number:</span>{' '}
                <span className="font-mono text-indigo-600 font-bold">{student?.rollNumber || '-'}</span>
              </p>
              <p>
                <span className="font-bold text-slate-900">Class Info:</span>{' '}
                <span className="font-semibold text-slate-900">{studentClass}</span>
              </p>
              <p>
                <span className="font-bold text-slate-900">Father Name:</span>{' '}
                <span className="font-medium text-slate-800">s/o {student?.fatherName || '-'}</span>
              </p>
            </div>
            <div className="space-y-1.5 md:text-right md:border-l md:border-slate-200 md:pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                BILLING & TRANSACTION
              </p>
              <p>
                <span className="font-bold text-slate-900">Receipt No:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{fee.receiptNumber || 'N/A'}</span>
              </p>
              <p>
                <span className="font-bold text-slate-900">Billing Month:</span>{' '}
                <span className="font-semibold text-slate-900">{formatReceiptMonth(fee.month)}</span>
              </p>
              <p>
                <span className="font-bold text-slate-900">Payment Date:</span>{' '}
                <span className="font-semibold text-slate-900">{formattedDate}</span>
              </p>
              <p>
                <span className="font-bold text-slate-900">Status:</span>{' '}
                <span
                  className={`font-bold uppercase ${
                    fee.status === 'paid'
                      ? 'text-emerald-600'
                      : fee.status === 'partial'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {fee.status}
                </span>
              </p>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 px-3">Fee Particular / Description</th>
                  <th className="text-right py-2 px-3 w-32">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Tuition Fee', fee.tuitionFee],
                  ['Function Fee', fee.functionFee],
                  ['Lab Fee', fee.labFee],
                  ['Fine', fee.fine],
                  ['Canteen Dues', fee.canteenDues],
                  ['Other Charges', fee.otherCharges],
                ]
                  .filter(([_, v]) => v > 0)
                  .map(([label, value]) => (
                    <tr key={label} className="border-b border-slate-200 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-600 font-semibold">{label}</td>
                      <td className="py-2.5 px-3 text-right text-slate-800 font-mono font-bold">
                        {value?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                {fee.scholarshipDeduction > 0 && (
                  <tr className="border-t border-slate-300 text-slate-500 font-medium text-right bg-slate-50/50">
                    <td className="py-2 px-3 text-left">Scholarship / Concession</td>
                    <td className="py-2 px-3 font-mono">- Rs. {fee.scholarshipDeduction.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="border-t border-slate-300 font-semibold text-slate-700 text-right">
                  <td className="py-2 px-3 text-left">Subtotal Invoice Amount</td>
                  <td className="py-2 px-3 text-slate-900 font-mono font-bold">
                    Rs. {fee.totalAmount?.toLocaleString()}
                  </td>
                </tr>
                <tr className="text-emerald-700 font-bold bg-emerald-50/30 text-right">
                  <td className="py-2 px-3 text-left">Amount Received / Paid</td>
                  <td className="py-2 px-3 font-mono font-extrabold">
                    Rs. {fee.paidAmount?.toLocaleString()}
                  </td>
                </tr>
                {fee.totalAmount - fee.paidAmount > 0 && (
                  <tr className="text-rose-600 font-bold bg-rose-50/30 text-right">
                    <td className="py-2 px-3 text-left">Outstanding Balance Due</td>
                    <td className="py-2 px-3 font-mono font-extrabold">
                      Rs. {(fee.totalAmount - fee.paidAmount).toLocaleString()}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Terms and Guidelines */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 mb-8 text-[10px] text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-700 mb-1">Receipt Instructions & Terms:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>This is an officially authenticated payment record generated under the college's central ERP portal.</li>
              <li>Receipts are invalid if payment cheques bounce or bank transactions are rolled back.</li>
              <li>Defaulters are liable to pay a surcharge fine as per college rules if balance is not settled timely.</li>
              <li>No manual overwriting or signatures will be deemed official without an official bursar stamp.</li>
            </ul>
          </div>

          {/* Signature and Printing Footer */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-200">
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <p>Academix College System Automated Hub</p>
              <p>Printed on: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-center w-48 border-t border-slate-400 pt-1.5 text-slate-500">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Authorized Treasurer</p>
              <p className="text-[9px] text-slate-400 font-medium">Bursar Office Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Styled Printable Receipt for Printer Page */}
      <div id="print-receipt-sheet" className="hidden print:block print:bg-white print:text-black">
        <div className="bg-white text-black p-0 max-w-none border-none">
          {/* Top College Header Block */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-5 relative">
            <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase tracking-wider text-black leading-none">
                {collegeName}
              </h1>
              <p className="text-xs font-bold tracking-widest text-black leading-none uppercase">
                COLLEGE CODE: {collegeCode}
              </p>
              <p className="text-[9px] text-gray-500 leading-none">
                Academix Campus Management Network Platform
              </p>
            </div>
            <div className="border-4 border-double border-black rounded-xl px-4 py-1.5 font-mono text-lg font-black tracking-widest uppercase transform -rotate-12 select-none shrink-0">
              {fee.status.toUpperCase()}
            </div>
          </div>

          <div className="text-center mb-5">
            <h2 className="text-xs font-extrabold text-black tracking-widest uppercase border-y border-black py-1.5 bg-gray-100">
              OFFICIAL PAYMENT RECEIPT
            </h2>
          </div>

          {/* Student & Receipt Metadata Layout */}
          <div className="grid grid-cols-2 gap-4 mb-5 bg-gray-50 border border-gray-300 rounded-xl p-4 text-[11px] leading-relaxed text-black">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                STUDENT PARTICULARS
              </p>
              <p>
                <span className="font-bold">Student Name:</span>{' '}
                <span className="font-semibold">{student?.name || '-'}</span>
              </p>
              <p>
                <span className="font-bold">Roll Number:</span>{' '}
                <span className="font-mono font-bold">{student?.rollNumber || '-'}</span>
              </p>
              <p>
                <span className="font-bold">Class Info:</span>{' '}
                <span className="font-semibold">{studentClass}</span>
              </p>
              <p>
                <span className="font-bold">Father Name:</span>{' '}
                <span className="font-medium">s/o {student?.fatherName || '-'}</span>
              </p>
            </div>
            <div className="space-y-1 text-right border-l border-gray-300 pl-4">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                BILLING & TRANSACTION
              </p>
              <p>
                <span className="font-bold">Receipt No:</span>{' '}
                <span className="font-mono font-bold">{fee.receiptNumber || 'N/A'}</span>
              </p>
              <p>
                <span className="font-bold">Billing Month:</span>{' '}
                <span className="font-semibold">{formatReceiptMonth(fee.month)}</span>
              </p>
              <p>
                <span className="font-bold">Payment Date:</span>{' '}
                <span className="font-semibold">{formattedDate}</span>
              </p>
              <p>
                <span className="font-bold">Status:</span>{' '}
                <span className="font-bold uppercase">{fee.status}</span>
              </p>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="mb-5">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-gray-100 text-black font-bold uppercase tracking-wider text-[9px]">
                  <th className="text-left py-2 px-3">Fee Particular / Description</th>
                  <th className="text-right py-2 px-3 w-32">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Tuition Fee', fee.tuitionFee],
                  ['Function Fee', fee.functionFee],
                  ['Lab Fee', fee.labFee],
                  ['Fine', fee.fine],
                  ['Canteen Dues', fee.canteenDues],
                  ['Other Charges', fee.otherCharges],
                ]
                  .filter(([_, v]) => v > 0)
                  .map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-200">
                      <td className="py-2 px-3 text-black font-medium">{label}</td>
                      <td className="py-2 px-3 text-right text-black font-mono font-bold">
                        {value?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                {fee.scholarshipDeduction > 0 && (
                  <tr className="border-t border-gray-300 text-black font-medium text-right bg-gray-50">
                    <td className="py-2 px-3 text-left">Scholarship / Concession</td>
                    <td className="py-2 px-3 font-mono">- Rs. {fee.scholarshipDeduction.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-black font-bold text-black text-right">
                  <td className="py-2 px-3 text-left">Subtotal Invoice Amount</td>
                  <td className="py-2 px-3 font-mono">
                    Rs. {fee.totalAmount?.toLocaleString()}
                  </td>
                </tr>
                <tr className="text-black font-bold bg-gray-50 border-t border-black text-right">
                  <td className="py-2 px-3 text-left">Amount Received / Paid</td>
                  <td className="py-2 px-3 font-mono font-extrabold">
                    Rs. {fee.paidAmount?.toLocaleString()}
                  </td>
                </tr>
                {fee.totalAmount - fee.paidAmount > 0 && (
                  <tr className="text-black font-bold border-t border-black text-right bg-gray-100">
                    <td className="py-2 px-3 text-left">Outstanding Balance Due</td>
                    <td className="py-2 px-3 font-mono font-extrabold">
                      Rs. {(fee.totalAmount - fee.paidAmount).toLocaleString()}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Terms and Guidelines */}
          <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mb-6 text-[9px] text-gray-600 leading-relaxed">
            <p className="font-bold text-black mb-1">Receipt Instructions & Terms:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>This is an officially authenticated payment record generated under the college's central ERP portal.</li>
              <li>Receipts are invalid if payment cheques bounce or bank transactions are rolled back.</li>
              <li>Defaulters are liable to pay a surcharge fine as per college rules if balance is not settled timely.</li>
              <li>No manual overwriting or signatures will be deemed official without an official bursar stamp.</li>
            </ul>
          </div>

          {/* Signature and Printing Footer */}
          <div className="flex items-end justify-between pt-4 border-t-2 border-black">
            <div className="text-[9px] text-gray-500 space-y-0.5">
              <p>Academix College System Automated Hub</p>
              <p>Printed on: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-center w-48 border-t border-black pt-1.5 text-black">
              <p className="text-[9px] font-bold uppercase tracking-wider">Authorized Treasurer</p>
              <p className="text-[8px] text-gray-500 font-medium">Bursar Office Signature</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          /* Hide absolutely everything on the page except our print-specific container */
          body * {
            visibility: hidden !important;
          }
          #print-receipt-sheet, #print-receipt-sheet * {
            visibility: visible !important;
          }
          #print-receipt-sheet {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Prevent page breaks inside the print sheet */
          #print-receipt-sheet {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default FeeReceipt;
