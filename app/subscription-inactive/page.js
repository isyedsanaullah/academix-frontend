'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import BrandLogo from '@/components/common/BrandLogo';
import { HiOutlineLockClosed, HiOutlineLogout, HiOutlineLogin } from 'react-icons/hi';

export default function SubscriptionInactivePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleSignOut = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-[#0E2238]">
      <div className="mb-8">
        <BrandLogo variant="horizontal" theme="light" size="md" />
      </div>

      <div className="w-full max-w-md bg-white border border-[#DDE6F0] rounded-2xl shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <HiOutlineLockClosed size={30} className="text-red-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-[#0E2238]">
            Subscription Inactive
          </h1>
          <p className="text-sm font-medium text-[#52657C] leading-relaxed">
            College subscription inactive, contact your administration
          </p>
          {user?.college?.name && (
            <p className="text-xs text-slate-400 pt-1">
              Institution: <strong className="text-[#0E2238]">{user.college.name}</strong>
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#DDE6F0] text-xs text-[#52657C] leading-relaxed">
          Student, faculty, and staff access is paused until your college administrator renews or activates the subscription.
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <HiOutlineLogout size={17} />
              Sign Out &amp; Return to Login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0A4D94] hover:bg-[#083D77] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <HiOutlineLogin size={17} />
              Return to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

