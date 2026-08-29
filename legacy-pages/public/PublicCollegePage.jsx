import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding, HiOutlineCalendar, HiOutlineClipboardCheck,
  HiOutlineSpeakerphone, HiOutlinePhotograph, HiOutlineDocumentText,
  HiOutlineSearch, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock
} from 'react-icons/hi';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import LottieLoader from '@/components/common/LottieLoader';

const API = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') 
  : '';

const PublicCollegePage = () => {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info'); // info | apply | status
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [googleUser, setGoogleUser] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasRestoredDraftFiles, setHasRestoredDraftFiles] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', fatherName: '', cnic: '', dateOfBirth: '', gender: 'male',
    phone: '', email: '', address: '', city: '',
    guardianName: '', guardianPhone: '', guardianRelation: 'Father',
    sscBoard: '', sscYear: new Date().getFullYear(), sscRollNumber: '',
    sscTotalMarks: 1100, sscObtainedMarks: '', sscResultStatus: 'declared',
    preferredGroup: 'Pre-Medical', preferredClass: 'FSC Part 1'
  });
  const [files, setFiles] = useState({ photo: null, sscDMC: null, hopeCertificate: null, ninthDMC: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState(null);

  // Load college data
  useEffect(() => {
    if (code) {
      fetch(`${API}/api/public/college/${code}`)
        .then(r => r.json())
        .then(d => { if (d.success) setData(d.data); })
        .catch(() => toast.error('Failed to load college info'))
        .finally(() => setLoading(false));
    }
  }, [code]);

  // Load draft
  useEffect(() => {
    if (typeof window !== 'undefined' && code) {
      const saved = localStorage.getItem(`cesms_draft_apply_${code}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.form) {
            setForm(prev => ({ ...prev, ...parsed.form }));
          }
          if (parsed.currentStep) {
            setCurrentStep(parsed.currentStep);
          }
          if (parsed.googleUser) {
            setGoogleUser(parsed.googleUser);
          }
          if (parsed.hasDraftFiles) {
            setHasRestoredDraftFiles(true);
          }
          toast.success('Restored draft application');
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
      setDraftLoaded(true);
    }
  }, [code]);

  const saveDraft = (updatedForm, step, gUser) => {
    if (typeof window !== 'undefined' && code) {
      const dataToSave = {
        form: updatedForm,
        currentStep: step,
        googleUser: gUser,
        hasDraftFiles: !!(files.photo || files.sscDMC || files.hopeCertificate || files.ninthDMC || (draftLoaded && hasRestoredDraftFiles))
      };
      localStorage.setItem(`cesms_draft_apply_${code}`, JSON.stringify(dataToSave));
    }
  };

  const handleFormChange = (key, value) => {
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);
    saveDraft(updatedForm, currentStep, googleUser);
  };

  const handleFileChange = (key, file) => {
    const updatedFiles = { ...files, [key]: file };
    setFiles(updatedFiles);
    
    // Clear warning when required files are uploaded
    if (key === 'photo' || key === 'sscDMC') {
      if (updatedFiles.photo && updatedFiles.sscDMC) {
        setHasRestoredDraftFiles(false);
      }
    }
    
    if (typeof window !== 'undefined' && code) {
      const saved = localStorage.getItem(`cesms_draft_apply_${code}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.hasDraftFiles = true;
          localStorage.setItem(`cesms_draft_apply_${code}`, JSON.stringify(parsed));
        } catch (e) {}
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      if (!auth || !googleProvider) {
        throw new Error('Google sign-in is not initialized. Check your client configuration.');
      }
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      const gUser = {
        idToken: token,
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL
      };
      setGoogleUser(gUser);
      setForm(prev => {
        const updated = {
          ...prev,
          name: result.user.displayName || prev.name,
          email: result.user.email || prev.email
        };
        saveDraft(updated, currentStep, gUser);
        return updated;
      });
      toast.success('Successfully authenticated with Google!');
    } catch (err) {
      console.error('Google Sign In failed:', err);
      toast.error(err.message || 'Google Sign-In failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
      setGoogleUser(null);
      toast.success('Signed out from Google');
    } catch (e) {
      console.error(e);
    }
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!googleUser || !googleUser.idToken) {
        toast.error('Please verify your identity with Google first');
        return false;
      }
    }
    if (step === 2) {
      if (!form.name) return toast.error('Full Name is required');
      if (!form.fatherName) return toast.error("Father's Name is required");
      if (!form.dateOfBirth) return toast.error('Date of Birth is required');
      if (!form.phone) return toast.error('Phone number is required');
      if (!form.address) return toast.error('Address is required');
      if (!form.email) return toast.error('Email is required');
      if (googleUser && form.email.toLowerCase() !== googleUser.email.toLowerCase()) {
        return toast.error('Email must match your verified Google account');
      }
    }
    if (step === 3) {
      if (!form.sscBoard) return toast.error('Board Name is required');
      if (!form.sscYear) return toast.error('Passing Year is required');
      if (!form.sscObtainedMarks) return toast.error('Obtained Marks are required');
      if (!form.sscTotalMarks) return toast.error('Total Marks are required');
      if (form.sscObtainedMarks > form.sscTotalMarks) {
        return toast.error('Obtained marks cannot be greater than total marks');
      }
    }
    if (step === 4) {
      if (showFileWarning) {
        toast.error('Please re-attach the required documents');
        return false;
      }
      if (!files.photo) return toast.error('Passport photo is required');
      if (!files.sscDMC) return toast.error('10th DMC / Marksheet is required');
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      const next = currentStep + 1;
      setCurrentStep(next);
      saveDraft(form, next, googleUser);
    }
  };

  const handlePrevStep = () => {
    const prev = currentStep - 1;
    setCurrentStep(prev);
    saveDraft(form, prev, googleUser);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!googleUser || !googleUser.idToken) {
      return toast.error('Google identity verification is missing. Please re-authenticate.');
    }
    if (!form.email || !form.name || !form.phone) return toast.error('Fill required fields');
    if (showFileWarning) {
      return toast.error('Please re-attach the required documents first');
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      fd.append('idToken', googleUser.idToken);
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      
      const res = await fetch(`${API}/api/public/apply/${code}`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      
      setSubmitted(json.data);
      localStorage.removeItem(`cesms_draft_apply_${code}`);
      toast.success('Application submitted successfully!');
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const checkStatus = async () => {
    if (!statusQuery.trim()) return;
    try {
      const res = await fetch(`${API}/api/public/application-status/${statusQuery.trim()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setStatusResult(json.data);
    } catch (err) { toast.error(err.message); setStatusResult(null); }
  };

  const aggregate = form.sscTotalMarks > 0 ? Math.round((form.sscObtainedMarks / form.sscTotalMarks) * 10000) / 100 : 0;
  const season = data?.admissionSeason;
  const admissionsOpen = !!season && new Date() <= new Date(season.endDate);
  const showFileWarning = hasRestoredDraftFiles && (!files.photo || !files.sscDMC);

  if (loading) return <LottieLoader fullScreen text="Loading College Portal..." />;

  if (!data) return (
    <div style={{ minHeight: '100vh', background: '#080c12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: 18 }}>
      College not found
    </div>
  );

  const { college, announcements } = data;
  const statusColor = { submitted: '#fbbf24', under_review: '#38bdf8', entry_test: '#a78bfa', approved: '#4ade80', rejected: '#f87171', enrolled: '#34d399' };

  const steps = [
    { number: 1, label: 'Identity', desc: 'Google Verification' },
    { number: 2, label: 'Personal', desc: 'Contact details' },
    { number: 3, label: 'Academic', desc: 'Matric details' },
    { number: 4, label: 'Documents', desc: 'DMC & Photo' },
    { number: 5, label: 'Review', desc: 'Final check' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080c12', color:'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', borderBottom:'1px solid var(--border-color)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HiOutlineOfficeBuilding size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{college.name}</h1>
              <p style={{ fontSize: 12, color:'var(--text-tertiary)', margin: '4px 0 0' }}>
                {college.address}{college.city ? `, ${college.city}` : ''} • {college.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', gap: 4, background:'var(--hover-bg)', borderRadius: 12, padding: 4, border:'1px solid var(--border-color)', width: 'fit-content' }}>
          {[
            { id: 'info', label: 'College Info', icon: HiOutlineOfficeBuilding },
            { id: 'apply', label: admissionsOpen ? 'Apply Now' : 'Admissions', icon: HiOutlineClipboardCheck },
            { id: 'status', label: 'Check Status', icon: HiOutlineSearch }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
              background: tab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: tab === t.id ? '#818cf8' : 'rgba(255,255,255,0.35)'
            }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 40px' }}>

        {/* ── INFO TAB ── */}
        {tab === 'info' && (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Announcements */}
            <div style={{ background:'var(--hover-bg)', borderRadius: 12, border:'1px solid var(--border-color)', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color:'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiOutlineSpeakerphone size={16} style={{ color: '#818cf8' }} /> Announcements
              </h3>
              {announcements?.length === 0 ? (
                <p style={{ color:'var(--text-tertiary)', fontSize: 13 }}>No public announcements yet</p>
              ) : announcements?.map(a => (
                <div key={a._id} style={{ padding: '12px 14px', borderRadius: 8, background:'var(--hover-bg)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color:'var(--text-primary)' }}>{a.title}</p>
                  <p style={{ fontSize: 12, color:'var(--text-tertiary)', marginTop: 4, whiteSpace:'pre-wrap' }}>
                    {a.content ? a.content.replace(/<p[^>]*>/gi,'').replace(/<\/p>/gi,'\n').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').trim() : ''}
                  </p>
                  <span style={{ fontSize: 10, color:'var(--text-tertiary)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>

            {/* Admission Status */}
            {season && (
              <div style={{ background: admissionsOpen ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)', borderRadius: 12, border: `1px solid ${admissionsOpen ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}`, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: admissionsOpen ? '#4ade80' : '#f87171', marginBottom: 8 }}>
                  {admissionsOpen ? '🟢 Admissions Open' : '🔴 Admissions Closed'}
                </h3>
                <p style={{ fontSize: 13, color:'var(--text-secondary)' }}>{season.title}</p>
                <p style={{ fontSize: 12, color:'var(--text-tertiary)', marginTop: 4 }}>
                  Deadline: {new Date(season.endDate).toLocaleDateString()} • Groups: {season.availableGroups?.join(', ')}
                </p>
                {season.entryTestRequired && (
                  <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 6 }}>⚠ Entry test required — {season.entryTestDate ? new Date(season.entryTestDate).toLocaleDateString() : 'Date TBD'}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── APPLY TAB ── */}
        {tab === 'apply' && (
          <>
            {!admissionsOpen ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <HiOutlineXCircle size={48} style={{ color: '#f87171', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>
                  {season ? 'Application Deadline Has Passed' : 'Admissions Not Announced Yet'}
                </h2>
                <p style={{ color:'var(--text-tertiary)', fontSize: 13, marginTop: 8 }}>
                  {season ? `The deadline was ${new Date(season.endDate).toLocaleDateString()}.` : 'Check back later for admission announcements.'}
                </p>
              </div>
            ) : submitted ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <HiOutlineCheckCircle size={48} style={{ color: '#4ade80', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>Application Submitted!</h2>
                <p style={{ color:'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>Your application number:</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#818cf8', marginTop: 8 }}>{submitted.applicationNumber}</p>
                <p style={{ color:'var(--text-tertiary)', fontSize: 12, marginTop: 12 }}>Save this number to check your application status. Check your email for updates.</p>
                {submitted.entryTestRequired && (
                  <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'inline-block' }}>
                    <p style={{ fontSize: 12, color: '#fbbf24' }}>⚠ Entry Test: {submitted.entryTestDate ? new Date(submitted.entryTestDate).toLocaleDateString() : 'Date will be emailed'}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Visual Step Progress Tracker */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, overflowX: 'auto', gap: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {steps.map((s, idx) => {
                    const isCompleted = idx + 1 < currentStep;
                    const isActive = idx + 1 === currentStep;
                    return (
                      <div key={s.number} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110, flex: 1 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                          background: isCompleted ? 'rgba(74,222,128,0.15)' : isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.03)',
                          color: isCompleted ? '#4ade80' : isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                          border: isActive ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.06)'
                        }}>
                          {isCompleted ? '✓' : s.number}
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#818cf8' : isCompleted ? '#4ade80' : 'rgba(255,255,255,0.35)', margin: 0, whiteSpace: 'nowrap' }}>{s.label}</p>
                          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: 0, whiteSpace: 'nowrap' }}>{s.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Step 1: Verify */}
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <HiOutlineClipboardCheck size={32} color="#6366f1" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Applicant Identity Verification</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 440, lineHeight: 1.5 }}>
                      To secure your college application, you must authenticate using your Google account. We will secure your dynamic draft and track your status automatically.
                    </p>
                    
                    {googleUser ? (
                      <div style={{ marginTop: 24, padding: '16px 24px', borderRadius: 12, background: 'rgba(74,222,128,0.03)', border: '1px solid rgba(74,222,128,0.1)', width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                          {googleUser.photoURL ? (
                            <img src={googleUser.photoURL} alt="Avatar" style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.2)' }} />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{googleUser.name ? googleUser.name.charAt(0) : 'U'}</div>
                          )}
                          <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{googleUser.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{googleUser.email}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
                          <button type="button" onClick={handleGoogleSignOut} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.03)', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Change Account
                          </button>
                          <button type="button" onClick={() => handleNextStep()} style={{ flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Continue →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={handleGoogleSignIn} disabled={authLoading} style={{
                        marginTop: 24, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.94 5.94 0 0 1 8 12.57c0-3.3 2.64-5.97 5.99-5.97 1.543 0 2.926.57 4.004 1.51l2.97-2.97A9.87 9.87 0 0 0 13.99 2.2c-5.462 0-9.9 4.438-9.9 9.9s4.438 9.9 9.9 9.9c5.148 0 9.79-3.702 9.79-9.9 0-.612-.054-1.2-.162-1.815H12.24Z"/>
                        </svg>
                        {authLoading ? 'Signing In...' : 'Verify with Google'}
                      </button>
                    )}
                  </div>
                )}

                {/* Step 2: Personal Details */}
                {currentStep === 2 && (
                  <Section title="Personal Information">
                    <Grid>
                      <Input label="Full Name (Verified with Google)" value={form.name} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                      <Input label="Email (Verified with Google)" type="email" value={form.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                      <Input label="Father's Name *" value={form.fatherName} onChange={v => handleFormChange('fatherName', v)} required />
                      <Input label="CNIC / B-Form #" value={form.cnic} onChange={v => handleFormChange('cnic', v)} placeholder="xxxxx-xxxxxxx-x" />
                      <Input label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={v => handleFormChange('dateOfBirth', v)} required />
                      <Select label="Gender *" value={form.gender} onChange={v => handleFormChange('gender', v)} options={['male', 'female', 'other']} />
                      <Input label="Phone *" value={form.phone} onChange={v => handleFormChange('phone', v)} placeholder="03xx-xxxxxxx" required />
                    </Grid>
                    <div style={{ marginTop: 12 }}>
                      <Input label="Address *" value={form.address} onChange={v => handleFormChange('address', v)} required />
                    </div>
                    <Grid style={{ marginTop: 12 }}>
                      <Input label="City" value={form.city} onChange={v => handleFormChange('city', v)} />
                      <Input label="Guardian Name" value={form.guardianName} onChange={v => handleFormChange('guardianName', v)} />
                      <Input label="Guardian Phone" value={form.guardianPhone} onChange={v => handleFormChange('guardianPhone', v)} />
                      <Select label="Guardian Relation" value={form.guardianRelation} onChange={v => handleFormChange('guardianRelation', v)} options={['Father', 'Mother', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Other']} />
                    </Grid>
                  </Section>
                )}

                {/* Step 3: Academic Details */}
                {currentStep === 3 && (
                  <Section title="SSC / Matric Details">
                    <Grid>
                      <Input label="Board Name *" value={form.sscBoard} onChange={v => handleFormChange('sscBoard', v)} placeholder="e.g. BISE Lahore" required />
                      <Input label="Passing Year *" type="number" value={form.sscYear} onChange={v => handleFormChange('sscYear', v)} required />
                      <Input label="Roll Number" value={form.sscRollNumber} onChange={v => handleFormChange('sscRollNumber', v)} />
                      <Select label="Result Status *" value={form.sscResultStatus} onChange={v => handleFormChange('sscResultStatus', v)} options={['declared', 'awaiting']} />
                      <Input label="Total Marks *" type="number" value={form.sscTotalMarks} onChange={v => handleFormChange('sscTotalMarks', Number(v))} required />
                      <Input label="Obtained Marks *" type="number" value={form.sscObtainedMarks} onChange={v => handleFormChange('sscObtainedMarks', Number(v))} required />
                    </Grid>

                    {form.sscObtainedMarks > 0 && form.sscTotalMarks > 0 && (
                      <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Calculated Aggregate Percentage</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: aggregate >= 60 ? '#4ade80' : '#fbbf24' }}>
                            {aggregate}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(aggregate, 100)}%`,
                            height: '100%',
                            background: aggregate >= 60 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                            borderRadius: 99,
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, margin: 0 }}>
                          * Calculated dynamically using: (Obtained Marks / Total Marks) * 100.
                        </p>
                      </div>
                    )}

                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Program Preference</h4>
                      <Grid>
                        <Select label="Preferred Class *" value={form.preferredClass} onChange={v => handleFormChange('preferredClass', v)} options={season.availableClasses || ['FSC Part 1', 'FSC Part 2']} />
                        <Select label="Preferred Group *" value={form.preferredGroup} onChange={v => handleFormChange('preferredGroup', v)} options={season.availableGroups || ['Pre-Medical', 'Pre-Engineering', 'Computer Science']} />
                      </Grid>
                    </div>
                  </Section>
                )}

                {/* Step 4: Documents */}
                {currentStep === 4 && (
                  <Section title="Upload Required Documents">
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Please upload scanned copies of the following documents. Only JPG, PNG, or PDF formats are allowed. Max size: 2MB per file.
                    </p>
                    <Grid>
                      <FileInput 
                        label="Passport Photo (Blue BG) *" 
                        icon={HiOutlinePhotograph} 
                        file={files.photo}
                        onChange={f => handleFileChange('photo', f)} 
                      />
                      <FileInput 
                        label="10th DMC / Marksheet *" 
                        icon={HiOutlineDocumentText} 
                        file={files.sscDMC}
                        onChange={f => handleFileChange('sscDMC', f)} 
                      />
                      <FileInput 
                        label="Hope Certificate (If result awaited)" 
                        icon={HiOutlineDocumentText} 
                        file={files.hopeCertificate}
                        onChange={f => handleFileChange('hopeCertificate', f)} 
                      />
                      <FileInput 
                        label="9th DMC (Optional)" 
                        icon={HiOutlineDocumentText} 
                        file={files.ninthDMC}
                        onChange={f => handleFileChange('ninthDMC', f)} 
                      />
                    </Grid>
                    
                    {showFileWarning && (
                      <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)', fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>⚠</span>
                        <span>Draft restored. For security reasons, you must re-attach your Passport Photo and 10th DMC files before submitting.</span>
                      </div>
                    )}
                  </Section>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Verified Applicant Profile */}
                    <div style={{ padding: 16, borderRadius: 12, background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {googleUser?.photoURL ? (
                          <img src={googleUser.photoURL} alt="Avatar" style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.2)' }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{form.name.charAt(0)}</div>
                        )}
                        <div>
                          <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{form.name}</h4>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Verified Google Account</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(74,222,128,0.08)', color: '#4ade80', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        ✓ Verified Identity
                      </div>
                    </div>

                    {/* Personal Details Summary */}
                    <ReviewSection title="Personal Details" onEdit={() => setCurrentStep(2)}>
                      <ReviewItem label="Full Name" value={form.name} />
                      <ReviewItem label="Father's Name" value={form.fatherName} />
                      <ReviewItem label="Email Address" value={form.email} />
                      <ReviewItem label="CNIC / B-Form" value={form.cnic || 'Not provided'} />
                      <ReviewItem label="Date of Birth" value={form.dateOfBirth} />
                      <ReviewItem label="Gender" value={form.gender} />
                      <ReviewItem label="Phone Number" value={form.phone} />
                      <ReviewItem label="Address" value={`${form.address}, ${form.city || ''}`} />
                      <ReviewItem label="Guardian" value={form.guardianName ? `${form.guardianName} (${form.guardianRelation}) - ${form.guardianPhone || ''}` : 'Not provided'} />
                    </ReviewSection>

                    {/* Academic Details Summary */}
                    <ReviewSection title="Academic Details & Preferences" onEdit={() => setCurrentStep(3)}>
                      <ReviewItem label="Board Name" value={form.sscBoard} />
                      <ReviewItem label="Passing Year" value={form.sscYear} />
                      <ReviewItem label="Roll Number" value={form.sscRollNumber || 'Not provided'} />
                      <ReviewItem label="Result Status" value={form.sscResultStatus} />
                      <ReviewItem label="Obtained / Total Marks" value={`${form.sscObtainedMarks} / ${form.sscTotalMarks}`} />
                      <ReviewItem label="Calculated Aggregate" value={`${aggregate}%`} highlight />
                      <ReviewItem label="Preferred Class" value={form.preferredClass} />
                      <ReviewItem label="Preferred Group" value={form.preferredGroup} />
                    </ReviewSection>

                    {/* Uploaded Documents */}
                    <ReviewSection title="Uploaded Documents" onEdit={() => setCurrentStep(4)}>
                      <ReviewFileItem label="Passport Photo" file={files.photo} />
                      <ReviewFileItem label="10th DMC / Marksheet" file={files.sscDMC} />
                      <ReviewFileItem label="Hope Certificate" file={files.hopeCertificate} />
                      <ReviewFileItem label="9th DMC" file={files.ninthDMC} />
                    </ReviewSection>

                    {/* Declaration */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12 }}>
                      <input type="checkbox" id="declaration" required style={{ marginTop: 3, cursor: 'pointer' }} />
                      <label htmlFor="declaration" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, cursor: 'pointer', userSelect: 'none' }}>
                        I hereby declare that all the information and document attachments provided above are correct, complete, and authentic to the best of my knowledge.
                      </label>
                    </div>
                  </div>
                )}

                {/* Back / Next Nav Buttons */}
                {currentStep > 1 && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => handlePrevStep()} style={{
                      padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      ← Back
                    </button>
                    
                    {currentStep < 5 ? (
                      <button type="button" onClick={() => handleNextStep()} style={{
                        padding: '10px 24px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        Next Step →
                      </button>
                    ) : (
                      <button type="submit" disabled={submitting} style={{
                        padding: '12px 32px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#fff',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                        opacity: submitting ? 0.5 : 1
                      }}>
                        {submitting ? 'Submitting Application...' : '🚀 Submit Application'}
                      </button>
                    )}
                  </div>
                )}
              </form>
            )}
          </>
        )}

        {/* ── STATUS TAB ── */}
        {tab === 'status' && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input value={statusQuery} onChange={e => setStatusQuery(e.target.value)}
                placeholder="Enter Application Number (e.g. APP-2026-00001)"
                onKeyDown={e => e.key === 'Enter' && checkStatus()}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background:'var(--hover-bg)', color:'var(--text-primary)', fontSize: 13, outline: 'none' }} />
              <button onClick={checkStatus} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: '#6366f1', color:'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Search
              </button>
            </div>
            {statusResult && (
              <div style={{ padding: 20, borderRadius: 12, background:'var(--hover-bg)', border:'1px solid var(--border-color)' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color:'var(--text-primary)' }}>{statusResult.name}</p>
                <p style={{ fontSize: 12, color:'var(--text-tertiary)', marginTop: 4 }}>#{statusResult.applicationNumber}</p>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[statusResult.status] || '#fff', background: `${statusColor[statusResult.status]}15`, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase' }}>
                    {statusResult.status?.replace('_', ' ')}
                  </span>
                  {statusResult.sscAggregate && <span style={{ fontSize: 11, color:'var(--text-tertiary)' }}>Aggregate: {statusResult.sscAggregate}%</span>}
                </div>
                {statusResult.entryTestRequired && (
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                    <p style={{ fontSize: 11, color: '#fbbf24' }}>
                      <HiOutlineClock size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Entry Test: {statusResult.entryTestDate ? new Date(statusResult.entryTestDate).toLocaleDateString() : 'Date TBD'} — Status: {statusResult.entryTestStatus}
                    </p>
                  </div>
                )}
                {statusResult.rejectionReason && (
                  <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>Reason: {statusResult.rejectionReason}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Reusable mini-components ──
const Section = ({ title, children }) => (
  <div style={{ background:'var(--hover-bg)', borderRadius: 12, border:'1px solid var(--border-color)', padding: 20 }}>
    <h3 style={{ fontSize: 13, fontWeight: 700, color:'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h3>
    {children}
  </div>
);

const Grid = ({ children, style }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, ...style }}>{children}</div>
);

const Input = ({ label, ...props }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color:'var(--text-tertiary)', marginBottom: 4 }}>{label}</label>
    <input {...props} onChange={e => props.onChange ? props.onChange(e.target.value) : null}
      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background:'var(--hover-bg)', color:'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', ...props.style }} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color:'var(--text-tertiary)', marginBottom: 4 }}>{label}</label>
    <select {...props} onChange={e => props.onChange(e.target.value)}
      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#131a25', color:'var(--text-primary)', fontSize: 13, outline: 'none' }}>
      {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
    </select>
  </div>
);

const FileInput = ({ label, icon: Icon, file, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color:'var(--text-tertiary)', marginBottom: 4 }}>{label}</label>
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8,
      border: file ? '1px dashed #34d399' : '1px dashed rgba(255,255,255,0.15)',
      background: file ? 'rgba(52,211,153,0.02)' : 'var(--hover-bg)',
      cursor: 'pointer', fontSize: 12, color: file ? '#34d399' : 'var(--text-tertiary)'
    }}>
      <Icon size={16} /> {file ? `Selected: ${file.name}` : 'Choose file'}
      <input type="file" accept="image/*,.pdf" onChange={e => {
        if (e.target.files[0]) onChange(e.target.files[0]);
      }} style={{ display: 'none' }} />
    </label>
  </div>
);

const ReviewSection = ({ title, children, onEdit }) => (
  <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
      <h4 style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', margin: 0 }}>{title}</h4>
      <button type="button" onClick={onEdit} style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
        ✏ Edit
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
      {children}
    </div>
  </div>
);

const ReviewItem = ({ label, value, highlight }) => (
  <div>
    <span style={{ display: 'block', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 13, color: highlight ? '#4ade80' : 'var(--text-primary)', fontWeight: highlight ? 700 : 500 }}>{value}</span>
  </div>
);

const ReviewFileItem = ({ label, file }) => (
  <div>
    <span style={{ display: 'block', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 12, color: file ? '#4ade80' : 'var(--text-secondary)' }}>
      {file ? `📎 ${file.name} (${Math.round(file.size / 1024)} KB)` : '⚠ Re-attach file'}
    </span>
  </div>
);

export default PublicCollegePage;
