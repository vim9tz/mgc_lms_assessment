"use client";

import { useEffect, useRef, useState } from "react";
import type {
  FileSystemTree,
  WebContainer as WC,
  WebContainerProcess,
} from "@webcontainer/api";
import { getWebContainerInstance } from "@/libs/webcontainerInstance";
import type { TreeNode } from "@/app/(private)/tree";
import yaml from "js-yaml";

/* ------------------------------
   Types for YAML config
--------------------------------*/
type SandboxConfig = {
  env?: Record<string, string>;
  // presets: named groups, each group is an array of steps { run: string }
  presets?: Record<string, { run: string }[]>;
  // commands: named commands (like start, dev, build)
  commands?: Record<string, { run: string }>;
};

/* ------------------------------
   Hook
--------------------------------*/
export function useMernSandbox(folderTree: TreeNode, yamlConfig: string) {
  const [webContainer, setWebContainer] = useState<WC | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const wcRef = useRef<WC | null>(null);
  const hasStartedRef = useRef(false);
  const [config, setConfig] = useState<SandboxConfig | null>(null);

  /* ------------------------------
     Parse YAML once (using js-yaml)
  --------------------------------*/
  useEffect(() => {
    try {
      const parsed = yaml.load(yamlConfig) as SandboxConfig;
      setConfig(parsed ?? null);
    } catch (e) {
      console.error("❌ Invalid YAML config", e);
      setConfig(null);
    }
  }, [yamlConfig]);

  /* ------------------------------
     Build + flatten FS
  --------------------------------*/
  const fsTree = useRef<FileSystemTree>(
    (() => {
      const buildFs = (node: TreeNode): FileSystemTree =>
        node.type === "file"
          ? { [node.name]: { file: { contents: node.content || "" } } }
          : {
              [node.name]: {
                directory: (node.children || []).reduce((acc, child) => {
                  Object.assign(acc, buildFs(child));
                  return acc;
                }, {} as FileSystemTree),
              },
            };
      const full = buildFs(folderTree) as any;
      return (full[folderTree.name] as any).directory as FileSystemTree;
    })()
  ).current;

  const findFirstFile = (n: TreeNode): string | null => {
    if (n.type === "file" && n.path) return n.path;
    for (const c of n.children || []) {
      const f = findFirstFile(c);
      if (f) return f;
    }
    return null;
  };

  /* ------------------------------
     Main lifecycle
  --------------------------------*/
  useEffect(() => {
    if (hasStartedRef.current || !config) return;
    hasStartedRef.current = true;

    (async () => {
      setLoading(true);
      const container = await getWebContainerInstance();
      wcRef.current = container;
      setWebContainer(container);

      // preview server ready
      let didReady = false;
      (container as any).on("server-ready", (port: number, url: string) => {
        if (didReady) return;
        didReady = true;
        setOutput((p) => p + `⚡ Server ready ➔ ${url}\n`);
        setPreviewUrl(url);
      });

      // mount FS
      setOutput((p) => p + "📁 Mounting files…\n");
      await container.mount(fsTree);

      // open first file
      const first = findFirstFile(folderTree);
      if (first) {
        setSelectedFile(first);
        setFileContent(await container.fs.readFile(first, "utf-8"));
      }

      // run flow from yaml (dynamic)
      await runFlowFromYaml(config);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  /* ------------------------------
     Run Flow (YAML-driven)
     - runs each preset group's steps in order
     - then runs commands.start (if present)
  --------------------------------*/
  const runFlowFromYaml = async (cfg: SandboxConfig) => {
    const env = { ...(cfg.env || {}) };

    // 1) run all presets in order (presets are iterated in Object.entries order)
    if (cfg.presets) {
      for (const [presetName, steps] of Object.entries(cfg.presets)) {
        setOutput((p) => p + `\n🛠 Running preset: ${presetName}\n`);
        for (const step of steps) {
          await runCommandString(step.run, env);
        }
      }
    }

    // 2) run "start" command if defined
    if (cfg.commands?.start) {
      setOutput((p) => p + "\n🚀 Starting application…\n");
      await runCommandString(cfg.commands.start.run, env);
    } else {
      setOutput((p) => p + "\n⚠️ No start command in YAML\n");
    }
  };

  /* ------------------------------
     Run a single command string
     - prints the command first
     - spawns in webcontainer with provided env
  --------------------------------*/
  const runCommandString = async (cmdString: string, env: Record<string, string>) => {
    const parts = cmdString.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    setOutput((p) => p + `▶️ ${cmd} ${args.join(" ")}\n`);
    const proc = await wcRef.current!.spawn(cmd, args, { env });
    pipeLogs(proc);
    await proc.exit;
  };

  /* ------------------------------
     File save & reload
  --------------------------------*/
  useEffect(() => {
    if (!webContainer || !selectedFile) return;
    (async () => {
      const txt = await webContainer.fs.readFile(selectedFile, "utf-8");
      setFileContent(txt);
    })();
  }, [selectedFile, webContainer]);

  const handleFileSave = async (newContent: string) => {
    if (!webContainer || !selectedFile) return;
    await webContainer.fs.writeFile(selectedFile, newContent);
    setFileContent(newContent);
  };

  /* ------------------------------
     Pipe logs
  --------------------------------*/
  const pipeLogs = async (proc: WebContainerProcess) => {
    const reader = proc.output.getReader();
    const decoder = new TextDecoder();
    const ansiRe = /\x1b\[[0-9;]*[A-Za-z]/g;
    const spinnerRe = /^[|\/\\-]+$/;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = typeof value === "string" ? value : decoder.decode(value);
      chunk
        .replace(ansiRe, "")
        .replace(/\r/g, "")
        .split("\n")
        .forEach((line) => {
          if (!line.trim() || spinnerRe.test(line.trim())) return;
          setOutput((prev) => prev + line + "\n");
        });
    }

    const code = await proc.exit;
    if (code !== 0) {
      setOutput((prev) => prev + `❌ exited with ${code}\n`);
    }
  };

  return {
    webContainer,
    selectedFile,
    fileContent,
    handleFileSelect: setSelectedFile,
    handleFileSave,
    output,
    loading,
    previewUrl,
  };
}
