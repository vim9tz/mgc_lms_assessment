import React from "react";

type Props = {
  handlePrevious: () => void;
  handleNext: () => void;
  handleSkip: () => void;
  handleSubmit: () => void;
  currentIndex: number;
  totalQuestions: number;
  weightage?: string;
};

export default function QuizNavigation({ handlePrevious, handleNext, handleSkip, handleSubmit, currentIndex, totalQuestions, weightage }: Props) {
  return (
    <div className="flex gap-4 flex-wrap justify-between items-center w-full">
      <div className="flex gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-500 rounded disabled:opacity-50 hover:disabled:cursor-not-allowed text-sm"
        >
          Previous
        </button>
        <button
          onClick={handleSkip}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-500 rounded disabled:opacity-50 hover:disabled:cursor-not-allowed text-sm"
        >
          Skip
        </button>
      </div>

      <div className="flex items-center gap-4">
        {weightage && (
            <div className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
             Marks: {parseFloat(weightage)}
            </div>
        )}
        
        {/* Submit button logic can be re-enabled if needed */}
      </div>
    </div>
  );
}
