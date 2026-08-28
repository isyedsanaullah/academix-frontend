import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineOfficeBuilding, HiOutlineSpeakerphone, HiOutlineLogin,
  HiOutlineClipboardCheck, HiOutlineSearch, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineClock, HiOutlinePhotograph, HiOutlineDocumentText,
  HiOutlineGlobe, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker
} from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [colleges, setColleges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({
    name: '', fatherName: '', cnic: '', dateOfBirth: '', gender: 'male',
    phone: '', email: '', password: '', address: '', city: '',
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

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      const homes = { superAdmin:'/super-admin', admin:'/admin', teacher:'/teacher', student:'/student', registrar:'/registrar', accountant:'/accountant', principal:'/principal', employee:'/employee' };
      navigate(homes[user.role] || '/login');
    }
  }, [user]);

  // Fetch colleges list or load slug directly
  useEffect(() => {
    if (slug) {
      loadCollege(slug);
      setLoading(false);
    } else {
      fetch(`${API}/api/public/colleges`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data?.length > 0) {
            setColleges(d.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const loadCollege = (codeOrSlug) => {
    setSelected(codeOrSlug);
    fetch(`${API}/api/public/college/${codeOrSlug}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.phone) return toast.error('Fill required fields');
    if (!form.password || form.password.length < 6) return toast.error('Password min 6 characters');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      const res = await fetch(`${API}/api/public/apply/${selected}`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setSubmitted(json.data);
      toast.success('Application submitted!');
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
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
  const college = data?.college;
  const announcements = data?.announcements || [];
  const statusColor = { submitted:'#fbbf24', under_review:'#38bdf8', entry_test:'#a78bfa', approved:'#4ade80', rejected:'#f87171', enrolled:'#34d399' };

  return (
    <div style={{ minHeight:'100vh', background:'#080c12', color:'var(--text-primary)', fontFamily:"'Inter',sans-serif" }}>
      <Toaster position="top-right" />

      {/* ── NAVBAR ── */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 32px', borderBottom:'1px solid var(--border-color)', background:'var(--hover-bg)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14 }}>A</div>
          <div>
            <h1 style={{ fontSize:16, fontWeight:800, margin:0 }}>Academix</h1>
            <p style={{ fontSize:9, color:'var(--text-tertiary)', margin:0 }}>E-Services Management Platform</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/login')} style={{ padding:'8px 20px', borderRadius:8, border:'1px solid rgba(99,102,241,0.4)', background:'transparent', color:'#818cf8', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <HiOutlineLogin size={14} /> Login
          </button>
        </div>
      </nav>

      {/* ── COLLEGE PICKER (when no slug) ── */}
      {!slug && !selected && (
        <div style={{ maxWidth:960, margin:'0 auto', padding:'40px 24px' }}>
          <h2 style={{ fontSize:24, fontWeight:800, textAlign:'center', marginBottom:8 }}>Choose Your College</h2>
          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-tertiary)', marginBottom:28 }}>Select a college to view announcements and apply for admission</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
            {colleges.map(c => (
              <div key={c._id} onClick={() => navigate(`/college/${c.slug || c.code}`)} style={{ padding:20, borderRadius:14, background:'var(--hover-bg)', border:'1px solid var(--border-color)', cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'; e.currentTarget.style.background='rgba(99,102,241,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <HiOutlineOfficeBuilding size={22} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{c.name}</p>
                    <p style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:2 }}>{c.city || c.address || c.code}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      {college && (
        <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06))', padding:'40px 32px', textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <HiOutlineOfficeBuilding size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize:28, fontWeight:900, margin:0 }}>{college.name}</h1>
          <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:10, flexWrap:'wrap' }}>
            {college.address && <span style={{ fontSize:12, color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:4 }}><HiOutlineLocationMarker size={13}/> {college.address}{college.city ? `, ${college.city}`:''}</span>}
            {college.phone && <span style={{ fontSize:12, color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:4 }}><HiOutlinePhone size={13}/> {college.phone}</span>}
            {college.email && <span style={{ fontSize:12, color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:4 }}><HiOutlineMail size={13}/> {college.email}</span>}
          </div>
          {college.website && <a href={college.website} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#818cf8', marginTop:6, display:'inline-flex', alignItems:'center', gap:4 }}><HiOutlineGlobe size={12}/> {college.website}</a>}
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'20px 24px 0' }}>
        <div style={{ display:'flex', gap:4, background:'var(--hover-bg)', borderRadius:12, padding:4, border:'1px solid var(--border-color)', width:'fit-content' }}>
          {[
            { id:'info', label:'Announcements', icon:HiOutlineSpeakerphone },
            { id:'apply', label: admissionsOpen ? 'Apply Now' : 'Admissions', icon:HiOutlineClipboardCheck },
            { id:'status', label:'Track Application', icon:HiOutlineSearch }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s',
              background: tab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: tab === t.id ? '#818cf8' : 'rgba(255,255,255,0.35)'
            }}>
              <t.icon size={14}/> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'20px 24px 60px' }}>

        {/* ── INFO TAB ── */}
        {tab === 'info' && (
          <div style={{ display:'grid', gap:16 }}>
            {season && (
              <div style={{ background: admissionsOpen ? 'rgba(74,222,128,0.05)':'rgba(248,113,113,0.05)', borderRadius:12, border:`1px solid ${admissionsOpen ? 'rgba(74,222,128,0.15)':'rgba(248,113,113,0.15)'}`, padding:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color: admissionsOpen ? '#4ade80':'#f87171', marginBottom:6 }}>
                  {admissionsOpen ? '🟢 Admissions Open':'🔴 Admissions Closed'}
                </h3>
                <p style={{ fontSize:13, color:'var(--text-secondary)' }}>{season.title}</p>
                <p style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:4 }}>
                  Deadline: {new Date(season.endDate).toLocaleDateString()} • Groups: {season.availableGroups?.join(', ')} • Seats: {season.maxSeats}
                </p>
                {season.entryTestRequired && <p style={{ fontSize:11, color:'#fbbf24', marginTop:6 }}>⚠ Entry test required</p>}
                {admissionsOpen && <button onClick={() => setTab('apply')} style={{ marginTop:12, padding:'8px 20px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'var(--text-primary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>📋 Apply Now</button>}
              </div>
            )}
            <div style={{ background:'var(--hover-bg)', borderRadius:12, border:'1px solid var(--border-color)', padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <HiOutlineSpeakerphone size={16} style={{ color:'#818cf8' }}/> Public Announcements
              </h3>
              {announcements.length === 0 ? (
                <p style={{ color:'var(--text-tertiary)', fontSize:13 }}>No announcements yet</p>
              ) : announcements.map(a => (
                <div key={a._id} style={{ padding:'12px 14px', borderRadius:8, background:'var(--hover-bg)', border:'1px solid rgba(255,255,255,0.04)', marginBottom:8 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{a.title}</p>
                  <p style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:4, whiteSpace:'pre-wrap' }}>
                    {a.content ? a.content.replace(/<p[^>]*>/gi,'').replace(/<\/p>/gi,'\n').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').trim() : ''}
                  </p>
                  <span style={{ fontSize:10, color:'var(--text-tertiary)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── APPLY TAB ── */}
        {tab === 'apply' && (
          <>
            {!admissionsOpen ? (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <HiOutlineXCircle size={48} style={{ color:'#f87171', margin:'0 auto 16px' }}/>
                <h2 style={{ fontSize:20, fontWeight:700, color:'#f87171' }}>{season ? 'Application Deadline Passed' : 'Admissions Not Announced Yet'}</h2>
                <p style={{ color:'var(--text-tertiary)', fontSize:13, marginTop:8 }}>Check back later for updates.</p>
              </div>
            ) : submitted ? (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <HiOutlineCheckCircle size={48} style={{ color:'#4ade80', margin:'0 auto 16px' }}/>
                <h2 style={{ fontSize:20, fontWeight:700, color:'#4ade80' }}>Application Submitted!</h2>
                <p style={{ fontSize:24, fontWeight:800, color:'#818cf8', marginTop:12 }}>{submitted.applicationNumber}</p>
                <p style={{ color:'var(--text-tertiary)', fontSize:12, marginTop:8 }}>Save this number. You can login with your email & password to track status.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <Sec title="Personal Information">
                  <Grid>
                    <Inp label="Full Name *" value={form.name} onChange={v => setForm({...form,name:v})} required />
                    <Inp label="Father's Name *" value={form.fatherName} onChange={v => setForm({...form,fatherName:v})} required />
                    <Inp label="CNIC / B-Form" value={form.cnic} onChange={v => setForm({...form,cnic:v})} placeholder="xxxxx-xxxxxxx-x" />
                    <Inp label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={v => setForm({...form,dateOfBirth:v})} required />
                    <Sel label="Gender *" value={form.gender} onChange={v => setForm({...form,gender:v})} options={['male','female']} />
                    <Inp label="Phone *" value={form.phone} onChange={v => setForm({...form,phone:v})} placeholder="03xx-xxxxxxx" required />
                    <Inp label="Email *" type="email" value={form.email} onChange={v => setForm({...form,email:v})} required />
                    <Inp label="Password *" type="password" value={form.password} onChange={v => setForm({...form,password:v})} placeholder="Min 6 chars" required />
                  </Grid>
                  <div style={{ marginTop:12 }}><Inp label="Address *" value={form.address} onChange={v => setForm({...form,address:v})} required /></div>
                  <Grid style={{ marginTop:12 }}>
                    <Inp label="City" value={form.city} onChange={v => setForm({...form,city:v})} />
                    <Inp label="Guardian Name" value={form.guardianName} onChange={v => setForm({...form,guardianName:v})} />
                    <Inp label="Guardian Phone" value={form.guardianPhone} onChange={v => setForm({...form,guardianPhone:v})} />
                  </Grid>
                </Sec>
                <Sec title="SSC / Matric Details">
                  <Grid>
                    <Inp label="Board *" value={form.sscBoard} onChange={v => setForm({...form,sscBoard:v})} placeholder="e.g. BISE Lahore" required />
                    <Inp label="Year *" type="number" value={form.sscYear} onChange={v => setForm({...form,sscYear:v})} required />
                    <Inp label="Roll #" value={form.sscRollNumber} onChange={v => setForm({...form,sscRollNumber:v})} />
                    <Sel label="Result Status" value={form.sscResultStatus} onChange={v => setForm({...form,sscResultStatus:v})} options={['declared','awaiting']} />
                    <Inp label="Total Marks *" type="number" value={form.sscTotalMarks} onChange={v => setForm({...form,sscTotalMarks:Number(v)})} required />
                    <Inp label="Obtained *" type="number" value={form.sscObtainedMarks} onChange={v => setForm({...form,sscObtainedMarks:Number(v)})} required />
                  </Grid>
                  {form.sscObtainedMarks > 0 && (
                    <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8, background: aggregate >= 50 ? 'rgba(74,222,128,0.08)':'rgba(248,113,113,0.08)', border:`1px solid ${aggregate >= 50 ? 'rgba(74,222,128,0.15)':'rgba(248,113,113,0.15)'}` }}>
                      <span style={{ fontSize:13, fontWeight:700, color: aggregate >= 50 ? '#4ade80':'#f87171' }}>Aggregate: {aggregate}%</span>
                    </div>
                  )}
                </Sec>
                <Sec title="Program Preference">
                  <Grid>
                    <Sel label="Class *" value={form.preferredClass} onChange={v => setForm({...form,preferredClass:v})} options={season?.availableClasses || ['FSC Part 1']} />
                    <Sel label="Group *" value={form.preferredGroup} onChange={v => setForm({...form,preferredGroup:v})} options={season?.availableGroups || ['Pre-Medical','Pre-Engineering','Computer Science']} />
                  </Grid>
                </Sec>
                <Sec title="Upload Documents">
                  <Grid>
                    <FI label="Passport Photo (Blue BG) *" icon={HiOutlinePhotograph} onChange={f => setFiles({...files,photo:f})} />
                    <FI label="10th DMC *" icon={HiOutlineDocumentText} onChange={f => setFiles({...files,sscDMC:f})} />
                    <FI label="Hope Certificate" icon={HiOutlineDocumentText} onChange={f => setFiles({...files,hopeCertificate:f})} />
                    <FI label="9th DMC (Optional)" icon={HiOutlineDocumentText} onChange={f => setFiles({...files,ninthDMC:f})} />
                  </Grid>
                </Sec>
                <button type="submit" disabled={submitting} style={{ padding:'14px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'var(--text-primary)', fontSize:14, fontWeight:700, opacity: submitting ? 0.5:1 }}>
                  {submitting ? 'Submitting...':'📋 Submit Application'}
                </button>
              </form>
            )}
          </>
        )}

        {/* ── STATUS TAB ── */}
        {tab === 'status' && (
          <div style={{ maxWidth:500 }}>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              <input value={statusQuery} onChange={e => setStatusQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkStatus()} placeholder="Enter Application Number (e.g. APP-2026-00001)"
                style={{ flex:1, padding:'12px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'var(--hover-bg)', color:'var(--text-primary)', fontSize:13, outline:'none' }} />
              <button onClick={checkStatus} style={{ padding:'12px 20px', borderRadius:10, border:'none', background:'#6366f1', color:'var(--text-primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Search</button>
            </div>
            {statusResult && (
              <div style={{ padding:20, borderRadius:12, background:'var(--hover-bg)', border:'1px solid var(--border-color)' }}>
                <p style={{ fontSize:16, fontWeight:700 }}>{statusResult.name}</p>
                <p style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:4 }}>#{statusResult.applicationNumber}</p>
                <div style={{ marginTop:12 }}>
                  <span style={{ fontSize:11, fontWeight:700, color: statusColor[statusResult.status], background:`${statusColor[statusResult.status]}15`, padding:'4px 10px', borderRadius:6, textTransform:'uppercase' }}>
                    {statusResult.status?.replace('_',' ')}
                  </span>
                </div>
                {statusResult.rejectionReason && <p style={{ fontSize:12, color:'#f87171', marginTop:8 }}>Reason: {statusResult.rejectionReason}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop:'1px solid var(--border-color)', padding:'20px 32px', textAlign:'center' }}>
        <p style={{ fontSize:11, color:'var(--text-tertiary)' }}>© 2026 Academix — College E-Services Management System</p>
      </div>
    </div>
  );
};

const Sec = ({title,children}) => (<div style={{ background:'var(--hover-bg)', borderRadius:12, border:'1px solid var(--border-color)', padding:20 }}><h3 style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</h3>{children}</div>);
const Grid = ({children,style}) => (<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, ...style }}>{children}</div>);
const Inp = ({label,...p}) => (<div><label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-tertiary)', marginBottom:4 }}>{label}</label><input {...p} onChange={e=>p.onChange(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'var(--hover-bg)', color:'var(--text-primary)', fontSize:13, outline:'none', boxSizing:'border-box' }}/></div>);
const Sel = ({label,options,...p}) => (<div><label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-tertiary)', marginBottom:4 }}>{label}</label><select {...p} onChange={e=>p.onChange(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'#131a25', color:'var(--text-primary)', fontSize:13, outline:'none' }}>{options.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}</select></div>);
const FI = ({label,icon:Icon,onChange}) => (<div><label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-tertiary)', marginBottom:4 }}>{label}</label><label style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, border:'1px dashed rgba(255,255,255,0.15)', background:'var(--hover-bg)', cursor:'pointer', fontSize:12, color:'var(--text-tertiary)' }}><Icon size={16}/> Choose file<input type="file" accept="image/*,.pdf" onChange={e=>onChange(e.target.files[0])} style={{ display:'none' }}/></label></div>);

export default LandingPage;
