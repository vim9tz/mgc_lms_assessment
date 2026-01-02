export interface TestCase {
  input: any[];
  expected: any;
  description: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  testCases: TestCase[];
}