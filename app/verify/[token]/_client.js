'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function DocumentVerificationPage() {
  const params = useParams();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [disabledNotice, setDisabledNotice] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchVerification = async () => {
      setLoading(true);
      setError(null);
      setDisabledNotice(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/public/verify/${token}`, {
          cache: 'no-store'
        });

        const json = await res.json();

        if (res.status === 404 || !json.success && json.code === 'NOT_FOUND') {
          setError('This verification token is invalid, expired, or does not exist.');
        } else if (json.code === 'VERIFICATION_DISABLED') {
          setDisabledNotice(json);
        } else if (res.ok && json.success) {
          setData(json);
        } else {
          setError(json.message || 'Verification failed. Please check the QR code or link.');
        }
      } catch (err) {
        setError('Unable to connect to verification server. Please check your network.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [token]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-PK', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'VALID' || s === 'PAID') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          AUTHENTIC & VERIFIED ({s})
        </div>
      );
    }
    if (s === 'UNPAID' || s === 'PARTIAL') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          OFFICIAL RECORD ({s})
        </div>
      );
    }
    if (s === 'REVOKED' || s === 'VOID') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          DOCUMENT {s} (INVALID)
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        STATUS: {s}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 text-slate-800 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 mb-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 text-2xl font-bold shadow-sm">
            {data?.institution?.logo ? (
              <img
                src={data.institution.logo}
                alt={data.institution.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              '🏛️'
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {data?.institution?.name || disabledNotice?.institution?.name || 'Institutional Document Verification'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
            Official Public Registry • Real-time Validation
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-medium text-slate-600">Verifying security token against institutional database...</p>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-sm border border-rose-200 p-8 text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Record Not Found</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {error}
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 text-left border border-slate-200/60">
              <p className="font-semibold text-slate-700 mb-1">Notice for Verifiers:</p>
              Please verify that you scanned an unaltered official QR code. Tokens are cryptographically unique and tamper-evident.
            </div>
          </div>
        )}

        {/* Feature Disabled Notice (HTTP 200 per spec) */}
        {!loading && disabledNotice && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ℹ️
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Notice</h2>
            <p className="text-sm text-slate-700 mb-4 font-medium">
              Verification is not available for this institution.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              The issuing institution does not currently have public QR verification active on its plan.
              Please contact the college registrar office directly with the original document serial number.
            </p>
          </div>
        )}

        {/* Verified Document Card */}
        {!loading && data && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            {/* Status Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Document Type
                </span>
                <span className="text-base font-bold text-slate-800 capitalize">
                  {data.kind === 'certificate' ? `${data.document?.type || 'Academic'} Certificate` :
                   data.kind === 'voucher' ? 'Fee Voucher / Bank Challan' :
                   data.kind === 'receipt' ? 'Official Fee Payment Receipt' :
                   data.kind === 'invoice' ? 'Platform Billing Invoice' : data.kind}
                </span>
              </div>
              <div>{getStatusBadge(data.status)}</div>
            </div>

            {/* Document Details Grid */}
            <div className="p-6 space-y-4">
              {/* Certificate Details */}
              {data.kind === 'certificate' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Student Name</span>
                    <span className="text-sm font-bold text-slate-800">{data.document?.studentName}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Father Name</span>
                    <span className="text-sm font-medium text-slate-800">{data.document?.fatherName}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Class & Group</span>
                    <span className="text-sm font-medium text-slate-800">{data.document?.class} • {data.document?.group}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Certificate No.</span>
                    <span className="text-sm font-mono font-medium text-slate-800">{data.document?.certificateNumber}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Issue Date</span>
                    <span className="text-sm font-medium text-slate-800">{formatDate(data.issueDate)}</span>
                  </div>
                </div>
              )}

              {/* Fee Voucher Details */}
              {data.kind === 'voucher' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Student</span>
                    <span className="text-sm font-bold text-slate-800">{data.document?.studentName}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Voucher Number</span>
                    <span className="text-sm font-mono font-medium text-slate-800">{data.document?.voucherNumber}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Payable Amount</span>
                    <span className="text-base font-bold text-indigo-700">Rs. {Number(data.document?.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Due Date</span>
                    <span className="text-sm font-medium text-slate-800">{formatDate(data.document?.dueDate)}</span>
                  </div>
                </div>
              )}

              {/* Payment Receipt Details */}
              {data.kind === 'receipt' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Receipt Number</span>
                    <span className="text-sm font-mono font-medium text-slate-800">{data.document?.receiptNumber}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Paid Amount</span>
                    <span className="text-base font-bold text-emerald-700">Rs. {Number(data.document?.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Paid Date</span>
                    <span className="text-sm font-medium text-slate-800">{formatDate(data.document?.paidDate)}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Payment Method</span>
                    <span className="text-sm font-medium text-slate-800 uppercase">{data.document?.method || 'Bank Deposit'}</span>
                  </div>
                </div>
              )}

              {/* Platform Invoice Details */}
              {data.kind === 'invoice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Invoice Number</span>
                    <span className="text-sm font-mono font-medium text-slate-800">{data.document?.invoiceNumber}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Invoice Amount</span>
                    <span className="text-base font-bold text-indigo-700">Rs. {Number(data.document?.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Billing Period</span>
                    <span className="text-xs font-medium text-slate-800">
                      {formatDate(data.document?.periodStart)} - {formatDate(data.document?.periodEnd)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Paid Date</span>
                    <span className="text-sm font-medium text-slate-800">{formatDate(data.document?.paidDate) || 'Pending Payment'}</span>
                  </div>
                </div>
              )}

              {/* Privacy & Safeguard Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-500">
                <span className="text-base">🔒</span>
                <div>
                  <span className="font-semibold text-slate-700 block">Privacy Safeguard Active:</span>
                  Student contact information, CNIC, roll numbers, and exact examination mark sheets are withheld from public verification to safeguard student identity.
                </div>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
              Verified against institutional blockchain-ready registry • {new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' })} PKT
            </div>
          </div>
        )}

        <div className="text-center mt-8 text-xs text-slate-400">
          Powered by <Link href="/" className="font-semibold text-indigo-600 hover:text-indigo-800">CESMS Cloud</Link> • Secure Document Verification Infrastructure
        </div>
      </div>
    </div>
  );
}
