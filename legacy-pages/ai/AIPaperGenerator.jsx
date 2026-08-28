import AIGeneratorPage from './AIGeneratorPage';
import { HiOutlineNewspaper } from 'react-icons/hi';

const FIELDS = [
  { name: 'subject', label: 'Subject', placeholder: 'e.g. Mathematics', required: true },
  { name: 'topic', label: 'Topic / Syllabus Coverage', placeholder: 'e.g. Calculus — Chapters 1-5', required: true },
  { name: 'totalMarks', label: 'Total Marks', type: 'number', placeholder: '100' },
  { name: 'sections', label: 'Sections', placeholder: 'e.g. MCQs (20), Short (40), Long (40)', type: 'textarea' },
  { name: 'difficulty', label: 'Difficulty', type: 'select', options: [
    { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }
  ]},
];

const AIPaperGenerator = () => (
  <AIGeneratorPage
    title="AI Paper Generator"
    description="Generate complete exam papers with proper formatting and mark distribution"
    endpoint="/ai/generate/paper"
    fields={FIELDS}
    icon={HiOutlineNewspaper}
  />
);

export default AIPaperGenerator;
