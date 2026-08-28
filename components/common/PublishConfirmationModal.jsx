import { HiOutlineSpeakerphone, HiOutlineX } from 'react-icons/hi';

const PublishConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  announcement,
  isSubmitting = false
}) => {
  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <HiOutlineSpeakerphone size={20} />
            </div>
            <h3 className="text-base font-bold text-white">Publish Announcement?</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <HiOutlineX size={18} />
          </button>
        </div>

        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-white/80">
          <p><strong className="text-white">Title:</strong> {announcement.title}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
              Category: {announcement.category}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
              Priority: {announcement.priority}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
              Audience: {announcement.audience}
            </span>
          </div>
          <p className="pt-2 text-[11px] text-white/40">
            Publishing will make this notice immediately visible to target users across dashboards and send in-app notifications.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-semibold transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50">
            {isSubmitting ? 'Publishing...' : 'Confirm & Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishConfirmationModal;
