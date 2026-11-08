import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/common/Pagination';
import CollegesHubLoader from '../../components/common/CollegesHubLoader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Search from '../../components/ui/Search';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import TableRow from '../../components/ui/TableRow';
import Modal from '../../components/ui/Modal';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/Icon';

const Students = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isReadOnly = user?.role === 'principal' || user?.role === 'teacher';
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeSectionTab, setActiveSectionTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const limit = 15;

  // Dynamic lists from metadata
  const [classesList, setClassesList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);

  // Subject combinations in registration modal
  const [groupSubjects, setGroupSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loadingGroupSubjects, setLoadingGroupSubjects] = useState(false);

  // Move Group state & modal
  const [movingStudent, setMovingStudent] = useState(null);
  const [moveTargetGroupId, setMoveTargetGroupId] = useState('');
  const [moveTargetSectionId, setMoveTargetSectionId] = useState('');
  const [moveReason, setMoveReason] = useState('Academic Stream Transfer');
  const [moveGroupSubjects, setMoveGroupSubjects] = useState([]);
  const [moveSelectedSubjects, setMoveSelectedSubjects] = useState([]);
  const [moveLoading, setMoveLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    fatherName: '',
    gender: 'male',
    class_id: '',
    group_id: '',
    section_id: '',
    phone: '',
    email: '',
    cnic: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    createAccount: false,
    password: 'student123',
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [clsRes, grpRes, secRes] = await Promise.all([
          api.get('/classes'),
          api.get('/groups'),
          api.get('/sections'),
        ]);
        setClassesList(clsRes.data.data || []);
        setGroupsList(grpRes.data.data || []);
        setSectionsList(secRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch academic metadata:', err);
        toast.error('Failed to load academic layout');
      }
    };
    fetchMetadata();
  }, []);

  const fetchStudents = async (
    targetPage = page,
    targetTab = activeSectionTab,
    targetSearch = search
  ) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: limit,
        search: targetSearch,
      };
      if (targetTab !== 'ALL') {
        params.section_id = targetTab;
      }
      const { data } = await api.get('/students', { params });
      setStudents(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalStudents(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(page, activeSectionTab, search);
  }, [page, activeSectionTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchStudents(1, activeSectionTab, search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchGroupSubjectsForForm = async (groupId) => {
    if (!groupId) {
      setGroupSubjects([]);
      setSelectedSubjects([]);
      return;
    }
    setLoadingGroupSubjects(true);
    try {
      const res = await api.get(`/groups/${groupId}/subjects`);
      const subjects = res.data.data || [];
      setGroupSubjects(subjects);
      const compulsoryIds = subjects
        .filter((s) => s.kind === 'compulsory')
        .map((s) => s.subject_id);
      setSelectedSubjects(compulsoryIds);
    } catch {
      setGroupSubjects([]);
      setSelectedSubjects([]);
    } finally {
      setLoadingGroupSubjects(false);
    }
  };

  const handleToggleElective = (subjectId, electiveSet, maxChoices = 1) => {
    const isSelected = selectedSubjects.includes(subjectId);
    if (isSelected) {
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
    } else {
      if (electiveSet) {
        const setSubjects = groupSubjects.filter(
          (s) => s.kind === 'elective' && s.electiveSet === electiveSet
        );
        const alreadyChosenInSet = selectedSubjects.filter((id) =>
          setSubjects.some((s) => s.subject_id === id)
        );
        if (alreadyChosenInSet.length >= maxChoices) {
          toast.error(`Maximum ${maxChoices} choice(s) allowed for "${electiveSet}"`);
          return;
        }
      }
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  const openMoveModal = (student) => {
    setMovingStudent(student);
    const matchedClass = classesList.find((c) => c.name === student.class);
    const classId = matchedClass?._id;
    const candidateGroups = groupsList.filter(
      (g) => (!classId || g.class_id === classId) && g.name !== student.group
    );
    const initialTargetGroup =
      candidateGroups[0]?._id || groupsList.find((g) => g.name !== student.group)?._id || '';
    setMoveTargetGroupId(initialTargetGroup);
    setMoveTargetSectionId('');
    setMoveReason('Academic Stream Transfer');
    if (initialTargetGroup) {
      fetchMoveGroupSubjects(initialTargetGroup);
    } else {
      setMoveGroupSubjects([]);
      setMoveSelectedSubjects([]);
    }
  };

  const fetchMoveGroupSubjects = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}/subjects`);
      const subjects = res.data.data || [];
      setMoveGroupSubjects(subjects);
      const compulsoryIds = subjects
        .filter((s) => s.kind === 'compulsory')
        .map((s) => s.subject_id);
      setMoveSelectedSubjects(compulsoryIds);
    } catch {
      setMoveGroupSubjects([]);
      setMoveSelectedSubjects([]);
    }
  };

  const handleMoveTargetGroupChange = (groupId) => {
    setMoveTargetGroupId(groupId);
    setMoveTargetSectionId('');
    if (groupId) {
      fetchMoveGroupSubjects(groupId);
    } else {
      setMoveGroupSubjects([]);
      setMoveSelectedSubjects([]);
    }
  };

  const handleToggleMoveElective = (subjectId, electiveSet, maxChoices = 1) => {
    const isSelected = moveSelectedSubjects.includes(subjectId);
    if (isSelected) {
      setMoveSelectedSubjects(moveSelectedSubjects.filter((id) => id !== subjectId));
    } else {
      if (electiveSet) {
        const setSubjects = moveGroupSubjects.filter(
          (s) => s.kind === 'elective' && s.electiveSet === electiveSet
        );
        const alreadyChosenInSet = moveSelectedSubjects.filter((id) =>
          setSubjects.some((s) => s.subject_id === id)
        );
        if (alreadyChosenInSet.length >= maxChoices) {
          toast.error(`Maximum ${maxChoices} choice(s) allowed for "${electiveSet}"`);
          return;
        }
      }
      setMoveSelectedSubjects([...moveSelectedSubjects, subjectId]);
    }
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!movingStudent) return;
    if (!moveTargetGroupId) return toast.error('Please select a target group');

    setMoveLoading(true);
    try {
      await api.post(`/students/${movingStudent._id || movingStudent.id}/move-group`, {
        targetGroupId: moveTargetGroupId,
        section_id: moveTargetSectionId || undefined,
        reason: moveReason,
        subjectIds: moveSelectedSubjects,
      });
      toast.success(`Student ${movingStudent.name} successfully transferred!`);
      setMovingStudent(null);
      fetchStudents(page, activeSectionTab, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setMoveLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_id) return toast.error('Class selection is required');
    if (!form.group_id) return toast.error('Group selection is required');
    if (!form.section_id) return toast.error('Section selection is required');

    try {
      let studentId = editing;
      if (editing) {
        await api.put(`/students/${editing}`, form);
        toast.success('Student updated successfully');
      } else {
        const res = await api.post('/students', form);
        studentId = res.data.data?._id || res.data.data?.id;
        toast.success('Student registered successfully');
      }

      if (studentId && selectedSubjects.length > 0) {
        try {
          await api.post(`/students/${studentId}/subjects`, { subjectIds: selectedSubjects });
        } catch (subErr) {
          console.warn('Subject assignment warning:', subErr.response?.data?.message);
        }
      }

      setShowModal(false);
      setEditing(null);
      fetchStudents(page, activeSectionTab, search);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      rollNumber: '',
      fatherName: '',
      gender: 'male',
      class_id: classesList[0]?._id || '',
      group_id: '',
      section_id: '',
      phone: '',
      email: '',
      cnic: '',
      address: '',
      guardianName: '',
      guardianPhone: '',
      guardianRelation: '',
      createAccount: false,
      password: 'student123',
    });
    setGroupSubjects([]);
    setSelectedSubjects([]);
  };

  const handleTabChange = (tabId) => {
    setActiveSectionTab(tabId);
    setPage(1);
  };

  const getActiveSectionDetails = () => {
    if (activeSectionTab === 'ALL') {
      return {
        name: 'All Sections',
        part: 'Full Session',
        code: 'ALL',
        groups: 'All Dynamic Streams',
        total: totalStudents,
        capacity: sectionsList.reduce((acc, curr) => acc + (curr.capacity || 40), 0) || 120,
      };
    }
    const sec = sectionsList.find((s) => s._id === activeSectionTab);
    return {
      name: sec?.name || `Section ${sec?.code || ''}`,
      part: sec?.class_id?.name || 'N/A',
      code: sec?.code || 'N/A',
      groups: sec?.group_id?.name || 'N/A',
      total: totalStudents,
      capacity: sec?.capacity || 40,
    };
  };

  const activeDetails = getActiveSectionDetails();

  const sectionTabs = [
    { id: 'ALL', name: 'All Sections' },
    ...sectionsList.map((sec) => ({
      id: sec._id,
      name: `${sec.code}${sec.name ? ` (${sec.name})` : ''}`,
    })),
  ];

  return (
    <div className="page">
      {/* Page Title & Add Button */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Students Directory</h1>
          <p className="page-sub">
            {isReadOnly
              ? 'View dynamic student roster and academic placements'
              : 'Register, transfer, and manage enrolled student rosters'}
          </p>
        </div>
        {!isReadOnly && (
          <div className="page-actions">
            <Button
              isPrimary
              icon="plus"
              onClick={() => {
                setEditing(null);
                resetForm();
                setShowModal(true);
              }}
            >
              Add Student
            </Button>
          </div>
        )}
      </div>

      {/* Active Section Summary Card */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-caption font-bold text-[var(--brand-blue)] uppercase tracking-wider block">
            Academic Group Context
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-h5 text-t-primary">{activeDetails.name}</h2>
            <span className="label label-blue">{activeDetails.part}</span>
            {activeDetails.code !== 'ALL' && (
              <span className="label label-green">Code {activeDetails.code}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-10 border-t border-s-subtle md:border-t-0 pt-4 md:pt-0">
          <div>
            <span className="text-caption font-semibold text-t-tertiary uppercase tracking-wider block">
              Group Binding
            </span>
            <span className="text-sub-title-2 text-t-primary mt-1 block">
              {activeDetails.groups}
            </span>
          </div>
          <div>
            <span className="text-caption font-semibold text-t-tertiary uppercase tracking-wider block">
              Section Capacity
            </span>
            <span className="text-sub-title-2 text-t-primary mt-1 block font-mono tabular-nums">
              <strong className="text-[var(--brand-blue)]">{activeDetails.total}</strong> /{' '}
              {activeDetails.capacity}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-caption font-semibold text-t-tertiary uppercase tracking-wider block">
              Dynamic Status
            </span>
            <span className="text-sub-title-2 text-[var(--brand-green-text)] mt-1 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[var(--brand-green)] rounded-full animate-pulse" />
              Synced
            </span>
          </div>
        </div>
      </Card>

      {/* Main Roster Card with Search, Section Tabs, and Table */}
      <Card
        title="Enrolled Students"
        subtitle={`${totalStudents.toLocaleString()} student records matching active filter`}
        headContent={
          <Search
            className="w-full sm:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search by name or roll #..."
          />
        }
      >
        {sectionTabs.length > 1 && (
          <div className="mb-5">
            <Tabs
              items={sectionTabs}
              value={activeSectionTab}
              setValue={(id) => handleTabChange(id)}
            />
          </div>
        )}

        {loading ? (
          <CollegesHubLoader
            size="md"
            text="Loading student records…"
            minHeight="min-h-[220px]"
          />
        ) : students.length === 0 ? (
          <EmptyState
            icon="graduation-cap"
            title="No students found"
            description="No students match your current section or search filter."
            action={
              !isReadOnly ? (
                <Button
                  isPrimary
                  icon="plus"
                  onClick={() => {
                    setEditing(null);
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  Register First Student
                </Button>
              ) : null
            }
          />
        ) : (
          <Table
            cellsThead={
              <>
                <th>Student Details</th>
                <th>Roll Number</th>
                <th>Class & Dynamic Group</th>
                <th>Section</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </>
            }
          >
            {students.map((s) => {
              const isActive = s.status === 'active';
              const rowActions = [
                {
                  label: 'View Student Profile',
                  icon: 'eye',
                  onClick: () => navigate(`/${user?.role || 'admin'}/students/${s._id}`),
                },
                ...(!isReadOnly
                  ? [
                      {
                        label: 'Transfer Academic Group',
                        icon: 'switch-horizontal',
                        disabled: !isActive,
                        onClick: () => openMoveModal(s),
                      },
                    ]
                  : []),
              ];

              return (
                <TableRow
                  key={s._id}
                  onClick={() => navigate(`/${user?.role || 'admin'}/students/${s._id}`)}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar h-10 w-10 rounded-2xl shrink-0">
                        {s.name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="text-sub-title-2 text-t-primary">{s.name}</p>
                        <p className="text-caption text-t-tertiary">s/o {s.fatherName}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="label label-blue font-mono">{s.rollNumber}</span>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sub-title-2 text-t-primary">{s.class}</span>
                      <span className="text-caption text-[var(--brand-blue)] font-medium">
                        {s.group}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="label label-gray">{s.section}</span>
                  </td>
                  <td>
                    <span className={`label capitalize ${isActive ? 'label-green' : 'label-red'}`}>
                      {s.status || 'active'}
                    </span>
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center justify-end gap-2">
                      {!isReadOnly && (
                        <Button
                          isStroke
                          size="sm"
                          icon="switch-horizontal"
                          disabled={!isActive}
                          onClick={() => openMoveModal(s)}
                        >
                          Move Group
                        </Button>
                      )}
                      <Dropdown items={rowActions} />
                    </div>
                  </td>
                </TableRow>
              );
            })}
          </Table>
        )}

        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalStudents}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </Card>

      {/* Register / Edit Student Modal (Portaled inside #app-portal-root) */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Student Record' : 'Register New Student'}
        subtitle="Complete academic placement and guardian contact information"
        classWrapper="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">Student Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">Roll Number *</label>
              <input
                value={form.rollNumber}
                onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                className="input-field"
                required
                placeholder="Academic Roll Number"
              />
            </div>
            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">Father Name *</label>
              <input
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                className="input-field"
                required
                placeholder="Father Name"
              />
            </div>
            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input-field"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Dynamic Academic Placements */}
            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">
                Class / Academic Part *
              </label>
              <select
                value={form.class_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    class_id: e.target.value,
                    group_id: '',
                    section_id: '',
                  })
                }
                className="input-field"
                required
              >
                <option value="">Select Class</option>
                {classesList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">
                Academic Group / Stream *
              </label>
              <select
                value={form.group_id}
                onChange={(e) => {
                  const gid = e.target.value;
                  setForm({ ...form, group_id: gid, section_id: '' });
                  fetchGroupSubjectsForForm(gid);
                }}
                className="input-field"
                required
                disabled={!form.class_id}
              >
                <option value="">Select Group</option>
                {groupsList
                  .filter((g) => g.class_id === form.class_id)
                  .map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sub-title-2 text-t-primary mb-2">
                Section Assignment *
              </label>
              <select
                value={form.section_id}
                onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                className="input-field"
                required
                disabled={!form.group_id}
              >
                <option value="">Select Section</option>
                {sectionsList
                  .filter(
                    (s) => s.group_id?._id === form.group_id || s.group_id === form.group_id
                  )
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.code} {s.name ? `(${s.name})` : ''} — Limit: {s.capacity || 40} Students
                    </option>
                  ))}
              </select>
            </div>

            {/* Subject Combinations Configuration */}
            {form.group_id && (
              <div className="md:col-span-2 border border-s-stroke2 rounded-3xl p-4 bg-b-surface1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="book-open" size={18} className="fill-[var(--brand-blue)]" />
                    <span className="text-sub-title-2 text-t-primary">
                      Subject Combination Rules
                    </span>
                  </div>
                  <span className="label label-blue font-mono">
                    {selectedSubjects.length} subjects chosen
                  </span>
                </div>

                {loadingGroupSubjects ? (
                  <CollegesHubLoader
                    size="xs"
                    text="Loading group subjects…"
                    minHeight="min-h-[70px]"
                  />
                ) : groupSubjects.length === 0 ? (
                  <p className="text-caption text-t-secondary italic">
                    No custom subject rules configured for this group. Standard syllabus will be
                    used.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {groupSubjects.filter((gs) => gs.kind === 'compulsory').length > 0 && (
                      <div>
                        <span className="text-caption font-bold text-t-tertiary uppercase tracking-wider block mb-1.5">
                          Compulsory Subjects (Automatic)
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {groupSubjects
                            .filter((gs) => gs.kind === 'compulsory')
                            .map((gs) => (
                              <span key={gs._id} className="label label-green">
                                <Icon name="check" size={12} className="fill-current" />
                                {gs.subject?.name || 'Subject'}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {Object.entries(
                      groupSubjects
                        .filter((gs) => gs.kind === 'elective')
                        .reduce((acc, gs) => {
                          const setKey = gs.electiveSet || 'General Electives';
                          if (!acc[setKey]) acc[setKey] = [];
                          acc[setKey].push(gs);
                          return acc;
                        }, {})
                    ).map(([setName, items]) => {
                      const maxChoices = items[0]?.maxChoices || 1;
                      const chosenInSet = selectedSubjects.filter((id) =>
                        items.some((gs) => gs.subject_id === id)
                      ).length;
                      return (
                        <div key={setName} className="border-t border-s-subtle pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-caption font-bold text-[var(--brand-blue)] uppercase tracking-wider">
                              {setName} (choose {maxChoices})
                            </span>
                            <span
                              className={`label font-mono ${
                                chosenInSet === maxChoices ? 'label-green' : 'label-yellow'
                              }`}
                            >
                              {chosenInSet} / {maxChoices} chosen
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {items.map((gs) => {
                              const isSelected = selectedSubjects.includes(gs.subject_id);
                              return (
                                <label
                                  key={gs._id}
                                  onClick={() =>
                                    handleToggleElective(
                                      gs.subject_id,
                                      gs.electiveSet,
                                      maxChoices
                                    )
                                  }
                                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-caption cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-[var(--brand-blue-soft)] border-[var(--brand-blue)] text-t-primary font-semibold'
                                      : 'bg-b-surface2 border-s-subtle text-t-secondary hover:text-t-primary'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded border-s-stroke2 text-[var(--brand-blue)]"
                                  />
                                  <span className="truncate">{gs.subject?.name || 'Subject'}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
                placeholder="Contact number"
              />
            </div>
            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">CNIC / B-Form</label>
              <input
                value={form.cnic}
                onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                className="input-field"
                placeholder="National Identifier"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sub-title-2 text-t-primary mb-2">
                Student Email Address
              </label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                type="email"
                placeholder="Unique email for registration"
              />
            </div>
          </div>

          {/* Redesigned Guardian Details Card Section */}
          <div className="rounded-3xl bg-b-surface1 border border-s-subtle p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)] flex items-center justify-center">
                <Icon name="users" size={16} className="fill-current" />
              </span>
              <div>
                <h3 className="text-sub-title-2 text-t-primary">Parent / Guardian Details</h3>
                <p className="text-caption text-t-tertiary">
                  Emergency & attendance notification contact
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-caption font-semibold text-t-secondary mb-1.5">
                  Guardian Name
                </label>
                <input
                  value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                  className="input-field"
                  placeholder="Guardian Name"
                />
              </div>
              <div>
                <label className="block text-caption font-semibold text-t-secondary mb-1.5">
                  Guardian Phone
                </label>
                <input
                  value={form.guardianPhone}
                  onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  className="input-field"
                  placeholder="Contact Phone"
                />
              </div>
              <div>
                <label className="block text-caption font-semibold text-t-secondary mb-1.5">
                  Relationship
                </label>
                <input
                  value={form.guardianRelation}
                  onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })}
                  className="input-field"
                  placeholder="Father, Mother, Uncle..."
                />
              </div>
            </div>
          </div>

          {!editing && (
            <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.createAccount}
                onChange={(e) => setForm({ ...form, createAccount: e.target.checked })}
                className="rounded border-s-stroke2 text-[var(--brand-blue)]"
              />
              <span className="text-caption font-medium text-t-secondary">
                Auto-create Student Portal Login account (Default password:{' '}
                <code className="font-mono text-t-primary">student123</code>)
              </span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-s-subtle">
            <Button type="button" isStroke onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isPrimary icon="check">
              {editing ? 'Save Modifications' : 'Confirm Registration'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Move Group Modal (Portaled inside #app-portal-root) */}
      <Modal
        open={Boolean(movingStudent)}
        onClose={() => !moveLoading && setMovingStudent(null)}
        title="Transfer Student Group"
        subtitle="Move student to another academic stream and update subject mappings"
        classWrapper="max-w-xl"
      >
        {movingStudent && (
          <form onSubmit={handleMoveSubmit} className="space-y-4">
            <div className="bg-b-surface1 border border-s-subtle p-4 rounded-3xl flex items-center justify-between gap-4">
              <div>
                <p className="text-sub-title-1 text-t-primary">{movingStudent.name}</p>
                <p className="text-caption text-t-secondary">
                  Roll:{' '}
                  <span className="text-[var(--brand-blue)] font-mono font-semibold">
                    {movingStudent.rollNumber}
                  </span>{' '}
                  • Class: {movingStudent.class}
                </p>
              </div>
              <div className="text-right">
                <span className="text-caption text-t-tertiary block">Current Group</span>
                <span className="label label-yellow mt-1">
                  {movingStudent.group} ({movingStudent.section || 'No Sec'})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sub-title-2 text-t-primary mb-2">
                  Target Group *
                </label>
                <select
                  value={moveTargetGroupId}
                  onChange={(e) => handleMoveTargetGroupChange(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select Target Group</option>
                  {groupsList
                    .filter((g) => g.name !== movingStudent.group)
                    .map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name} {g.seats ? `(Limit: ${g.seats})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sub-title-2 text-t-primary mb-2">
                  Target Section (Optional)
                </label>
                <select
                  value={moveTargetSectionId}
                  onChange={(e) => setMoveTargetSectionId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Auto-assign / Keep Section</option>
                  {sectionsList
                    .filter(
                      (s) =>
                        !moveTargetGroupId ||
                        s.group_id?._id === moveTargetGroupId ||
                        s.group_id === moveTargetGroupId
                    )
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} {s.name ? `(${s.name})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sub-title-2 text-t-primary mb-2">
                Transfer Reason *
              </label>
              <select
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                className="input-field"
              >
                <option value="Academic Stream Transfer">
                  Academic Stream Transfer (e.g. Pre-Med to ICS)
                </option>
                <option value="Student Request">Student / Parent Formal Request</option>
                <option value="Administrative Reassignment">Administrative Reassignment</option>
                <option value="Seat Availability Adjustment">Seat Availability Adjustment</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-s-subtle">
              <Button
                type="button"
                isStroke
                disabled={moveLoading}
                onClick={() => setMovingStudent(null)}
              >
                Cancel
              </Button>
              <Button type="submit" isPrimary disabled={moveLoading} icon="check">
                {moveLoading ? 'Transferring Student...' : 'Confirm Transfer'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Students;
