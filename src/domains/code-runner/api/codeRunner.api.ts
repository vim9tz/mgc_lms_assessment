
import { httpClient } from '@/lib/httpClient';
import { codeRunnerEndpoints } from './codeRunner.endpoints';

export const codeRunnerApi = {
  getQuestion: async (id: string) => {
    const { data } = await httpClient.get(codeRunnerEndpoints.getQuestion(id));
    return data;
  },

  getTopicQuestions: async (topicId: number) => {
    const { data } = await httpClient.get(codeRunnerEndpoints.getTopicQuestions(topicId));
    return data;
  },

  submit: async (payload: any) => {
    const { data } = await httpClient.post(codeRunnerEndpoints.submit, payload);
    return data;
  }
};
