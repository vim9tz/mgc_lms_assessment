import React from "react";

type Props = {
  options: Record<string, string>;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_the_blanks' | 'subjective';
  selected: string | string[] | boolean | null;
  onSelect: (answer: string | string[] | boolean) => void;
  onBookmark: () => void;
  isCorrect?: boolean | null;
  correctAnswer?: string | string[] | boolean | null;
};

export default function QuizOptions({ options, type, selected, onSelect, onBookmark, isCorrect, correctAnswer }: Props) {
  const optionEntries = Object.entries(options);
  return (
    <>
      <div className="flex flex-col h-full gap-4 p-6">
        
        {type === 'multiple_choice' ? (
          optionEntries.map(([key, opt], idx) => {
            const isChecked = Array.isArray(selected) && selected.includes(key);
            let optionStyles = "transform transition-all duration-200 hover:scale-101 w-full";
            let statusIcon = null;

            if (isCorrect === false && correctAnswer && key === correctAnswer) {
              optionStyles += " bg-gradient-to-r from-green-100 to-green-300 border-green-500 border-2 border-dashed text-green-500 shadow-sm";
              statusIcon = "✓";
            } else if (isChecked) {
              if (isCorrect === true) {
                optionStyles += " bg-gradient-to-r from-green-100 to-green-200 border-green-500 border-2 border-dashed text-green-500 shadow-sm";
                statusIcon = "✓";
              } else if (isCorrect === false) {
                optionStyles += " bg-gradient-to-r from-red-100 to-red-200 border-red-500 border-2 border-dashed text-red-500 shadow-sm";
                statusIcon = "✗";
              } else {
                optionStyles += " border-2 bg-white border-dashed border-blue-700 text-blue-800 shadow-sm";
              }
            } else {
              optionStyles += " bg-white hover:bg-slate-50 border-2 border-dashed border-slate-200";
            }

            return (
              <button
                key={idx}
                onClick={() => {
                  if (!Array.isArray(selected)) return onSelect([key]);
                  if (isChecked) {
                    onSelect(selected.filter(o => o !== key));
                  } else {
                    onSelect([...selected, key]);
                  }
                }}
                disabled={isCorrect !== null}
                className={`p-4 h-full rounded-xl ${optionStyles} flex items-center justify-between ${isCorrect !== null ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-md border-2 border-slate-300 flex items-center justify-center mr-3">
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className="text-lg">{opt}</span>
                </div>
                {statusIcon && (
                  <span className="text-xl font-bold">{statusIcon}</span>
                )}
              </button>
            );
          })
        ) : (
          optionEntries.map(([key, opt], idx) => {
            let optionStyles = "transform transition-all duration-200 hover:scale-101 w-full";
            let statusIcon = null;

            if (isCorrect === false && correctAnswer && key === correctAnswer) {
              optionStyles += "bg-gradient-to-r from-green-100 to-green-300 border-green-500 border-2 border-dashed text-green-500 shadow-sm";
              statusIcon = "✓";
            } else if (selected === key) {
              if (isCorrect === true) {
                optionStyles += "bg-gradient-to-r from-green-100 to-green-200 border-green-500 border-2 border-dashed text-green-500 shadow-sm";
                statusIcon = "✓";
              } else if (isCorrect === false) {
                optionStyles += " bg-gradient-to-r from-red-100 to-red-200 border-red-500 border-2 border-dashed text-red-500 shadow-sm";
                statusIcon = "✗";
              } else {
                optionStyles += " border-2 bg-white border-dashed border-blue-700 text-blue-800 shadow-sm";
              }
            } else {
              optionStyles += " bg-white hover:bg-slate-50 border-2 border-dashed border-slate-200";
            }
            return (
              <button
                key={idx}
                onClick={() => onSelect(key)}
                disabled={isCorrect !== null}
                className={`p-4 h-full rounded-xl ${optionStyles} flex items-center justify-between ${isCorrect !== null ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-md bg-opacity-20 bg-slate-300 flex items-center justify-center mr-3">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-lg">{opt}</span>
                </div>
                {statusIcon && (
                  <span className="text-xl font-bold">{statusIcon}</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
