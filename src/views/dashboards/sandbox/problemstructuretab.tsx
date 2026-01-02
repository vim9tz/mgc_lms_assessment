import * as React from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { ProblemStatement } from "@/views/dashboards/sandbox/problem-statement";
import { Card } from '@mui/material';
import SelectModule from './select-module';
import { useState } from 'react';

type TreeNode = {
  name: string;
  type: 'folder' | 'file';
  path?: string;
  content?: string;
  children?: TreeNode[];
};

type TestCase = {
  input: string;
  expected_output: string | null;
  weightage: string;
};

type CodingQuestion = {
  question_id: string;
  title: string;
  description: string;
  test_cases: TestCase[];
  solution: string | null;
  folder_tree: TreeNode;
};

interface ProblemstructuretabProps {
  question: CodingQuestion;
  currentFile: string;
  onFileSelect: (path: string) => void;
  webContainer: any;
}

export default function Problemstructuretab({ question }: ProblemstructuretabProps) {
  const [value, setValue] = useState("1");

  return (
    <Card className="flex justify-between h-full">
      <Box sx={{ width: "100%", typography: "body1" }}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              width: "100%"
            }}
          >

          </Box>

            <ProblemStatement question={question} />

      </Box>
    </Card>
  );
}
