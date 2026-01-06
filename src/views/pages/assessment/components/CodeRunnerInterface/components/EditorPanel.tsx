import React from "react";
import dynamic from "next/dynamic";
import { Button, CircularProgress } from "@mui/material";
import { PlayArrow, CloudUpload as CloudUploadIcon, Code as CodeIcon } from "@mui/icons-material";
import { Question } from "../types";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EditorPanelProps {
  question: Question;
  code: string;
  editorLanguage: string;
  submitting: boolean;
  onChangeCode: (v: string) => void;
  onRun: () => void;
  onSubmit: () => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  question,
  code,
  editorLanguage,
  submitting,
  onChangeCode,
  onRun,
  onSubmit,
}) => {
  return (
    <div className="w-full flex flex-col bg-[#1e1e1e] h-full">
      <div className="flex items-center justify-between px-4 h-12 bg-[#1e1e1e] border-b border-[#333] shrink-0">
        <div className="flex items-center gap-3 text-gray-400 font-medium text-xs uppercase tracking-wider">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#2d2d2d] border border-[#3e3e3e]">
             <CodeIcon sx={{ fontSize: 14 }} className="text-blue-500" />
             <span className="text-gray-300">{question.programming_language || "Language"}</span>
          </div>
        </div>

        <div className="flex gap-2">
            <Button
            size="small"
            variant="outlined"
            onClick={onRun}
            disabled={submitting}
            sx={{ 
                textTransform: 'none', 
                borderColor: '#444', 
                color: '#ccc',
                minWidth: 'auto',
                px: 2,
                fontSize: '0.8rem',
                '&:hover': { borderColor: '#666', bg: '#333', color: '#fff' }
            }}
            startIcon={submitting ? <CircularProgress size={12} color="inherit" /> : <PlayArrow sx={{ fontSize: 16 }} />}
            >
            {submitting ? "Running..." : "Run"}
            </Button>

            <Button
            size="small"
            variant="contained"
            onClick={onSubmit}
            disabled={submitting}
            sx={{ 
                textTransform: 'none', 
                bgcolor: '#28a745', 
                color: '#fff',
                minWidth: 'auto',
                px: 2,
                fontSize: '0.8rem',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#218838', boxShadow: 'none' }
            }}
            startIcon={submitting ? <CircularProgress size={12} color="inherit" /> : <CloudUploadIcon sx={{ fontSize: 16 }} />}
            >
            {submitting ? "Submitting..." : "Submit"}
            </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
            height="100%"
            language={editorLanguage}
            value={code}
            onChange={(v) => onChangeCode(v || "")}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 14 }}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
