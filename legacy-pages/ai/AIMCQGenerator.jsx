import AIGeneratorPage from './AIGeneratorPage';
import { HiOutlineCollection } from 'react-icons/hi';

const FIELDS = [
  { name: 'subject', label: 'Subject', placeholder: 'e.g. Biology', required: true },
  { name: 'topic', label: 'Topic', placeholder: 'e.g. Cell Division', required: true },
  { name: 'count', label: 'Number of MCQs', type: 'number', placeholder: '10' },
  { name: 'difficulty', label: 'Difficulty', type: 'select', options: [
    { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }
  ]},
];

const AIMCQGenerator = () => (
  <AIGeneratorPage
    title="AI MCQ Generator"
    description="Generate multiple choice question banks with correct answers"
    endpoint="/ai/generate/mcq"
    fields={FIELDS}
    icon={HiOutlineCollection}
  />
);

export default AIMCQGenerator;
