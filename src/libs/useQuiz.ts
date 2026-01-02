import { useState, useEffect, useRef } from "react";

interface Option {
  text: string;
  is_correct: boolean;
}

interface Question {
  quiz_id: string;
  question: string;
  options: Option[];
  code?: any;
  correctAnswer?: string; // optional for logic usage
}

export function useQuizLogic(initialData: Question[] = []) {
  const [quizData, setQuizData] = useState<Question[]>(initialData);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const questionNavRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(0);
  const [timeTaken, setTimeTaken] = useState("");
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");

  const currentQuestion = quizData[currentIndex];
  useEffect(() => {
    if (startTime === null) setStartTime(new Date());
    if (buttonRef.current) setButtonWidth(buttonRef.current.offsetWidth);

    const timer = setInterval(() => {
      if (startTime) {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setHours(String(Math.floor(diff / 3600)).padStart(2, "0"));
        setMinutes(String(Math.floor((diff % 3600) / 60)).padStart(2, "0"));
        setSeconds(String(diff % 60).padStart(2, "0"));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const loadQuizData = (newData: Question[]) => {
    setQuizData(newData);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setSkippedQuestions([]);
    setAnswerChecked(false);
    setStartTime(new Date());
  };

  const handleAnswerSelect = (answer: string) => {
    if (answerChecked) return;
    setSelectedAnswer(answer);
    setAnswers(prev => [
      ...prev.filter(a => a.question !== currentQuestion.question),
      { question: currentQuestion.question, selectedAnswer: answer, correctAnswer: currentQuestion.correctAnswer }
    ]);
  };

  const handleCheckAnswer = () => setAnswerChecked(true);

  const handleNext = () => {
    if (questionNavRef.current) {
        // Reset answer check state for the next question
        setAnswerChecked(false);
        setSelectedAnswer(null);
  
        const nextIndex = Math.min(currentIndex + 1, quizData.length - 1);
        setCurrentIndex(nextIndex);
  
        if (questionNavRef.current && buttonWidth > 0) {
          questionNavRef.current.scrollBy({
            left: buttonWidth + 8,
            behavior: "smooth",
          });
        }
      }
  };

  const handlePrevious = () => {
    if (questionNavRef.current) {
        setAnswerChecked(false);
        setSelectedAnswer(null);
  
        const prevIndex = Math.max(currentIndex - 1, 0);
        setCurrentIndex(prevIndex);
  
        if (questionNavRef.current && buttonWidth > 0) {
          questionNavRef.current.scrollBy({
            left: -(buttonWidth + 8),
            behavior: "smooth",
          });
        }
      }
  };

  const handleSkip = () => {
    if (!answers.find(a => a.question === currentQuestion.question)) {
        setSkippedQuestions((prevSkipped) => {
          if (!prevSkipped.includes(currentIndex)) {
            return [...prevSkipped, currentIndex];
          }
          return prevSkipped;
        });
      }
  
      // If we're on the last question, submit the quiz; otherwise, go to next question
      if (currentIndex === quizData.length - 1) {
        handleSubmit();
      } else {
        handleNext();
      }
  };

  const handleSubmit = () => {
    if (currentIndex === quizData.length - 1) {
      setOpen(true);
      if (startTime) {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setTimeTaken(`${Math.floor(seconds / 60)} min ${seconds % 60} sec`);
      }
    }
  };

  return {
    quizData, currentIndex, selectedAnswer, answers, skippedQuestions, open, timeTaken,
    hours, minutes, seconds, answerChecked, questionNavRef, buttonRef,
    setCurrentIndex, setSelectedAnswer, setAnswers, setSkippedQuestions, setOpen,
    setAnswerChecked, handleAnswerSelect, handleCheckAnswer, handleNext,
    handlePrevious, handleSkip, handleSubmit, currentQuestion: quizData[currentIndex], buttonWidth,loadQuizData 
  };
}
