import AIGeneratorPage from './AIGeneratorPage';
import { HiOutlineBookOpen } from 'react-icons/hi';

const FIELDS = [
  { name: 'subject', label: 'Subject', placeholder: 'e.g. Chemistry', required: true },
  { name: 'topic', label: 'Topic', placeholder: 'e.g. Organic Chemistry — Alkanes', required: true },
  { name: 'style', label: 'Notes Style', type: 'select', options: [
    { value: 'detailed', label: 'Detailed Notes' },
    { value: 'summary', label: 'Quick Summary' },
    { value: 'bullet-points', label: 'Bullet Points' },
    { value: 'exam-prep', label: 'Exam Preparation' }
  ]},
];

const AINotesGenerator = () => (
  <AIGeneratorPage
    title="AI Notes Generator"
    description="Generate comprehensive study notes from topics or uploaded material"
    endpoint="/ai/generate/notes"
    fields={FIELDS}
    icon={HiOutlineBookOpen}
  />
);

export default AINotesGenerator;
