import React from "react";
import { Box, Chip } from "@mui/material";
import { Question, SubmissionResult } from "../types";

interface OutputPanelProps {
  result: SubmissionResult | null;
  question: Question;
  view: "output" | "tests";
}

const OutputPanel: React.FC<OutputPanelProps> = ({ result, question, view }) => {
  return (
    <Box>
      {view === "output" && (
        <div className="bg-[#1e1e1e] text-gray-300 p-4 rounded-lg font-mono text-xs leading-relaxed min-h-[160px] border border-[#333]">
           {result?.output ? (
             <pre className="whitespace-pre-wrap font-inherit m-0">{result.output}</pre>
           ) : (
             <div className="text-gray-500 italic flex items-center gap-2 h-full justify-center">
                <span>Run code to see output...</span>
             </div>
           )}
        </div>
      )}

      {view === "tests" && (
        <div className="space-y-3">
          {!result && question?.test_cases && (
            <div className="space-y-3">
              {question.test_cases.map((tc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border bg-gray-50/50 border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-600 flex items-center gap-2 text-xs uppercase tracking-wide">
                      Test Case {i + 1}
                    </span>
                    <Chip label="Pending" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                  </div>
                  <div className="mt-2 text-xs grid grid-cols-[60px_1fr] gap-y-2 font-mono">
                    <span className="text-gray-400 select-none">Input:</span>
                    <div className="text-gray-700 bg-white px-2 py-1 rounded border border-gray-100">{tc?.input_data || "N/A"}</div>

                    <span className="text-gray-400 select-none">Expected:</span>
                    <div className="text-gray-700 bg-white px-2 py-1 rounded border border-gray-100">{tc?.expected_output || "N/A"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!result && !question?.test_cases && (
            <div className="text-gray-400 italic p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-sm">
              No test cases found.
            </div>
          )}

          {result?.test_cases?.map((tc, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border transition-colors ${
                tc.status === "passed"
                  ? "bg-green-50/50 border-green-200"
                  : "bg-red-50/50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold flex items-center gap-2 text-xs uppercase tracking-wide ${
                    tc.status === "passed" ? "text-green-700" : "text-red-700"
                }`}>
                  Test Case {i + 1}
                </span>
                {tc.status === "passed" ? (
                  <Chip label="Passed" color="success" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                ) : (
                  <Chip label="Failed" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                )}
              </div>

              <div className="mt-2 text-xs grid grid-cols-[60px_1fr] gap-y-2 font-mono">
                <span className="text-gray-500 select-none">Input:</span>
                <div className="text-gray-800 bg-white/50 px-2 py-1 rounded border border-gray-200/50">{tc.input || "N/A"}</div>

                <span className="text-gray-500 select-none">Expected:</span>
                <div className="text-gray-800 bg-white/50 px-2 py-1 rounded border border-gray-200/50">{tc.expected_output || "N/A"}</div>

                {tc.status !== "passed" && (
                  <>
                    <span className="text-red-500 font-bold select-none">Actual:</span>
                    <div className="text-red-800 bg-red-100/50 px-2 py-1 rounded border border-red-200">{tc.actual_output || "N/A"}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
};

export default OutputPanel;
