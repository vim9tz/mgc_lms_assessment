// src/hooks/useCoding.ts
"use client";

import { useEffect, useRef, useState } from "react";
import type { FileSystemTree, WebContainer as WC } from "@webcontainer/api";
import { getWebContainerInstance } from "@/libs/webcontainerInstance";

type TreeNode = {
  name: string;
  type: "folder" | "file";
  path?: string;
  content?: string;
  children?: TreeNode[];
};

type TestCase = { input: string; expected_output: string | null; weightage: string };

type CodingQuestion = {
  question_id: string;
  title: string;
  description: string;
  test_cases: TestCase[];
  solution: string | null;
  folder_tree: TreeNode;
};

export function useCodingHook(question: CodingQuestion) {
  const [webContainer, setWebContainer] = useState<WC | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<WC | null>(null);
  const hasMountedRef = useRef(false);

  // 1) Convert your folder_tree into the WebContainer mount format
  const convertToFsTree = (node: TreeNode): FileSystemTree => {
    const walk = (n: TreeNode): FileSystemTree => {
      if (n.type === "file") {
        return { [n.name]: { file: { contents: n.content ?? "" } } };
      }
      const children: FileSystemTree = {};
      n.children?.forEach((c) => Object.assign(children, walk(c)));
      return { [n.name]: { directory: children } };
    };
    const fs = walk(node);
    // mount wants the inner directory of the root folder
    return (fs[node.name] as { directory: FileSystemTree }).directory;
  };

  // 2) Mount the question folder into the container
  const mountQuestion = async () => {
    if (!webContainer) return;
    const fsTree = convertToFsTree(question.folder_tree);
    await webContainer.mount(fsTree);
  };

  // 3) Find the first file in the tree so we can auto-select it
  const findFirstFile = (n: TreeNode): string | null => {
    if (n.type === "file" && n.path) return n.path;
    for (const c of n.children || []) {
      const p = findFirstFile(c);
      if (p) return p;
    }
    return null;
  };

  // 4) Boot exactly once
  useEffect(() => {
    (async () => {
      if (!containerRef.current) {
        containerRef.current = await getWebContainerInstance();
      }
      setWebContainer(containerRef.current);
    })();
  }, []);

  // 5) Once booted, mount & auto-select on first render
  useEffect(() => {
    if (webContainer && !hasMountedRef.current) {
      (async () => {
        await mountQuestion();
        const first = findFirstFile(question.folder_tree);
        if (first) {
          // read the file so editor shows its contents
          const contents = await webContainer.fs.readFile(first, "utf-8");
          setSelectedFile(first);
          setFileContent(contents);
        }
        hasMountedRef.current = true;
      })();
    }
  }, [webContainer, question]);

  // file picker in sidebar calls this
  const handleFileSelect = async (path: string) => {
    if (!webContainer) return;
    setSelectedFile(path);
    const contents = await webContainer.fs.readFile(path, "utf-8");
    setFileContent(contents);
  };

  const handleFileSave = async (newContent: string) => {
    if (!webContainer || !selectedFile) return;
    await webContainer.fs.writeFile(selectedFile, newContent);
    setFileContent(newContent);
  };

  // 6) Run code, stream stdout+stderr, show exit code or errors
  const runCode = async () => {
    if (!webContainer) return;
    setLoading(true);
    setTerminalOutput("");

    // pick the file to run
    // prefer what the user has clicked, otherwise the first .js file in the tree
    const entry =
      selectedFile ||
      (function findFirstJS(n: TreeNode): string | null {
        if (n.type === "file" && n.name.endsWith(".js") && n.path) return n.path;
        for (const c of n.children || []) {
          const p = findFirstJS(c);
          if (p) return p;
        }
        return null;
      })(question.folder_tree);

    if (!entry) {
      setTerminalOutput("❌ No JavaScript entry file found to run.");
      setLoading(false);
      return;
    }

    try {
      // spawn using the dynamic entry point
      const proc = await webContainer.spawn("node", [entry]);

      const reader = proc.output.getReader();
      const decoder = new TextDecoder();

      (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = typeof value === "string" ? value : decoder.decode(value);
          setTerminalOutput((out) => out + chunk);
        }
      })();

      const exitCode = await proc.exit;
      if (exitCode !== 0) {
        setTerminalOutput((out) => out + `\n📦 process exited with code ${exitCode}`);
      }
    } catch (err: any) {
      setTerminalOutput((out) => out + `\n❌ ${(err && err.message) || err}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    question,
    webContainer,
    selectedFile,
    fileContent,
    terminalOutput,
    loading,
    handleFileSelect,
    handleFileSave,
    runCode,
  };
}
