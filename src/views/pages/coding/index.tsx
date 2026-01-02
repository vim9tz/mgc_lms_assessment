
"use client";

import React from "react";
import { Splitter, theme } from "antd";
import { ProblemStatement } from "@/views/dashboards/sandbox/problem-statement";
import { CodeEditor } from "@/views/dashboards/sandbox/code-editor";
import CodeTerminal from "@/views/dashboards/sandbox/code-terminal";
import { useMernSandbox } from "@/hooks/useMernSandbox";

export default function Coding({ groupedQuestions }: any) {
  const { token } = theme.useToken();
  if (!groupedQuestions?.length) return null;

  const folderTree = groupedQuestions[0].folder_tree;
  
  const {
    webContainer,
    selectedFile,
    fileContent,
    handleFileSelect,
    handleFileSave,
    output,
    previewUrl,
  } = useMernSandbox(folderTree, groupedQuestions[0].cli_reference || groupedQuestions[0].cli_ref);

  return (
    <div className="h-screen w-full">
      {/* top = question  |  bottom = editor + preview/terminal */}
      <Splitter layout="horizontal" style={{ height: "100%" }}>
        {/* QUESTION */}
        <Splitter.Panel
          defaultSize="40%"
          style={{ overflowY: "auto", padding: "1rem" }}
        >
          <ProblemStatement question={groupedQuestions[0]} />
        </Splitter.Panel>

        {/* EDITOR / PREVIEW + TERMINAL */}
        <Splitter.Panel style={{ height: "100%" }}>
          <Splitter layout="vertical" style={{ height: "100%" }}>
            {/* EDITOR */}
            <Splitter.Panel defaultSize="50%" style={{ height: "100%" }}>
              <CodeEditor
                rootTree={folderTree}
                selectedFile={selectedFile}
                fileContent={fileContent}
                onFileSelect={handleFileSelect}
                onSave={handleFileSave}
              />
            </Splitter.Panel>

            {/* PREVIEW + TERMINAL */}
            <Splitter.Panel defaultSize="50%" style={{ height: "100%" }}>
              <CodeTerminal
                previewUrl={previewUrl}
                terminalOutput={output}
              />
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}
