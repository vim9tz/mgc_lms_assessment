import { mock } from "node:test";

// Define a type for API methods
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Define a type for API endpoints
type ApiEndpoint = {
  [key in ApiMethod]?: { url: string };
};

// Define all available endpoints with methods
export const apiEndpoints: Record<string, ApiEndpoint> = {
  user: {
    GET: { url: '/me' },
  },
  testAttempt: {
    POST: { url: '/learning/getAttempt' },
  },
  questions: {
    POST: { url: '/learning/getQuestion' },
  },
  answers : {
    POST: { url: '/checkAnswers' },
  },
  quizSubmit: {
    POST: { url: '/quiz/submit' },
  },
  getOTP : {
    POST: { url: '/generateToken' }, 
  },
  verifyOTP : { 
    POST: { url: '/verifyOtp' },
  },
  guestTest: {
    POST: { url: '/testQuestions' },
  },
  guestAttempt: {
    POST: { url: '/testModules' },
  },
  endAttempt: {
    POST : {url : '/quiz/end'}
  },
  submitquiz:{
    POST : {url : '/submit-full-test'}
  },

  getGeeksSubmission:{
    POST : {url : '/get-geeks/test-submissions'}
  },

  getSubmission: {
    POST: { url: '/get-submission' },
  },
  timesync: {
    GET: { url: '/servertime' },
  },
  checkCheck: {
    POST: { url: '/testCheckValidity' },
  },
  practiceAttempt: {
    POST: { url: '/get-practice-attempt' },
  },
  practiceQuestions: {
    POST: { url: '/get-practice-questions' },
  },
  mockAttempt: {
    POST: { url: '/get-mock-attempts' },
  },
  mockQuestions: {
    POST: { url: '/get-mock-questions' },
  },
  // Add more endpoints as needed
};

