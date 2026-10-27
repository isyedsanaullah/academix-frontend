import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [proofForm, setProofForm] = useState({
    method: 'easypaisa',
    amount: '',
    transactionId: '',
    senderPhone: '',
    file: null
  });

  const fetchFees = async () => {
    try {
      const { data } = await api.get('/fees/my');
      setFees(data.data || []);
    } catch { toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/payment-proofs/accounts');
      if (data.success) {
        setPaymentAccounts(data.data || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchFees();
    fetchAccounts();
  }, []);

  const openProofModal = (fee) => {
    setSelectedFee(fee);
    const balance = Math.max(0, (fee.totalAmount || 0) - (fee.paidAmount || 0));
    setProofForm({
      method: paymentAccounts[0]?.method || 'easypaisa',
      amount: balance,
      transactionId: '',
      senderPhone: '',
      file: null
    });
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!proofForm.transactionId.trim()) {
      return toast.error('Please enter the transaction ID');
    }
    if (!proofForm.file) {
      return toast.error('Please select payment screenshot');
    }

    setUploading(true);
    try {
      // 1. Upload screenshot file via multipart
      const formData = new FormData();
      formData.append('file', proofForm.file);
      formData.append('category', 'payment-proofs');
      formData.append('entityType', 'PaymentProof');

      const fileRes = await api.post('/files/initiate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileId = fileRes.data?.data?.id || fileRes.data?.file?.id;
      if (!fileId) {
        throw new Error('Screenshot upload failed');
      }

      // 2. Submit payment proof
      const res = await api.post('/payment-proofs', {
        feeId: selectedFee.id || selectedFee._id,
        method: proofForm.method,
        amount: Number(proofForm.amount),
        transactionId: proofForm.transactionId.trim(),
        senderPhone: proofForm.senderPhone.trim() || undefined,
        file_id: fileId
      });

      if (res.data?.success) {
        toast.success('Payment proof submitted! Awaiting accountant review.');
        setSelectedFee(null);
        fetchFees();
      } else {
        toast.error(res.data?.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error submitting proof');
    } finally {
      setUploading(false);
    }
  };

  const totalFee = fees.reduce((s, f) => s + (f.totalAmount || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const balance = totalFee - totalPaid;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 800, color:'var(--text-primary)' }}>My Fees</h1>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Fee', value: `Rs. ${totalFee.toLocaleString()}`, color:'var(--text-primary)' },
          { label: 'Paid', value: `Rs. ${totalPaid.toLocaleString()}`, color: '#4ade80' },
          { label: 'Balance Due', value: `Rs. ${balance.toLocaleString()}`, color: balance > 0 ? '#f87171' : '#4ade80' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: '11px', fontWeight: 600, color:'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: s.color, marginTop: '6px' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Month</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {fees.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color:'var(--text-tertiary)' }}>No fee records</td></tr>
            ) : fees.map(f => {
              const feeBal = (f.totalAmount || 0) - (f.paidAmount || 0);
              return (
                <tr key={f._id || f.id}>
                  <td style={{ fontWeight: 500 }}>{f.month}</td>
                  <td>Rs. {f.totalAmount?.toLocaleString()}</td>
                  <td style={{ color: '#4ade80' }}>Rs. {f.paidAmount?.toLocaleString()}</td>
                  <td style={{ color: '#f87171' }}>Rs. {feeBal.toLocaleString()}</td>
                  <td><span className={`badge ${f.status === 'paid' ? 'badge-success' : f.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{f.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <a
                        href={`/api/documents/voucher/${f.id || f._id}.pdf`}
                        download
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 8px', textDecoration: 'none' }}
                      >
                        Challan
                      </a>
                      {feeBal > 0 && f.status !== 'void' && (
                        <button
                          onClick={() => openProofModal(f)}
                          className="btn-primary"
                          style={{ fontSize: '11px', padding: '4px 8px', background: '#059669', borderColor: '#059669' }}
                        >
                          Upload Proof
                        </button>
                      )}
                      {(f.status === 'paid' || (f.paidAmount && f.paidAmount >= f.totalAmount)) && (
                        <a
                          href={`/api/documents/receipt/${f.payment_id || f.paymentId || f.id || f._id}.pdf`}
                          download
                          className="btn-primary"
                          style={{ fontSize: '11px', padding: '4px 8px', textDecoration: 'none' }}
                        >
                          Receipt
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment Proof Upload Modal */}
      {selectedFee && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto', padding: '24px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800 }}>Submit Payment Screenshot</h2>
              <button onClick={() => setSelectedFee(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {/* Payment Instructions Banner */}
            {paymentAccounts.length > 0 && (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', marginBottom: '16px', fontSize: '12px' }}>
                <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Official College Payment Accounts:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {paymentAccounts.map((acc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: idx < paymentAccounts.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '4px' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{acc.method}: {acc.title}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{acc.number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Payment Method:</label>
                <select
                  value={proofForm.method}
                  onChange={e => setProofForm({ ...proofForm, method: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="bank">Bank Transfer / Deposit</option>
                  <option value="raast">Raast Instant Pay</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Paid Amount (PKR):</label>
                <input
                  type="number"
                  value={proofForm.amount}
                  onChange={e => setProofForm({ ...proofForm, amount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Transaction ID / Reference No.:</label>
                <input
                  type="text"
                  value={proofForm.transactionId}
                  onChange={e => setProofForm({ ...proofForm, transactionId: e.target.value })}
                  placeholder="e.g. 88392109281 (from SMS or receipt)"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Sender Phone (Optional):</label>
                <input
                  type="text"
                  value={proofForm.senderPhone}
                  onChange={e => setProofForm({ ...proofForm, senderPhone: e.target.value })}
                  placeholder="e.g. 0300-1234567"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Payment Screenshot:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setProofForm({ ...proofForm, file: e.target.files[0] })}
                  required
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>PNG, JPG or WebP (Max 5 MB)</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  {uploading ? 'Submitting Proof...' : 'Submit Payment Proof'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFee(null)}
                  className="btn-secondary"
                  style={{ padding: '10px 16px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFees;

