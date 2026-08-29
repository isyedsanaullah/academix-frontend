'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { HiOutlineAcademicCap, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineMail, HiOutlinePhone, HiOutlineOfficeBuilding, HiOutlineShieldCheck, HiOutlineSparkles } from 'react-icons/hi';
import api from '../../services/api';
import toast from 'react-hot-toast';

function RequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState('standard');
  
  const [formData, setFormData] = useState({
    collegeName: '',
    adminEmail: '',
    phone: '',
    studentCount: '',
    message: '',
    preferredContact: 'email'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Pre-select plan from query string
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && ['standard', 'professional', 'premium', 'ownership'].includes(planParam.toLowerCase())) {
      setSelectedPlan(planParam.toLowerCase());
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.collegeName.trim()) {
      toast.error('College name is required');
      return false;
    }
    
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.adminEmail.trim() || !emailRe.test(formData.adminEmail)) {
      toast.error('A valid administrator email is required');
      return false;
    }

    const phoneRe = /^\+?[0-9\s\-]{7,15}$/;
    if (!formData.phone.trim() || !phoneRe.test(formData.phone)) {
      toast.error('A valid contact phone number is required');
      return false;
    }

    const students = parseInt(formData.studentCount, 10);
    if (isNaN(students) || students <= 0) {
      toast.error('Student count must be a positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/public/subscription-request', {
        ...formData,
        selectedPlan
      });

      if (response.data?.success) {
        setSuccess(true);
        toast.success(response.data.message || 'Request submitted successfully!');
      } else {
        throw new Error(response.data?.message || 'Something went wrong');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Submission failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10 space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <HiOutlineCheckCircle size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">Request Submitted!</h2>
          <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto leading-relaxed">
            Thank you for requesting a subscription. Your details have been recorded and sent to our team. A representative will contact you at <strong>{formData.adminEmail}</strong> or <strong>{formData.phone}</strong> shortly to complete your onboarding process.
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="btn-primary py-2 px-6 text-xs mt-4"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* College Name */}
      <div>
        <label htmlFor="collegeName" className="block text-xs font-semibold text-white/55 mb-2 uppercase tracking-wide">
          College Name *
        </label>
        <div className="relative">
          <HiOutlineOfficeBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input
            type="text"
            id="collegeName"
            name="collegeName"
            value={formData.collegeName}
            onChange={handleChange}
            placeholder="e.g. Stanford College of Science"
            className="input-field pl-10 text-xs"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* Grid: Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="adminEmail" className="block text-xs font-semibold text-white/55 mb-2 uppercase tracking-wide">
            Administrator Email *
          </label>
          <div className="relative">
            <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              placeholder="admin@college.edu"
              className="input-field pl-10 text-xs"
              required
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-white/55 mb-2 uppercase tracking-wide">
            Contact Phone Number *
          </label>
          <div className="relative">
            <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="03xx-xxxxxxx"
              className="input-field pl-10 text-xs"
              required
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Grid: Selected Plan & Student Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="selectedPlan" className="block text-xs font-semibold text-white/55 mb-2 uppercase tracking-wide">
            Selected Plan *
          </label>
          <select
            id="selectedPlan"
            name="selectedPlan"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="input-field text-xs bg-[#1a2230]"
            required
            disabled={loading}
          >
            <option value="standard">Standard Plan (PKR 12,000/month)</option>
            <option value="professional">Professional Plan (PKR 13,500/month)</option>
            <option value="premium">Premium Plan (PKR 15,000/month)</option>
            <option value="ownership">Full System Ownership (PKR 280,000 one-time)</option>
          </select>
        </div>
        <div>
          <label htmlFor="studentCount" className="block text-xs font-semibold text-white/55 mb-2 uppercase tracking-wide">
            Estimated Student Count *
          </label>
          <input
            type="number"
            id="studentCount"
            name="studentCount"
            value={formData.studentCount}
            onChange={handleChange}
            placeholder="e.g. 800"
            className="input-field text-xs"
            min="1"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* Message / Special Requirements */}
      <div>
        <label htmlFor="message" className="block text-xs font-semibold text-white/55 mb-2 uppercase tracking-wide">
          Message &amp; Special Requirements (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Mention details like transport counts, custom integrations, etc..."
          className="input-field text-xs min-h-20"
          disabled={loading}
        />
      </div>

      {/* Preferred Contact Method */}
      <div>
        <label className="block text-xs font-semibold text-white/55 mb-2 uppercase tracking-wide">
          Preferred Contact Method
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
            <input
              type="radio"
              name="preferredContact"
              value="email"
              checked={formData.preferredContact === 'email'}
              onChange={handleChange}
              disabled={loading}
              className="accent-indigo-500"
            />
            Email Address
          </label>
          <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
            <input
              type="radio"
              name="preferredContact"
              value="phone"
              checked={formData.preferredContact === 'phone'}
              onChange={handleChange}
              disabled={loading}
              className="accent-indigo-500"
            />
            Phone Number
          </label>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-xs text-red-400">
          <HiOutlineExclamationCircle size={16} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-3 justify-center text-xs font-bold transition-all disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Submitting Request...
          </div>
        ) : (
          'Request Subscription'
        )}
      </button>
    </form>
  );
}

export default function RequestSubscriptionPage() {
  return (
    <div className="min-h-screen bg-[#04070d] text-white/85 flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#04070d]/80 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 h-14 sm:h-[62px] flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 min-w-0" onClick={() => router.push('/')}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 relative">
              <Image src="/logo.svg" alt="Academix" fill className="object-contain" priority />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-[15px] font-extrabold text-white leading-none tracking-tight">Academix</h1>
              <p className="text-[8px] sm:text-[9px] text-white/35 font-semibold uppercase tracking-wider sm:tracking-widest mt-0.5 leading-none truncate">
                Subscription Request
              </p>
            </div>
          </div>
          <a href="/" className="btn-secondary py-1 sm:py-1.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs rounded-lg sm:rounded-xl shrink-0">
            Back to Home
          </a>
        </div>
      </header>

      {/* CONTAINER */}
      <div className="flex-1 max-w-[620px] w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Request Academix Subscription
            </h1>
            <p className="text-xs text-white/40 mt-1.5 max-w-sm mx-auto">
              Ready to modernize your campus operations? Fill out the details below, and our developer team will set up your portal.
            </p>
          </div>

          <hr className="border-white/[0.06] mb-6" />

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <RequestForm />
          </Suspense>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] bg-[#04070d] py-6 text-center text-xs text-white/30 space-y-1">
        <p className="font-semibold text-white/45">Academix — College Portal</p>
        <p>© {new Date().getFullYear()} Academix. All rights reserved.</p>
      </footer>
    </div>
  );
}
