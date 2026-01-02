// hooks/useDynamicQuizHook.ts
// import { useQuizHook } from './useQuizHook';
import { useQuizHook } from './useQuiz';
import { useQuizEmitterHook } from './useQuizEmitterHook';

export const useDynamicQuizHook = (
  quizId: string,
  quizQuestions: any,
  userId?: string
) => {
  if (typeof window !== 'undefined') {
    const type = sessionStorage.getItem('type');
    if (type === 'test' || type === 'geeks_test') {
      return useQuizEmitterHook(quizId, quizQuestions, userId ?? '');
    }
  }

  return useQuizHook(quizId, quizQuestions);
};
