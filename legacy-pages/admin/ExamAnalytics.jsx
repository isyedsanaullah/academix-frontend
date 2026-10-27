'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineExclamation,
  HiOutlineSearch,
  HiOutlineAdjustments,
  HiOutlineAcademicCap,
  HiOutlineBadgeCheck
} from 'react-icons/hi';

export default function ExamAnalytics() {
  const [activeTab, setActiveTab] = useState('weak'); // 'weak' or 'comparison'
  const [loading, setLoading] = useState(false);

  // Weak Students state
  const [thresholdPercent, setThresholdPercent] = useState(50);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [weakStudents, setWeakStudents] = useState([]);

  // Comparison state
  const [comparisonData, setComparisonData] = useState({ subjects: [], teachers: [] });

  const fetchWeakStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exam-analytics/weak-students', {
        params: {
          thresholdPercent,
          class: selectedClass !== 'all' ? selectedClass : undefined,
          section: selectedSection !== 'all' ? selectedSection : undefined
        }
      });
      if (res.data?.success) {
        setWeakStudents(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch weak students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exam-analytics/result-comparison');
      if (res.data?.success) {
        setComparisonData({
          subjects: res.data.subjects || [],
          teachers: res.data.teachers || []
        });
      }
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'weak') {
      fetchWeakStudents();
    } else {
      fetchComparison();
    }
  }, [activeTab, thresholdPercent, selectedClass, selectedSection]);

  const criticalCount = weakStudents.filter(s => s.percentage < 33).length;
  const moderateCount = weakStudents.filter(s => s.percentage >= 33 && s.percentage < thresholdPercent).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <HiOutlineChartBar className="w-7 h-7 text-amber-600" />
            Exam Analytics & Faculty Performance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Weak student identification per subject, and comparative teacher performance metrics
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('weak')}
          className={`flex items-center gap-2 px-6 py-3.5 font-semibold text-sm border-b-2 transition ${
            activeTab === 'weak'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiOutlineExclamation className="w-4 h-4" />
          Weak Student Identification
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-2 px-6 py-3.5 font-semibold text-sm border-b-2 transition ${
            activeTab === 'comparison'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HiOutlineUserGroup className="w-4 h-4" />
          Subject & Teacher Comparison
        </button>
      </div>

      {/* Tab 1: Weak Students */}
      {activeTab === 'weak' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total At-Risk Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{weakStudents.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
              <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Critical Failure (&lt; 33%)</p>
              <p className="text-2xl font-bold text-rose-700 mt-2">{criticalCount}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Moderate Risk (33% - {thresholdPercent}%)</p>
              <p className="text-2xl font-bold text-amber-700 mt-2">{moderateCount}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-600">Threshold:</span>
              <input
                type="range"
                min="30"
                max="70"
                step="5"
                value={thresholdPercent}
                onChange={(e) => setThresholdPercent(parseInt(e.target.value, 10))}
                className="w-32 accent-amber-600"
              />
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                &lt; {thresholdPercent}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none"
              >
                <option value="all">All Classes</option>
                <option value="FSC Part 1">FSC Part 1</option>
                <option value="FSC Part 2">FSC Part 2</option>
              </select>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none"
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-4">Roll #</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Class & Group</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4 text-center">Score (Obt / Max)</th>
                    <th className="py-3.5 px-4 text-center">Percentage</th>
                    <th className="py-3.5 px-4 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Analyzing test records...
                      </td>
                    </tr>
                  ) : weakStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-emerald-600 font-semibold">
                        No students found below {thresholdPercent}% threshold! All candidates meeting academic standards.
                      </td>
                    </tr>
                  ) : (
                    weakStudents.map((s, idx) => {
                      const isCritical = s.percentage < 33;
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{s.rollNumber || '-'}</td>
                          <td className="py-3.5 px-4 font-semibold text-gray-900">{s.name}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs text-gray-800">{s.class} ({s.section})</span>
                            <span className="block text-xs text-amber-600">{s.group}</span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-800">{s.subjectName}</td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            {s.obtainedMarks} / {s.totalMarks}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {s.percentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span className={s.grade === 'F' ? 'text-rose-600' : 'text-gray-700'}>
                              {s.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Subject-wise Comparison */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineAcademicCap className="w-5 h-5 text-indigo-600" />
              Subject-Wise Performance & Pass Rates
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4 text-center">Appeared</th>
                    <th className="py-3 px-4 text-center">Avg. Score %</th>
                    <th className="py-3 px-4 text-center">Pass Rate %</th>
                    <th className="py-3 px-4 text-center">Highest / Lowest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisonData.subjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400">
                        No subject evaluation records available for comparison.
                      </td>
                    </tr>
                  ) : (
                    comparisonData.subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{sub.subjectName}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">{sub.teacherName}</td>
                        <td className="py-3.5 px-4 text-center font-semibold">{sub.totalAppeared}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-900">{sub.averagePercentage}%</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            sub.passRate >= 80 ? 'bg-emerald-100 text-emerald-800' : (sub.passRate >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                          }`}>
                            {sub.passRate}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span className="text-emerald-700 font-bold">{sub.highestMarks}</span> / <span className="text-rose-600 font-bold">{sub.lowestMarks}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teacher-wise Comparison */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineUserGroup className="w-5 h-5 text-indigo-600" />
              Teacher Performance Evaluation Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Subjects Taught</th>
                    <th className="py-3 px-4 text-center">Students Evaluated</th>
                    <th className="py-3 px-4 text-center">Overall Pass Rate %</th>
                    <th className="py-3 px-4 text-center">Average Student Score %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisonData.teachers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400">
                        No faculty evaluations found.
                      </td>
                    </tr>
                  ) : (
                    comparisonData.teachers.map((t, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{t.teacherName}</td>
                        <td className="py-3.5 px-4 text-xs font-medium text-gray-600">{t.subjects.join(', ')}</td>
                        <td className="py-3.5 px-4 text-center font-semibold">{t.totalStudents}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            t.overallPassRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.overallPassRate}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-700">{t.averageStudentScore}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
