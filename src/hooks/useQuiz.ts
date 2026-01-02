import { useState, useEffect } from 'react';


interface Question {
  quiz_id: string;
  question: string;
  options: Record<string, string>; // made non-optional to ensure type compatibility
  type: 'single_choice' | 'multiple_choice' | 'true_false'; // added type property
  content?: string;
  weightage?: string;
}

interface Answer {
  questionId: string;
  answer: string | string[] | boolean | null; // <-- update this
  isBookmarked: boolean;
  isSkipped: boolean;
  correctAnswer?: string | string[] | boolean | null; // <-- update this
}

interface QuizSession {
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
}

export const useQuizHook = (quizId: string, questions: Question[] | null) => {
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    if (!questions || questions.length === 0) return;

    setLoading(true);

    const transformed = questions.map(q => ({
      questionId: q.quiz_id,
      answer: null,
      isBookmarked: false,
      isSkipped: false,
    }));

    setQuizSession({
      questions,
      currentIndex: 0,
      answers: transformed,
    });

    setTimer(0);
    setLoading(false);
  }, [questions]);

  useEffect(() => {
    if (!quizSession) return;
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [quizSession]);

  const updateAnswer = (update: Partial<Answer>) => {
    setQuizSession(prev => {
      if (!prev) return prev;
      const updatedAnswers = [...prev.answers];
      updatedAnswers[prev.currentIndex] = {
        ...updatedAnswers[prev.currentIndex],
        ...update,
      };
      return {
        ...prev,
        answers: updatedAnswers,
      };
    });
  };

  const handleAnswerSelect = (answer: string | string[] | boolean) => {
    if (!quizSession) return;
    updateAnswer({ answer, isSkipped: false });
  };

  const handleClearAnswer = () => {
    if (!quizSession) return;
    updateAnswer({ answer: null, isSkipped: false });
  };

  const handleCheckAnswer = () => {
    console.log('heloooooo')

    if (!quizSession) return null;
    const currentAnswer = quizSession.answers[quizSession.currentIndex];
    const currentQuestion = quizSession.questions[quizSession.currentIndex];
    
    if (!currentAnswer || !currentAnswer.answer) return null;
  };

  const handleBookmark = () => {
    if (!quizSession) return;
    const currentBookmarkStatus = quizSession.answers[quizSession.currentIndex].isBookmarked;
    updateAnswer({ isBookmarked: !currentBookmarkStatus });
  };

  const handleSkip = () => {
    if (!quizSession) return;
    updateAnswer({ isSkipped: true });
    handleNext();
  };

  const handleNext = () => {
    if (!quizSession) return;
    
    // Check if current question has no answer and mark it as skipped
    const currentAnswer = quizSession.answers[quizSession.currentIndex];
    if (currentAnswer && !currentAnswer.answer && !currentAnswer.isSkipped) {
      updateAnswer({ isSkipped: true });
    }

    setQuizSession(prev => prev && {
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    });
  };

  const handlePrevious = () => {
    if (!quizSession) return;
    
    // Check if current question has no answer and mark it as skipped
    const currentAnswer = quizSession.answers[quizSession.currentIndex];
    if (currentAnswer && !currentAnswer.answer && !currentAnswer.isSkipped) {
      updateAnswer({ isSkipped: true });
    }
    setQuizSession(prev => prev && {
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    });
  };

  const handleSubmit = () => {
    if (!quizSession) return;
    console.log("Submitting answers:", quizSession.answers);
  };

  const goToQuestion = (index: number) => {
    setQuizSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentIndex: Math.max(0, Math.min(index, prev.questions.length - 1))
      };
    });
  };

  return {
    quizSession,
    loading,
    timer,
    handleAnswerSelect,
    handleClearAnswer,
    handleBookmark,
    handleSkip,
    handleNext,
    handlePrevious,
    handleSubmit,
    goToQuestion,
    handleCheckAnswer,
    updateAnswer
  };
};
