import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineCloudUpload, 
  HiOutlineDownload, 
  HiOutlineCheckCircle, 
  HiOutlineExclamation, 
  HiOutlineArrowLeft, 
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlineCheck
} from 'react-icons/hi';

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/);
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    result.push(cells);
  }
  return result;
};

const UploadResult = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [sectionMap, setSectionMap] = useState({});
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSectionCode, setSelectedSectionCode] = useState('');
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  
  // Compute subjects that the teacher actually teaches in this exam campaign (or all subjects if Admin)
  const teacherExamSubjects = selectedExam
    ? (user?.role === 'admin'
        ? selectedExam.subjects
        : selectedExam.subjects.filter(examSub => {
            // Strict restriction for teachers
            return assignedSubjects.some(assignedSub => 
              assignedSub._id === examSub.subject_id || 
              assignedSub.name?.toLowerCase() === examSub.name?.toLowerCase()
            );
          }))
    : [];
  
  // Workflow states
  const [currentStep, setCurrentStep] = useState(1); // 1: Setup, 2: Upload, 3: Validate
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Parsing & validation states
  const [parsedData, setParsedData] = useState([]); // List of { student_id, rollNumber, name, marks: { [subName]: obtained } }
  const [validationErrors, setValidationErrors] = useState({}); // { [studentId]: { [subName]: errorMsg } }
  const [validationSummary, setValidationSummary] = useState({ totalRows: 0, errorCount: 0 });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [eRes, sRes, pRes] = await Promise.all([
        api.get('/exams').catch(() => ({ data: { data: [] } })),
        api.get('/sections').catch(() => ({ data: { data: [] } })),
        api.get('/profile/me').catch(() => ({ data: { data: {} } }))
      ]);
      setExams(eRes.data.data || []);
      setAssignedSubjects(pRes.data?.data?.teacherSubjects || []);

      if (sRes.data?.success && sRes.data?.data) {
        const map = {};
        const list = [];
        sRes.data.data.forEach(s => {
          const className = s.class_id?.name || '';
          if (s.code && className) {
            const compoundKey = `${className}_${s.code}`;
            map[compoundKey] = s.name || `Section ${s.code}`;
            list.push({
              id: compoundKey,
              code: s.code,
              className: className,
              name: s.name || `Section ${s.code}`
            });
          }
        });
        setSectionMap(map);
        setSectionsList(list);
      }
    } catch {
      toast.error('Failed to load active exams registry');
    } finally {
      setLoading(false);
    }
  };

  // When exam is selected, fetch students of that class
  useEffect(() => {
    if (!selectedExamId) {
      setSelectedExam(null);
      setStudents([]);
      setSelectedSectionCode('');
      return;
    }

    const exam = exams.find(e => e._id === selectedExamId);
    setSelectedExam(exam);
    fetchStudents(exam.class);
  }, [selectedExamId]);

  // Auto-select first section when exam target finishes loading
  useEffect(() => {
    if (selectedExam) {
      const classSecs = sectionsList.filter(s => s.className === selectedExam.class);
      const finalSecs = classSecs.length > 0
        ? classSecs
        : Array.from(new Set(students.map(s => s.section)))
            .filter(Boolean)
            .map(code => ({ code }));

      if (finalSecs.length > 0) {
        const isCurrentValid = finalSecs.some(s => s.code === selectedSectionCode);
        if (!isCurrentValid) {
          setSelectedSectionCode(finalSecs[0].code);
        }
      } else {
        setSelectedSectionCode('');
      }
    } else {
      setSelectedSectionCode('');
    }
  }, [selectedExam, students, sectionsList]);

  const fetchStudents = async (className) => {
    setStudentsLoading(true);
    try {
      const { data } = await api.get('/students', { params: { class: className, limit: 300 } });
      setStudents(data.data || []);
    } catch {
      toast.error('Failed to fetch class roster list');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Generate pre-populated CSV template
  const handleDownloadTemplate = () => {
    if (!selectedExam || students.length === 0) {
      toast.error('Roster or Exam information is not fully loaded');
      return;
    }

    if (!selectedSectionCode) {
      toast.error('Please select a target section name first');
      return;
    }

    const sectionStudents = students.filter(s => s.section === selectedSectionCode);
    if (sectionStudents.length === 0) {
      toast.error('No students found in the selected section');
      return;
    }

    if (teacherExamSubjects.length === 0) {
      toast.error('You are not assigned to any subjects in this exam campaign');
      return;
    }

    // 1. Build Headers
    // Roll Number, Student Name, Section, Sub1 (Max: 100), Sub2 (Max: 100)...
    const headers = ['Roll Number', 'Student Name', 'Section (Full Name)'];
    teacherExamSubjects.forEach(sub => {
      headers.push(`${sub.name} (Max: ${sub.totalMarks})`);
    });

    const csvRows = [headers.join(',')];

    // 2. Pre-populate rows
    sectionStudents.forEach(s => {
      const compoundKey = `${s.class}_${s.section}`;
      const friendlySec = sectionMap[compoundKey] || s.section || '—';
      const row = [
        `"${s.rollNumber}"`,
        `"${s.name}"`,
        `"${friendlySec}"`
      ];
      // Empty spaces for marks columns
      teacherExamSubjects.forEach(() => {
        row.push('');
      });
      csvRows.push(row.join(','));
    });

    // 3. Trigger download
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sectionFriendly = sectionMap[`${selectedExam.class}_${selectedSectionCode}`] || `Section_${selectedSectionCode}`;
    link.setAttribute('download', `Academix_Result_Template_${selectedExam.name.replace(/\s+/g, '_')}_${sectionFriendly.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Pre-populated CSV template for ${sectionFriendly} downloaded successfully!`);
    
    // Auto progress to next step
    setCurrentStep(2);
  };

  // Drag and drop event handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setCsvFile(file);
        handleFileProcessing(file);
      } else {
        toast.error('Only CSV format files are supported');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      handleFileProcessing(file);
    }
  };

  // Parse and process file client-side
  const handleFileProcessing = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsedRows = parseCSV(text);

      if (parsedRows.length <= 1) {
        toast.error('CSV file seems empty or missing header lines');
        return;
      }

      const headers = parsedRows[0].map(h => h.toLowerCase().trim());
      
      // Resolve Column indexes
      const rollIdx = headers.findIndex(h => h.includes('roll') || h.includes('id'));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      
      if (rollIdx === -1) {
        toast.error('Could not find mandatory "Roll Number" column in CSV headers');
        return;
      }

      // Map subject columns
      const subjectCols = []; // list of { colIndex, subjectName, totalMarks, subject_id }
      teacherExamSubjects.forEach(sub => {
        const subNameLower = sub.name.toLowerCase();
        // find a header that matches subject name
        const matchIdx = headers.findIndex(h => h.includes(subNameLower));
        if (matchIdx !== -1) {
          subjectCols.push({
            colIndex: matchIdx,
            subjectName: sub.name,
            totalMarks: sub.totalMarks,
            subject_id: sub.subject_id
          });
        }
      });

      if (subjectCols.length === 0) {
        toast.error('Could not match any CSV columns to Exam subjects');
        return;
      }

      // Parse data rows
      const grid = [];
      for (let i = 1; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        if (row.length < 2) continue; // skip empty lines

        const rollVal = row[rollIdx]?.trim();
        const nameVal = row[nameIdx]?.trim() || 'Student';

        // Match with database student roster (only in the selected section)
        const matchedStu = students.find(s => 
          s.rollNumber?.toLowerCase() === rollVal?.toLowerCase() &&
          s.section === selectedSectionCode
        );

        const marksMap = {};
        subjectCols.forEach(col => {
          const val = row[col.colIndex]?.trim();
          marksMap[col.subjectName] = val === undefined ? '' : val;
        });

        grid.push({
          student_id: matchedStu?._id || null,
          rollNumber: rollVal,
          name: matchedStu?.name || nameVal,
          notFound: !matchedStu,
          marks: marksMap
        });
      }

      setParsedData(grid);
      validateDataGrid(grid, subjectCols);
      setCurrentStep(3); // Advance to preview & validation grid
    };
    reader.readAsText(file);
  };

  // Perform full validation grid check
  const validateDataGrid = (grid, activeSubCols = []) => {
    const subs = activeSubCols.length > 0 ? activeSubCols : teacherExamSubjects;
    const errors = {};
    let errCount = 0;

    grid.forEach((row, rIdx) => {
      errors[rIdx] = {};
      
      // 1. Check if student found
      if (row.notFound) {
        const friendlySection = sectionMap[`${selectedExam?.class}_${selectedSectionCode}`] || `Section ${selectedSectionCode}`;
        errors[rIdx]['student'] = `Student Roll Number not found in ${friendlySection}`;
        errCount++;
      }

      // 2. Check each subject marks
      subs.forEach(sub => {
        const obtainedStr = row.marks[sub.name];
        if (obtainedStr !== '' && obtainedStr !== undefined) {
          const num = Number(obtainedStr);
          if (isNaN(num)) {
            errors[rIdx][sub.name] = 'Marks must be a valid number';
            errCount++;
          } else if (num < 0) {
            errors[rIdx][sub.name] = 'Marks cannot be negative';
            errCount++;
          } else if (num > sub.totalMarks) {
            errors[rIdx][sub.name] = `Cannot exceed Max: ${sub.totalMarks}`;
            errCount++;
          }
        }
      });
    });

    setValidationErrors(errors);
    setValidationSummary({
      totalRows: grid.length,
      errorCount: errCount
    });
  };

  // Manual cell override inputs inside preview grid
  const handleCellChange = (rowIndex, subjectName, val) => {
    const updated = [...parsedData];
    updated[rowIndex] = {
      ...updated[rowIndex],
      marks: {
        ...updated[rowIndex].marks,
        [subjectName]: val
      }
    };
    setParsedData(updated);
    
    // Re-run validation on updated grid
    const subCols = teacherExamSubjects.map(s => ({
      subjectName: s.name,
      totalMarks: s.totalMarks,
      subject_id: s.subject_id
    }));
    validateDataGrid(updated, subCols);
  };

  // Save validated data in one bulk API post
  const handleSaveBulk = async () => {
    if (validationSummary.errorCount > 0) {
      toast.error('Please resolve all validation errors in the table grid first.');
      return;
    }

    setSaving(true);
    try {
      const uploadPayload = parsedData.map(row => {
        const marksPayload = Object.entries(row.marks)
          .filter(([subjectName, value]) => {
            if (value === '' || value === undefined) return false;
            return teacherExamSubjects.some(sub => sub.name === subjectName);
          })
          .map(([subjectName, value]) => {
            const matchedSub = teacherExamSubjects.find(s => s.name === subjectName);
            return {
              subject: subjectName,
              subject_id: matchedSub?.subject_id,
              obtained: Number(value),
              total: matchedSub?.totalMarks
            };
          });

        return {
          student_id: row.student_id,
          marks: marksPayload
        };
      }).filter(r => r.student_id && r.marks.length > 0);

      if (uploadPayload.length === 0) {
        toast.error('No valid scores found to upload.');
        setSaving(false);
        return;
      }

      await api.post('/results/bulk', {
        exam_id: selectedExamId,
        results: uploadPayload
      });

      toast.success(`Successfully uploaded results for ${uploadPayload.length} students!`);
      navigate('/teacher/results');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk upload results. Verify ownership permissions.');
    } finally {
      setSaving(false);
    }
  };

  // Get active sections for the selected class
  const classSecs = selectedExam
    ? sectionsList.filter(s => s.className === selectedExam.class)
    : [];

  const availableSections = classSecs.length > 0
    ? classSecs
    : Array.from(new Set(students.map(s => s.section)))
        .filter(Boolean)
        .map(code => ({
          code,
          name: sectionMap[`${selectedExam?.class}_${code}`] || `Section ${code}`,
          className: selectedExam?.class
        }));

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Header */}
      <div>
        <button onClick={() => navigate('/teacher/results')} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-xs mb-3 font-semibold uppercase tracking-wider">
          <HiOutlineArrowLeft size={14} /> Back to Results
        </button>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          📥 Bulk Import Marksheet
        </h1>
        <p className="text-white/40 text-xs mt-1">Upload graded cohort exam sheets using Excel / CSV files.</p>
      </div>

      {/* Progress Steps Indicators Bar */}
      <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs font-bold tracking-wide uppercase">
        {[
          { step: 1, label: 'Select Campaign' },
          { step: 2, label: 'Download Template' },
          { step: 3, label: 'Upload Sheet' },
          { step: 4, label: 'Verify & Confirm' }
        ].map(s => {
          const isActive = currentStep >= s.step;
          const isCurrent = currentStep === s.step;
          return (
            <div key={s.step} className={`py-2 px-1 sm:px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
              isCurrent 
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                : isActive 
                  ? 'bg-slate-800/40 text-emerald-400/80 border border-transparent' 
                  : 'bg-transparent text-white/20 border border-transparent'
            }`}>
              <div className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-black ${
                isCurrent 
                  ? 'bg-indigo-500 text-slate-950 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                  : isActive 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-white/10 text-white/40'
              }`}>
                {isActive && s.step < currentStep ? <HiOutlineCheck size={10} /> : s.step}
              </div>
              <span className="hidden md:inline">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Steps Content Layout */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500/20 border-top-indigo-500 rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main workspace section (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1 & 2 Card */}
            {currentStep <= 2 && (
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl space-y-6">
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Configuration Step</span>
                  <h3 className="text-lg font-black text-white">Select Target Exam Campaign</h3>
                  <p className="text-white/40 text-xs mt-1">Select an active exam. The template generator will lock subject totals and load the class student register.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Campaign</label>
                    <select 
                      value={selectedExamId} 
                      onChange={e => {
                        setSelectedExamId(e.target.value);
                        setCurrentStep(1);
                      }} 
                      className="input-field w-full py-3"
                    >
                      <option value="">Choose Exam Campaign...</option>
                      {exams.map(e => (
                        <option key={e._id} value={e._id}>{e.name} ({e.class})</option>
                      ))}
                    </select>
                  </div>

                  {selectedExam && (
                    <div className="flex flex-col gap-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Section Name</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableSections.map(sec => (
                          <button
                            key={sec.code}
                            type="button"
                            onClick={() => setSelectedSectionCode(sec.code)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 border ${
                              selectedSectionCode === sec.code
                                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.2)] font-black'
                                : 'bg-slate-950/40 text-slate-400 border-white/5 hover:text-white hover:border-white/10'
                            }`}
                          >
                            {sec.name}
                          </button>
                        ))}
                      </div>
                      {availableSections.length === 0 && (
                        <p className="text-[11px] text-rose-400/80 font-semibold mt-1">
                          No sections found registered for this class.
                        </p>
                      )}
                    </div>
                  )}

                  {selectedExam && (
                    <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-3 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider block">Class Target</span>
                          <span className="text-white font-bold text-sm block mt-0.5">{selectedExam.class}</span>
                        </div>
                        <div>
                          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider block">Total Students (Section)</span>
                          <span className="text-white font-bold text-sm block mt-0.5" key={selectedSectionCode}>
                            {studentsLoading 
                              ? 'Loading roster...' 
                              : `${students.filter(s => s.section === selectedSectionCode).length} Students`
                            }
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3">
                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider block mb-2">Subject Columns & Caps</span>
                        <div className="flex flex-wrap gap-2">
                          {teacherExamSubjects.map(s => (
                            <span key={s.name} className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 rounded-lg text-[10px] font-bold">
                              {s.name} <span className="opacity-50">/{s.totalMarks}</span>
                            </span>
                          ))}
                          {teacherExamSubjects.length === 0 && (
                            <span className="text-rose-400 font-bold text-[10px] uppercase tracking-wider">None assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedExam && students.length > 0 && (
                    teacherExamSubjects.length > 0 ? (
                      <button 
                        onClick={handleDownloadTemplate} 
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all duration-200"
                      >
                        <HiOutlineDownload size={16} />
                        Generate & Download Pre-populated Template (.csv)
                      </button>
                    ) : (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
                        <HiOutlineExclamation size={18} className="shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">No Assigned Subjects Detected</p>
                          <p className="opacity-80 text-[11px] mt-0.5">You are not registered to teach any subjects listed under the {selectedExam.name} campaign. Only assigned subjects can be imported.</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Step 3: File Dropzone Card */}
            {currentStep === 2 && selectedExam && (
              <div 
                className={`bg-slate-900/60 backdrop-blur-md border p-8 rounded-3xl shadow-xl transition-all duration-200 ${
                  dragActive ? 'border-indigo-500 bg-indigo-950/10' : 'border-white/10'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-14 h-14 bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                    <HiOutlineCloudUpload size={28} className="animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Upload Completed Marksheet</h4>
                    <p className="text-white/40 text-[11px] max-w-sm mt-1 mx-auto">Drag & drop your saved CSV template here, or select it from your local directories.</p>
                  </div>

                  <label className="btn-secondary px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all">
                    Browse Files
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Preview & Validation Edit Grid */}
            {currentStep === 3 && parsedData.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-md font-black text-white">Interactive Sheets Validation Grid</h3>
                    <p className="text-white/40 text-[10px] mt-0.5">Please review your parsed result rows below. Click any cell to override marks directly.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCurrentStep(2)} 
                      className="btn-secondary text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-xl hover:bg-white/5"
                    >
                      Re-upload File
                    </button>
                    <button 
                      onClick={handleSaveBulk} 
                      disabled={validationSummary.errorCount > 0 || saving} 
                      className={`btn-primary text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-xl flex items-center gap-1.5 ${
                        validationSummary.errorCount > 0 ? 'opacity-40 cursor-not-allowed bg-slate-800 text-white/30 border-transparent shadow-none' : ''
                      }`}
                    >
                      {saving ? 'Saving...' : 'Confirm & Save All'}
                    </button>
                  </div>
                </div>

                {/* Validation Warnings Summary Badge */}
                {validationSummary.errorCount > 0 && (
                  <div className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-3 flex items-center gap-2.5 text-rose-300 text-xs">
                    <HiOutlineExclamation size={18} className="shrink-0 animate-pulse text-rose-400" />
                    <span>
                      Found <strong>{validationSummary.errorCount} data validation errors</strong>. Please edit the highlighted cells directly in the table to fix them before saving.
                    </span>
                  </div>
                )}

                {/* Validation Success Summary Badge */}
                {validationSummary.errorCount === 0 && (
                  <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 flex items-center gap-2.5 text-emerald-300 text-xs">
                    <HiOutlineCheckCircle size={18} className="shrink-0 text-emerald-400" />
                    <span>
                      Roster is clean! All <strong>{validationSummary.totalRows} student rows</strong> are successfully validated and ready to save.
                    </span>
                  </div>
                )}

                {/* Custom Interactive Table Grid */}
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-20 backdrop-blur-md">
                        <th className="py-3 px-4 font-bold">Student</th>
                        <th className="py-3 px-4 font-bold">Roll Number</th>
                        {teacherExamSubjects.map(s => (
                          <th key={s.name} className="py-3 px-4 font-bold text-center">{s.name} <span className="opacity-40 font-normal">({s.totalMarks})</span></th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {parsedData.map((row, rIdx) => {
                        const hasRowError = Object.keys(validationErrors[rIdx] || {}).length > 0;
                        return (
                          <tr 
                            key={rIdx} 
                            className={`transition-colors duration-100 ${
                              hasRowError ? 'bg-rose-500/[0.03] hover:bg-rose-500/[0.05]' : 'bg-transparent hover:bg-white/[0.01]'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  row.notFound ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                                }`} />
                                <span>{row.name}</span>
                              </div>
                              {validationErrors[rIdx]?.['student'] && (
                                <span className="text-[9px] font-bold text-rose-400 block mt-0.5">{validationErrors[rIdx]['student']}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-400">{row.rollNumber || '—'}</td>
                            {teacherExamSubjects.map(sub => {
                              const cellErr = validationErrors[rIdx]?.[sub.name];
                              const cellVal = row.marks[sub.name] || '';
                              return (
                                <td key={sub.name} className="py-3 px-2 text-center">
                                  <input 
                                    type="text" 
                                    value={cellVal} 
                                    onChange={e => handleCellChange(rIdx, sub.name, e.target.value)} 
                                    placeholder="--" 
                                    className={`w-16 text-center py-1 rounded-lg border text-xs font-bold transition-all duration-100 mx-auto block ${
                                      cellErr 
                                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.1)] focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
                                        : cellVal !== '' 
                                          ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                                          : 'bg-slate-950/30 border-white/5 text-slate-400 focus:border-white/20 focus:ring-0'
                                    }`}
                                    title={cellErr || ''}
                                  />
                                  {cellErr && (
                                    <span className="text-[8px] font-bold text-rose-400 block mt-0.5 max-w-[70px] mx-auto leading-tight">{cellErr}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
          </div>

          {/* Right sidebar instructions/helpful tips card (1 col) */}
          <div className="space-y-6">
            
            {/* Template Help Info Card */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <HiOutlineSparkles size={20} />
                <h4 className="text-xs font-bold uppercase tracking-wider">Teacher Instruction Panel</h4>
              </div>

              <div className="text-[11px] text-slate-400 space-y-3 leading-relaxed">
                <p>
                  To make score entry completely seamless and error-free, follow these simple guidelines:
                </p>
                
                <ol className="list-decimal pl-4 space-y-2.5 font-medium">
                  <li>
                    <strong className="text-white">Choose Exam Campaign:</strong> Select the correct target exam first. This fetches the designated subjects and active class roster.
                  </li>
                  <li>
                    <strong className="text-white">Download CSV Template:</strong> Academix generates a tailored CSV with pre-populated student names and roll numbers. <span className="text-indigo-400">Always use this downloaded file!</span>
                  </li>
                  <li>
                    <strong className="text-white">Enter Scores in Excel:</strong> Open the template in Microsoft Excel, Google Sheets, or Numbers. Enter scores in the appropriate subject columns.
                  </li>
                  <li>
                    <strong className="text-white">Respect Max Caps:</strong> Avoid values exceeding the maximum marks of each subject. Blank cells indicate student absence or ungraded entries.
                  </li>
                  <li>
                    <strong className="text-white">Interactive Preview:</strong> Upload your CSV to see parsing results. Highlighted cells indicating errors can be fixed directly inside the preview table.
                  </li>
                </ol>

                <div className="bg-indigo-950/30 border border-indigo-500/10 p-3.5 rounded-xl text-[10px] font-semibold text-indigo-300">
                  ⚠️ Note: The system will enforce teacher ownership validations during bulk save. Ensure you only grade columns corresponding to subjects you are authorized to teach.
                </div>
              </div>
            </div>

            {/* CSV Template Quick Preview mockup */}
            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl space-y-3">
              <span className="text-white/30 text-[9px] font-bold uppercase tracking-wider block">Typical Template Structure</span>
              <div className="font-mono text-[9px] text-slate-400 space-y-1 bg-slate-950/80 p-3 rounded-xl border border-white/5 overflow-x-auto leading-normal">
                <div className="text-indigo-400 font-bold">Roll Number,Student Name,Section,Physics (Max: 85),Maths (Max: 100)...</div>
                <div>2026-F1001,Ahmed Khan,Pre-Medical A,78,92</div>
                <div>2026-F1002,Ayesha Malik,Pre-Medical A,81,89</div>
                <div>2026-F1003,Bilal Saeed,Pre-Medical A,,95 <span className="text-white/30 font-sans italic ml-1">/* Absent in Physics */</span></div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default UploadResult;
