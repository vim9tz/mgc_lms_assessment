"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import CodeRunnerInterface from './components/CodeRunnerInterface/CodeRunnerInterface'

export default function AssessmentQuiz() {
  const searchParams = useSearchParams()
  const questionCodingId = searchParams.get('question_coding_id')
  const token = searchParams.get('token')

  if (questionCodingId) {
    return <CodeRunnerInterface questionId={questionCodingId} token={token || undefined} />
  }

  // ... Original "Hello buddy!" or existing logic ...
  return (
    <div className=" w-full h-full">
      <h1>Hello buddy!</h1>
    </div>
  )
}

