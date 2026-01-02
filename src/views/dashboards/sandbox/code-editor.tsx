"use client";

import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Card } from "@/views/dashboards/sandbox/ui/card";
import Button from '@mui/material/Button';
import { useTheme } from "@mui/material/styles";
import { createSvgIcon, Typography } from "@mui/material";
import { ProjectStructure } from './project-structure';

// reuse TreeNode type
interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  path?: string;
  content?: string;
  children?: TreeNode[];
}

interface CodeEditorProps {
  rootTree: TreeNode;
  selectedFile: string;
  fileContent: string;
  onFileSelect: (path: string) => void;
  onSave: (content: string) => void;
}

export function CodeEditor({
  rootTree,
  selectedFile,
  fileContent,
  onFileSelect,
  onSave,
}: CodeEditorProps) {
  const [code, setCode] = useState(fileContent);
  const [language, setLanguage] = useState("plaintext");
  const [lineWrap, setLineWrap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setCode(fileContent);
    setLanguage(detectLanguage(fileContent));
  }, [fileContent]);

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on" as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    glyphMargin: false,
    wordWrap: lineWrap ? ("on" as const) : ("off" as const),
  };

  const handleEditorWillMount = (monaco: typeof import("monaco-editor")) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  };

  const detectLanguage = (codeStr: string) => {
    if (codeStr.startsWith("<") && codeStr.includes("</")) return "html";
    if (codeStr.includes("def ")) return "python";
    if (codeStr.includes("class ") && codeStr.includes("public static void main")) return "java";
    if (codeStr.includes("SELECT ") || codeStr.includes("INSERT INTO")) return "sql";
    if (codeStr.includes("function") || codeStr.includes("const") || codeStr.includes("let")) return "javascript";
    if (codeStr.includes("import") && codeStr.includes("from")) return "javascript";
    return "plaintext";
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) setCode(value);
  };

  const saveFile = () => {
    onSave(code);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const CodeEditorIcon = createSvgIcon(
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-terminal"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m8 16 2-2-2-2" /><path d="M12 18h4" /></svg>,
    'CodeEditorIcon',
  );

  return (
    <Card
      className={`flex h-full flex-col shadow-md rounded-tr-md rounded-tl-none rounded-b-none ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 border-r overflow-auto">
          <ProjectStructure
            rootTree={rootTree}
            onFileSelect={onFileSelect}
            currentFile={selectedFile}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 flex justify-between items-center">
            <div className="flex gap-1 items-center">
              <CodeEditorIcon sx={{ fontSize: 17 }} color="secondary" />
              <Typography className="text-sm font-medium">
                Editing: {selectedFile || "No file selected"}
              </Typography>
            </div>
            <div className="flex gap-2">
              <Button size="small" color="secondary" onClick={saveFile}>
                Save
              </Button>
              <Button size="small" color="secondary" onClick={() => setLineWrap(!lineWrap)}>
                {lineWrap ? 'No Wrap' : 'Wrap'}
              </Button>
              <Button size="small" color="secondary" onClick={toggleFullscreen}>
                Fullscreen
              </Button>
            </div>
          </div>
          <div className="flex-1 relative">
            <Editor
              defaultLanguage="plaintext"
              language={language}
              value={code}
              height="100%"
              theme={theme.palette.mode === "dark" ? "vs-dark" : "vs-light"}
              options={editorOptions}
              beforeMount={handleEditorWillMount}
              onChange={handleCodeChange}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
