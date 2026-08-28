import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineLogout as HiCheckout, HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineSearch, HiOutlineRefresh } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const Visitors = () => {
  const { user } = useAuth();
  const isGuard = user?.role === 'employee';

  const [activeTab, setActiveTab] = useState('external'); // 'external' or 'internal'
  
  // External Visitors State
  const [visitors, setVisitors] = useState([]);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ visitorName: '', cnic: '', phone: '', purpose: '', hostName: '', hostDepartment: '' });

  // Internal Movement Logs State
  const [internalLogs, setInternalLogs] = useState([]);
  const [loadingInternal, setLoadingInternal] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState(''); // 'student', 'teacher', 'employee', or '' for all
  const [filterAction, setFilterAction] = useState(''); // 'entry', 'exit', or '' for all

  useEffect(() => {
    if (activeTab === 'external') {
      fetchVisitors();
    } else {
      fetchInternalLogs();
    }
  }, [activeTab, selectedDate, filterType, filterAction]);

  const fetchVisitors = async () => {
    setLoadingVisitors(true);
    try {
      const { data } = await api.get('/visitors');
      setVisitors(data.data || []);
    } catch {
      toast.error('Failed to fetch external visitors');
    } finally {
      setLoadingVisitors(false);
    }
  };

  const fetchInternalLogs = async () => {
    setLoadingInternal(true);
    try {
      const { data } = await api.get('/gate/logs', {
        params: {
          date: selectedDate,
          personType: filterType || undefined,
          action: filterAction || undefined
        }
      });
      setInternalLogs(data.data || []);
    } catch {
      toast.error('Failed to fetch internal gate logs');
    } finally {
      setLoadingInternal(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isGuard) return toast.error('Unauthorized');
    try {
      await api.post('/visitors', form);
      toast.success('Visitor logged');
      setShowModal(false);
      setForm({ visitorName: '', cnic: '', phone: '', purpose: '', hostName: '', hostDepartment: '' });
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log visitor');
    }
  };

  const handleCheckout = async (id) => {
    if (!isGuard) return toast.error('Unauthorized');
    try {
      await api.put(`/visitors/${id}/checkout`);
      toast.success('Visitor checked out');
      fetchVisitors();
    } catch {
      toast.error('Failed to checkout visitor');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Visitors & Movement Monitoring</h1>
          <p className="text-sm text-surface-400 mt-1">Track external guests and internal student/staff daily entry/exit movements.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex bg-[#0d1117] border border-white/[0.06] p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('external')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'external' ? 'bg-indigo-600 text-white' : 'text-surface-400 hover:text-white'}`}
            >
              👤 External Visitors
            </button>
            <button 
              onClick={() => setActiveTab('internal')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'internal' ? 'bg-indigo-600 text-white' : 'text-surface-400 hover:text-white'}`}
            >
              🛡️ Internal Movement
            </button>
          </div>

          {activeTab === 'external' && isGuard && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <HiOutlinePlus size={18} /> Log Visitor
            </button>
          )}
        </div>
      </div>

      {/* External Visitors Tab */}
      {activeTab === 'external' && (
        <div className="glass-card overflow-hidden">
          {loadingVisitors ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visitors.length === 0 ? (
            <div className="text-center py-12 text-surface-400 text-sm">No external visitors logged recently.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>CNIC</th>
                    <th>Phone</th>
                    <th>Purpose</th>
                    <th>Host Name</th>
                    <th>Host Dept</th>
                    <th>Entry Time</th>
                    <th>Status</th>
                    {isGuard && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {visitors.map(v => (
                    <tr key={v._id}>
                      <td className="font-medium text-surface-200">{v.visitorName}</td>
                      <td className="font-mono text-xs">{v.cnic || '-'}</td>
                      <td>{v.phone || '-'}</td>
                      <td>{v.purpose}</td>
                      <td>{v.hostName || '-'}</td>
                      <td>{v.hostDepartment || '-'}</td>
                      <td className="text-xs">{new Date(v.entryTime).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${v.status === 'in' ? 'badge-success' : 'badge-info'}`}>
                          {v.status === 'in' ? 'Inside' : 'Left'}
                        </span>
                      </td>
                      {isGuard && (
                        <td>
                          {v.status === 'in' && (
                            <button onClick={() => handleCheckout(v._id)} className="btn-secondary text-xs py-1 px-2">
                              <HiCheckout size={14} /> Out
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Internal Movement Tab */}
      {activeTab === 'internal' && (
        <div className="space-y-4">
          {/* Filters Panel */}
          <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-[10px] uppercase font-bold text-surface-400 mb-1">Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                  className="input-field max-w-[150px] py-1.5 px-3 text-xs" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-surface-400 mb-1">Person Type</label>
                <select 
                  value={filterType} 
                  onChange={e => setFilterType(e.target.value)} 
                  className="input-field py-1.5 px-3 text-xs"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-surface-400 mb-1">Movement Type</label>
                <select 
                  value={filterAction} 
                  onChange={e => setFilterAction(e.target.value)} 
                  className="input-field py-1.5 px-3 text-xs"
                >
                  <option value="">All Actions</option>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              </div>
            </div>

            <button 
              onClick={fetchInternalLogs}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <HiOutlineRefresh size={14} /> Reload Logs
            </button>
          </div>

          {/* Internal Logs Grid */}
          <div className="glass-card overflow-hidden">
            {loadingInternal ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : internalLogs.length === 0 ? (
              <div className="text-center py-12 text-surface-400 text-sm">No internal movement recorded for this query.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Movement</th>
                      <th>Verification Method</th>
                      <th>Gate / Location</th>
                      <th>Early Exit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalLogs.map(l => (
                      <tr key={l._id}>
                        <td className="font-mono text-xs text-surface-300">
                          {new Date(l.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="font-medium text-surface-100">{l.personName}</td>
                        <td>
                          <span className={`badge ${l.personType === 'student' ? 'badge-info' : l.personType === 'teacher' ? 'badge-primary' : 'badge-warning'}`}>
                            {l.personType}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${l.action === 'entry' ? 'badge-success' : 'badge-danger'}`}>
                            {l.action === 'entry' ? 'Entry' : 'Exit'}
                          </span>
                        </td>
                        <td className="text-xs uppercase text-surface-400">{l.verificationMethod || 'QR'}</td>
                        <td className="text-xs text-surface-300">{l.location || 'Main Gate'}</td>
                        <td className="text-xs text-surface-400">
                          {l.isEarlyExit ? (l.earlyExitApproved ? '✅ Approved' : '⚠️ Blocked') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log External Visitor Modal */}
      {isGuard && showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white mb-4">Log Visitor Entry</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-surface-300 mb-1">Name *</label><input value={form.visitorName} onChange={e => setForm({ ...form, visitorName: e.target.value })} className="input-field" required /></div>
                <div><label className="block text-sm text-surface-300 mb-1">CNIC</label><input value={form.cnic} onChange={e => setForm({ ...form, cnic: e.target.value })} className="input-field" placeholder="12345-1234567-1" /></div>
                <div><label className="block text-sm text-surface-300 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm text-surface-300 mb-1">Host Name</label><input value={form.hostName} onChange={e => setForm({ ...form, hostName: e.target.value })} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-surface-300 mb-1">Host Department</label><input value={form.hostDepartment} onChange={e => setForm({ ...form, hostDepartment: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm text-surface-300 mb-1">Purpose *</label><input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className="input-field" required /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center">Log Entry</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;
