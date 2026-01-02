import { getSocket } from '@/lib/socket';
import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface Question {
  quiz_id: string;
  question: string;
  options: Record<string, string>;
  type: 'single_choice' | 'multiple_choice' | 'true_false';
}

interface Answer {
  questionId: string;
  answer: string | string[] | boolean | null;
  isBookmarked: boolean;
  isSkipped: boolean;
  correctAnswer?: string | string[] | boolean | null;
}

interface QuizSession {
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
}

export const useQuizEmitterHook = (
  testId: string,
  questions: Question[] | null,
  userId: string
) => {
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(0);
  const socketRef = useRef<Socket>();

  // 1) Initialize socket once
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    setLoading(true);
  
    const socket = getSocket();
    socketRef.current = socket;
  
    let isRestored = false;

    const submissionId = sessionStorage.getItem('submission_id') || null;

  
    socket.emit("quiz_session_start", { testId, userId ,submissionId });
  
    socket.on("connect", () => {
      console.log(`🟢 Socket connected: ${socket.id}`);
    });
  
    socket.on("quiz_resume_state", (data) => {
      console.log("♻️ Resuming quiz from Redis:", data);
      isRestored = true;
  
      const restoredAnswers: Answer[] = questions.map((q) => {
        const entry = data.answers?.[q.quiz_id] || {};
        return {
          questionId: q.quiz_id,
          answer: entry.answer ?? null,
          isBookmarked: entry.isBookmarked ?? false,
          isSkipped: entry.isSkipped ?? false,
          correctAnswer: entry.correctAnswer ?? undefined,
        };
      });
  
      setQuizSession({
        questions,
        currentIndex: 0,
        answers: restoredAnswers,
      });
  
      setTimer(data.timer || 0);
      setLoading(false);
    });
  
    // Fallback: If no restore happens in 1 second, initialize fresh session
    const fallbackTimeout = setTimeout(() => {
      if (!isRestored) {
        console.log("⚠️ No Redis data. Initializing new session.");
        const freshAnswers: Answer[] = questions.map((q) => ({
          questionId: q.quiz_id,
          answer: null,
          isBookmarked: false,
          isSkipped: false,
        }));
  
        setQuizSession({
          questions,
          currentIndex: 0,
          answers: freshAnswers,
        });
  
        setTimer(0);
        setLoading(false);
  
        socket.emit("quiz_loaded", {
          testId,
          userId,
          questions: questions.map((q) => q.quiz_id),
        });
      }
    }, 1000);
  
    return () => {
      socket.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, [questions?.length, testId, userId]);
  
  // 3) Timer
  useEffect(() => {
    if (!quizSession) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [quizSession]);

  // 4) Helper to emit + update local state
  const emitAndUpdate = (
    event: string,
    payload: any,
    update: Partial<Answer> | null = null
  ) => {

    const submissionId = sessionStorage.getItem('submission_id') || null;

    const fullPayload = { testId, userId, submissionId , ...payload };
    console.log(`📤 Emitting john  ${event}:`, fullPayload ,  socketRef.current);
    socketRef.current?.emit(event, fullPayload);

    if (update && quizSession) {
      setQuizSession(prev => {
        if (!prev) return prev;
        const idx = prev.currentIndex;
        const newAnswers = [...prev.answers];
        newAnswers[idx] = { ...newAnswers[idx], ...update };
        return { ...prev, answers: newAnswers };
      });
    }
  };

  // 5) Quiz action handlers
  const updateAnswer = (update: Partial<Answer>) => {
    if (!quizSession) return;
    setQuizSession(prev => {
      if (!prev) return prev;
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentIndex] = {
        ...newAnswers[prev.currentIndex],
        ...update,
      };
      return { ...prev, answers: newAnswers };
    });
  };

  const handleAnswerSelect = (answer: string | string[] | boolean) => {
    if (!quizSession) return;
    const questionId = quizSession.questions[quizSession.currentIndex].quiz_id;
    emitAndUpdate('quiz_answer', { questionId, answer }, { answer, isSkipped: false });
  };

  const handleClearAnswer = () => {
    if (!quizSession) return;
    const questionId = quizSession.questions[quizSession.currentIndex].quiz_id;
    emitAndUpdate('quiz_answer', { questionId, answer: null }, { answer: null, isSkipped: false });
  };

  const handleBookmark = () => {
    
    if (!quizSession) return;
    const idx = quizSession.currentIndex;
    const question = quizSession.questions[idx];
    const answer = quizSession.answers[idx];

    const questionId = question.quiz_id;
    const newStatus = !answer.isBookmarked;

    console.log("🔖 Bookmark clicked", {
      questionId,
      currentStatus: answer.isBookmarked,
      newStatus,
    });

    emitAndUpdate('quiz_bookmark', { questionId, isBookmarked: newStatus }, { isBookmarked: newStatus });
  };

  const handleSkip = () => {
    if (!quizSession) return;
    const questionId = quizSession.questions[quizSession.currentIndex].quiz_id;
    emitAndUpdate('quiz_skip', { questionId }, { isSkipped: true });
    handleNext();
  };

  const handleNext = () => {
    if (!quizSession) return;
    const ans = quizSession.answers[quizSession.currentIndex];
    if (!ans.answer && !ans.isSkipped) {
      const questionId = quizSession.questions[quizSession.currentIndex].quiz_id;
      emitAndUpdate('quiz_skip', { questionId }, { isSkipped: true });
    }
    setQuizSession(prev => prev && ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    }));
  };

  const handlePrevious = () => {
    if (!quizSession) return;
    const ans = quizSession.answers[quizSession.currentIndex];
    if (!ans.answer && !ans.isSkipped) {
      const questionId = quizSession.questions[quizSession.currentIndex].quiz_id;
      emitAndUpdate('quiz_skip', { questionId }, { isSkipped: true });
    }
    setQuizSession(prev => prev && ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }));
  };

const handleCheckAnswer = () => {
  if (!quizSession) {
    console.log('No quiz session found');
    return null;
  }

  const currentAnswer = quizSession.answers[quizSession.currentIndex];
  const currentQuestion = quizSession.questions[quizSession.currentIndex];

  if (!currentAnswer || !currentAnswer.answer) {
    console.log('No answer provided for current question');
    return null;
  }

  // Here you can put your actual answer checking logic
  console.log('Answer check ready to run...');
  return null;
};


  const handleSubmit = () => {
    socketRef.current?.emit('quiz_submit', { testId, userId });
    console.log('Submitting answers:', quizSession?.answers);
  };

  const goToQuestion = (index: number) => {
    if (!quizSession) return;
    setQuizSession(prev => prev && ({
      ...prev,
      currentIndex: Math.max(0, Math.min(index, prev.questions.length - 1)),
    }));
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
    updateAnswer,
  };
};  
