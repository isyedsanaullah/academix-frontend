'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  HiOutlineBeaker,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamation
} from 'react-icons/hi';

export default function PracticalManagement() {
  const [activeTab, setActiveTab] = useState('sessions'); // sessions, marks, journals, stock, examiners
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Data states
  const [sessions, setSessions] = useState([]);
  const [marks, setMarks] = useState([]);
  const [journals, setJournals] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [examiners, setExaminers] = useState([]);

  // Modals
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    subject_id: '',
    class: 'FSC Part 1',
    group: 'Pre-Medical',
    section: 'A',
    batchNo: 1,
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    labName: 'Physics Lab 1'
  });

  const [stockModal, setStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    name: '',
    category: 'chemical',
    subject: 'Chemistry',
    unit: 'ml',
    quantity: 100,
    minQuantity: 20,
    location: 'Cabinet A2'
  });

  const [movementModal, setMovementModal] = useState({ open: false, item: null, change: -1, reason: 'practical' });
  const [examinerModal, setExaminerModal] = useState(false);
  const [examinerForm, setExaminerForm] = useState({
    board: 'FBISE',
    examinerName: '',
    examinerType: 'external',
    examinerCnic: '',
    centreName: '',
    examDate: new Date().toISOString().split('T')[0]
  });

  // Fetch functions
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/practicals/sessions');
      if (res.data?.success) setSessions(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/practicals/marks');
      if (res.data?.success) setMarks(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/practicals/journals');
      if (res.data?.success) setJournals(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/practicals/stock');
      if (res.data?.success) setStockItems(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExaminers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/practicals/examiners');
      if (res.data?.success) setExaminers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') fetchSessions();
    if (activeTab === 'marks') fetchMarks();
    if (activeTab === 'journals') fetchJournals();
    if (activeTab === 'stock') fetchStock();
    if (activeTab === 'examiners') fetchExaminers();
  }, [activeTab]);

  // Handlers
  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/practicals/sessions', sessionForm);
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Practical session scheduled!' });
        setSessionModal(false);
        fetchSessions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule practical session');
    }
  };

  const handleCreateStock = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/practicals/stock', stockForm);
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Stock item added!' });
        setStockModal(false);
        fetchStock();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add stock item');
    }
  };

  const handleStockMovement = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/practicals/stock/${movementModal.item.id}/movement`, {
        change: movementModal.change,
        reason: movementModal.reason
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Stock adjustment recorded!' });
        setMovementModal({ open: false, item: null, change: -1, reason: 'practical' });
        fetchStock();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Stock movement rejected');
    }
  };

  const handleCreateExaminer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/practicals/examiners', examinerForm);
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Board practical examiner registered!' });
        setExaminerModal(false);
        fetchExaminers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register examiner');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <HiOutlineBeaker className="w-7 h-7 text-teal-600" />
            Practicals & Laboratory Operations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lab timetables, marks entry, journal verification, stock inventory, and board examiners
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'sessions' && (
            <button
              onClick={() => setSessionModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
            >
              <HiOutlinePlus className="w-4 h-4" /> Schedule Lab Session
            </button>
          )}
          {activeTab === 'stock' && (
            <button
              onClick={() => setStockModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
            >
              <HiOutlinePlus className="w-4 h-4" /> Add Stock Item
            </button>
          )}
          {activeTab === 'examiners' && (
            <button
              onClick={() => setExaminerModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
            >
              <HiOutlinePlus className="w-4 h-4" /> Register Examiner
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-2xl shadow-sm">
        {[
          { id: 'sessions', label: 'Lab Timetable & Sessions', icon: HiOutlineCalendar },
          { id: 'marks', label: 'Marks & Attendance', icon: HiOutlineClipboardList },
          { id: 'journals', label: 'Lab Journals', icon: HiOutlineBookOpen },
          { id: 'stock', label: 'Stock & Inventory', icon: HiOutlineBeaker },
          { id: 'examiners', label: 'Board Examiners', icon: HiOutlineUserGroup }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm border-b-2 transition ${
                activeTab === t.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Practical Sessions */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Class & Group</th>
                  <th className="py-3.5 px-4">Section / Batch</th>
                  <th className="py-3.5 px-4">Laboratory</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No practical sessions scheduled yet.
                    </td>
                  </tr>
                ) : (
                  sessions.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {new Date(s.date).toLocaleDateString('en-PK')}
                        <span className="block text-xs font-normal text-gray-500">{s.startTime} - {s.endTime}</span>
                      </td>
                      <td className="py-3.5 px-4">{s.subject_id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800">{s.class}</span>
                        <span className="block text-xs text-teal-600">{s.group}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        Section {s.section} (Batch {s.batchNo})
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700">{s.labName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 capitalize">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Practical Marks */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recorded Practical & Lab Evaluation Marks</h3>
            <span className="text-xs text-gray-400">Total Entries: {marks.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Roll #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Marks</th>
                  <th className="py-3 px-4 text-center">Journal Marks</th>
                  <th className="py-3 px-4 text-center">Attended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      No practical marks recorded yet.
                    </td>
                  </tr>
                ) : (
                  marks.map(m => (
                    <tr key={m.id}>
                      <td className="py-3 px-4 font-mono font-bold">{m.student?.rollNumber || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{m.student?.name || 'Student'}</td>
                      <td className="py-3 px-4">{m.subject_id}</td>
                      <td className="py-3 px-4 text-center font-bold text-teal-700">{m.marks} / {m.maxMarks}</td>
                      <td className="py-3 px-4 text-center font-semibold">{m.journalMarks != null ? m.journalMarks : '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          m.attended ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {m.attended ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Lab Journals */}
      {activeTab === 'journals' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Student Practical Notebook / Journal Status</h3>
            <span className="text-xs text-gray-400">Total: {journals.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Roll #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Required Exp.</th>
                  <th className="py-3 px-4 text-center">Submitted</th>
                  <th className="py-3 px-4 text-center">Checked & Signed</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      No journal submission records found.
                    </td>
                  </tr>
                ) : (
                  journals.map(j => (
                    <tr key={j.id}>
                      <td className="py-3 px-4 font-mono font-bold">{j.student?.rollNumber || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{j.student?.name || 'Student'}</td>
                      <td className="py-3 px-4 text-center font-semibold">{j.required}</td>
                      <td className="py-3 px-4 text-center font-bold text-teal-600">{j.submitted}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{j.checked}</td>
                      <td className="py-3 px-4 text-xs italic text-gray-500">{j.remarks || 'None'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Lab Stock & Inventory */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Chemicals, Apparatus & Lab Stock (Zero-Floor Enforced)</h3>
            <span className="text-xs text-gray-400">Total Items: {stockItems.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Current Quantity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      No stock items registered yet.
                    </td>
                  </tr>
                ) : (
                  stockItems.map(item => {
                    const isLow = item.quantity <= (item.minQuantity || 0);
                    return (
                      <tr key={item.id}>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {item.name}
                          {isLow && (
                            <span className="inline-flex items-center gap-1 ml-2 text-xs font-bold text-rose-600">
                              <HiOutlineExclamation className="w-3.5 h-3.5" /> Low Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 capitalize">{item.category}</td>
                        <td className="py-3 px-4">{item.subject}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-900">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">{item.location || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setMovementModal({ open: true, item, change: -1, reason: 'practical' })}
                            className="px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                          >
                            Adjust / Use
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Board Examiners */}
      {activeTab === 'examiners' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Registered Board Practical Examiners</h3>
            <span className="text-xs text-gray-400">Total: {examiners.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Examiner Name</th>
                  <th className="py-3 px-4">Board</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">CNIC</th>
                  <th className="py-3 px-4">Center</th>
                  <th className="py-3 px-4">Exam Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {examiners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      No board practical examiners registered.
                    </td>
                  </tr>
                ) : (
                  examiners.map(e => (
                    <tr key={e.id}>
                      <td className="py-3 px-4 font-semibold text-gray-900">{e.examinerName}</td>
                      <td className="py-3 px-4 font-bold text-teal-700">{e.board}</td>
                      <td className="py-3 px-4 capitalize">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {e.examinerType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{e.examinerCnic || '-'}</td>
                      <td className="py-3 px-4">{e.centreName || '-'}</td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        {e.examDate ? new Date(e.examDate).toLocaleDateString('en-PK') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {movementModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Record Stock Adjustment</h3>
            <p className="text-xs text-gray-500">
              Item: <strong>{movementModal.item?.name}</strong> (Available: {movementModal.item?.quantity} {movementModal.item?.unit})
            </p>
            <form onSubmit={handleStockMovement} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Change (+ purchase, - practical/breakage)</label>
                <input
                  type="number"
                  step="any"
                  value={movementModal.change}
                  onChange={(e) => setMovementModal({ ...movementModal, change: parseFloat(e.target.value) || 0 })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Reason</label>
                <select
                  value={movementModal.reason}
                  onChange={(e) => setMovementModal({ ...movementModal, reason: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:outline-none"
                >
                  <option value="practical">Practical Session Usage</option>
                  <option value="purchase">New Purchase</option>
                  <option value="breakage">Breakage / Damage</option>
                  <option value="adjustment">Stock Adjustment</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMovementModal({ open: false, item: null, change: -1, reason: 'practical' })}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition"
                >
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Practical Session Modal */}
      {sessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Schedule Practical Session</h3>
            <form onSubmit={handleCreateSession} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Subject Name / ID</label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Chemistry"
                  value={sessionForm.subject_id}
                  onChange={(e) => setSessionForm({ ...sessionForm, subject_id: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Class</label>
                  <select
                    value={sessionForm.class}
                    onChange={(e) => setSessionForm({ ...sessionForm, class: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:outline-none"
                  >
                    <option value="FSC Part 1">FSC Part 1</option>
                    <option value="FSC Part 2">FSC Part 2</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Group</label>
                  <select
                    value={sessionForm.group}
                    onChange={(e) => setSessionForm({ ...sessionForm, group: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:outline-none"
                  >
                    <option value="Pre-Medical">Pre-Medical</option>
                    <option value="Pre-Engineering">Pre-Engineering</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Date</label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Lab Name</label>
                  <input
                    type="text"
                    value={sessionForm.labName}
                    onChange={(e) => setSessionForm({ ...sessionForm, labName: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSessionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Add Lab Stock Item</h3>
            <form onSubmit={handleCreateStock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Copper Sulfate Crystals"
                  value={stockForm.name}
                  onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Category</label>
                  <select
                    value={stockForm.category}
                    onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:outline-none"
                  >
                    <option value="chemical">Chemical</option>
                    <option value="apparatus">Apparatus</option>
                    <option value="consumable">Consumable</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={stockForm.subject}
                    onChange={(e) => setStockForm({ ...stockForm, subject: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Initial Quantity</label>
                  <input
                    type="number"
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. ml, g, units"
                    value={stockForm.unit}
                    onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Examiner Modal */}
      {examinerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Register Board Practical Examiner</h3>
            <form onSubmit={handleCreateExaminer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Examiner Name</label>
                <input
                  type="text"
                  value={examinerForm.examinerName}
                  onChange={(e) => setExaminerForm({ ...examinerForm, examinerName: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Board</label>
                  <select
                    value={examinerForm.board}
                    onChange={(e) => setExaminerForm({ ...examinerForm, board: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:outline-none"
                  >
                    <option value="FBISE">FBISE</option>
                    <option value="BISE Lahore">BISE Lahore</option>
                    <option value="BISE Rawalpindi">BISE Rawalpindi</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Type</label>
                  <select
                    value={examinerForm.examinerType}
                    onChange={(e) => setExaminerForm({ ...examinerForm, examinerType: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 bg-white focus:outline-none"
                  >
                    <option value="external">External</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">CNIC</label>
                <input
                  type="text"
                  placeholder="35202-xxxxxxx-x"
                  value={examinerForm.examinerCnic}
                  onChange={(e) => setExaminerForm({ ...examinerForm, examinerCnic: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 mt-1 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExaminerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
