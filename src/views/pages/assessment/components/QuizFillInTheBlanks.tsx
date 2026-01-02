'use client';

import React from 'react';

interface Props {
  content: string;
  answers: string[];
  onAnswerChange: (index: number, value: string) => void;
}

export default function QuizFillInTheBlanks({
  content,
  answers,
  onAnswerChange,
}: Props) {
  // Strip HTML tags, decode entities, and trim
  const plainContent = content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  // Split text by blanks and find placeholders
  const textSegments = plainContent.split(/{{blank\d+}}/g);
  const blankPlaceholders = plainContent.match(/{{blank\d+}}/g) || [];

  return (
    <section className="max-w-4xl w-full mx-auto bg-gradient-to-r from-white via-blue-50 to-white p-8 lg:p-12 rounded-xl shadow-lg transition-shadow hover:shadow-2xl">
      <div className="flex flex-wrap items-center gap-6">
        {textSegments.map((segment, idx) => (
          <React.Fragment key={idx}>
            <span className="text-gray-800 text-base lg:text-lg leading-7 font-medium">
              {segment}
            </span>
            {idx < blankPlaceholders.length && (
              <input
                type="text"
                value={answers[idx] || ''}
                onChange={(e) => onAnswerChange(idx, e.target.value)}
                placeholder={`Answer ${idx + 1}`}
                className="appearance-none bg-transparent border-b-2 border-gray-300 px-2 py-1 w-32 lg:w-40 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-0 outline-none transition-colors duration-200"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
