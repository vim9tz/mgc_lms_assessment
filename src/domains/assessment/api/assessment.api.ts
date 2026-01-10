import { httpClient } from '@/lib/httpClient';
import { assessmentEndpoints } from './assessment.endpoints';

export const assessmentApi = {
  checkCheck: async (subtopic_id: string) => {
    const { data } = await httpClient.post(assessmentEndpoints.checkCheck, { subtopic_id });
    return data;
  },

  getQuestions: async (subtopic_id: string, type?: string) => {
    const { data } = await httpClient.post(assessmentEndpoints.getQuestions, { subtopic_id, type });
    return data;
  },
  
  // New method for direct GET questions (as used in Home.tsx getAssessmentQuestions)
  getQuestionsByType: async (subtopic_id: string, type: string) => {
      const { data } = await httpClient.get(`/v1/assessment/subtopics/${subtopic_id}/questions?type=${type}`);
      return data;
  },

  getTest: async (subtopic_id: string) => {
    const { data } = await httpClient.post(assessmentEndpoints.getTest, { subtopic_id });
    return data;
  },

  guestAttempt: async (test_id: string) => {
    const { data } = await httpClient.post(assessmentEndpoints.guestAttempt, { test_id });
    return data;
  },

  guestTest: async (test_id: string) => {
    const { data } = await httpClient.post(assessmentEndpoints.guestTest, { test_id });
    return data;
  },
  
  practiceAttempt: async (practise_id: string) => {
      const { data } = await httpClient.post(assessmentEndpoints.practiceAttempt, { practise_id });
      return data;
  },
  
  practiceQuestions: async (practise_id: string) => {
      const { data } = await httpClient.post(assessmentEndpoints.practiceQuestions, { practise_id });
      return data;
  },
  
  mockAttempt: async (mock_id: string) => {
      const { data } = await httpClient.post(assessmentEndpoints.mockAttempt, { mock_id });
      return data;
  },
  
  mockQuestions: async (mock_id: string) => {
      const { data } = await httpClient.post(assessmentEndpoints.mockQuestions, { mock_id });
      return data;
  },

  submit: async (payload: any) => {
    const { data } = await httpClient.post(assessmentEndpoints.submit, payload);
    return data;
  }
};
