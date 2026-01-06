'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import CodeRunnerInterface from '@/views/pages/assessment/components/CodeRunnerInterface';

export default function CodeAssessmentPage() {
  const searchParams = useSearchParams();
  const questionCodingId = searchParams.get('question_coding_id');
  const token = searchParams.get('token');

  if (!questionCodingId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">
          Missing question_coding_id parameter.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <CodeRunnerInterface 
        questionId={questionCodingId} 
        token={token || undefined} 
      />
    </div>
  );
}
