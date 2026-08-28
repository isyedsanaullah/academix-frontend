// Shared Announcement Constants & Enums for Frontend

export const ANNOUNCEMENT_CATEGORIES = [
  'Emergency',
  'Holiday',
  'Academic',
  'Examination',
  'Fee',
  'Admission',
  'Event',
  'Administration',
  'General'
];

export const ANNOUNCEMENT_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const ANNOUNCEMENT_AUDIENCES = [
  'All Users',
  'All Students',
  'All Teachers',
  'Parents',
  'Staff',
  'Faculty',
  'Specific Department',
  'Specific Class'
];

export const ANNOUNCEMENT_STATUSES = ['Draft', 'Scheduled', 'Published', 'Archived'];

export const REFINEMENT_ACTIONS = [
  { id: 'enhance', label: '✨ Enhance', desc: 'Improve clarity, tone, and formatting' },
  { id: 'formal', label: '👔 Formal', desc: 'Make tone more official and academic' },
  { id: 'simplify', label: '⚡ Simplify', desc: 'Make clear and easy to understand' },
  { id: 'shorten', label: '✂️ Shorten', desc: 'Condense into concise notice' },
  { id: 'expand', label: '📝 Expand', desc: 'Add helpful administrative details' },
  { id: 'rewrite', label: '🔄 Rewrite', desc: 'Refresh wording completely' }
];

export const CATEGORY_COLORS = {
  Emergency: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-300' },
  Holiday: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
  Academic: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
  Examination: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300' },
  Fee: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' },
  Admission: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', badge: 'bg-indigo-500/20 text-indigo-300' },
  Event: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30', badge: 'bg-pink-500/20 text-pink-300' },
  Administration: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300' },
  General: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', badge: 'bg-slate-500/20 text-slate-300' }
};

export const PRIORITY_COLORS = {
  Urgent: { badge: 'bg-red-600 text-white animate-pulse font-bold' },
  High: { badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  Medium: { badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  Low: { badge: 'bg-sky-500/20 text-sky-400 border border-sky-500/30' }
};
