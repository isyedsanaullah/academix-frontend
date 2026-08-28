const fs = require('fs');
const path = require('path');

const routes = [
  // Super Admin
  { path: 'super-admin', component: '@/pages/superAdmin/Dashboard', roles: ['superAdmin'] },
  { path: 'super-admin/colleges', component: '@/pages/superAdmin/Colleges', roles: ['superAdmin'] },
  { path: 'super-admin/colleges/[id]', component: '@/pages/superAdmin/CollegeDetail', roles: ['superAdmin'] },
  { path: 'super-admin/analytics', component: '@/pages/superAdmin/SAAnalytics', roles: ['superAdmin'] },
  { path: 'super-admin/ai/chat', component: '@/pages/ai/AIChat', roles: ['superAdmin'] },
  { path: 'super-admin/settings', component: '@/pages/shared/ProfilePage', roles: ['superAdmin'] },

  // Admin
  { path: 'admin', component: '@/pages/admin/Dashboard', roles: ['admin'] },
  { path: 'admin/sessions', component: '@/pages/admin/Sessions', roles: ['admin'] },
  { path: 'admin/classes', component: '@/pages/admin/ClassesAndSections', roles: ['admin'] },
  { path: 'admin/subjects', component: '@/pages/admin/Subjects', roles: ['admin'] },
  { path: 'admin/students', component: '@/pages/admin/Students', roles: ['admin'] },
  { path: 'admin/students/[id]', component: '@/pages/admin/StudentDetail', roles: ['admin'] },
  { path: 'admin/staff', component: '@/pages/admin/Staff', roles: ['admin'] },
  { path: 'admin/staff/[id]', component: '@/pages/admin/StaffDetail', roles: ['admin'] },
  { path: 'admin/teachers', component: '@/pages/admin/Teachers', roles: ['admin'] },
  { path: 'admin/employees', component: '@/pages/admin/Employees', roles: ['admin'] },
  { path: 'admin/fees', component: '@/pages/admin/Fees', roles: ['admin'] },
  { path: 'admin/fees/receipt/[id]', component: '@/pages/admin/FeeReceipt', roles: ['admin'] },
  { path: 'admin/fees/defaulters', component: '@/pages/admin/Defaulters', roles: ['admin'] },
  { path: 'admin/attendance', component: '@/pages/admin/Attendance', roles: ['admin'] },
  { path: 'admin/timetable', component: '@/pages/admin/TimetablePage', roles: ['admin'] },
  { path: 'admin/exams', component: '@/pages/admin/Exams', roles: ['admin'] },
  { path: 'admin/exams/roll-slips', component: '@/pages/admin/RollSlips', roles: ['admin'] },
  { path: 'admin/results', component: '@/pages/admin/Results', roles: ['admin'] },
  { path: 'admin/results/entry', component: '@/pages/admin/ResultEntry', roles: ['admin'] },
  { path: 'admin/results/card/[id]', component: '@/pages/admin/ResultCard', roles: ['admin'] },
  { path: 'admin/announcements', component: '@/pages/admin/Announcements', roles: ['admin'] },
  { path: 'admin/leaves', component: '@/pages/admin/LeaveManagement', roles: ['admin'] },
  { path: 'admin/visitors', component: '@/pages/admin/Visitors', roles: ['admin'] },
  { path: 'admin/certificates', component: '@/pages/admin/Certificates', roles: ['admin'] },
  { path: 'admin/settings', component: '@/pages/admin/Settings', roles: ['admin'] },
  { path: 'admin/profile', component: '@/pages/shared/ProfilePage', roles: ['admin'] },
  { path: 'admin/ai/chat', component: '@/pages/ai/AIChat', roles: ['admin'] },

  // Registrar
  { path: 'registrar', component: '@/pages/registrar/Dashboard', roles: ['registrar'] },
  { path: 'registrar/applications', component: '@/pages/registrar/Applications', roles: ['registrar'] },
  { path: 'registrar/admission-seasons', component: '@/pages/registrar/AdmissionSeasons', roles: ['registrar'] },
  { path: 'registrar/students', component: '@/pages/admin/Students', roles: ['registrar'] },
  { path: 'registrar/students/[id]', component: '@/pages/admin/StudentDetail', roles: ['registrar'] },
  { path: 'registrar/certificates', component: '@/pages/admin/Certificates', roles: ['registrar'] },
  { path: 'registrar/timetable', component: '@/pages/admin/TimetablePage', roles: ['registrar'] },
  { path: 'registrar/announcements', component: '@/pages/admin/Announcements', roles: ['registrar'] },
  { path: 'registrar/ai/chat', component: '@/pages/ai/AIChat', roles: ['registrar'] },
  { path: 'registrar/settings', component: '@/pages/shared/ProfilePage', roles: ['registrar'] },

  // Accountant
  { path: 'accountant', component: '@/pages/accountant/Dashboard', roles: ['accountant'] },
  { path: 'accountant/treasury', component: '@/pages/accountant/Treasury', roles: ['accountant'] },
  { path: 'accountant/fees', component: '@/pages/admin/Fees', roles: ['accountant'] },
  { path: 'accountant/fees/receipt/[id]', component: '@/pages/admin/FeeReceipt', roles: ['accountant'] },
  { path: 'accountant/fees/defaulters', component: '@/pages/admin/Defaulters', roles: ['accountant'] },
  { path: 'accountant/dues', component: '@/pages/accountant/DuesReport', roles: ['accountant'] },
  { path: 'accountant/payroll', component: '@/pages/accountant/Payroll', roles: ['accountant'] },
  { path: 'accountant/announcements', component: '@/pages/admin/Announcements', roles: ['accountant'] },
  { path: 'accountant/ai/chat', component: '@/pages/ai/AIChat', roles: ['accountant'] },
  { path: 'accountant/settings', component: '@/pages/shared/ProfilePage', roles: ['accountant'] },

  // Principal
  { path: 'principal', component: '@/pages/admin/PrincipalDashboard', roles: ['principal'] },
  { path: 'principal/approvals', component: '@/pages/principal/Approvals', roles: ['principal'] },
  { path: 'principal/evaluations', component: '@/pages/principal/EvaluationSeasons', roles: ['principal'] },
  { path: 'principal/students', component: '@/pages/admin/Students', roles: ['principal'] },
  { path: 'principal/students/[id]', component: '@/pages/admin/StudentDetail', roles: ['principal'] },
  { path: 'principal/attendance', component: '@/pages/admin/Attendance', roles: ['principal'] },
  { path: 'principal/results', component: '@/pages/admin/Results', roles: ['principal'] },
  { path: 'principal/exams', component: '@/pages/admin/Exams', roles: ['principal'] },
  { path: 'principal/fees', component: '@/pages/admin/Fees', roles: ['principal'] },
  { path: 'principal/staff', component: '@/pages/admin/Staff', roles: ['principal'] },
  { path: 'principal/staff/[id]', component: '@/pages/admin/StaffDetail', roles: ['principal'] },
  { path: 'principal/announcements', component: '@/pages/admin/Announcements', roles: ['principal'] },
  { path: 'principal/early-exit', component: '@/pages/principal/PrincipalEarlyExit', roles: ['principal'] },
  { path: 'principal/gate-logs', component: '@/pages/employee/GuardDashboard', roles: ['principal'] },
  { path: 'principal/ai/chat', component: '@/pages/ai/AIChat', roles: ['principal'] },
  { path: 'principal/settings', component: '@/pages/shared/ProfilePage', roles: ['principal'] },

  // Teacher
  { path: 'teacher', component: '@/pages/teacher/Dashboard', roles: ['teacher'] },
  { path: 'teacher/students', component: '@/pages/teacher/Students', roles: ['teacher'] },
  { path: 'teacher/attendance', component: '@/pages/teacher/TeacherAttendance', roles: ['teacher'] },
  { path: 'teacher/results', component: '@/pages/teacher/StudentResults', roles: ['teacher'] },
  { path: 'teacher/results/upload', component: '@/pages/teacher/UploadResult', roles: ['teacher'] },
  { path: 'teacher/assignments', component: '@/pages/teacher/TeacherAssignments', roles: ['teacher'] },
  { path: 'teacher/quizzes', component: '@/pages/admin/Quizzes', roles: ['teacher'] },
  { path: 'teacher/fines', component: '@/pages/teacher/FineStudent', roles: ['teacher'] },
  { path: 'teacher/ai/chat', component: '@/pages/ai/AIChat', roles: ['teacher'] },
  { path: 'teacher/ai/pdf-library', component: '@/pages/teacher/PDFLibrary', roles: ['teacher'] },
  { path: 'teacher/ai/quiz', component: '@/pages/ai/AIQuizGenerator', roles: ['teacher'] },
  { path: 'teacher/ai/paper', component: '@/pages/ai/AIPaperGenerator', roles: ['teacher'] },
  { path: 'teacher/ai/mcq', component: '@/pages/ai/AIMCQGenerator', roles: ['teacher'] },
  { path: 'teacher/ai/notes', component: '@/pages/ai/AINotesGenerator', roles: ['teacher'] },
  { path: 'teacher/ai/assignment', component: '@/pages/ai/AIAssignmentGenerator', roles: ['teacher'] },
  { path: 'teacher/ai/syllabus', component: '@/pages/ai/AISyllabusGenerator', roles: ['teacher'] },
  { path: 'teacher/my-qr', component: '@/pages/common/MyQRPage', roles: ['teacher'] },
  { path: 'teacher/early-exit', component: '@/pages/common/EarlyExitPage', roles: ['teacher'] },
  { path: 'teacher/settings', component: '@/pages/shared/ProfilePage', roles: ['teacher'] },

  // Student
  { path: 'student', component: '@/pages/student/Dashboard', roles: ['student'] },
  { path: 'student/attendance', component: '@/pages/student/MyAttendance', roles: ['student'] },
  { path: 'student/fees', component: '@/pages/student/MyFees', roles: ['student'] },
  { path: 'student/fines', component: '@/pages/student/MyFines', roles: ['student'] },
  { path: 'student/results', component: '@/pages/student/MyResults', roles: ['student'] },
  { path: 'student/assignments', component: '@/pages/admin/Assignments', roles: ['student'] },
  { path: 'student/quizzes', component: '@/pages/admin/Quizzes', roles: ['student'] },
  { path: 'student/timetable', component: '@/pages/admin/TimetablePage', roles: ['student'] },
  { path: 'student/leave', component: '@/pages/student/LeaveApplication', roles: ['student'] },
  { path: 'student/settings', component: '@/pages/shared/ProfilePage', roles: ['student'] },
  { path: 'student/ai/chat', component: '@/pages/ai/AIChat', roles: ['student'] },
  { path: 'student/ai/notes', component: '@/pages/ai/AINotesGenerator', roles: ['student'] },
  { path: 'student/evaluation', component: '@/pages/student/TeacherEvaluation', roles: ['student'] },
  { path: 'student/my-qr', component: '@/pages/common/MyQRPage', roles: ['student'] },
  { path: 'student/early-exit', component: '@/pages/common/EarlyExitPage', roles: ['student'] },

  // Employee
  { path: 'employee', component: '@/pages/employee/Dashboard', roles: ['employee'] },
  { path: 'employee/gate', component: '@/pages/employee/GuardDashboard', roles: ['employee'] },
  { path: 'employee/gate-logs', component: '@/pages/employee/GuardDashboard', roles: ['employee'] },
  { path: 'employee/visitors', component: '@/pages/admin/Visitors', roles: ['employee'] },
  { path: 'employee/early-exit', component: '@/pages/common/EarlyExitPage', roles: ['employee'] },
  { path: 'employee/settings', component: '@/pages/shared/ProfilePage', roles: ['employee'] },
];

const baseDir = path.resolve(__dirname, '../app');

routes.forEach((route) => {
  const routeDir = path.join(baseDir, route.path);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }

  const pageContent = `'use client';

import PageComponent from '${route.component.replace("@/pages/", "@/legacy-pages/")}';
import AuthGuard from '@/components/common/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Page() {
  return (
    <AuthGuard allowedRoles={${JSON.stringify(route.roles)}}>
      <DashboardLayout>
        <PageComponent />
      </DashboardLayout>
    </AuthGuard>
  );
}
`;

  fs.writeFileSync(path.join(routeDir, 'page.js'), pageContent);
  console.log(`Generated route page for: ${route.path}`);
});
