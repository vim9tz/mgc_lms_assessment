"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
// If your project uses antd Splitter and it's installed, keep this:
import { Splitter } from "antd";
// If not, comment the line above and uncomment the fallback below:
//
// const Splitter: any = ({ children }: { children: React.ReactNode }) => <>{children}</>;
// Splitter.Panel = ({ children }: { children: React.ReactNode }) => <>{children}</>;

import QuizQuestion from "./quizQuestionV2";
import QuizOptions from "./quizOptionsV2";
import QuizNavigation from "./quizNavigationV2";
import QuestionNavigator from "@/components/QuestionNavigator";

import MenuItem from "@mui/material/MenuItem";
import CustomTextField from "@core/components/mui/TextField";
import QuizFillInTheBlanks from "./QuizFillInTheBlanks";
import QuizSubject from "./QuizSubject";
import Button from "@mui/material/Button";
import useApi from "@/hooks/useApi";


interface Question {
  quiz_id: string;
  question: string;
  content?: string;
  weightage?: string;
  description?: string;
  options: Record<string, string>;
  type:
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "fill_in_the_blanks"
  | "subjective";
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
  answers: Answer[];
  currentIndex: number;
}

type Props = {
  quizSession: QuizSession;
  questionModuleMap: string[];
  handleAnswerSelect: (answer: string | string[] | boolean) => void;
  handleClearAnswer: () => void;
  handleBookmark: () => void;
  handleSkip: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSubmit: () => void;
  goToQuestion: (idx: number) => void;
  handleCheckAnswer: () => boolean; // kept to match your props, not used here
  updateAnswer: (update: Partial<Answer>) => void;
  timer: number;
};

type CheckAnswerApiItem = {
  quiz_id: string | number;
  selected_option: string | number | boolean | string[]; // server input
};

type CheckAnswerApiResultItem = {
  quiz_id: string | number;
  selected_option: string | number | boolean | string[];
  correct: boolean;
  correct_answer?: string | string[] | boolean | null;
};

type CheckAnswerApiResponse = {
  data?: CheckAnswerApiResultItem[];
};

export default function QuizPanel({
  quizSession,
  questionModuleMap,
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
  timer,
}: Props) {

  // read ?token=...&subTopic=...&type=...
  const searchParams = useSearchParams();
  // const tokenFromQS = searchParams.get("token") || "";
  const tokenFromQS = searchParams.get("token") || "";
  const subtopicIdFromQS = searchParams.get("subTopic") || ""; // note the capital T in your URL
  // const typeFromQS = searchParams.get("type") || "";            // "knowledge_check"

  const [showResults, setShowResults] = useState(false);

  // Which questions have been "checked"
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});

  // Per-question correctness & correctAnswer
  const [statusByIndex, setStatusByIndex] = useState<
    Record<number, { isCorrect: boolean | null; correctAnswer?: string | string[] | boolean | null }>
  >({});

  const uniqueModules = [...new Set(questionModuleMap)];
  const { fetchFromBackend } = useApi();

  const handleGoToQuestion = (idx: number) => {
    const current = quizSession.answers[quizSession.currentIndex];
    if (!current.answer && !current.isSkipped) {
      updateAnswer({ isSkipped: true });
    }
    goToQuestion(idx);
    // Keep status for visited questions so styling persists when you come back.
  };

  // Basic guards
  if (
    !quizSession ||
    !quizSession.questions ||
    quizSession.questions.length === 0 ||
    quizSession.currentIndex >= quizSession.questions.length
  ) {
    return <div className="p-4 text-gray-600">Loading question...</div>;
  }

  const currentQuestion = quizSession.questions[quizSession.currentIndex];
  const selectedAnswer = quizSession.answers[quizSession.currentIndex]?.answer ?? null;
  const currentModule = questionModuleMap[quizSession.currentIndex] ?? "";
  const isChecked = !!checkedQuestions[quizSession.currentIndex];

  // Use per-question status
  const currentStatus = statusByIndex[quizSession.currentIndex]?.isCorrect ?? null;
  const currentCorrectAnswer =
    statusByIndex[quizSession.currentIndex]?.correctAnswer ??
    quizSession.answers[quizSession.currentIndex]?.correctAnswer ??
    null;

  // Call API and set correctness for only the current question
  async function checkCurrentQuestionAnswer() {
    const qIdx = quizSession.currentIndex;
    const question = quizSession.questions[qIdx];
    const selected = quizSession.answers[qIdx]?.answer ?? null;

    // Must have selected answer.
    // Must have EITHER subtopicIdFromQS OR tokenFromQS.
    if (selected === null) {
        console.warn("Missing selected answer");
        return null;
    }
    if (!subtopicIdFromQS && !tokenFromQS) {
      console.warn("Missing subtopic_id and token");
      return null;
    }

    const payload: any = {
      answers: [
        {
          quiz_id: question.quiz_id,
          selected_option: selected,
        },
      ],
    };

    if (subtopicIdFromQS) {
        payload.subtopic_id = subtopicIdFromQS;
    } else if (tokenFromQS) {
        // If we have a real subtopic ID from guest attempt, use it
        const realId = sessionStorage.getItem('subtopic_id');
        if (realId) {
             payload.subtopic_id = realId;
             // also send test_id just in case, or maybe not needed if subtopic_id works
        } else {
             payload.test_id = tokenFromQS;
        }

        const subId = sessionStorage.getItem('submission_id');
        if (subId) payload.submission_id = subId;
    }
    
    console.log('checkCurrentQuestionAnswer Payload:', payload);

    const checkRes = (await fetchFromBackend(
      "/quizAnswers",
      "POST",
      payload
    )) as CheckAnswerApiResponse;

    const result = checkRes?.data?.[0];
    const correct = !!result?.correct;
    const correctAnswerFromApi =
      (result?.correct_answer as string | string[] | boolean | null) ?? null;

    setStatusByIndex((prev) => ({
      ...prev,
      [qIdx]: { isCorrect: correct, correctAnswer: correctAnswerFromApi },
    }));

    if (correctAnswerFromApi !== null && correctAnswerFromApi !== undefined) {
      updateAnswer({ correctAnswer: correctAnswerFromApi });
    }

    return correct;
  }
  // console.log('currentQuestion', currentQuestion);

  return (
    <div className="flex flex-row w-full h-[90vh]">
      <QuestionNavigator
        quizSession={quizSession}
        currentIndex={quizSession.currentIndex}
        questionModuleMap={questionModuleMap}
        onClick={handleGoToQuestion}
      />

      <div className="flex flex-col items-center justify-center border-b w-full">
        <div className="w-full h-full bg-white">
          <Splitter>
            <Splitter.Panel defaultSize="55%" min="20%" max="70%">
              <div className="bg-white border-x h-full flex flex-col justify-between">
                {/* Header */}
                <div className="flex justify-between items-center border-b p-2 px-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-1 border rounded-md pr-2 shrink-0">
                      <div className="border-r border-slate-200 p-1.5 flex items-center">
                        <p className="text-sm text-gray-500 font-semibold">
                          {quizSession.currentIndex + 1}
                        </p>
                        <p className="text-sm text-gray-500 font-semibold text-center">
                          <span className="text-[10px] font-bold px-1">/</span>
                          {quizSession.questions.length}
                        </p>
                      </div>
                      <p className="text-sm pl-1">Question</p>
                    </div>

                    {/* Question Title in Header */}
                    <p className="text-blue-600 font-medium text-sm truncate flex-1" title={currentQuestion.question}>
                      {currentQuestion.question}
                    </p>
                  </div>

                  {uniqueModules.length > 1 ? (
                    <CustomTextField
                      select
                      size="small"
                      sx={{ minWidth: 120 }}
                      value={currentModule}
                      onChange={(e) =>
                        handleGoToQuestion(
                          questionModuleMap.findIndex((m) => m === e.target.value)
                        )
                      }
                    >
                      {uniqueModules.map((mod, idx) => (
                        <MenuItem key={idx} value={mod}>
                          {mod}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  ) : (
                    <Button sx={{ minWidth: 120 }}>{currentModule}</Button>
                  )}
                </div>

                {/* Question Content */}
                <div className="flex justify-start h-full p-4">
                  {currentQuestion.type === "subjective" ? (
                    <QuizSubject
                      title={currentQuestion.question}
                      description={currentQuestion.content}
                      answer={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                      onContentChange={(value) =>
                        updateAnswer({
                          questionId: currentQuestion.quiz_id,
                          answer: value,
                        })
                      }
                      handleSelect={handleAnswerSelect}
                    />
                  ) : currentQuestion.type === "fill_in_the_blanks" && currentQuestion.content ? (
                    <QuizFillInTheBlanks
                      content={currentQuestion.content}
                      answers={Array.isArray(selectedAnswer) ? selectedAnswer : []}
                      onAnswerChange={(index, value) => {
                        const updated = [...(Array.isArray(selectedAnswer) ? selectedAnswer : [])];
                        updated[index] = value;
                        handleAnswerSelect(updated);
                      }}
                    />
                  ) : (
                    <QuizQuestion question={currentQuestion.content || currentQuestion.question || ""} />
                  )}
                </div>

                {/* Navigation Controls */}
                <div className="border-t p-2">
                  <QuizNavigation
                    handlePrevious={handlePrevious}
                    handleNext={handleNext}
                    handleSkip={handleSkip}
                    handleSubmit={() => {
                      handleSubmit();
                      setShowResults(true);
                    }}
                    currentIndex={quizSession.currentIndex}
                    totalQuestions={quizSession.questions.length}
                    weightage={currentQuestion.weightage}
                  />
                </div>
              </div>
            </Splitter.Panel>

            {/* Side Panel for Options */}
            {!["fill_in_the_blanks", "subjective"].includes(currentQuestion.type) && (
              <Splitter.Panel>
                <div className="relative shadow-sm rounded-md h-full flex flex-col justify-between overflow-y-scroll">
                  <div className="sticky top-0 bg-white z-10 flex justify-between items-center border-b p-4">
                    <p className="text-sm font-semibold">Options</p>
                    <button
                      onClick={handleBookmark}
                      className={`p-1 rounded-md ${quizSession.answers[quizSession.currentIndex]?.isBookmarked
                        ? "text-yellow-500 hover:text-yellow-600"
                        : "text-gray-400 hover:text-gray-500"
                        } transition-colors duration-200`}
                      title="Bookmark question"
                    >
                      {/* bookmark icon */}
                    </button>
                  </div>

                  <div className="p-2 h-full">
                    <QuizOptions
                      options={currentQuestion.options}
                      type={currentQuestion.type}
                      selected={selectedAnswer}
                      onSelect={handleAnswerSelect}
                      onBookmark={handleBookmark}
                      isCorrect={currentStatus}             // per-question value
                      correctAnswer={currentCorrectAnswer}  // per-question value
                    />
                  </div>

                  <div className="flex justify-end p-2 gap-3 border-t">
                    {/* Hide Check Answer for assessments */}
                    {sessionStorage.getItem('test_type') !== 'assessment' && (
                      <button
                        onClick={async () => {
                          const result = await checkCurrentQuestionAnswer();
                          if (result !== null) {
                            setCheckedQuestions((prev) => ({
                              ...prev,
                              [quizSession.currentIndex]: true,
                            }));
                          }
                        }}
                        className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded disabled:opacity-50"
                        disabled={!quizSession.answers[quizSession.currentIndex]?.answer}
                      >
                        Check Answer
                      </button>
                    )}

                    <button
                      onClick={handleNext}
                      disabled={quizSession.currentIndex === quizSession.questions.length - 1}
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </Splitter.Panel>
            )}
          </Splitter>
        </div>

        {/* If you use results later, re-enable this */}
        {/* <ResultModal
          open={showResults}
          onClose={() => setShowResults(false)}
          answers={quizSession.answers}
          totalQuestions={quizSession.questions.length}
          timeTaken={timer}
        /> */}
      </div>
    </div>
  );
}
