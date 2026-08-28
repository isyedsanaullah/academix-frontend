import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', content:'', category:'general', audience:'all', priority:'medium', isPublic:false });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try { const { data } = await api.get('/announcements'); setAnnouncements(data.data || []); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/announcements', form); toast.success('Announcement created'); setShowModal(false); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const priorityColors = { low:'badge-info', medium:'badge-primary', high:'badge-warning', urgent:'badge-danger' };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary"><HiOutlinePlus size={18} /> New Announcement</button>
      </div>

      <div className="space-y-4">
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        : announcements.length === 0 ? <div className="text-center py-12 text-surface-500">No announcements</div>
        : announcements.map(a => (
          <div key={a._id} className="glass-card p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-white">{a.title}</h3>
                  <span className={`badge ${priorityColors[a.priority]}`}>{a.priority}</span>
                  <span className="badge badge-info">{a.audience}</span>
                </div>
                <p className="text-surface-300 text-sm whitespace-pre-wrap">
                  {a.content
                    ? a.content.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim()
                    : ''}
                </p>
                <p className="text-surface-500 text-xs mt-2">By {a.createdBy?.name} • {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-red-400"><HiOutlineTrash size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white mb-4">New Announcement</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm text-surface-300 mb-1">Title *</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="input-field" required /></div>
              <div><label className="block text-sm text-surface-300 mb-1">Content *</label><textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} className="input-field min-h-[100px]" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-surface-300 mb-1">Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input-field"><option value="general">General</option><option value="academic">Academic</option><option value="fee">Fee</option><option value="exam">Exam</option><option value="event">Event</option></select></div>
                <div><label className="block text-sm text-surface-300 mb-1">Audience</label><select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})} className="input-field"><option value="all">All</option><option value="students">Students</option><option value="teachers">Teachers</option></select></div>
                <div><label className="block text-sm text-surface-300 mb-1">Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input-field"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
              </div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1 justify-center">Publish</button><button type="button" onClick={()=>setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
