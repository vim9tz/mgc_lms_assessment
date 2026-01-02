export interface MCQQuestion {
  quiz_id: string;
  question: string;
  type: "single_choice" | "multiple_choice" | "true_false";
  options: Record<string, string>;
}

export interface MCQModule {
  module_name: string;
  questions: MCQQuestion[];
}

export interface TestCase {
  input: string;
  expected_output: string;
  weightage: string;
}

export interface CodingQuestion {
  question_id: string;
  title: string;
  type: string;  // Add this field to represent the type of the coding question
  description: string;
  test_cases: TestCase[];
  solution: string;
  folder_path: string | null;
}

export interface CodingModule {
  module_name: string;
  questions: CodingQuestion[];
}

export interface QuizData {
  mcq: MCQModule[];
  coding: CodingModule[];
  is_saved_state: boolean;
}

export interface QuizApiResponse {
  data: QuizData;
}
