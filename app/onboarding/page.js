'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import CollegePublicProfileView from '@/components/college/CollegePublicProfileView';
import {
  HiOutlineOfficeBuilding, HiOutlineBookOpen, HiOutlineUserGroup,
  HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineUpload,
  HiOutlineTrash, HiOutlinePhotograph, HiOutlineExternalLink,
  HiOutlineEye, HiOutlineQuestionMarkCircle, HiArrowRight,
  HiArrowLeft, HiOutlineSave, HiOutlineRefresh, HiOutlinePlus,
  HiOutlineGlobe, HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker,
  HiOutlineInformationCircle, HiOutlineAcademicCap, HiOutlineDownload,
  HiOutlineDocumentText, HiOutlineExclamationCircle, HiOutlineUserAdd,
  HiOutlineClock
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
  const headers = lines[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].replace(/^["']|["']$/g, '') : '';
    });
    rows.push(obj);
  }

  return { headers, rows };
}

// ─── Step Definitions ────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  { id: 'verify',   title: 'Email Verified',   desc: 'Security clearance',     icon: HiOutlineCheckCircle },
  { id: 'profile',  title: 'College Profile',  desc: 'Branding & contacts',    icon: HiOutlineOfficeBuilding },
  { id: 'academic', title: 'Academic Setup',   desc: 'Sessions & classes',     icon: HiOutlineBookOpen },
  { id: 'staff',    title: 'Staff Accounts',   desc: 'Team setup',             icon: HiOutlineUserGroup },
  { id: 'students', title: 'Student Import',   desc: 'Enrollment batches',     icon: HiOutlineAcademicCap },
  { id: 'review',   title: 'Review & Launch',  desc: 'Publish workspace',      icon: HiOutlineSparkles },
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
      {
        name: 'FSc Pre-Medical (Part 1)',
        groups: ['Pre-Medical'],
        sections: ['A', 'B'],
        subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Islamic Studies']
      },
      {
        name: 'FSc Pre-Engineering (Part 1)',
        groups: ['Pre-Engineering'],
        sections: ['A', 'B'],
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu', 'Islamic Studies']
      },
      {
        name: 'ICS (Part 1)',
        groups: ['Computer Science'],
        sections: ['A', 'B'],
        subjects: ['Computer Science', 'Mathematics', 'Physics', 'English', 'Urdu', 'Islamic Studies']
      },
      {
        name: 'FSc Pre-Medical (Part 2)',
        groups: ['Pre-Medical'],
        sections: ['A'],
        subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Pak Studies']
      },
      {
        name: 'FSc Pre-Engineering (Part 2)',
        groups: ['Pre-Engineering'],
        sections: ['A'],
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu', 'Pak Studies']
      },
      {
        name: 'ICS (Part 2)',
        groups: ['Computer Science'],
        sections: ['A'],
        subjects: ['Computer Science', 'Mathematics', 'Physics', 'English', 'Urdu', 'Pak Studies']
      }
    ]
  },
  {
    id: 'matric',
    name: 'Matriculation (SSC)',
    tag: '9th & 10th Classes',
    desc: 'Secondary school curriculum for Science and General tracks.',
    sessionName: '2026-2027',
    classes: [
      {
        name: '9th Class (Science)',
        groups: ['Science'],
        sections: ['A', 'B'],
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Islamiyat']
      },
      {
        name: '9th Class (Computer)',
        groups: ['Computer Science'],
        sections: ['A'],
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Urdu', 'Islamiyat']
      },
      {
        name: '10th Class (Science)',
        groups: ['Science'],
        sections: ['A', 'B'],
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Pak Studies']
      },
      {
        name: '10th Class (Computer)',
        groups: ['Computer Science'],
        sections: ['A'],
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Urdu', 'Pak Studies']
      }
    ]
  },
  {
    id: 'bs',
    name: 'BS Degree Programs',
    tag: 'Undergraduate 4-Year',
    desc: 'Semester system higher education degree programs.',
    sessionName: 'Fall 2026 - Spring 2030',
    classes: [
      {
        name: 'BS Computer Science (Year 1)',
        groups: ['Computing'],
        sections: ['Section 1', 'Section 2'],
        subjects: ['Programming Fundamentals', 'Calculus', 'Applied Physics', 'English Composition']
      },
      {
        name: 'BS Software Engineering (Year 1)',
        groups: ['Computing'],
        sections: ['Section 1'],
        subjects: ['Introduction to SE', 'Discrete Structures', 'Calculus', 'English Composition']
      },
      {
        name: 'BBA (Year 1)',
        groups: ['Business Administration'],
        sections: ['Section 1'],
        subjects: ['Principles of Management', 'Microeconomics', 'Business Math', 'Business English']
      }
    ]
  },
  {
    id: 'custom',
    name: 'Custom Structure',
    tag: 'Flexible / Build your own',
    desc: 'Define custom academic sessions, classes and subject combinations.',
    sessionName: '2026-2027',
    classes: [
      {
        name: 'First Year (Class 1)',
        groups: ['General'],
        sections: ['A'],
        subjects: ['Core Subject 1', 'Core Subject 2', 'English']
      }
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState('profile');
  const [stepsState, setStepsState] = useState({
    verify: 'done',
    profile: 'todo',
    academic: 'todo',
    staff: 'todo',
    students: 'todo',
    review: 'todo'
  });
  const [completionPercent, setCompletionPercent] = useState(16);
  const [academicSummary, setAcademicSummary] = useState({ sessionCount: 0, classCount: 0 });

  // View mode for desktop: form vs preview vs split
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview'

  // ── Profile Form State ──
  const [profile, setProfile] = useState({
    name: '',
    tagline: '',
    about: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    establishedYear: '',
    affiliation: '',
    logo: '',
    logo_key: null,
    coverPhoto: '',
    cover_key: null,
    gallery: [],
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      whatsapp: ''
    }
  });

  // ── Academic Form State ──
  const [selectedPreset, setSelectedPreset] = useState('intermediate');
  const [sessionData, setSessionData] = useState({
    name: '2026-2027',
    startDate: '2026-09-01',
    endDate: '2027-06-30'
  });
  const [classesList, setClassesList] = useState(ACADEMIC_PRESETS[0].classes);

  // ── Gallery item upload caption ──
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const staffFileInputRef = useRef(null);
  const studentFileInputRef = useRef(null);

  // ── Staff State ──
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffMode, setStaffMode] = useState('single'); // 'single' | 'csv'
  const [singleStaff, setSingleStaff] = useState({
    name: '',
    email: '',
    role: 'teacher',
    phone: '',
    designation: ''
  });
  const [addingStaff, setAddingStaff] = useState(false);
  const [resendingStaffId, setResendingStaffId] = useState(null);
  const [staffCsvFile, setStaffCsvFile] = useState(null);
  const [staffCsvRows, setStaffCsvRows] = useState([]);
  const [importingStaffCsv, setImportingStaffCsv] = useState(false);

  // ── Student Bulk Import State ──
  const [studentCsvFile, setStudentCsvFile] = useState(null);
  const [studentCsvRows, setStudentCsvRows] = useState([]);
  const [importingStudents, setImportingStudents] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [recentBatches, setRecentBatches] = useState([]);

  // ── Load Server Onboarding State ──
  const fetchOnboardingState = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/onboarding');
      if (res.data?.success) {
        const data = res.data.data;
        const c = data.college || {};

        setStepsState(data.steps || {});
        setCompletionPercent(data.completionPercent || 16);
        setAcademicSummary(data.academicSummary || { sessionCount: 0, classCount: 0 });

        if (data.currentStep) {
          setCurrentStep(data.currentStep);
        }

        // Pre-fill profile
        setProfile({
          name: c.name || '',
          tagline: c.tagline || '',
          about: c.about || '',
          address: c.address || '',
          city: c.city || '',
          phone: c.phone || '',
          email: c.email || '',
          website: c.website || '',
          establishedYear: c.establishedYear || c.established_year || '',
          affiliation: c.affiliation || '',
          logo: c.logo || '',
          logo_key: c.logo_key || null,
          coverPhoto: c.coverPhoto || '',
          cover_key: c.cover_key || null,
          gallery: Array.isArray(c.gallery) ? c.gallery : [],
          socialLinks: {
            facebook: c.socialLinks?.facebook || '',
            twitter: c.socialLinks?.twitter || '',
            instagram: c.socialLinks?.instagram || '',
            linkedin: c.socialLinks?.linkedin || '',
            youtube: c.socialLinks?.youtube || '',
            whatsapp: c.socialLinks?.whatsapp || ''
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

  useEffect(() => {
    fetchOnboardingState();
  }, []);

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

    const sizeLimits = {
      logo: 1 * 1024 * 1024,
      cover: 3 * 1024 * 1024,
      gallery: 2 * 1024 * 1024
    };

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
            gallery: [
              ...p.gallery,
              { key: objectKey, url, caption: newGalleryCaption || `Campus Photo ${p.gallery.length + 1}` }
            ]
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
    if (!profile.name.trim()) {
      return toast.error('College name is required');
    }
    if (!profile.city.trim()) {
      return toast.error('Campus city is required');
    }
    if (!profile.phone.trim() && !profile.email.trim()) {
      return toast.error('Please provide at least a phone number or public email');
    }

    setSaving(true);
    try {
      const res = await api.patch('/admin/onboarding/steps/profile', profile);
      if (res.data?.success) {
        toast.success('College profile saved!');
        await fetchOnboardingState();
        if (advance) {
          setCurrentStep('academic');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── Save Academic Step ──
  const handleSaveAcademic = async (advance = true) => {
    if (!sessionData.name.trim()) {
      return toast.error('Academic session name is required');
    }
    if (classesList.length === 0) {
      return toast.error('Please configure at least one class');
    }

    setSaving(true);
    try {
      const payload = {
        session: sessionData,
        classes: classesList,
        preset: selectedPreset
      };

      const res = await api.patch('/admin/onboarding/steps/academic', payload);
      if (res.data?.success) {
        toast.success('Academic structure saved successfully!');
        await fetchOnboardingState();
        if (advance) {
          setCurrentStep('staff');
        }
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

  // ── Save and Continue Later ──
  const handleSaveAndContinueLater = async () => {
    if (currentStep === 'profile') {
      await handleSaveProfile(false);
    } else if (currentStep === 'academic') {
      await handleSaveAcademic(false);
    }
    toast.success('Progress saved! You can resume from any device at any time.');
  };

  // ── Add/Remove Class Helpers ──
  const handleAddClass = () => {
    setClassesList(prev => [
      ...prev,
      {
        name: `New Class ${prev.length + 1}`,
        groups: ['General'],
        sections: ['A'],
        subjects: ['General Subject']
      }
    ]);
  };

  const handleRemoveClass = (index) => {
    setClassesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateClassName = (index, newName) => {
    setClassesList(prev => {
      const copy = [...prev];
      copy[index].name = newName;
      return copy;
    });
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
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (currentStep === 'staff') {
      fetchStaffList();
    }
  }, [currentStep]);

  const handleCreateSingleStaff = async (e) => {
    if (e) e.preventDefault();
    if (!singleStaff.name.trim() || singleStaff.name.trim().length < 2) {
      return toast.error('Full name is required (min 2 chars)');
    }
    if (!singleStaff.email.trim() || !singleStaff.email.includes('@')) {
      return toast.error('A valid email address is required');
    }

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
      if (res.data?.success) {
        toast.success(res.data.message || 'Invitation resent successfully!');
        await fetchStaffList();
      }
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
          name: r.Name || r.name || '',
          email: r.Email || r.email || '',
          role: (r.Role || r.role || 'employee').toLowerCase(),
          phone: r.Phone || r.phone || '',
          designation: r.Designation || r.designation || ''
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
      if (res.data?.success) {
        setRecentBatches(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load recent batches:', err);
    }
  };

  useEffect(() => {
    if (currentStep === 'students') {
      fetchRecentBatches();
    }
  }, [currentStep]);

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
    } catch (err) {
      toast.error('Failed to download student template');
    }
  };

  const handleStudentCsvChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudentCsvFile(file);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        const { rows } = parseCSV(text);
        setStudentCsvRows(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleImportStudents = async () => {
    if (studentCsvRows.length === 0) return toast.error('No student records to import');
    setImportingStudents(true);
    setImportProgress(30);
    try {
      setImportProgress(60);
      const res = await api.post('/admin/onboarding/students/import', {
        filename: studentCsvFile?.name || 'students.csv',
        students: studentCsvRows
      });
      setImportProgress(100);
      if (res.data?.success) {
        setImportResult(res.data);
        const { created = 0, skipped = 0, failed = 0 } = res.data.summary || {};
        toast.success(`Import finished: ${created} created, ${skipped} skipped, ${failed} failed.`);
        await fetchRecentBatches();
        await fetchOnboardingState();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import student CSV');
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
    } catch (err) {
      toast.error('Failed to download error audit report');
    }
  };

  // ── Live Preview Data Object ──
  const livePreviewData = useMemo(() => {
    return {
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
    };
  }, [profile, classesList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-3 text-white">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/50 font-medium">Restoring your onboarding state…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-white flex flex-col">

      {/* ── Top Header / Onboarding Shell ── */}
      <header className="sticky top-0 z-40 bg-surface-900/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Collegeshub Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A4D94] to-[#083b72] flex items-center justify-center font-black text-white text-base shadow-md">
              C
            </div>
            <div>
              <div className="flex items-baseline text-sm font-extrabold tracking-tight">
                <span className="text-white">Colleges</span>
                <span className="text-[#299A49]">hub</span>
                <span className="text-[10px] text-[#299A49] font-bold ml-0.5">.org</span>
              </div>
              <p className="text-[10px] text-white/40 font-medium -mt-0.5">Campus Setup Wizard</p>
            </div>
          </div>

          {/* Stepper Progress Indicator (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-40 bg-surface-800 rounded-full h-2 overflow-hidden border border-white/[0.06]">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{completionPercent}%</span>
          </div>

          {/* Action: Save and continue later */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAndContinueLater}
              disabled={saving}
              className="btn-secondary text-xs py-2 px-3 sm:px-4 flex items-center gap-1.5 hover:text-white"
            >
              <HiOutlineSave size={14} className="text-white/60" />
              <span className="hidden sm:inline">Save & Continue Later</span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>

        {/* ── Labelled Steps Bar (Desktop) & Dots (Mobile) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 border-t border-white/[0.03] overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[540px] sm:min-w-0 gap-2">
            {ONBOARDING_STEPS.map((step, idx) => {
              const isDone = stepsState[step.id] === 'done';
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleNavigateStep(step.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                    isCurrent
                      ? 'bg-indigo-500/15 border border-indigo-500/30 text-white'
                      : isDone
                      ? 'text-emerald-400 hover:bg-white/[0.03]'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.05] text-white/40'
                  }`}>
                    {isDone ? <HiOutlineCheckCircle size={12} /> : idx + 1}
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Content Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── STEP 1: VERIFIED EMAIL (Informational card) ── */}
        {currentStep === 'verify' && (
          <div className="max-w-2xl mx-auto glass-card p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <HiOutlineCheckCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Administrator Email Verified</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Your administrative credentials and college workspace access have been successfully verified. You are ready to configure your college profile.
            </p>
            <button
              type="button"
              onClick={() => handleNavigateStep('profile')}
              className="btn-primary px-6 py-3 mx-auto flex items-center gap-2 text-sm"
            >
              Continue to College Profile <HiArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 2: COLLEGE PROFILE ── */}
        {currentStep === 'profile' && (
          <div className="space-y-6">

            {/* View Mode Toggle Bar (Desktop & Mobile) */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Step 1: College Profile & Branding
                </h1>
                <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                  Set up public information, logos, cover image, and contact links for visitors and prospective students.
                </p>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-surface-900 border border-white/[0.08] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'form' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <HiOutlineEye size={14} /> Live Preview
                </button>
              </div>
            </div>

            {/* Split Screen / Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* LEFT / EDIT FORM */}
              <div className={`space-y-6 ${activeTab === 'preview' ? 'hidden lg:block lg:col-span-6' : 'lg:col-span-12 xl:col-span-7'}`}>

                {/* "Why We Ask" Helper Box */}
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                  <HiOutlineInformationCircle size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-indigo-200/80">
                    <strong className="text-white">Why we ask:</strong> Your college profile powers your dedicated subdomain page (e.g. <span className="font-mono text-indigo-300 font-semibold">{profile.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'fmc'}.collegeshub.org</span>). Prospective students view these details before applying for admissions.
                  </div>
                </div>

                {/* Core Details Card */}
                <div className="glass-card p-5 sm:p-7 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HiOutlineOfficeBuilding className="text-indigo-400" /> Basic Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="field-label text-xs">
                        College Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Federal Medical College"
                        className="input-field text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="field-label text-xs">Tagline or Motto</label>
                        <span className="text-[10px] text-white/30 font-mono">{profile.tagline.length}/120</span>
                      </div>
                      <input
                        type="text"
                        maxLength={120}
                        value={profile.tagline}
                        onChange={(e) => setProfile(p => ({ ...p, tagline: e.target.value }))}
                        placeholder="e.g. Excellence in Medical Education & Healthcare Research"
                        className="input-field text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="field-label text-xs">About Institution</label>
                        <span className="text-[10px] text-white/30 font-mono">{profile.about.length}/1500</span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={1500}
                        value={profile.about}
                        onChange={(e) => setProfile(p => ({ ...p, about: e.target.value }))}
                        placeholder="Provide an overview of your college history, vision, campus facilities, and academic achievements..."
                        className="input-field text-sm leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs">Established Year</label>
                      <input
                        type="number"
                        min="1800"
                        max={new Date().getFullYear()}
                        value={profile.establishedYear}
                        onChange={(e) => setProfile(p => ({ ...p, establishedYear: e.target.value }))}
                        placeholder="e.g. 2012"
                        className="input-field text-sm"
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs">Affiliation / Board</label>
                      <input
                        type="text"
                        value={profile.affiliation}
                        onChange={(e) => setProfile(p => ({ ...p, affiliation: e.target.value }))}
                        placeholder="e.g. PMDC / SZABMU / FBISE"
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Media & Visuals Card */}
                <div className="glass-card p-5 sm:p-7 space-y-5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HiOutlinePhotograph className="text-indigo-400" /> Branding & Visuals
                  </h3>

                  {/* Logo Upload */}
                  <div>
                    <label className="field-label text-xs">
                      College Logo (Max 1 MB, PNG/JPG/WebP) <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="w-16 h-16 rounded-xl bg-surface-900 border border-white/[0.1] overflow-hidden flex items-center justify-center flex-shrink-0">
                        {profile.logo ? (
                          <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-white/30 font-bold">No Logo</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                        />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                        >
                          <HiOutlineUpload size={14} /> Upload Logo
                        </button>
                        <p className="text-[11px] text-white/40 mt-1">
                          Auto-optimized to 512×512px. Transparent PNG or square recommended.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Photo Upload */}
                  <div className="border-t border-white/[0.06] pt-4">
                    <label className="field-label text-xs">
                      Cover Banner Photo (Max 3 MB, JPG/PNG/WebP)
                    </label>
                    <div className="mt-2 space-y-2">
                      {profile.coverPhoto && (
                        <div className="w-full h-28 rounded-xl overflow-hidden bg-surface-900 border border-white/[0.08] relative">
                          <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProfile(p => ({ ...p, coverPhoto: '', cover_key: null }))}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      )}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover')}
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                      >
                        <HiOutlineUpload size={14} /> {profile.coverPhoto ? 'Replace Cover Image' : 'Upload Cover Image'}
                      </button>
                      <p className="text-[11px] text-white/40">
                        Wide 16:9 landscape photo of your main campus or building (max 1600px wide).
                      </p>
                    </div>
                  </div>

                  {/* Campus Gallery */}
                  <div className="border-t border-white/[0.06] pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="field-label text-xs">
                        Campus Gallery (Up to 8 images, Max 2 MB each)
                      </label>
                      <span className="text-[10px] text-white/40 font-mono">
                        {profile.gallery.length}/8 uploaded
                      </span>
                    </div>

                    {profile.gallery.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {profile.gallery.map((img, i) => (
                          <div key={i} className="aspect-video rounded-lg overflow-hidden bg-surface-900 border border-white/[0.06] relative group">
                            <img src={img.url} alt={img.caption || `Campus ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProfile(p => ({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i) }))}
                              className="absolute top-1 right-1 p-1 rounded bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <HiOutlineTrash size={12} />
                            </button>
                            {img.caption && (
                              <div className="absolute inset-x-0 bottom-0 bg-surface-950/80 p-1 text-[9px] text-white truncate">
                                {img.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {profile.gallery.length < 8 && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Optional image caption (e.g. Science Laboratory)"
                          value={newGalleryCaption}
                          onChange={(e) => setNewGalleryCaption(e.target.value)}
                          className="input-field text-xs flex-1"
                        />
                        <input
                          ref={galleryInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'gallery')}
                        />
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <HiOutlinePlus size={14} /> Add Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Contact Information */}
                <div className="glass-card p-5 sm:p-7 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HiOutlineLocationMarker className="text-indigo-400" /> Location & Contact
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label text-xs">
                        Campus City <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
                        placeholder="e.g. Islamabad"
                        className="input-field text-sm"
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs">Campus Address</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
                        placeholder="e.g. Sector H-8/4"
                        className="input-field text-sm"
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs">Public Phone Number</label>
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                        placeholder="e.g. +92 51 9265003"
                        className="input-field text-sm"
                      />
                    </div>

                    <div>
                      <label className="field-label text-xs">Public Inquiries Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                        placeholder="e.g. admissions@fmc.edu.pk"
                        className="input-field text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="field-label text-xs">Website URL</label>
                      <input
                        type="url"
                        value={profile.website}
                        onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))}
                        placeholder="e.g. https://www.fmc.edu.pk"
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="glass-card p-5 sm:p-7 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HiOutlineGlobe className="text-indigo-400" /> Social Links (Optional)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="field-label text-[11px] flex items-center gap-1.5">
                        <FaFacebook className="text-blue-500" /> Facebook
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks.facebook}
                        onChange={(e) => setProfile(p => ({
                          ...p,
                          socialLinks: { ...p.socialLinks, facebook: e.target.value }
                        }))}
                        placeholder="https://facebook.com/..."
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label text-[11px] flex items-center gap-1.5">
                        <FaInstagram className="text-pink-500" /> Instagram
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks.instagram}
                        onChange={(e) => setProfile(p => ({
                          ...p,
                          socialLinks: { ...p.socialLinks, instagram: e.target.value }
                        }))}
                        placeholder="https://instagram.com/..."
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label text-[11px] flex items-center gap-1.5">
                        <FaTwitter className="text-sky-400" /> Twitter / X
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks.twitter}
                        onChange={(e) => setProfile(p => ({
                          ...p,
                          socialLinks: { ...p.socialLinks, twitter: e.target.value }
                        }))}
                        placeholder="https://x.com/..."
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label text-[11px] flex items-center gap-1.5">
                        <FaLinkedin className="text-blue-400" /> LinkedIn
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks.linkedin}
                        onChange={(e) => setProfile(p => ({
                          ...p,
                          socialLinks: { ...p.socialLinks, linkedin: e.target.value }
                        }))}
                        placeholder="https://linkedin.com/school/..."
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label text-[11px] flex items-center gap-1.5">
                        <FaYoutube className="text-red-500" /> YouTube
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks.youtube}
                        onChange={(e) => setProfile(p => ({
                          ...p,
                          socialLinks: { ...p.socialLinks, youtube: e.target.value }
                        }))}
                        placeholder="https://youtube.com/@..."
                        className="input-field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label text-[11px] flex items-center gap-1.5">
                        <FaWhatsapp className="text-emerald-500" /> WhatsApp
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks.whatsapp}
                        onChange={(e) => setProfile(p => ({
                          ...p,
                          socialLinks: { ...p.socialLinks, whatsapp: e.target.value }
                        }))}
                        placeholder="https://wa.me/..."
                        className="input-field text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveProfile(true)}
                    disabled={saving}
                    className="btn-primary px-8 py-3.5 text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 font-bold"
                  >
                    {saving ? 'Saving Profile...' : 'Save & Continue to Academic Setup'}
                    <HiArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* RIGHT / LIVE PREVIEW PANE */}
              <div className={`space-y-4 ${activeTab === 'form' ? 'hidden xl:block xl:col-span-5' : 'lg:col-span-12'}`}>
                <div className="sticky top-24 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineEye className="text-indigo-400" /> Live Public Profile Preview
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">100% Shared Component</span>
                  </div>

                  {/* Render Shared Public Profile Component */}
                  <div className="max-h-[750px] overflow-y-auto rounded-2xl border border-white/[0.08] shadow-2xl scrollbar-thin">
                    <CollegePublicProfileView
                      college={livePreviewData}
                      isPreview={true}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── STEP 3: ACADEMIC SETUP ── */}
        {currentStep === 'academic' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-white/[0.06] pb-4">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Step 2: Academic Setup & Programs
              </h1>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                Set up your first academic session and create your classes, sections, and study tracks.
              </p>
            </div>

            {/* "Why We Ask" Helper Box */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
              <HiOutlineInformationCircle size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-indigo-200/80">
                <strong className="text-white">Why we ask:</strong> Academics form the backbone of your college. Every student enrolled and timetable scheduled is mapped to an active session, class, and section. You can choose a quick preset below and customize it.
              </div>
            </div>

            {/* Quick-Start Presets */}
            <div className="space-y-3">
              <label className="field-label text-xs">Choose Quick-Start Preset</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ACADEMIC_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                          : 'bg-surface-900 border-white/[0.06] text-white/70 hover:border-white/[0.15] hover:bg-surface-850'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-white/[0.06] text-white/40'
                        }`}>
                          {preset.tag}
                        </span>
                        {isSelected && <HiOutlineCheckCircle className="text-indigo-400" size={16} />}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{preset.name}</h4>
                      <p className="text-[11px] text-white/50 leading-relaxed mt-1">{preset.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Settings */}
            <div className="glass-card p-5 sm:p-7 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HiOutlineBookOpen className="text-indigo-400" /> Academic Session
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label text-xs">
                    Session Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={sessionData.name}
                    onChange={(e) => setSessionData(s => ({ ...s, name: e.target.value }))}
                    placeholder="e.g. 2026-2027"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="field-label text-xs">Session Start Date</label>
                  <input
                    type="date"
                    value={sessionData.startDate}
                    onChange={(e) => setSessionData(s => ({ ...s, startDate: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="field-label text-xs">Session End Date</label>
                  <input
                    type="date"
                    value={sessionData.endDate}
                    onChange={(e) => setSessionData(s => ({ ...s, endDate: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Classes & Sections Setup */}
            <div className="glass-card p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HiOutlineAcademicCap className="text-indigo-400" /> Classes & Sections ({classesList.length})
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">Customize class names, sections, and subjects as needed.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddClass}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <HiOutlinePlus size={14} /> Add Class
                </button>
              </div>

              <div className="space-y-3.5">
                {classesList.map((cls, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-900 border border-white/[0.05] hover:border-white/[0.1] transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={cls.name}
                          onChange={(e) => handleUpdateClassName(idx, e.target.value)}
                          className="input-field text-sm font-bold py-1.5 flex-1 max-w-sm"
                          placeholder="Class Name"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(idx)}
                        className="text-white/30 hover:text-red-400 p-1.5 transition-colors"
                        title="Delete class"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>

                    {/* Sections */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.03]">
                      <span className="text-[11px] text-white/40 font-semibold uppercase mr-1">Sections:</span>
                      {(cls.sections || []).map((sec, secIdx) => (
                        <span
                          key={secIdx}
                          className="px-2.5 py-1 rounded-md bg-white/[0.04] text-xs font-mono font-bold text-white/80 border border-white/[0.06] flex items-center gap-1.5"
                        >
                          Section {sec}
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(idx, secIdx)}
                            className="text-white/30 hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddSection(idx)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-0.5 rounded border border-dashed border-indigo-500/30 hover:bg-indigo-500/10 transition-colors"
                      >
                        + Add Section
                      </button>
                    </div>

                    {/* Subjects preview */}
                    {cls.subjects && cls.subjects.length > 0 && (
                      <div className="text-[11px] text-white/40 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold uppercase">Subjects:</span>
                        <span>{cls.subjects.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep('profile')}
                className="btn-secondary px-5 py-3 text-xs sm:text-sm flex items-center gap-2"
              >
                <HiArrowLeft size={16} /> Back to Profile
              </button>

              <button
                type="button"
                onClick={() => handleSaveAcademic(true)}
                disabled={saving}
                className="btn-primary px-8 py-3.5 text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 font-bold"
              >
                {saving ? 'Saving...' : 'Save & Proceed to Staff Setup'}
                <HiArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: STAFF ACCOUNTS ── */}
        {currentStep === 'staff' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Step 3: Staff Accounts & Role Invitations
                </h1>
                <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                  Invite teachers, registrars, accountants, and staff with secure single-use "Set Your Password" email invitations.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-surface-900 border border-white/[0.08] rounded-xl p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setStaffMode('single')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    staffMode === 'single' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <HiOutlineUserAdd size={14} /> Single Invite
                </button>
                <button
                  type="button"
                  onClick={() => setStaffMode('csv')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    staffMode === 'csv' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <HiOutlineDocumentText size={14} /> Bulk CSV
                </button>
              </div>
            </div>

            {/* Mode 1: Single Staff Invitation Form */}
            {staffMode === 'single' ? (
              <form onSubmit={handleCreateSingleStaff} className="glass-card p-5 sm:p-7 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HiOutlineUserAdd className="text-indigo-400" /> New Staff Member Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="field-label text-xs">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={singleStaff.name}
                      onChange={(e) => setSingleStaff(s => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. Prof. Tariq Mehmood"
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label text-xs">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={singleStaff.email}
                      onChange={(e) => setSingleStaff(s => ({ ...s, email: e.target.value }))}
                      placeholder="tariq@example.com"
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label text-xs">System Role</label>
                    <select
                      value={singleStaff.role}
                      onChange={(e) => setSingleStaff(s => ({ ...s, role: e.target.value }))}
                      className="input-field text-sm capitalize"
                    >
                      <option value="teacher">Teacher / Faculty</option>
                      <option value="principal">Principal / Dean</option>
                      <option value="registrar">Registrar / Admissions</option>
                      <option value="accountant">Accountant / Finance</option>
                      <option value="employee">Staff Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label text-xs">Phone Number</label>
                    <input
                      type="tel"
                      value={singleStaff.phone}
                      onChange={(e) => setSingleStaff(s => ({ ...s, phone: e.target.value }))}
                      placeholder="+92 300 1234567"
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="field-label text-xs">Designation / Department</label>
                    <input
                      type="text"
                      value={singleStaff.designation}
                      onChange={(e) => setSingleStaff(s => ({ ...s, designation: e.target.value }))}
                      placeholder="e.g. Head of Physics Department"
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={addingStaff}
                    className="btn-primary py-2.5 px-6 text-xs sm:text-sm flex items-center gap-2 font-bold"
                  >
                    {addingStaff ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending Invite...
                      </>
                    ) : (
                      <>
                        <HiOutlineMail size={16} /> Send Email Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: Bulk CSV Upload */
              <div className="glass-card p-5 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <HiOutlineDocumentText className="text-indigo-400" /> Upload Staff Roster CSV
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Columns: <span className="font-mono text-indigo-300">Name, Email, Role, Phone, Designation</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadStaffTemplate}
                    className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <HiOutlineDownload size={15} /> Download Sample Template
                  </button>
                </div>

                <div className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-6 text-center transition-all bg-surface-900/50">
                  <input
                    ref={staffFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleStaffCsvFileChange}
                    className="hidden"
                    id="staff-csv-input"
                  />
                  <label htmlFor="staff-csv-input" className="cursor-pointer block">
                    <HiOutlineUpload className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                    <span className="text-sm font-semibold text-white block">
                      {staffCsvFile ? staffCsvFile.name : 'Click to select or drag & drop staff CSV file'}
                    </span>
                    <span className="text-xs text-white/40 block mt-1">Maximum file size: 5 MB</span>
                  </label>
                </div>

                {staffCsvRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">
                        Parsed <strong>{staffCsvRows.length}</strong> staff member records
                      </span>
                      <button
                        type="button"
                        onClick={handleBulkUploadStaff}
                        disabled={importingStaffCsv}
                        className="btn-primary py-2 px-5 text-xs flex items-center gap-2 font-bold"
                      >
                        {importingStaffCsv ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Inviting Members...
                          </>
                        ) : (
                          <>
                            <HiOutlineMail size={14} /> Send Invitations to All ({staffCsvRows.length})
                          </>
                        )}
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto border border-white/[0.06] rounded-xl bg-surface-950 text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-surface-900 text-white/60 text-[11px] uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Role</th>
                            <th className="p-2.5">Designation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {staffCsvRows.slice(0, 10).map((r, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]">
                              <td className="p-2.5 text-white/30 font-mono">{i + 1}</td>
                              <td className="p-2.5 font-medium text-white">{r.name}</td>
                              <td className="p-2.5 text-white/70">{r.email}</td>
                              <td className="p-2.5 capitalize text-indigo-400">{r.role}</td>
                              <td className="p-2.5 text-white/50">{r.designation || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Staff Roster Table */}
            <div className="glass-card p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HiOutlineUserGroup className="text-indigo-400" /> College Staff Roster ({staffList.length})
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">All staff accounts registered or pending password creation.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchStaffList}
                  disabled={loadingStaff}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <HiOutlineRefresh size={14} className={loadingStaff ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {loadingStaff ? (
                <div className="py-8 text-center text-white/40 text-xs">Loading staff roster...</div>
              ) : staffList.length === 0 ? (
                <div className="py-8 text-center text-white/40 text-xs bg-surface-900/40 rounded-xl border border-white/[0.04]">
                  No staff members added yet. Use the form above to send an invitation.
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/[0.06] rounded-xl bg-surface-900 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-surface-850 text-white/60 text-[11px] uppercase tracking-wider border-b border-white/[0.06]">
                      <tr>
                        <th className="p-3">Staff Member</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {staffList.map((st) => (
                        <tr key={st.id} className="hover:bg-white/[0.02]">
                          <td className="p-3">
                            <div className="font-semibold text-white">{st.name}</div>
                            <div className="text-[11px] text-white/40">{st.email}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {st.role}
                            </span>
                          </td>
                          <td className="p-3 text-white/60">{st.phone || '—'}</td>
                          <td className="p-3">
                            {st.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                <HiOutlineCheckCircle size={13} /> Active
                              </span>
                            ) : st.isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
                                <HiOutlineExclamationCircle size={13} /> Invite Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                <HiOutlineClock size={13} /> Invited
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {st.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleResendStaffInvite(st.id)}
                                disabled={resendingStaffId === st.id}
                                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-white/80 hover:text-white transition-colors border border-white/10"
                              >
                                {resendingStaffId === st.id ? 'Sending...' : 'Resend Invite'}
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

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => handleNavigateStep('academic')}
                className="btn-secondary px-5 py-3 text-xs sm:text-sm flex items-center gap-2"
              >
                <HiArrowLeft size={16} /> Back to Academic
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await api.patch('/admin/onboarding/steps/skip', { skipStep: 'staff' });
                    handleNavigateStep('students');
                  }}
                  className="btn-secondary px-4 py-3 text-xs sm:text-sm text-white/60 hover:text-white"
                >
                  Skip for Now
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateStep('students')}
                  className="btn-primary px-7 py-3 text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 font-bold"
                >
                  Save & Proceed to Student Import <HiArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: STUDENT IMPORT ── */}
        {currentStep === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Step 4: Student Bulk Enrollment
                </h1>
                <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                  Enroll students in bulk using CSV templates dynamically mapped to your college's active academic session, classes, and sections.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadStudentTemplate}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-2 self-start sm:self-auto font-semibold"
              >
                <HiOutlineDownload size={16} className="text-indigo-400" />
                Download Dynamic CSV Template
              </button>
            </div>

            {/* Upload Box */}
            <div className="glass-card p-5 sm:p-7 space-y-5">
              <div className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-all bg-surface-900/50">
                <input
                  ref={studentFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleStudentCsvChange}
                  className="hidden"
                  id="student-csv-input"
                />
                <label htmlFor="student-csv-input" className="cursor-pointer block">
                  <HiOutlineUpload className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <span className="text-base font-semibold text-white block">
                    {studentCsvFile ? studentCsvFile.name : 'Select or drag & drop student enrollment CSV'}
                  </span>
                  <span className="text-xs text-white/40 block mt-1">
                    Template pre-formatted with Admission Number, Class, Section, and Guardian details.
                  </span>
                </label>
              </div>

              {/* CSV Preview */}
              {studentCsvRows.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-surface-900 p-3.5 rounded-xl border border-white/[0.06]">
                    <div>
                      <span className="text-white/60">Ready to import:</span>{' '}
                      <strong className="text-emerald-400 text-sm">{studentCsvRows.length}</strong>{' '}
                      <span className="text-white/60">student records</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleImportStudents}
                      disabled={importingStudents}
                      className="btn-primary py-2 px-6 text-xs flex items-center justify-center gap-2 font-bold"
                    >
                      {importingStudents ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing Batch ({importProgress}%)...
                        </>
                      ) : (
                        <>
                          <HiOutlineAcademicCap size={16} />
                          Start Bulk Enrollment ({studentCsvRows.length})
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress Bar when importing */}
                  {importingStudents && (
                    <div className="w-full bg-surface-800 rounded-full h-2.5 overflow-hidden border border-white/[0.06]">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="max-h-64 overflow-y-auto border border-white/[0.06] rounded-xl bg-surface-950 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-surface-900 text-white/60 text-[11px] uppercase tracking-wider sticky top-0 border-b border-white/[0.06]">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Admission #</th>
                          <th className="p-2.5">Class</th>
                          <th className="p-2.5">Section</th>
                          <th className="p-2.5">Gender</th>
                          <th className="p-2.5">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {studentCsvRows.slice(0, 15).map((r, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="p-2.5 text-white/30 font-mono">{i + 1}</td>
                            <td className="p-2.5 font-medium text-white">{r.Name || r.name}</td>
                            <td className="p-2.5 font-mono text-emerald-400">{r['Admission Number'] || r.rollNumber || '—'}</td>
                            <td className="p-2.5 text-white/70">{r.Class || r.class || '—'}</td>
                            <td className="p-2.5 text-white/70">{r.Section || r.section || 'A'}</td>
                            <td className="p-2.5 capitalize text-white/50">{r.Gender || r.gender || 'male'}</td>
                            <td className="p-2.5 text-white/50">{r.Phone || r.phone || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results Card */}
              {importResult && (
                <div className="p-5 rounded-2xl bg-surface-900 border border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <HiOutlineCheckCircle className="text-emerald-400" size={18} />
                      Import Batch Completed
                    </h4>
                    <span className="text-xs text-white/40 font-mono">
                      Total: {importResult.summary?.total || 0} rows
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-xl font-bold text-emerald-400">{importResult.summary?.created || 0}</div>
                      <div className="text-[11px] text-emerald-300/80 font-medium mt-0.5">Created Successfully</div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="text-xl font-bold text-amber-400">{importResult.summary?.skipped || 0}</div>
                      <div className="text-[11px] text-amber-300/80 font-medium mt-0.5">Skipped / Duplicates</div>
                    </div>

                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="text-xl font-bold text-red-400">{importResult.summary?.failed || 0}</div>
                      <div className="text-[11px] text-red-300/80 font-medium mt-0.5">Failed / Errors</div>
                    </div>
                  </div>

                  {(importResult.summary?.failed > 0 || importResult.summary?.skipped > 0) && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs">
                      <span className="text-red-300">
                        Some rows were skipped or contained errors. Download the audit log to review details.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadErrors(importResult.batchId)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-white"
                      >
                        <HiOutlineDownload size={14} /> Download Error Audit (CSV)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => handleNavigateStep('staff')}
                className="btn-secondary px-5 py-3 text-xs sm:text-sm flex items-center gap-2"
              >
                <HiArrowLeft size={16} /> Back to Staff Setup
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await api.patch('/admin/onboarding/steps/skip', { skipStep: 'students' });
                    handleNavigateStep('review');
                  }}
                  className="btn-secondary px-4 py-3 text-xs sm:text-sm text-white/60 hover:text-white"
                >
                  Skip for Now
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateStep('review')}
                  className="btn-primary px-7 py-3 text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 font-bold"
                >
                  Proceed to Final Review <HiArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 6: REVIEW & LAUNCH ── */}
        {currentStep === 'review' && (
          <div className="max-w-2xl mx-auto glass-card p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <HiOutlineSparkles size={36} />
            </div>

            <div>
              <span className="badge badge-success text-xs px-3 py-1 rounded-full mb-2 inline-block">Setup Complete</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">Your College Workspace is Ready</h2>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                All essential modules, academic structures, and accounts have been configured. You can now access your comprehensive management dashboard.
              </p>
            </div>

            {/* Readiness Summary Matrix */}
            <div className="p-5 rounded-2xl bg-surface-900 border border-white/[0.06] text-left space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                <span className="text-white/50">Institution Name:</span>
                <span className="font-bold text-white">{profile.name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                <span className="text-white/50">Campus Location:</span>
                <span className="font-semibold text-white">{profile.city || 'Configured'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                <span className="text-white/50">Academic Sessions:</span>
                <span className="font-semibold text-emerald-400">{academicSummary.sessionCount || 1} active session</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                <span className="text-white/50">Academic Programs & Classes:</span>
                <span className="font-semibold text-indigo-400">{classesList.length} configured classes</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                <span className="text-white/50">Team & Faculty Roster:</span>
                <span className="font-semibold text-purple-400">{staffList.length} members invited/active</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-white/50">Admissions Status:</span>
                <span className="font-semibold text-emerald-400">
                  {importResult ? `${importResult.summary?.created || 0} students imported` : 'Batch import enabled'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigateStep('profile')}
                className="btn-secondary w-full sm:w-auto px-5 py-3 text-xs font-semibold"
              >
                Review & Edit Details
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="btn-primary w-full sm:w-auto px-8 py-3 text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                Launch Admin Dashboard <HiArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
