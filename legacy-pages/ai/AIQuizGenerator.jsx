import { useRouter } from 'next/navigation';
import AIQuizBuilder from '@/components/quiz/AIQuizBuilder';

const AIQuizGenerator = () => {
  const router = useRouter();

  return (
    <AIQuizBuilder
      onClose={() => router.push('/teacher/quizzes')}
      onSuccess={() => router.push('/teacher/quizzes')}
    />
  );
};

export default AIQuizGenerator;
