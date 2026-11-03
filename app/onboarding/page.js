'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import CollegePublicProfileView from '@/components/college/CollegePublicProfileView';
import CollegesHubLoader from '@/components/common/CollegesHubLoader';
import {
  HiOutlineOfficeBuilding, HiOutlineBookOpen, HiOutlineUserGroup,
  HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineUpload,
  HiOutlineTrash, HiOutlinePhotograph, HiOutlineExternalLink,
  HiOutlineEye, HiOutlineQuestionMarkCircle, HiArrowRight,
  HiArrowLeft, HiOutlineSave, HiOutlineRefresh, HiOutlinePlus,
  HiOutlineGlobe, HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker,
  HiOutlineInformationCircle, HiOutlineAcademicCap, HiOutlineDownload,
  HiOutlineDocumentText, HiOutlineExclamationCircle, HiOutlineUserAdd,
  HiOutlineClock, HiOutlineKey
} from 'react-icons/hi';
import {
  FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, FaWhatsapp
} from 'react-icons/fa';

// ─── CSV Parser Utility ──────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentField.trim());
      if (row.some(f => f.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || row.length > 0) {
    row.push(currentField.trim());
    if (row.some(f => f.length > 0)) {
      lines.push(row);
    }
  }

  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].map(h => h.replace(/^[\"']|[\"']$/g, '').trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].replace(/^[\"']|[\"']$/g, '') : '';
    });
    rows.push(obj);
  }

  return { headers, rows };
}

// ─── Step Definitions ────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  { id: 'verify',      title: 'Account Ready',    desc: 'Identity confirmed',    icon: HiOutlineCheckCircle },
  { id: 'credentials', title: 'Set Credentials',  desc: 'Username & password',   icon: HiOutlineKey },
  { id: 'profile',     title: 'College Profile',  desc: 'Branding & contacts',   icon: HiOutlineOfficeBuilding },
  { id: 'academic',    title: 'Academic Setup',   desc: 'Sessions & classes',    icon: HiOutlineBookOpen },
  { id: 'staff',       title: 'Staff Accounts',   desc: 'Team setup',            icon: HiOutlineUserGroup },
  { id: 'students',    title: 'Student Import',   desc: 'Enrollment batches',    icon: HiOutlineAcademicCap },
  { id: 'review',      title: 'Review & Launch',  desc: 'Publish workspace',     icon: HiOutlineSparkles },
];

// ─── Academic Presets ────────────────────────────────────────────────────────
const ACADEMIC_PRESETS = [
  {
    id: 'intermediate',
    name: 'Intermediate (HSSC)',
    tag: 'FSc, ICS, FA, I.Com',
    desc: 'Standard higher secondary 2-year programs with Part 1 and Part 2.',
    sessionName: '2026-2027',
    classes: [
      { name: 'FSc Pre-Medical (Part 1)', groups: ['Pre-Medical'], sections: ['A', 'B'], subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Islamic Studies'] },
      { name: 'FSc Pre-Engineering (Part 1)', groups: ['Pre-Engineering'], sections: ['A', 'B'], subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu', 'Islamic Studies'] },
      { name: 'ICS (Part 1)', groups: ['Computer Science'], sections: ['A', 'B'], subjects: ['Computer Science', 'Mathematics', 'Physics', 'English', 'Urdu', 'Islamic Studies'] },
      { name: 'FSc Pre-Medical (Part 2)', groups: ['Pre-Medical'], sections: ['A'], subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Pak Studies'] },
      { name: 'FSc Pre-Engineering (Part 2)', groups: ['Pre-Engineering'], sections: ['A'], subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu', 'Pak Studies'] },
      { name: 'ICS (Part 2)', groups: ['Computer Science'], sections: ['A'], subjects: ['Computer Science', 'Mathematics', 'Physics', 'English', 'Urdu', 'Pak Studies'] }
    ]
  },
  {
    id: 'matric',
    name: 'Matriculation (SSC)',
    tag: '9th & 10th Classes',
    desc: 'Secondary school curriculum for Science and General tracks.',
    sessionName: '2026-2027',
    classes: [
      { name: '9th Class (Science)', groups: ['Science'], sections: ['A', 'B'], subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Islamiyat'] },
      { name: '9th Class (Computer)', groups: ['Computer Science'], sections: ['A'], subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Urdu', 'Islamiyat'] },
      { name: '10th Class (Science)', groups: ['Science'], sections: ['A', 'B'], subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Pak Studies'] },
      { name: '10th Class (Computer)', groups: ['Computer Science'], sections: ['A'], subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Urdu', 'Pak Studies'] }
    ]
  },
  {
    id: 'bs',
    name: 'BS Degree Programs',
    tag: 'Undergraduate 4-Year',
    desc: 'Semester system higher education degree programs.',
    sessionName: 'Fall 2026 - Spring 2030',
    classes: [
      { name: 'BS Computer Science (Year 1)', groups: ['Computing'], sections: ['Section 1', 'Section 2'], subjects: ['Programming Fundamentals', 'Calculus', 'Applied Physics', 'English Composition'] },
      { name: 'BS Software Engineering (Year 1)', groups: ['Computing'], sections: ['Section 1'], subjects: ['Introduction to SE', 'Discrete Structures', 'Calculus', 'English Composition'] },
      { name: 'BBA (Year 1)', groups: ['Business Administration'], sections: ['Section 1'], subjects: ['Principles of Management', 'Microeconomics', 'Business Math', 'Business English'] }
    ]
  },
  {
    id: 'custom',
    name: 'Custom Structure',
    tag: 'Flexible / Build your own',
    desc: 'Define custom academic sessions, classes and subject combinations.',
    sessionName: '2026-2027',
    classes: [
      { name: 'First Year (Class 1)', groups: ['General'], sections: ['A'], subjects: ['Core Subject 1', 'Core Subject 2', 'English'] }
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState('verify');
  const [stepsState, setStepsState] = useState({
    verify: 'done',
    credentials: 'todo',
    profile: 'todo',
    academic: 'todo',
    staff: 'todo',
    students: 'todo',
    review: 'todo'
  });
  const [completionPercent, setCompletionPercent] = useState(16);
  const [academicSummary, setAcademicSummary] = useState({ sessionCount: 0, classCount: 0 });
  const [activeTab, setActiveTab] = useState('form');

  // ── Profile Form State ──
  const [profile, setProfile] = useState({
    name: '', tagline: '', about: '', address: '', city: '',
    phone: '', email: '', website: '', establishedYear: '', affiliation: '',
    logo: '', logo_key: null, coverPhoto: '', cover_key: null, gallery: [],
    socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '', whatsapp: '' }
  });

  // ── Academic Form State ──
  const [selectedPreset, setSelectedPreset] = useState('intermediate');
  const [sessionData, setSessionData] = useState({ name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30' });
  const [classesList, setClassesList] = useState(ACADEMIC_PRESETS[0].classes);
  const [newGalleryCaption, setNewGalleryCaption] = useState('');

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const staffFileInputRef = useRef(null);
  const studentFileInputRef = useRef(null);

  // ── Staff State ──
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffMode, setStaffMode] = useState('single');
  const [singleStaff, setSingleStaff] = useState({ name: '', email: '', role: 'teacher', phone: '', designation: '' });
  const [addingStaff, setAddingStaff] = useState(false);
  const [resendingStaffId, setResendingStaffId] = useState(null);
  const [staffCsvFile, setStaffCsvFile] = useState(null);
  const [staffCsvRows, setStaffCsvRows] = useState([]);
  const [importingStaffCsv, setImportingStaffCsv] = useState(false);

  // ── Credentials Step State ──
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credConfirm,  setCredConfirm]  = useState('');
  const [credShowPw,   setCredShowPw]   = useState(false);
  const [credErrors,   setCredErrors]   = useState({});
  const [credSaving,   setCredSaving]   = useState(false);

  // ── Student Bulk Import State ──
  const [studentCsvFile, setStudentCsvFile] = useState(null);
  const [studentCsvRows, setStudentCsvRows] = useState([]);
  const [importingStudents, setImportingStudents] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [recentBatches, setRecentBatches] = useState([]);
  const [quotas, setQuotas] = useState({ students: null, staff: null });
  const [bgBatchId, setBgBatchId] = useState(null);   // batch running in background
  const [bgBatchStatus, setBgBatchStatus] = useState(null); // live status object
  const bgPollRef = useRef(null);

  // ── Load Server Onboarding State ──
  const fetchOnboardingState = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/onboarding');
      if (res.data?.success) {
        const data = res.data.data;
        const c = data.college || {};
        setStepsState({ credentials: 'todo', ...(data.steps || {}) });
        setCompletionPercent(data.completionPercent || 16);
        setAcademicSummary(data.academicSummary || { sessionCount: 0, classCount: 0 });

        const q = data.quotas || data.academicSummary?.quotas || {};
        setQuotas({
          students: q.students || data.academicSummary?.studentQuota || null,
          staff: q.staff || data.academicSummary?.staffQuota || null
        });

        const serverStep = data.currentStep;
        if (serverStep && serverStep !== 'verify') {
          setCurrentStep(serverStep);
        } else {
          setCurrentStep('verify');
        }
        setProfile({
          name: c.name || '', tagline: c.tagline || '', about: c.about || '',
          address: c.address || '', city: c.city || '', phone: c.phone || '',
          email: c.email || '', website: c.website || '',
          establishedYear: c.establishedYear || c.established_year || '',
          affiliation: c.affiliation || '', logo: c.logo || '',
          logo_key: c.logo_key || null, coverPhoto: c.coverPhoto || '',
          cover_key: c.cover_key || null,
          gallery: Array.isArray(c.gallery) ? c.gallery : [],
          socialLinks: {
            facebook: c.socialLinks?.facebook || '', twitter: c.socialLinks?.twitter || '',
            instagram: c.socialLinks?.instagram || '', linkedin: c.socialLinks?.linkedin || '',
            youtube: c.socialLinks?.youtube || '', whatsapp: c.socialLinks?.whatsapp || ''
          }
        });
      }
    } catch (err) {
      console.error('Failed to load onboarding state:', err);
      toast.error('Unable to retrieve your onboarding progress.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOnboardingState(); }, []);

  // ── Handle Preset Selection ──
  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    const found = ACADEMIC_PRESETS.find(p => p.id === presetId);
    if (found) {
      setSessionData(prev => ({ ...prev, name: found.sessionName }));
      setClassesList(JSON.parse(JSON.stringify(found.classes)));
    }
  };

  // ── Media Upload Handler ──
  const handleFileUpload = async (file, type) => {
    if (!file) return;
    const sizeLimits = { logo: 1 * 1024 * 1024, cover: 3 * 1024 * 1024, gallery: 2 * 1024 * 1024 };
    if (file.size > sizeLimits[type]) {
      const mb = sizeLimits[type] / (1024 * 1024);
      return toast.error(`File size exceeds maximum allowed ${mb} MB`);
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const toastId = toast.loading(`Uploading and optimizing ${type}...`);
    try {
      const res = await api.post('/admin/onboarding/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        const { objectKey, url } = res.data.data;
        if (type === 'logo') {
          setProfile(p => ({ ...p, logo: url, logo_key: objectKey }));
        } else if (type === 'cover') {
          setProfile(p => ({ ...p, coverPhoto: url, cover_key: objectKey }));
        } else if (type === 'gallery') {
          setProfile(p => ({
            ...p,
            gallery: [...p.gallery, { key: objectKey, url, caption: newGalleryCaption || `Campus Photo ${p.gallery.length + 1}` }]
          }));
          setNewGalleryCaption('');
        }
        toast.success(`${type.toUpperCase()} uploaded successfully!`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to upload ${type}`, { id: toastId });
    }
  };

  // ── Save Profile Step ──
  const handleSaveProfile = async (advance = true) => {
    if (!profile.name.trim()) return toast.error('College name is required');
    if (!profile.city.trim()) return toast.error('Campus city is required');
    if (!profile.phone.trim() && !profile.email.trim()) return toast.error('Please provide at least a phone number or public email');
    setSaving(true);
    try {
      const res = await api.patch('/admin/onboarding/steps/profile', profile);
      if (res.data?.success) {
        toast.success('College profile saved!');
        await fetchOnboardingState();
        if (advance) setCurrentStep('academic');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── Save Academic Step ──
  const handleSaveAcademic = async (advance = true) => {
    if (!sessionData.name.trim()) return toast.error('Academic session name is required');
    if (classesList.length === 0) return toast.error('Please configure at least one class');
    setSaving(true);
    try {
      const payload = { session: sessionData, classes: classesList, preset: selectedPreset };
      const res = await api.patch('/admin/onboarding/steps/academic', payload);
      if (res.data?.success) {
        toast.success('Academic structure saved successfully!');
        await fetchOnboardingState();
        if (advance) setCurrentStep('staff');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save academic setup');
    } finally {
      setSaving(false);
    }
  };

  // ── Step Navigation ──
  const handleNavigateStep = async (stepId) => {
    try {
      await api.patch('/admin/onboarding/steps/navigate', { targetStep: stepId });
      setCurrentStep(stepId);
    } catch {
      setCurrentStep(stepId);
    }
  };

  // ── Save Credentials (optional) ──
  const handleSaveCredentials = async (skip = false) => {
    if (!skip) {
      const e = {};
      if (credUsername && credUsername.trim().length < 3) e.username = 'Username must be at least 3 characters.';
      if (credUsername && !/^[a-zA-Z0-9_.-]+$/.test(credUsername.trim())) e.username = 'Only letters, numbers, underscores, dots and hyphens allowed.';
      if (!credPassword) e.password = 'Password is required.';
      else if (credPassword.length < 8) e.password = 'Password must be at least 8 characters.';
      if (credPassword && credPassword !== credConfirm) e.confirm = 'Passwords do not match.';
      if (Object.keys(e).length) { setCredErrors(e); return; }
    }
    setCredSaving(true);
    try {
      if (!skip) {
        await api.put('/auth/update-password', {
          newPassword: credPassword,
          ...(credUsername.trim() ? { username: credUsername.trim().toLowerCase() } : {})
        });
        toast.success('Credentials saved successfully!');
      }
      await handleNavigateStep('profile');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save credentials.';
      toast.error(msg);
    } finally {
      setCredSaving(false);
    }
  };

  // ── Save and Continue Later ──
  const handleSaveAndContinueLater = async () => {
    if (currentStep === 'profile') await handleSaveProfile(false);
    else if (currentStep === 'academic') await handleSaveAcademic(false);
    toast.success('Progress saved! You can resume from any device at any time.');
  };

  // ── Add/Remove Class Helpers ──
  const handleAddClass = () => {
    setClassesList(prev => [...prev, { name: `New Class ${prev.length + 1}`, groups: ['General'], sections: ['A'], subjects: ['General Subject'] }]);
  };
  const handleRemoveClass = (index) => setClassesList(prev => prev.filter((_, i) => i !== index));
  const handleUpdateClassName = (index, newName) => {
    setClassesList(prev => { const copy = [...prev]; copy[index].name = newName; return copy; });
  };
  const handleAddSection = (classIdx) => {
    setClassesList(prev => {
      const copy = [...prev];
      const sections = copy[classIdx].sections || [];
      const nextLetter = String.fromCharCode(65 + sections.length);
      copy[classIdx].sections = [...sections, nextLetter];
      return copy;
    });
  };
  const handleRemoveSection = (classIdx, secIdx) => {
    setClassesList(prev => {
      const copy = [...prev];
      copy[classIdx].sections = copy[classIdx].sections.filter((_, i) => i !== secIdx);
      return copy;
    });
  };

  // ── Staff Handlers ──
  const fetchStaffList = async () => {
    try {
      setLoadingStaff(true);
      const res = await api.get('/admin/onboarding/staff');
      if (res.data?.success) {
        setStaffList(res.data.data || []);
        if (res.data.quota) setQuotas(q => ({ ...q, staff: res.data.quota }));
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => { if (currentStep === 'staff') fetchStaffList(); }, [currentStep]);

  const handleCreateSingleStaff = async (e) => {
    if (e) e.preventDefault();
    if (!singleStaff.name.trim() || singleStaff.name.trim().length < 2) return toast.error('Full name is required (min 2 chars)');
    if (!singleStaff.email.trim() || !singleStaff.email.includes('@')) return toast.error('A valid email address is required');
    setAddingStaff(true);
    try {
      const res = await api.post('/admin/onboarding/staff', singleStaff);
      if (res.data?.success) {
        toast.success(`Invitation email dispatched to ${singleStaff.email}!`);
        setSingleStaff({ name: '', email: '', role: 'teacher', phone: '', designation: '' });
        await fetchStaffList();
        await fetchOnboardingState();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send staff invitation');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleResendStaffInvite = async (userId) => {
    setResendingStaffId(userId);
    try {
      const res = await api.post(`/admin/onboarding/staff/${userId}/resend`);
      if (res.data?.success) { toast.success(res.data.message || 'Invitation resent successfully!'); await fetchStaffList(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    } finally {
      setResendingStaffId(null);
    }
  };

  const handleDownloadStaffTemplate = () => {
    const csvContent = 'Name,Email,Role,Phone,Designation\r\n' +
      '"Dr. Tariq Mehmood","tariq@example.com","principal","+92 300 1234567","Principal"\r\n' +
      '"Ayesha Khan","ayesha@example.com","teacher","+92 301 7654321","Senior Lecturer Physics"\r\n' +
      '"Kamran Akram","kamran@example.com","accountant","+92 333 9876543","Accounts Officer"';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'staff_invite_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStaffCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStaffCsvFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        const { rows } = parseCSV(text);
        const mapped = rows.map(r => ({
          name: r.Name || r.name || '', email: r.Email || r.email || '',
          role: (r.Role || r.role || 'employee').toLowerCase(),
          phone: r.Phone || r.phone || '', designation: r.Designation || r.designation || ''
        })).filter(r => r.name || r.email);
        setStaffCsvRows(mapped);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkUploadStaff = async () => {
    if (staffCsvRows.length === 0) return toast.error('No staff records found in file');
    setImportingStaffCsv(true);
    try {
      const res = await api.post('/admin/onboarding/staff', { staffList: staffCsvRows });
      if (res.data?.success) {
        const { created = 0, skipped = 0, failed = 0 } = res.data.summary || {};
        toast.success(`Import complete: ${created} invited, ${skipped} skipped, ${failed} failed.`);
        setStaffCsvFile(null);
        setStaffCsvRows([]);
        if (staffFileInputRef.current) staffFileInputRef.current.value = '';
        await fetchStaffList();
        await fetchOnboardingState();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import staff CSV');
    } finally {
      setImportingStaffCsv(false);
    }
  };

  // ── Student Handlers ──
  const fetchRecentBatches = async () => {
    try {
      const res = await api.get('/admin/onboarding/students/batches');
      if (res.data?.success) setRecentBatches(res.data.data || []);
    } catch (err) { console.error('Failed to load recent batches:', err); }
  };

  useEffect(() => { if (currentStep === 'students') fetchRecentBatches(); }, [currentStep]);

  const handleDownloadStudentTemplate = async () => {
    try {
      const res = await api.get('/admin/onboarding/students/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_import_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { toast.error('Failed to download student template'); }
  };

  const handleStudentCsvChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudentCsvFile(file);
    setImportResult(null);
    setBgBatchId(null);
    setBgBatchStatus(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      try {
        const XLSX = (await import('xlsx')).default;
        const arrayBuf = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setStudentCsvRows(rawRows);
        toast.success(`Excel file loaded — ${rawRows.length} student records detected.`);
      } catch (err) {
        toast.error('Failed to parse Excel file. Please use the CSV template or an .xlsx file.');
      }
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result;
        if (typeof text === 'string') {
          const { rows } = parseCSV(text);
          setStudentCsvRows(rows);
        }
      };
      reader.readAsText(file);
    }
  };

  // Poll batch status in background
  const startBgPoll = (batchId) => {
    if (bgPollRef.current) clearInterval(bgPollRef.current);
    bgPollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/admin/onboarding/students/batches/${batchId}/status`);
        if (res.data?.success) {
          const s = res.data.data;
          setBgBatchStatus(s);
          if (s.status === 'completed' || s.status === 'failed') {
            clearInterval(bgPollRef.current);
            bgPollRef.current = null;
            if (s.status === 'completed') {
              toast.success(`✅ Background import done: ${s.created} created, ${s.skipped} skipped, ${s.failed} failed.`);
            } else {
              toast.error('Background import encountered an error. Check error report.');
            }
            fetchRecentBatches();
            fetchOnboardingState();
          }
        }
      } catch (_) {}
    }, 3000);
  };

  // Cleanup poll on unmount
  useEffect(() => {
    return () => { if (bgPollRef.current) clearInterval(bgPollRef.current); };
  }, []);

  const handleImportStudents = async () => {
    if (studentCsvRows.length === 0) return toast.error('No student records to import');
    setImportingStudents(true);
    setImportProgress(20);
    try {
      setImportProgress(50);
      const res = await api.post('/admin/onboarding/students/import', {
        filename: studentCsvFile?.name || 'students.csv', students: studentCsvRows
      });
      setImportProgress(100);
      if (res.data?.success) {
        if (res.data.quota || res.data.summary?.quota) {
          setQuotas(q => ({ ...q, students: res.data.quota || res.data.summary?.quota }));
        }

        if (res.data.status === 'processing' && res.data.batchId) {
          // Background mode — server already responded, import running in bg
          setBgBatchId(res.data.batchId);
          setBgBatchStatus({ status: 'processing', total: res.data.total, created: 0, skipped: 0, failed: 0, progress: 0 });
          setImportResult({ batchId: res.data.batchId, summary: res.data.summary, quota: res.data.quota, isBackground: true });
          toast.success(`✅ ${res.data.total} records submitted! Import running in background — you can proceed to the next step.`, { duration: 5000 });
          startBgPoll(res.data.batchId);
        } else {
          // Sync mode (small batch)
          setImportResult(res.data);
          const { created = 0, skipped = 0, failed = 0 } = res.data.summary || {};
          toast.success(`Import finished: ${created} created, ${skipped} skipped, ${failed} failed.`);
          await fetchRecentBatches();
          await fetchOnboardingState();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import student file');
    } finally {
      setImportingStudents(false);
    }
  };

  const handleDownloadErrors = async (batchId) => {
    try {
      const res = await api.get(`/admin/onboarding/students/batches/${batchId}/errors`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `import_errors_batch_${batchId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { toast.error('Failed to download error audit report'); }
  };

  // ── Live Preview Data Object ──
  const livePreviewData = useMemo(() => ({
    name: profile.name || 'Your College Name',
    tagline: profile.tagline,
    about: profile.about,
    city: profile.city || 'Campus City',
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    establishedYear: profile.establishedYear,
    affiliation: profile.affiliation,
    logo: profile.logo,
    coverPhoto: profile.coverPhoto,
    gallery: profile.gallery,
    socialLinks: profile.socialLinks,
    status: 'active',
    programs: classesList.map(c => ({
      name: c.name,
      description: `Groups: ${(c.groups || []).join(', ')} • Sections: ${(c.sections || []).join(', ')}`
    }))
  }), [profile, classesList]);

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6 text-white">
        <CollegesHubLoader size="md" text="Restoring your onboarding state…" />
      </div>
    );
  }

  // ─── Step number helper ──────────────────────────────────────────────────────
  const stepNumbers = { verify: 0, profile: 1, academic: 2, staff: 3, students: 4, review: 5 };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-950 text-white flex flex-col">

      {/* ════════════════════════════════════════════
          STICKY HEADER
      ════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-surface-900/95 backdrop-blur-2xl border-b border-white/[0.05] shadow-lg shadow-black/40">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">

          {/* Logo + divider + label */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img src="/logo-horizontal-dark.svg" alt="CollegesHub" className="h-8 w-auto" />
            <div className="hidden sm:block h-5 w-px bg-white/10" />
            <span className="hidden sm:block text-xs font-medium text-white/35 tracking-wide">Campus Setup Wizard</span>
          </div>

          {/* Mobile step dots */}
          <div className="flex md:hidden items-center gap-1.5 flex-1 justify-center">
            {ONBOARDING_STEPS.map((step) => {
              const isDone = stepsState[step.id] === 'done';
              const isCurrent = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => handleNavigateStep(step.id)}
                  className={`transition-all duration-300 rounded-full ${
                    isCurrent ? 'w-7 h-2 bg-[#4C94E8]' : isDone ? 'w-2 h-2 bg-[#3DBE63]' : 'w-2 h-2 bg-white/10'
                  }`}
                />
              );
            })}
          </div>

          {/* Right: progress pill + save button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2.5 bg-surface-800 border border-white/[0.06] rounded-full px-3.5 py-1.5">
              <div className="w-20 bg-surface-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completionPercent}%`, background: 'linear-gradient(90deg, #4C94E8, #3DBE63)' }}
                />
              </div>
              <span className="text-xs font-bold text-white/60 font-mono">{completionPercent}%</span>
            </div>
            <button
              type="button"
              onClick={handleSaveAndContinueLater}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-white/50 hover:text-white/80 transition-all disabled:opacity-50"
            >
              <HiOutlineSave size={14} />
              <span className="hidden sm:inline">Save Progress</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════
          BODY: SIDEBAR + MAIN
      ════════════════════════════════════════════ */}
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">

        {/* ── LEFT SIDEBAR (desktop lg+) ── */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 border-r border-white/[0.04]" style={{ background: 'rgba(7,11,19,0.5)' }}>
          <div className="sticky top-16 h-[calc(100vh-4rem)] flex flex-col p-4 overflow-y-auto">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 pt-2 pb-3">Setup Steps</p>

            <nav className="flex-1 space-y-0.5">
              {ONBOARDING_STEPS.map((step, idx) => {
                const isDone = stepsState[step.id] === 'done';
                const isCurrent = currentStep === step.id;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleNavigateStep(step.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                      isCurrent
                        ? 'text-white border border-[#4C94E8]/20 shadow-lg'
                        : isDone
                        ? 'text-white/55 hover:text-white/80 hover:bg-white/[0.03]'
                        : 'text-white/25 hover:text-white/45 hover:bg-white/[0.02]'
                    }`}
                    style={isCurrent ? { background: 'rgba(10,77,148,0.12)' } : {}}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isCurrent ? 'text-[#4C94E8]' : isDone ? 'text-[#3DBE63]' : 'text-white/20'
                      }`}
                      style={{
                        background: isCurrent ? 'rgba(76,148,232,0.15)' : isDone ? 'rgba(61,190,99,0.1)' : 'rgba(255,255,255,0.03)'
                      }}
                    >
                      {isDone ? <HiOutlineCheckCircle size={16} /> : <Icon size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{step.title}</div>
                      <div className="text-[10px] text-white/30 truncate mt-0.5">{step.desc}</div>
                    </div>
                    {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#4C94E8] flex-shrink-0" />}
                  </button>
                );
              })}
            </nav>

            {/* Progress bar at bottom */}
            <div className="mt-4 p-3 rounded-xl border border-white/[0.05]" style={{ background: 'rgba(13,20,33,0.6)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-white/35 font-medium">Overall Progress</span>
                <span className="text-[10px] font-bold text-[#3DBE63] font-mono">{completionPercent}%</span>
              </div>
              <div className="w-full bg-surface-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completionPercent}%`, background: 'linear-gradient(90deg, #4C94E8, #3DBE63)' }}
                />
              </div>
              <p className="text-[10px] text-white/20 mt-2 leading-relaxed">
                {completionPercent < 100 ? 'Complete all steps to launch your workspace.' : 'All steps completed! Ready to launch.'}
              </p>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

            <AnimatePresence mode="wait">

              {/* ════ STEP: VERIFY ════ */}
              {currentStep === 'verify' && (
                <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="max-w-lg mx-auto">
                  <div className="bg-surface-900 border border-white/[0.07] rounded-2xl p-8 sm:p-10 text-center space-y-6 shadow-2xl shadow-black/30">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg" style={{ background: 'rgba(61,190,99,0.1)', border: '1px solid rgba(61,190,99,0.2)' }}>
                      <HiOutlineCheckCircle size={34} style={{ color: '#3DBE63' }} />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-3" style={{ background: 'rgba(61,190,99,0.1)', color: '#3DBE63', border: '1px solid rgba(61,190,99,0.2)' }}>
                        <HiOutlineCheckCircle size={12} /> Account Ready
                      </div>
                      <h2 className="text-2xl font-extrabold text-white">You're signed in!</h2>
                      <p className="text-sm text-white/50 mt-2.5 leading-relaxed">
                        Your Google account was used to verify your identity. You can now set up your login credentials or continue directly.
                      </p>
                    </div>
                    <button type="button" onClick={() => handleNavigateStep('credentials')} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold">
                      Set Up Login Credentials <HiArrowRight size={16} />
                    </button>
                    <button type="button" onClick={() => handleNavigateStep('profile')} className="w-full py-2.5 text-sm text-white/35 hover:text-white/60 transition-colors">
                      Skip for now → go to College Profile
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ════ STEP: CREDENTIALS ════ */}
              {currentStep === 'credentials' && (() => {
                const pwStrength = (() => {
                  if (!credPassword) return { score: 0, label: '', color: '' };
                  let s = 0;
                  if (credPassword.length >= 8) s++;
                  if (credPassword.length >= 12) s++;
                  if (/[A-Z]/.test(credPassword)) s++;
                  if (/[0-9]/.test(credPassword)) s++;
                  if (/[^A-Za-z0-9]/.test(credPassword)) s++;
                  if (s <= 1) return { score: s, label: 'Weak', color: '#ef4444' };
                  if (s <= 2) return { score: s, label: 'Fair', color: '#f59e0b' };
                  if (s <= 3) return { score: s, label: 'Good', color: '#3b82f6' };
                  return { score: s, label: 'Strong', color: '#22c55e' };
                })();
                return (
                  <motion.div key="credentials" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="max-w-lg mx-auto">
                    <div className="bg-surface-900 border border-white/[0.07] rounded-2xl p-8 sm:p-10 space-y-6 shadow-2xl shadow-black/30">
                      {/* Header */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(76,148,232,0.12)', border: '1px solid rgba(76,148,232,0.2)' }}>
                            <HiOutlineKey size={20} style={{ color: '#4C94E8' }} />
                          </div>
                          <div>
                            <h2 className="text-xl font-extrabold text-white">Set Login Credentials</h2>
                            <p className="text-xs text-white/35">Optional — you can always set these later in your profile</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3.5 rounded-xl" style={{ background: 'rgba(76,148,232,0.06)', border: '1px solid rgba(76,148,232,0.12)' }}>
                          <HiOutlineInformationCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#4C94E8' }} />
                          <p className="text-xs text-white/50 leading-relaxed">
                            Since you signed in with Google, you can also set a password to enable email/password login. The username is for a shorter login alias.
                          </p>
                        </div>
                      </div>

                      {/* Username */}
                      <div>
                        <label className="field-label text-xs">Username <span className="text-white/25 font-normal">(optional)</span></label>
                        <input
                          type="text"
                          value={credUsername}
                          onChange={e => { setCredUsername(e.target.value); setCredErrors(p => ({ ...p, username: '' })); }}
                          placeholder="e.g. john_admin"
                          className="input-field text-sm mt-1"
                          autoComplete="username"
                        />
                        {credErrors.username && <p className="text-xs text-red-400 mt-1">{credErrors.username}</p>}
                        <p className="text-[11px] text-white/25 mt-1">Letters, numbers, underscores, dots, hyphens only.</p>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="field-label text-xs">Password <span className="text-red-400">*</span></label>
                        <div className="relative mt-1">
                          <input
                            type={credShowPw ? 'text' : 'password'}
                            value={credPassword}
                            onChange={e => { setCredPassword(e.target.value); setCredErrors(p => ({ ...p, password: '' })); }}
                            placeholder="At least 8 characters"
                            className="input-field text-sm pr-12"
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setCredShowPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                            <HiOutlineEye size={16} />
                          </button>
                        </div>
                        {credPassword && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex gap-1 flex-1">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                                  style={{ background: i <= Math.ceil(pwStrength.score * 4 / 5) ? pwStrength.color : 'rgba(255,255,255,0.07)' }}/>
                              ))}
                            </div>
                            <span className="text-[11px] font-semibold w-10 text-right" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                          </div>
                        )}
                        {credErrors.password && <p className="text-xs text-red-400 mt-1">{credErrors.password}</p>}
                      </div>

                      {/* Confirm */}
                      <div>
                        <label className="field-label text-xs">Confirm Password <span className="text-red-400">*</span></label>
                        <input
                          type={credShowPw ? 'text' : 'password'}
                          value={credConfirm}
                          onChange={e => { setCredConfirm(e.target.value); setCredErrors(p => ({ ...p, confirm: '' })); }}
                          placeholder="Repeat password"
                          className="input-field text-sm mt-1"
                          autoComplete="new-password"
                        />
                        {credErrors.confirm && <p className="text-xs text-red-400 mt-1">{credErrors.confirm}</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 pt-2">
                        <button type="button"
                          onClick={() => handleSaveCredentials(false)}
                          disabled={credSaving}
                          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50">
                          {credSaving ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Saving…
                            </>
                          ) : (
                            <>Save & Continue <HiArrowRight size={16} /></>
                          )}
                        </button>
                        <button type="button"
                          onClick={() => handleSaveCredentials(true)}
                          disabled={credSaving}
                          className="w-full py-2.5 text-sm text-white/35 hover:text-white/60 transition-colors">
                          Skip — I'll set credentials later
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* ════ STEP: PROFILE ════ */}
              {currentStep === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6">

                  {/* Step header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-white/[0.05]">
                    <div>
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2" style={{ background: 'rgba(76,148,232,0.1)', color: '#4C94E8', border: '1px solid rgba(76,148,232,0.15)' }}>
                        Step 1 of 5
                      </div>
                      <h1 className="text-2xl font-extrabold text-white tracking-tight">College Profile & Branding</h1>
                      <p className="text-sm text-white/40 mt-1">Set up your public information, logos, cover image, and contact details for your college page.</p>
                    </div>
                    <div className="flex items-center bg-surface-800 border border-white/[0.07] rounded-xl p-1 self-start flex-shrink-0">
                      <button type="button" onClick={() => setActiveTab('form')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'form' ? 'bg-[#0A4D94] text-white shadow-sm' : 'text-white/40 hover:text-white'}`}>Edit</button>
                      <button type="button" onClick={() => setActiveTab('preview')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${activeTab === 'preview' ? 'bg-[#0A4D94] text-white shadow-sm' : 'text-white/40 hover:text-white'}`}><HiOutlineEye size={13} /> Preview</button>
                    </div>
                  </div>

                  {/* Info notice */}
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(76,148,232,0.06)', border: '1px solid rgba(76,148,232,0.13)' }}>
                    <HiOutlineInformationCircle size={17} className="flex-shrink-0 mt-0.5" style={{ color: '#4C94E8' }} />
                    <p className="text-xs text-white/55 leading-relaxed">
                      Your college profile powers your public subdomain page (e.g. <span className="font-mono text-[11px]" style={{ color: '#4C94E8' }}>{(profile.name.trim() ? profile.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') : '') || 'yourcolleye'}.collegeshub.org</span>). Prospective students see these details before applying.
                    </p>
                  </div>

                  {/* ── Full-screen preview overlay ── */}
                  <AnimatePresence>
                    {activeTab === 'preview' && (
                      <motion.div
                        key="preview-overlay"
                        initial={{ opacity: 0, x: '4%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '4%' }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 z-[60] flex flex-col"
                        style={{ background: 'rgba(4,7,13,0.98)', backdropFilter: 'blur(16px)' }}
                      >
                        {/* Browser-chrome top bar */}
                        <div
                          className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06]"
                          style={{ background: 'rgba(8,12,22,0.98)' }}
                        >
                          {/* Traffic lights */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(248,113,113,0.7)' }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(251,191,36,0.7)' }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(74,222,128,0.7)' }} />
                          </div>
                          {/* URL bar */}
                          <div
                            className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono max-w-lg mx-auto"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            <HiOutlineGlobe size={12} style={{ color: '#3DBE63' }} />
                            <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                              {(profile.name.trim()
                                ? profile.name.toLowerCase().trim()
                                    .replace(/\s+/g, '-')
                                    .replace(/[^a-z0-9-]/g, '')
                                    .replace(/-+/g, '-')
                                    .replace(/^-|-$/g, '')
                                : '') || 'yourcolleye'}
                              <span style={{ color: 'rgba(255,255,255,0.25)' }}>.collegeshub.org</span>
                            </span>
                          </div>
                          {/* Right: badge + close */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
                              style={{ background: 'rgba(76,148,232,0.1)', color: '#4C94E8', border: '1px solid rgba(76,148,232,0.18)' }}
                            >
                              <HiOutlineEye size={10} /> Live Preview
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('form')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white transition-colors"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
                            >
                              ✕ Close Preview
                            </button>
                          </div>
                        </div>
                        {/* Scrollable page content */}
                        <div className="flex-1 overflow-y-auto">
                          <CollegePublicProfileView college={livePreviewData} isPreview={true} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 gap-6">

                    {/* FORM COLUMN */}
                    <div className="space-y-5">

                      {/* Basic Information */}
                      <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <HiOutlineOfficeBuilding size={14} style={{ color: '#4C94E8' }} /> Basic Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className="field-label text-xs">College Name <span className="text-red-400">*</span></label>
                            <input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Federal Medical College" className="input-field text-sm mt-1" />
                          </div>
                          <div className="sm:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="field-label text-xs">Tagline or Motto</label>
                              <span className="text-[10px] text-white/25 font-mono">{profile.tagline.length}/120</span>
                            </div>
                            <input type="text" maxLength={120} value={profile.tagline} onChange={(e) => setProfile(p => ({ ...p, tagline: e.target.value }))} placeholder="e.g. Excellence in Medical Education & Healthcare Research" className="input-field text-sm" />
                          </div>
                          <div className="sm:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="field-label text-xs">About Institution</label>
                              <span className="text-[10px] text-white/25 font-mono">{profile.about.length}/1500</span>
                            </div>
                            <textarea rows={4} maxLength={1500} value={profile.about} onChange={(e) => setProfile(p => ({ ...p, about: e.target.value }))} placeholder="Overview of your college history, vision, campus facilities, and academic achievements..." className="input-field text-sm leading-relaxed" />
                          </div>
                          <div>
                            <label className="field-label text-xs">Established Year</label>
                            <input type="number" min="1800" max={new Date().getFullYear()} value={profile.establishedYear} onChange={(e) => setProfile(p => ({ ...p, establishedYear: e.target.value }))} placeholder="e.g. 2012" className="input-field text-sm mt-1" />
                          </div>
                          <div>
                            <label className="field-label text-xs">Affiliation / Board</label>
                            <input type="text" value={profile.affiliation} onChange={(e) => setProfile(p => ({ ...p, affiliation: e.target.value }))} placeholder="e.g. PMDC / SZABMU / FBISE" className="input-field text-sm mt-1" />
                          </div>
                        </div>
                      </div>

                      {/* Branding & Visuals */}
                      <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-5">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <HiOutlinePhotograph size={14} style={{ color: '#4C94E8' }} /> Branding & Visuals
                        </h3>

                        {/* Logo */}
                        <div>
                          <label className="field-label text-xs">College Logo <span className="text-[10px] text-white/25 font-normal">(Max 1 MB · PNG/JPG/WebP)</span> <span className="text-red-400">*</span></label>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="w-16 h-16 rounded-xl bg-surface-800 border border-white/[0.08] overflow-hidden flex items-center justify-center flex-shrink-0">
                              {profile.logo
                                ? <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" />
                                : <span className="text-[9px] text-white/20 font-bold text-center leading-tight px-1">No Logo</span>}
                            </div>
                            <div>
                              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')} />
                              <button type="button" onClick={() => logoInputRef.current?.click()} className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"><HiOutlineUpload size={13} /> Upload Logo</button>
                              <p className="text-[10px] text-white/30 mt-1.5">Auto-optimized to 512×512px. Transparent PNG recommended.</p>
                            </div>
                          </div>
                        </div>

                        {/* Cover */}
                        <div className="border-t border-white/[0.04] pt-4">
                          <label className="field-label text-xs">Cover Banner <span className="text-[10px] text-white/25 font-normal">(Max 3 MB · Wide 16:9)</span></label>
                          <div className="mt-2 space-y-2">
                            {profile.coverPhoto && (
                              <div className="w-full h-28 rounded-xl overflow-hidden bg-surface-800 border border-white/[0.06] relative">
                                <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setProfile(p => ({ ...p, coverPhoto: '', cover_key: null }))} className="absolute top-2 right-2 p-1.5 rounded-lg text-white transition-colors" style={{ background: 'rgba(220,38,38,0.8)' }}><HiOutlineTrash size={12} /></button>
                              </div>
                            )}
                            <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover')} />
                            <button type="button" onClick={() => coverInputRef.current?.click()} className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"><HiOutlineUpload size={13} /> {profile.coverPhoto ? 'Replace Cover' : 'Upload Cover'}</button>
                          </div>
                        </div>

                        {/* Gallery */}
                        <div className="border-t border-white/[0.04] pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="field-label text-xs">Campus Gallery <span className="text-[10px] text-white/25 font-normal">(Up to 8 · Max 2 MB each)</span></label>
                            <span className="text-[10px] text-white/25 font-mono">{profile.gallery.length}/8</span>
                          </div>
                          {profile.gallery.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {profile.gallery.map((img, i) => (
                                <div key={i} className="aspect-video rounded-lg overflow-hidden bg-surface-800 border border-white/[0.05] relative group">
                                  <img src={img.url} alt={img.caption || `Campus ${i + 1}`} className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => setProfile(p => ({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 p-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(220,38,38,0.8)' }}><HiOutlineTrash size={10} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                          {profile.gallery.length < 8 && (
                            <div className="flex gap-2">
                              <input type="text" placeholder="Optional caption..." value={newGalleryCaption} onChange={(e) => setNewGalleryCaption(e.target.value)} className="input-field text-xs flex-1" />
                              <input ref={galleryInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'gallery')} />
                              <button type="button" onClick={() => galleryInputRef.current?.click()} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 whitespace-nowrap"><HiOutlinePlus size={13} /> Add</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location & Contact */}
                      <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <HiOutlineLocationMarker size={14} style={{ color: '#4C94E8' }} /> Location & Contact
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="field-label text-xs">Campus City <span className="text-red-400">*</span></label>
                            <input type="text" value={profile.city} onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Islamabad" className="input-field text-sm mt-1" />
                          </div>
                          <div>
                            <label className="field-label text-xs">Campus Address</label>
                            <input type="text" value={profile.address} onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="e.g. Sector H-8/4" className="input-field text-sm mt-1" />
                          </div>
                          <div>
                            <label className="field-label text-xs">Public Phone</label>
                            <input type="text" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+92 51 9265003" className="input-field text-sm mt-1" />
                          </div>
                          <div>
                            <label className="field-label text-xs">Inquiries Email</label>
                            <input type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="admissions@college.edu.pk" className="input-field text-sm mt-1" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="field-label text-xs">Website URL</label>
                            <input type="url" value={profile.website} onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))} placeholder="https://www.college.edu.pk" className="input-field text-sm mt-1" />
                          </div>
                        </div>
                      </div>

                      {/* Social Links */}
                      <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <HiOutlineGlobe size={14} style={{ color: '#4C94E8' }} /> Social Links <span className="text-white/15 font-normal normal-case tracking-normal ml-1">(Optional)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {[
                            { key: 'facebook',  label: 'Facebook',   Icon: FaFacebook,  color: '#3b82f6', ph: 'https://facebook.com/...' },
                            { key: 'instagram', label: 'Instagram',  Icon: FaInstagram, color: '#ec4899', ph: 'https://instagram.com/...' },
                            { key: 'twitter',   label: 'Twitter / X',Icon: FaTwitter,   color: '#38bdf8', ph: 'https://x.com/...' },
                            { key: 'linkedin',  label: 'LinkedIn',   Icon: FaLinkedin,  color: '#60a5fa', ph: 'https://linkedin.com/school/...' },
                            { key: 'youtube',   label: 'YouTube',    Icon: FaYoutube,   color: '#ef4444', ph: 'https://youtube.com/@...' },
                            { key: 'whatsapp',  label: 'WhatsApp',   Icon: FaWhatsapp,  color: '#22c55e', ph: 'https://wa.me/...' },
                          ].map(({ key, label, Icon, color, ph }) => (
                            <div key={key}>
                              <label className="field-label text-[11px] flex items-center gap-1.5"><Icon style={{ color }} size={11} /> {label}</label>
                              <input type="url" value={profile.socialLinks[key]} onChange={(e) => setProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, [key]: e.target.value } }))} placeholder={ph} className="input-field text-xs mt-1" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex justify-end pt-1">
                        <button type="button" onClick={() => handleSaveProfile(true)} disabled={saving} className="btn-primary px-8 py-3.5 text-sm font-bold flex items-center gap-2 disabled:opacity-60">
                          {saving ? 'Saving...' : 'Save & Continue'} <HiArrowRight size={16} />
                        </button>
                      </div>
                    </div>


                  </div>
                </motion.div>
              )}

              {/* ════ STEP: ACADEMIC ════ */}
              {currentStep === 'academic' && (
                <motion.div key="academic" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6">

                  <div className="pb-5 border-b border-white/[0.05]">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2" style={{ background: 'rgba(76,148,232,0.1)', color: '#4C94E8', border: '1px solid rgba(76,148,232,0.15)' }}>Step 2 of 5</div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Academic Setup & Programs</h1>
                    <p className="text-sm text-white/40 mt-1">Configure your academic session and set up classes, sections, and study tracks.</p>
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(76,148,232,0.06)', border: '1px solid rgba(76,148,232,0.12)' }}>
                    <HiOutlineInformationCircle size={17} className="flex-shrink-0 mt-0.5" style={{ color: '#4C94E8' }} />
                    <p className="text-xs text-white/50 leading-relaxed">Academics form the backbone of your college. Every student and timetable is mapped to an active session, class, and section. Choose a preset below and customize as needed.</p>
                  </div>

                  {/* Presets */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Quick-Start Preset</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {ACADEMIC_PRESETS.map((preset) => {
                        const isSelected = selectedPreset === preset.id;
                        return (
                          <button key={preset.id} type="button" onClick={() => handleSelectPreset(preset.id)}
                            className={`p-4 rounded-xl text-left border transition-all ${isSelected ? 'shadow-lg' : 'bg-surface-900 border-white/[0.05] hover:border-white/[0.12] hover:bg-surface-800'}`}
                            style={isSelected ? { background: 'rgba(10,77,148,0.12)', border: '1px solid rgba(76,148,232,0.35)', boxShadow: '0 8px 30px rgba(10,77,148,0.12)' } : {}}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider" style={isSelected ? { background: 'rgba(76,148,232,0.2)', color: '#4C94E8', border: '1px solid rgba(76,148,232,0.2)' } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {preset.tag}
                              </span>
                              {isSelected && <HiOutlineCheckCircle size={14} style={{ color: '#4C94E8' }} />}
                            </div>
                            <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-white/65'}`}>{preset.name}</h4>
                            <p className="text-[11px] text-white/35 leading-relaxed mt-1">{preset.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Session */}
                  <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <HiOutlineBookOpen size={14} style={{ color: '#4C94E8' }} /> Academic Session
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="field-label text-xs">Session Title <span className="text-red-400">*</span></label>
                        <input type="text" value={sessionData.name} onChange={(e) => setSessionData(s => ({ ...s, name: e.target.value }))} placeholder="e.g. 2026-2027" className="input-field text-sm mt-1" />
                      </div>
                      <div>
                        <label className="field-label text-xs">Start Date</label>
                        <input type="date" value={sessionData.startDate} onChange={(e) => setSessionData(s => ({ ...s, startDate: e.target.value }))} className="input-field text-sm mt-1" />
                      </div>
                      <div>
                        <label className="field-label text-xs">End Date</label>
                        <input type="date" value={sessionData.endDate} onChange={(e) => setSessionData(s => ({ ...s, endDate: e.target.value }))} className="input-field text-sm mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Classes */}
                  <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <HiOutlineAcademicCap size={14} style={{ color: '#4C94E8' }} /> Classes & Sections ({classesList.length})
                        </h3>
                        <p className="text-[11px] text-white/30 mt-0.5">Customize class names, sections, and subjects as needed.</p>
                      </div>
                      <button type="button" onClick={handleAddClass} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"><HiOutlinePlus size={13} /> Add Class</button>
                    </div>
                    <div className="space-y-3">
                      {classesList.map((cls, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all space-y-3" style={{ background: 'rgba(13,20,33,0.7)' }}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className="w-6 h-6 rounded-md font-bold text-[11px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(76,148,232,0.15)', color: '#4C94E8' }}>{idx + 1}</span>
                              <input type="text" value={cls.name} onChange={(e) => handleUpdateClassName(idx, e.target.value)} className="input-field text-sm font-semibold py-1.5 flex-1 max-w-sm" placeholder="Class Name" />
                            </div>
                            <button type="button" onClick={() => handleRemoveClass(idx)} className="text-white/20 hover:text-red-400 p-1.5 transition-colors"><HiOutlineTrash size={15} /></button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.03]">
                            <span className="text-[10px] text-white/25 font-semibold uppercase mr-1">Sections:</span>
                            {(cls.sections || []).map((sec, secIdx) => (
                              <span key={secIdx} className="px-2 py-0.5 rounded text-xs font-mono text-white/65 border border-white/[0.05] flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                Section {sec}
                                <button type="button" onClick={() => handleRemoveSection(idx, secIdx)} className="text-white/25 hover:text-red-400 text-sm leading-none ml-0.5">×</button>
                              </span>
                            ))}
                            <button type="button" onClick={() => handleAddSection(idx)} className="text-xs font-semibold px-2 py-0.5 rounded border border-dashed transition-colors" style={{ color: '#4C94E8', borderColor: 'rgba(76,148,232,0.25)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,148,232,0.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                              + Add Section
                            </button>
                          </div>
                          {cls.subjects && cls.subjects.length > 0 && (
                            <div className="text-[10px] text-white/25 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold uppercase">Subjects:</span>
                              <span>{cls.subjects.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => setCurrentStep('profile')} className="btn-secondary px-5 py-3 text-sm flex items-center gap-2"><HiArrowLeft size={15} /> Back</button>
                    <button type="button" onClick={() => handleSaveAcademic(true)} disabled={saving} className="btn-primary px-8 py-3.5 text-sm font-bold flex items-center gap-2 disabled:opacity-60">
                      {saving ? 'Saving...' : 'Save & Continue'} <HiArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ════ STEP: STAFF ════ */}
              {currentStep === 'staff' && (
                <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6">

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.05]">
                    <div>
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2" style={{ background: 'rgba(76,148,232,0.1)', color: '#4C94E8', border: '1px solid rgba(76,148,232,0.15)' }}>Step 3 of 5</div>
                      <h1 className="text-2xl font-extrabold text-white tracking-tight">Staff Accounts & Invitations</h1>
                      <p className="text-sm text-white/40 mt-1">Invite teachers, registrars, and staff with secure single-use email invitations.</p>
                    </div>
                    <div className="flex items-center bg-surface-800 border border-white/[0.07] rounded-xl p-1 self-start flex-shrink-0">
                      <button type="button" onClick={() => setStaffMode('single')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${staffMode === 'single' ? 'text-white shadow-sm' : 'text-white/40 hover:text-white'}`} style={staffMode === 'single' ? { background: '#0A4D94' } : {}}>
                        <HiOutlineUserAdd size={13} /> Single
                      </button>
                      <button type="button" onClick={() => setStaffMode('csv')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${staffMode === 'csv' ? 'text-white shadow-sm' : 'text-white/40 hover:text-white'}`} style={staffMode === 'csv' ? { background: '#0A4D94' } : {}}>
                        <HiOutlineDocumentText size={13} /> Bulk CSV
                      </button>
                    </div>
                  </div>

                  {/* ── Staff Quota Status ── */}
                  {(() => {
                    const sq = quotas.staff || academicSummary.staffQuota;
                    const hasLimit = sq && sq.limit !== null && sq.limit !== undefined && sq.limit >= 0;
                    const limit = hasLimit ? sq.limit : null;
                    const used = sq ? sq.used : staffList.length;
                    const remaining = hasLimit ? Math.max(0, limit - used) : null;
                    const isFull = hasLimit && remaining === 0;

                    return (
                      <div
                        className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        style={{
                          background: isFull ? 'rgba(239,68,68,0.08)' : 'rgba(13,20,33,0.7)',
                          borderColor: isFull ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <HiOutlineUserGroup size={17} style={{ color: isFull ? '#ef4444' : '#4C94E8' }} className="flex-shrink-0" />
                          <div>
                            <span className="text-white font-semibold">Staff Accounts Quota: </span>
                            {hasLimit ? (
                              <span className="text-white/70">
                                <strong className="text-white">{used}</strong> of <strong className="text-white">{limit}</strong> accounts used
                              </span>
                            ) : (
                              <span className="text-white/70">
                                <strong className="text-white">{used}</strong> accounts invited (Unlimited on current plan)
                              </span>
                            )}
                          </div>
                        </div>

                        {hasLimit ? (
                          <span
                            className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                              isFull ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/15 text-[#4C94E8] border border-blue-500/20'
                            }`}
                          >
                            {remaining} {remaining === 1 ? 'slot' : 'slots'} available
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#3DBE63] border border-emerald-500/20">
                            Unlimited
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Single form */}
                  {staffMode === 'single' ? (
                    <form onSubmit={handleCreateSingleStaff} className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <HiOutlineUserAdd size={14} style={{ color: '#4C94E8' }} /> New Staff Member
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="field-label text-xs">Full Name <span className="text-red-400">*</span></label>
                          <input type="text" value={singleStaff.name} onChange={(e) => setSingleStaff(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Prof. Tariq Mehmood" className="input-field text-sm mt-1" required />
                        </div>
                        <div>
                          <label className="field-label text-xs">Email Address <span className="text-red-400">*</span></label>
                          <input type="email" value={singleStaff.email} onChange={(e) => setSingleStaff(s => ({ ...s, email: e.target.value }))} placeholder="tariq@example.com" className="input-field text-sm mt-1" required />
                        </div>
                        <div>
                          <label className="field-label text-xs">System Role</label>
                          <select value={singleStaff.role} onChange={(e) => setSingleStaff(s => ({ ...s, role: e.target.value }))} className="input-field text-sm capitalize mt-1">
                            <option value="teacher">Teacher / Faculty</option>
                            <option value="principal">Principal / Dean</option>
                            <option value="registrar">Registrar / Admissions</option>
                            <option value="accountant">Accountant / Finance</option>
                            <option value="employee">Staff Employee</option>
                          </select>
                        </div>
                        <div>
                          <label className="field-label text-xs">Phone Number</label>
                          <input type="tel" value={singleStaff.phone} onChange={(e) => setSingleStaff(s => ({ ...s, phone: e.target.value }))} placeholder="+92 300 1234567" className="input-field text-sm mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="field-label text-xs">Designation / Department</label>
                          <input type="text" value={singleStaff.designation} onChange={(e) => setSingleStaff(s => ({ ...s, designation: e.target.value }))} placeholder="e.g. Head of Physics Department" className="input-field text-sm mt-1" />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button type="submit" disabled={addingStaff} className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 font-semibold disabled:opacity-60">
                          {addingStaff ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</> : <><HiOutlineMail size={15} /> Send Invitation</>}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Bulk CSV */
                    <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            <HiOutlineDocumentText size={14} style={{ color: '#4C94E8' }} /> Upload Staff Roster CSV
                          </h3>
                          <p className="text-xs text-white/40 mt-1">Columns: <span className="font-mono text-[11px]" style={{ color: '#4C94E8' }}>Name, Email, Role, Phone, Designation</span></p>
                        </div>
                        <button type="button" onClick={handleDownloadStaffTemplate} className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start"><HiOutlineDownload size={13} /> Sample Template</button>
                      </div>
                      <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover:border-[#4C94E8]/40" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,20,33,0.5)' }}>
                        <input ref={staffFileInputRef} type="file" accept=".csv" onChange={handleStaffCsvFileChange} className="hidden" id="staff-csv-input" />
                        <label htmlFor="staff-csv-input" className="cursor-pointer block">
                          <HiOutlineUpload className="w-9 h-9 mx-auto mb-2" style={{ color: '#4C94E8' }} />
                          <span className="text-sm font-semibold text-white block">{staffCsvFile ? staffCsvFile.name : 'Click to select or drag & drop'}</span>
                          <span className="text-xs text-white/30 block mt-1">Maximum file size: 5 MB</span>
                        </label>
                      </div>
                      {staffCsvRows.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/50">Parsed <strong className="text-white">{staffCsvRows.length}</strong> staff records</span>
                            <button type="button" onClick={handleBulkUploadStaff} disabled={importingStaffCsv} className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 font-semibold disabled:opacity-60">
                              {importingStaffCsv ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Inviting...</> : <><HiOutlineMail size={13} /> Send All ({staffCsvRows.length})</>}
                            </button>
                          </div>
                          <div className="max-h-52 overflow-y-auto border border-white/[0.05] rounded-xl text-xs" style={{ background: '#04070d' }}>
                            <table className="w-full text-left">
                              <thead className="bg-surface-900 text-white/35 text-[10px] uppercase tracking-wider sticky top-0">
                                <tr><th className="p-2.5">#</th><th className="p-2.5">Name</th><th className="p-2.5">Email</th><th className="p-2.5">Role</th><th className="p-2.5">Designation</th></tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.03]">
                                {staffCsvRows.slice(0, 10).map((r, i) => (
                                  <tr key={i} className="hover:bg-white/[0.02]">
                                    <td className="p-2.5 text-white/20 font-mono">{i + 1}</td>
                                    <td className="p-2.5 font-medium text-white">{r.name}</td>
                                    <td className="p-2.5 text-white/55">{r.email}</td>
                                    <td className="p-2.5 capitalize" style={{ color: '#4C94E8' }}>{r.role}</td>
                                    <td className="p-2.5 text-white/35">{r.designation || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Staff Roster */}
                  <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <HiOutlineUserGroup size={14} style={{ color: '#4C94E8' }} /> College Staff Roster ({staffList.length})
                        </h3>
                        <p className="text-[11px] text-white/30 mt-0.5">All staff accounts registered or pending password setup.</p>
                      </div>
                      <button type="button" onClick={fetchStaffList} disabled={loadingStaff} className="text-xs text-white/35 hover:text-white flex items-center gap-1 transition-colors">
                        <HiOutlineRefresh size={13} className={loadingStaff ? 'animate-spin' : ''} /> Refresh
                      </button>
                    </div>
                    {loadingStaff ? (
                      <div className="py-4"><CollegesHubLoader size="xs" text="Loading roster…" minHeight="min-h-[80px]" /></div>
                    ) : staffList.length === 0 ? (
                      <div className="py-8 text-center text-white/25 text-xs rounded-xl border border-white/[0.04]" style={{ background: 'rgba(13,20,33,0.4)' }}>No staff members added yet. Use the form above to send an invitation.</div>
                    ) : (
                      <div className="overflow-x-auto border border-white/[0.04] rounded-xl text-xs" style={{ background: '#04070d' }}>
                        <table className="w-full text-left">
                          <thead className="bg-surface-900 text-white/35 text-[10px] uppercase tracking-wider border-b border-white/[0.04]">
                            <tr><th className="p-3">Staff Member</th><th className="p-3">Role</th><th className="p-3">Phone</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {staffList.map((st) => (
                              <tr key={st.id} className="hover:bg-white/[0.02]">
                                <td className="p-3"><div className="font-semibold text-white">{st.name}</div><div className="text-[11px] text-white/30">{st.email}</div></td>
                                <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(76,148,232,0.12)', color: '#4C94E8', border: '1px solid rgba(76,148,232,0.18)' }}>{st.role}</span></td>
                                <td className="p-3 text-white/40">{st.phone || '—'}</td>
                                <td className="p-3">
                                  {st.status === 'active'
                                    ? <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: '#3DBE63' }}><HiOutlineCheckCircle size={12} /> Active</span>
                                    : st.isExpired
                                    ? <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium"><HiOutlineExclamationCircle size={12} /> Expired</span>
                                    : <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium"><HiOutlineClock size={12} /> Invited</span>}
                                </td>
                                <td className="p-3 text-right">
                                  {st.status !== 'active' && (
                                    <button type="button" onClick={() => handleResendStaffInvite(st.id)} disabled={resendingStaffId === st.id} className="px-2.5 py-1 rounded text-[11px] text-white/55 hover:text-white transition-colors border border-white/[0.07] disabled:opacity-50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                      {resendingStaffId === st.id ? 'Sending...' : 'Resend'}
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

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => handleNavigateStep('academic')} className="btn-secondary px-5 py-3 text-sm flex items-center gap-2"><HiArrowLeft size={15} /> Back</button>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={async () => { await api.patch('/admin/onboarding/steps/skip', { skipStep: 'staff' }); handleNavigateStep('students'); }} className="btn-secondary px-4 py-3 text-sm text-white/45 hover:text-white">Skip for Now</button>
                      <button type="button" onClick={() => handleNavigateStep('students')} className="btn-primary px-7 py-3.5 text-sm font-bold flex items-center gap-2">Continue <HiArrowRight size={15} /></button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════ STEP: STUDENTS ════ */}
              {currentStep === 'students' && (
                <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6">

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.05]">
                    <div>
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2" style={{ background: 'rgba(76,148,232,0.1)', color: '#4C94E8', border: '1px solid rgba(76,148,232,0.15)' }}>Step 4 of 5</div>
                      <h1 className="text-2xl font-extrabold text-white tracking-tight">Student Bulk Enrollment</h1>
                      <p className="text-sm text-white/40 mt-1">Enroll students in bulk using CSV templates mapped to your active academic session.</p>
                    </div>
                    <button type="button" onClick={handleDownloadStudentTemplate} className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2 self-start font-semibold shadow-sm hover:border-[#4C94E8]/40 transition-all">
                      <HiOutlineDownload size={15} style={{ color: '#4C94E8' }} /> Download Excel / CSV Template
                    </button>
                    <button type="button" onClick={async () => {
                      try {
                        const res = await api.get('/admin/onboarding/students/template?format=xlsx', { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'students_import_template.xlsx');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (err) { toast.error('Failed to download Excel template'); }
                    }} className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2 self-start font-semibold shadow-sm hover:border-emerald-500/40 transition-all">
                      <HiOutlineDownload size={15} style={{ color: '#3DBE63' }} /> Download .xlsx Template
                    </button>
                  </div>

                  {/* ── Guidance Note: Configured Classes & Groups ── */}
                  {(() => {
                    const activeList = (academicSummary.classes && academicSummary.classes.length > 0)
                      ? academicSummary.classes
                      : (classesList && classesList.length > 0 ? classesList : []);

                    return (
                      <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'rgba(10,77,148,0.08)', borderColor: 'rgba(76,148,232,0.22)' }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <HiOutlineInformationCircle size={18} style={{ color: '#4C94E8' }} className="flex-shrink-0" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Configured Classes in your College ({activeList.length})
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleNavigateStep('academic')}
                            className="text-[11px] font-semibold text-[#4C94E8] hover:underline flex items-center gap-1 self-start"
                          >
                            + Add more classes in Step 2 →
                          </button>
                        </div>

                        <p className="text-xs text-white/60 leading-relaxed">
                          Your uploaded file's <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">Class</strong> column must match one of the exact class names below. Download the template above for pre-filled dummy examples for all of them:
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {activeList.map((c, i) => {
                            const grps = Array.isArray(c.groups) && c.groups.length > 0 ? c.groups.join(', ') : '';
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
                                style={{ background: 'rgba(13,20,33,0.7)', borderColor: 'rgba(255,255,255,0.08)' }}
                              >
                                <span className="font-semibold text-white font-mono">{c.name}</span>
                                {grps && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(76,148,232,0.15)', color: '#4C94E8' }}>
                                    {grps}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Student Quota Status Bar ── */}
                  {(() => {
                    const sq = quotas.students || academicSummary.studentQuota;
                    const hasLimit = sq && sq.limit !== null && sq.limit !== undefined && sq.limit >= 0;
                    const limit = hasLimit ? sq.limit : null;
                    const used = sq ? sq.used : (academicSummary.studentCount || 0);
                    const remaining = hasLimit ? Math.max(0, limit - used) : null;
                    const pct = hasLimit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                    const isFull = hasLimit && remaining === 0;

                    return (
                      <div
                        className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        style={{
                          background: isFull ? 'rgba(239,68,68,0.08)' : 'rgba(13,20,33,0.7)',
                          borderColor: isFull ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isFull ? 'rgba(239,68,68,0.15)' : 'rgba(76,148,232,0.12)',
                              color: isFull ? '#ef4444' : '#4C94E8'
                            }}
                          >
                            <HiOutlineAcademicCap size={20} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>Student Enrollment Quota</span>
                              {hasLimit ? (
                                <span
                                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                                    isFull
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : 'bg-emerald-500/15 text-[#3DBE63] border border-emerald-500/25'
                                  }`}
                                >
                                  {remaining} slots available
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-[#4C94E8] border border-blue-500/25">
                                  Unlimited Quota
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/45 mt-0.5">
                              {hasLimit ? (
                                <>
                                  Currently enrolled: <strong className="text-white">{used}</strong> of <strong className="text-white">{limit}</strong> maximum allowed students.
                                </>
                              ) : (
                                <>
                                  Currently enrolled: <strong className="text-white">{used}</strong> students. No hard cap on current subscription plan.
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {hasLimit && (
                          <div className="sm:w-48 flex flex-col gap-1.5 flex-shrink-0">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-white/40">Capacity Used</span>
                              <span className={pct >= 95 ? 'text-red-400 font-bold' : pct >= 75 ? 'text-amber-400 font-bold' : 'text-[#3DBE63] font-bold'}>
                                {pct}%
                              </span>
                            </div>
                            <div className="w-full bg-surface-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: pct >= 95 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#3DBE63'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="bg-surface-900 border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-5">
                    {/* Upload zone */}
                    <div className="border-2 border-dashed rounded-2xl p-10 text-center transition-all" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,20,33,0.5)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(61,190,99,0.35)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                      <input ref={studentFileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleStudentCsvChange} className="hidden" id="student-csv-input" />
                      <label htmlFor="student-csv-input" className="cursor-pointer block">
                        <HiOutlineUpload className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(61,190,99,0.6)' }} />
                        <span className="text-sm font-semibold text-white block">{studentCsvFile ? studentCsvFile.name : 'Select CSV or Excel (.xlsx) enrollment file'}</span>
                        <span className="text-xs text-white/30 block mt-1.5">Supports CSV and Excel files · Admission Number, Class, Section, Guardian details.</span>
                      </label>
                    </div>

                    {/* Background Import Status Banner */}
                    {bgBatchStatus && bgBatchStatus.status === 'processing' && (
                      <div className="p-4 rounded-xl border flex items-center gap-4 text-xs" style={{ background: 'rgba(61,190,99,0.07)', borderColor: 'rgba(61,190,99,0.25)' }}>
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold">Import running in background…</p>
                          <p className="text-white/50 mt-0.5">
                            {bgBatchStatus.created} created · {bgBatchStatus.skipped} skipped · {bgBatchStatus.failed} failed
                            <span className="ml-2 font-mono text-emerald-400">({bgBatchStatus.progress || 0}%)</span>
                          </p>
                          <div className="w-full h-1.5 rounded-full mt-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${bgBatchStatus.progress || 0}%`, background: '#3DBE63' }} />
                          </div>
                        </div>
                        <span className="text-emerald-400/70 font-semibold text-[11px] whitespace-nowrap">You can proceed ↓</span>
                      </div>
                    )}
                    {bgBatchStatus && bgBatchStatus.status === 'completed' && (
                      <div className="p-4 rounded-xl border flex items-center gap-3 text-xs" style={{ background: 'rgba(61,190,99,0.07)', borderColor: 'rgba(61,190,99,0.25)' }}>
                        <HiOutlineCheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold">Background import complete!</p>
                          <p className="text-white/50 mt-0.5">{bgBatchStatus.created} created · {bgBatchStatus.skipped} skipped · {bgBatchStatus.failed} failed</p>
                        </div>
                      </div>
                    )}

                    {/* CSV/Excel Preview & Import */}
                    {studentCsvRows.length > 0 && (() => {
                      const sq = quotas.students || academicSummary.studentQuota;
                      const hasLimit = sq && sq.limit !== null && sq.limit !== undefined && sq.limit >= 0;
                      const limit = hasLimit ? sq.limit : null;
                      const used = sq ? sq.used : (academicSummary.studentCount || 0);
                      const remaining = hasLimit ? Math.max(0, limit - used) : null;
                      const exceedsQuota = hasLimit && studentCsvRows.length > remaining;

                      return (
                        <div className="space-y-4">
                          {/* Exceeded Quota Alert */}
                          {exceedsQuota && (
                            <div
                              className="p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed"
                              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}
                            >
                              <HiOutlineExclamationCircle size={18} className="flex-shrink-0 mt-0.5 text-red-400" />
                              <div>
                                <strong className="text-white block font-semibold mb-0.5">Student Quota Exceeded Warning</strong>
                                Your CSV contains <strong className="text-white">{studentCsvRows.length}</strong> records, but your college quota only has <strong className="text-white">{remaining}</strong> available {remaining === 1 ? 'slot' : 'slots'} remaining ({used}/{limit} currently used).
                                {remaining === 0
                                  ? ' None of these students can be imported until your quota is increased.'
                                  : ` Only the first ${remaining} students will be imported; the remaining ${studentCsvRows.length - remaining} will be rejected.`}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3.5 rounded-xl border border-white/[0.05]" style={{ background: 'rgba(13,20,33,0.7)' }}>
                            <div>
                              <span className="text-white/50">Ready to import: </span>
                              <strong style={{ color: exceedsQuota ? '#ef4444' : '#3DBE63' }} className="text-sm">{studentCsvRows.length}</strong>
                              <span className="text-white/50"> student records</span>
                              {hasLimit && (
                                <span className="text-white/40 ml-2 font-mono">
                                  (Quota available: <strong className={remaining === 0 ? 'text-red-400' : 'text-[#3DBE63]'}>{remaining}</strong>)
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={handleImportStudents}
                              disabled={importingStudents || (hasLimit && remaining === 0)}
                              className="btn-primary py-2 px-6 text-xs flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                            >
                              {importingStudents
                                ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing ({importProgress}%)...</>
                                : <><HiOutlineAcademicCap size={14} /> Start Import ({studentCsvRows.length})</>}
                            </button>
                          </div>
                        {importingStudents && (
                          <div className="w-full rounded-full h-2 overflow-hidden border border-white/[0.04]" style={{ background: 'rgba(13,20,33,0.8)' }}>
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${importProgress}%`, background: '#3DBE63' }} />
                          </div>
                        )}
                        <div className="max-h-64 overflow-y-auto border border-white/[0.04] rounded-xl text-xs" style={{ background: '#04070d' }}>
                          <table className="w-full text-left">
                            <thead className="bg-surface-900 text-white/35 text-[10px] uppercase tracking-wider sticky top-0 border-b border-white/[0.04]">
                              <tr><th className="p-2.5">#</th><th className="p-2.5">Name</th><th className="p-2.5">Admission #</th><th className="p-2.5">Class</th><th className="p-2.5">Section</th><th className="p-2.5">Gender</th><th className="p-2.5">Phone</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                              {studentCsvRows.slice(0, 15).map((r, i) => (
                                <tr key={i} className="hover:bg-white/[0.02]">
                                  <td className="p-2.5 text-white/20 font-mono">{i + 1}</td>
                                  <td className="p-2.5 font-medium text-white">{r.Name || r.name}</td>
                                  <td className="p-2.5 font-mono text-[11px]" style={{ color: '#3DBE63' }}>{r['Admission Number'] || r.rollNumber || '—'}</td>
                                  <td className="p-2.5 text-white/55">{r.Class || r.class || '—'}</td>
                                  <td className="p-2.5 text-white/55">{r.Section || r.section || 'A'}</td>
                                  <td className="p-2.5 capitalize text-white/35">{r.Gender || r.gender || 'male'}</td>
                                  <td className="p-2.5 text-white/35">{r.Phone || r.phone || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );})()}

                    {/* Import Results */}
                    {importResult && (
                      <div className="p-5 rounded-2xl border border-white/[0.06] space-y-4" style={{ background: 'rgba(13,20,33,0.7)' }}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2"><HiOutlineCheckCircle size={17} style={{ color: '#3DBE63' }} /> Import Batch Completed</h4>
                          <span className="text-xs text-white/30 font-mono">Total: {importResult.summary?.total || 0} rows</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 rounded-xl" style={{ background: 'rgba(61,190,99,0.08)', border: '1px solid rgba(61,190,99,0.15)' }}>
                            <div className="text-xl font-bold" style={{ color: '#3DBE63' }}>{importResult.summary?.created || 0}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(61,190,99,0.65)' }}>Created</div>
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                            <div className="text-xl font-bold text-amber-400">{importResult.summary?.skipped || 0}</div>
                            <div className="text-[11px] text-amber-400/65 mt-0.5">Skipped</div>
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                            <div className="text-xl font-bold text-red-400">{importResult.summary?.failed || 0}</div>
                            <div className="text-[11px] text-red-400/65 mt-0.5">Failed</div>
                          </div>
                        </div>
                        {(importResult.summary?.failed > 0 || importResult.summary?.skipped > 0) && (
                          <div className="flex items-center justify-between p-3 rounded-xl text-xs" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}>
                            <span className="text-red-400/75">Some rows were skipped or had errors. Download the audit log to review.</span>
                            <button type="button" onClick={() => handleDownloadErrors(importResult.batchId)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-white"><HiOutlineDownload size={12} /> Error Report</button>
                          </div>
                        )}
                        {importResult.quota && !importResult.quota.isUnlimited && (
                          <div className="p-3 rounded-xl border border-white/[0.05] flex items-center justify-between text-xs" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <span className="text-white/50">Updated Student Capacity:</span>
                            <span className="font-mono font-bold text-white">
                              {importResult.quota.used} / {importResult.quota.limit} enrolled ({importResult.quota.remaining} slots remaining)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => handleNavigateStep('staff')} className="btn-secondary px-5 py-3 text-sm flex items-center gap-2"><HiArrowLeft size={15} /> Back</button>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={async () => { await api.patch('/admin/onboarding/steps/skip', { skipStep: 'students' }); handleNavigateStep('review'); }} className="btn-secondary px-4 py-3 text-sm text-white/45 hover:text-white">Skip for Now</button>
                      <button type="button" onClick={() => handleNavigateStep('review')} className="btn-primary px-7 py-3.5 text-sm font-bold flex items-center gap-2">Final Review <HiArrowRight size={15} /></button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════ STEP: REVIEW ════ */}
              {currentStep === 'review' && (
                <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="max-w-xl mx-auto">
                  <div className="bg-surface-900 border border-white/[0.07] rounded-2xl p-8 sm:p-10 space-y-7 shadow-2xl shadow-black/30">

                    {/* Icon */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(10,77,148,0.2), rgba(61,190,99,0.15))', border: '1px solid rgba(61,190,99,0.2)' }}>
                        <HiOutlineSparkles size={32} style={{ color: '#3DBE63' }} />
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mt-4" style={{ background: 'rgba(61,190,99,0.1)', color: '#3DBE63', border: '1px solid rgba(61,190,99,0.2)' }}>
                        Setup Complete
                      </div>
                      <h2 className="text-2xl font-extrabold text-white mt-2">Your College Workspace is Ready</h2>
                      <p className="text-sm text-white/45 mt-2 leading-relaxed">All essential modules have been configured. You can now access your comprehensive management dashboard.</p>
                    </div>

                    {/* Summary */}
                    <div className="p-5 rounded-xl border border-white/[0.05] space-y-0 text-xs" style={{ background: 'rgba(13,20,33,0.7)' }}>
                      {[
                        { label: 'Institution Name',      value: profile.name || '—',                           color: 'text-white' },
                        { label: 'Campus Location',       value: profile.city || 'Configured',                  color: 'text-white' },
                        { label: 'Academic Sessions',     value: `${academicSummary.sessionCount || 1} active`,  colorHex: '#3DBE63' },
                        { label: 'Classes Configured',    value: `${classesList.length} classes`,               colorHex: '#4C94E8' },
                        { label: 'Staff Members',         value: `${staffList.length} invited / active`,         color: 'text-purple-400' },
                        { label: 'Student Import',        value: importResult ? `${importResult.summary?.created || 0} imported` : 'Batch import ready', colorHex: '#3DBE63' },
                      ].map((row, i, arr) => (
                        <div key={i} className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                          <span className="text-white/40">{row.label}:</span>
                          <span className={`font-semibold ${row.color || ''}`} style={row.colorHex ? { color: row.colorHex } : {}}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button type="button" onClick={() => handleNavigateStep('profile')} className="btn-secondary w-full sm:w-auto px-5 py-3 text-sm">Review & Edit Details</button>
                      <button type="button" onClick={() => router.push('/admin')} className="btn-primary w-full sm:w-auto px-8 py-3.5 text-sm font-bold flex items-center justify-center gap-2">
                        Launch Dashboard <HiArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
