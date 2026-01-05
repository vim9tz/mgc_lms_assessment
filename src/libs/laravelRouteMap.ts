// libs/laravelRouteMap.ts

import { check } from "valibot";

export function resolveLaravelEndpoint(
  endpointParts?: string[],
  method: 'GET' | 'POST' = 'GET',
  body?: any
): string | null {
  if (!endpointParts || endpointParts.length === 0) return null;

  const [first] = endpointParts;

  if (first === 'auth') return null; // Reserved for NextAuth

  if (first === 'github') return 'github'; // handle inside dynamic route

  // Static map
  const staticMap: Record<string, string> = {
    question: 'questions',
    test: 'testAttempt',
    quizAnswers: 'answers',
    quizSubmit: 'quizSubmit',
    getOTP: 'getOTP',
    verifyOTP: 'verifyOTP',
    guestTest: 'guestTest',
    guestAttempt: 'guestAttempt',
    endtest: 'endAttempt',
    submitquiz :'submitquiz',
    getGeeksSubmission: 'getGeeksSubmission',
    getSubmission: 'getSubmission',
    timesync: 'timesync',
    checkCheck: 'checkCheck',
    practiceAttempt: 'practiceAttempt',
    practiceQuestions: 'practiceQuestions',
    mockAttempt: 'mockAttempt',
    mockQuestions: 'mockQuestions',
    questions: 'questions',
    assessmentQuestions: 'assessmentQuestions',
  };

  return staticMap[first] ?? null;
}
