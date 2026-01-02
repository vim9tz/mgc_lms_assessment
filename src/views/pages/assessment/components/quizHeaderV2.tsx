"use client";

import { Card } from "@mui/material";
import React from "react";

// MUI imports
import MenuItem from '@mui/material/MenuItem'

// Component imports
import CustomTextField from '@core/components/mui/TextField'

type Props = {
  current: number;
  total: number;
  timer: number;
  currentModule: string;
  questionModuleMap: string[];
  handleGoToQuestion: (index: number) => void;
};

export default function QuizHeader({
  current,
  total,
  timer,
  currentModule,
  questionModuleMap,
  handleGoToQuestion
}: Props) {
  const uniqueModules = [...new Set(questionModuleMap)];

  return (
    <div className="w-full  flex flex-wrap gap-4 justify-center sm:justify-between items-center pb-3">
      {/* Left: Answered Stats */}
      <div className="flex justify-center items-center gap-1 sm:order-3 order-3">
        <Card className="flex justify-center items-center p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-file-check-2"
          >
            <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="m3 15 2 2 4-4" />
          </svg>
        </Card>
        <Card className="flex justify-center items-center px-2 py-1">
          <p className="text-md font-bold">
            Answered: {current + 1}
            <span className="font-medium text-lg">/</span>
            {total}
          </p>
        </Card>
      </div>
      {/* Center: Module dropdown */}
      {/* <div className="w-fit max-w-md sm:order-2 order-2">
        <CustomTextField
          select
          fullWidth
          value={currentModule}
          onChange={(e) =>
            handleGoToQuestion(questionModuleMap.findIndex((m) => m === e.target.value))
          }
        >
          {uniqueModules.map((mod, idx) => (
            <MenuItem key={idx} value={mod}>
              {mod}
            </MenuItem>
          ))}
        </CustomTextField>
      </div> */}

      {/* Right: Timer display */}
      <div className="sm:w-fit w-full flex gap-1 justify-center items-center align-middle sm:order-1 order-1">
        <Card className="flex justify-center items-center w-9 h-9">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-alarm-clock"
          >
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M5 3 2 6" />
            <path d="m22 6-3-3" />
            <path d="M6.38 18.7 4 21" />
            <path d="M17.64 18.67 20 21" />
          </svg>
        </Card>
        <Card className="w-9 h-9 flex justify-center items-center">{Math.floor(timer / 3600)}</Card>
        <Card className="w-9 h-9 flex justify-center items-center">{Math.floor((timer % 3600) / 60)}</Card>
        <Card className="w-9 h-9 flex justify-center items-center">{timer % 60}</Card>
      </div>
    </div>
  );
}
