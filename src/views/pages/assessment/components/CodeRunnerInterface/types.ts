export interface QuestionTestCase {
  id: number;
  description?: string;
  input_data: string;
  expected_output: string;
}

export interface Question {
  id: number;
  topic_id?: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  content: string;
  programming_language?: string;
  programming_language_id?: number;
  starter_code?: string;
  user_code?: string;
  test_cases?: QuestionTestCase[];
}

export interface TopicQuestion {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  status: "solved" | "attempted" | "unsolved";
}

export interface TestCaseResult {
  status: "passed" | "failed" | "error";
  input?: string;
  expected_output?: string;
  actual_output?: string;
  passed?: boolean;
}

export interface SubmissionResult {
  status: "passed" | "failed" | "error";
  output?: string;
  runtime?: number;
  test_cases?: TestCaseResult[];
}

export interface CodeRunnerInterfaceProps {
  questionId: string;
  token?: string;
}
