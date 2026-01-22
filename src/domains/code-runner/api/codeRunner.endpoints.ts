
export const codeRunnerEndpoints = {
  getQuestion: (id: string) => `/code-runner/questions/${id}`,
  getTopicQuestions: (topicId: number) => `/code-runner/topics/${topicId}/questions`,
  submit: '/code-runner/submit',
  save: '/code-runner/save',
  reset: '/code-runner/reset',
};
