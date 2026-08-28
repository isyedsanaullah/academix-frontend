import AIGeneratorPage from './AIGeneratorPage';
import { HiOutlineTemplate } from 'react-icons/hi';

const FIELDS = [
  { name: 'course', label: 'Course Name', placeholder: 'e.g. Data Structures and Algorithms', required: true },
  { name: 'duration', label: 'Duration', type: 'select', options: [
    { value: '1 semester', label: '1 Semester (16 weeks)' },
    { value: '2 semesters', label: '2 Semesters (32 weeks)' },
    { value: '1 quarter', label: '1 Quarter (10 weeks)' },
    { value: '6 months', label: '6 Months' },
  ]},
  { name: 'level', label: 'Level', type: 'select', options: [
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'intermediate', label: 'Intermediate' },
  ]},
];

const AISyllabusGenerator = () => (
  <AIGeneratorPage
    title="AI Syllabus Generator"
    description="Generate comprehensive course syllabi with week-by-week breakdown"
    endpoint="/ai/generate/syllabus"
    fields={FIELDS}
    icon={HiOutlineTemplate}
  />
);

export default AISyllabusGenerator;
