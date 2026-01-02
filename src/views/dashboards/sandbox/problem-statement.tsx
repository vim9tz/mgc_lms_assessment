import React from "react";
import { Card, Typography } from "@mui/material";
import { createSvgIcon } from "@mui/material";
import { FileQuestion } from 'lucide-react';

type TestCase = { input: string; expected_output: string | null; weightage: string };
type CodingQuestion = {
  question_id: string;
  title: string;
  description: string;
  test_cases: TestCase[];
  solution: string | null;
  folder_tree: any;
};

const QuestionIcon = createSvgIcon(
  <path d="M12 17h.01M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />,
  "QuestionIcon"
);

export function ProblemStatement({ question }: { question: CodingQuestion }) {
  return (
    <Card className="h-full overflow-y-auto ">
      <div className="flex items-center mb-2 border-b p-3">
        <FileQuestion size={20} color="#666666" />
        <Typography variant="subtitle1" className="ml-1">Question</Typography>
      </div>

      <div className="p-4">
        <Typography variant="h6" className="mb-2">{question.title}</Typography>
        <div
          className="prose mb-4"
          dangerouslySetInnerHTML={{ __html: question.description }}
        />
        {question.test_cases?.length > 0 && (
          <>
            <Typography variant="subtitle2" className="mb-1 font-semibold">Test Cases</Typography>
            {question.test_cases.map((tc, i) => (
              <Card key={i} className="p-3 shadow-none border mb-2">
                <Typography variant="body2"><strong>Input:</strong></Typography>
                <pre className="bg-gray-100 p-2 rounded">{tc.input}</pre>
                <Typography variant="body2"><strong>Expected:</strong></Typography>
                <pre className="bg-gray-100 p-2 rounded">{tc.expected_output}</pre>
                <Typography variant="body2"><strong>Weightage:</strong> {tc.weightage}</Typography>
              </Card>
            ))}
          </>
        )}
      </div>
    </Card>
  );
}
