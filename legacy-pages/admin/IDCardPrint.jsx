import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { HiOutlinePrinter, HiOutlineSearch, HiOutlineQrcode, HiOutlineFilter, HiOutlineRefresh } from 'react-icons/hi';

const IDCardPrint = () => {
  const { user } = useAuth();
  const [role, setRole] = useState('student'); // 'student', 'teacher', 'employee'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [role, selectedSection]);

  const fetchMetadata = async () => {
    try {
      const { data } = await api.get('/sections');
      setSections(data.data || []);
    } catch {}
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let endpoint = '/students';
      if (role === 'teacher') endpoint = '/teachers';
      if (role === 'employee') endpoint = '/employees';

      const params = { limit: 100 };
      if (role === 'student' && selectedSection) params.section_id = selectedSection;

      const { data } = await api.get(endpoint, { params });
      let list = data.data || [];

      // Normalize fields
      list = list.map(m => {
        const name = m.name || m.user?.name || 'Member';
        const cardId = m.qrCode || m.cardId || m.rollNumber || m.id;
        const roleLabel = role === 'student' ? 'Student' : role === 'teacher' ? 'Teacher' : (m.department || m.designation || 'Staff');
        const subtitle = role === 'student' ? `${m.class || ''} ${m.section ? `(${m.section})` : ''}`.trim() : (m.specialization || m.department || 'Staff Member');
        return {
          id: m.id || m._id,
          name,
          fatherName: m.fatherName || '',
          cardId,
          qrCode: cardId,
          photo: m.photo || m.avatar || '',
          roleLabel,
          subtitle,
          collegeName: user?.college?.name || 'College Member',
          collegeCode: user?.college?.code || 'CESMS'
        };
      });

      setItems(list);
    } catch {
      toast.error('Failed to load member records');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.cardId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Print Hide Controls Header */}
      <div className="no-print glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HiOutlineQrcode className="text-indigo-400" size={24} /> Member ID Cards & QR Codes
          </h1>
          <p className="text-xs text-surface-400 mt-1">Generate and print official college membership cards with embedded gate scanner QR codes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={fetchMembers} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
            <HiOutlineRefresh size={14} /> Refresh
          </button>
          <button onClick={handlePrint} className="btn-primary text-xs py-2 px-4 flex items-center gap-2 shadow-lg shadow-indigo-500/20">
            <HiOutlinePrinter size={16} /> Print All Cards
          </button>
        </div>
      </div>

      {/* No-Print Filters */}
      <div className="no-print glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="block text-[10px] uppercase font-bold text-surface-400 mb-1">Role / Type</label>
            <select 
              value={role} 
              onChange={e => { setRole(e.target.value); setSelectedSection(''); }} 
              className="input-field py-1.5 px-3 text-xs"
            >
              <option value="student">🎓 Students</option>
              <option value="teacher">👨‍🏫 Teachers</option>
              <option value="employee">👥 Staff / Employees</option>
            </select>
          </div>

          {role === 'student' && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-surface-400 mb-1">Section</label>
              <select 
                value={selectedSection} 
                onChange={e => setSelectedSection(e.target.value)} 
                className="input-field py-1.5 px-3 text-xs"
              >
                <option value="">All Sections</option>
                {sections.map(s => (
                  <option key={s.id || s._id} value={s.id || s._id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-surface-400 mb-1">Search</label>
            <div className="relative">
              <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" size={14} />
              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search name or ID..." 
                className="input-field py-1.5 pl-8 pr-3 text-xs min-w-[200px]" 
              />
            </div>
          </div>
        </div>

        <div className="text-xs text-surface-400 font-semibold">
          Showing <span className="text-white font-bold">{filteredItems.length}</span> cards
        </div>
      </div>

      {/* Cards Grid (Screen + Print) */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card p-12 text-center text-surface-400 text-sm">
          No members found matching the selected criteria.
        </div>
      ) : (
        <div className="id-card-print-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="id-card-element bg-[#0b0f17] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between"
              style={{ minHeight: '260px', pageBreakInside: 'avoid' }}
            >
              {/* Card Decorative Header Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

              {/* College Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mt-1">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">{item.collegeName}</h3>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{item.collegeCode} OFFICIAL ID CARD</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {item.roleLabel}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex items-center gap-4 py-3">
                {/* Photo / Avatar */}
                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-indigo-400">{item.name.charAt(0)}</span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                  {item.fatherName && <p className="text-[10px] text-surface-400 truncate">s/o {item.fatherName}</p>}
                  <div className="mt-2 space-y-0.5">
                    <div className="text-[10px] text-surface-400">
                      ID: <span className="font-mono text-indigo-300 font-bold">{item.cardId}</span>
                    </div>
                    {item.subtitle && <div className="text-[10px] text-emerald-400 font-semibold">{item.subtitle}</div>}
                  </div>
                </div>
              </div>

              {/* Card Footer with QR Code */}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3 bg-white/[0.01] -mx-5 -mb-5 p-4 rounded-b-2xl">
                <div>
                  <p className="text-[8px] uppercase tracking-widest font-extrabold text-surface-400">Gate Access QR</p>
                  <p className="text-[9px] font-mono text-white font-bold mt-0.5">{item.cardId}</p>
                </div>
                <div className="bg-white p-1.5 rounded-lg shadow-md shrink-0">
                  <QRCodeSVG value={item.qrCode} size={64} level="M" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print CSS rules */}
      <style jsx global>{`
        @media print {
          /* Hide non-printable UI elements */
          body * {
            visibility: hidden;
          }
          .no-print, nav, header, sidebar, .sidebar {
            display: none !important;
          }
          .id-card-print-grid, .id-card-print-grid * {
            visibility: visible;
          }
          .id-card-print-grid {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
            padding: 10px !important;
          }
          .id-card-element {
            border: 1px solid #ccc !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
          .id-card-element * {
            color: #000 !important;
          }
          .id-card-element .text-indigo-400, .id-card-element .text-indigo-300 {
            color: #4f46e5 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default IDCardPrint;
