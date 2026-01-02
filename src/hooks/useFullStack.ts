// src/hooks/useMernSandbox.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  FileSystemTree,
  WebContainer as WC,
  WebContainerProcess,
} from "@webcontainer/api";
import { getWebContainerInstance } from "@/libs/webcontainerInstance";
import type { TreeNode } from "@/app/(private)/tree";
import yaml from "js-yaml";

/* =========================================================
   Types
   ========================================================= */
export type YamlConfig = {
  version: string;
  name: string;
  env?: Record<string, string>;
  dependencies?: {
    manager: string;
    installCommand: string;
  };
  presets?: Record<
    string,
    {
      cmd: string;
      args?: string[];
    }
  >;
  commands?: Record<
    string,
    {
      description?: string;
      run: string;
    }
  >;
};

function splitCommand(cmdString: string): [string, string[]] {
  const parts = cmdString.trim().split(/\s+/);
  return [parts[0], parts.slice(1)];
}

/* =========================================================
   Hook
   ========================================================= */
export function useMernSandbox(folderTree: TreeNode, yamlConfig: string) {
  const [webContainer, setWebContainer] = useState<WC | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const wcRef = useRef<WC | null>(null);
  const hasStartedRef = useRef(false);

  const [config, setConfig] = useState<YamlConfig | null>(null);

  // Parse YAML once
  useEffect(() => {
    try {
      const parsed = yaml.load(yamlConfig) as YamlConfig;
      setConfig(parsed);
    } catch (err) {
      console.error("YAML parse error", err);
    }
  }, [yamlConfig]);

  // Build FS tree
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

  /* =========================================================
     Core lifecycle
     ========================================================= */
  useEffect(() => {
    if (hasStartedRef.current || !config) return;
    hasStartedRef.current = true;

    (async () => {
      const container = await getWebContainerInstance();
      wcRef.current = container;
      setWebContainer(container);

      let didReady = false;
      (container as any).on("server-ready", (port: number, url: string) => {
        if (didReady) return;
        didReady = true;
        setOutput((p) => p + `⚡ Server ready ➔ ${url}\n`);
        setPreviewUrl(url);
      });

      // 1) Mount files
      setOutput((p) => p + "📁 Mounting files…\n");
      await container.mount(fsTree);

      // 2) Open first file
      const first = findFirstFile(folderTree);
      if (first) {
        setSelectedFile(first);
        setFileContent(await container.fs.readFile(first, "utf-8"));
      }

      // 3) Install deps
      setOutput((p) => p + "🔧 Installing dependencies…\n");
      let installCmd: [string, string[]] = ["npm", ["install"]];
      if (config.dependencies?.installCommand) {
        installCmd = splitCommand(config.dependencies.installCommand);
      }
      const installProc = await container.spawn(...installCmd, {
        env: { ...(config.env || {}) }, // apply YAML env
      });
      pipeLogs(installProc);
      await installProc.exit;
      setOutput((p) => p + "✅ Dependencies installed\n");

      // 4) Auto-start first preset
      if (config?.presets && Object.keys(config.presets).length > 0) {
        const firstPreset = Object.keys(config.presets)[0]!;
        await startPreset(firstPreset);
      }
    })();
  }, [config]);

  // reload file content on select
  useEffect(() => {
    if (!webContainer || !selectedFile) return;
    (async () => {
      const txt = await webContainer.fs.readFile(selectedFile, "utf-8");
      setFileContent(txt);
    })();
  }, [selectedFile, webContainer]);

  /* =========================================================
     Helpers
     ========================================================= */
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

  const handleFileSave = async (newContent: string) => {
    if (!webContainer || !selectedFile) return;
    await webContainer.fs.writeFile(selectedFile, newContent);
    setFileContent(newContent);
  };

  /* =========================================================
     New exposed functions
     ========================================================= */

  // Run any named YAML preset
  const startPreset = useCallback(
    async (name: string) => {
      if (!config?.presets?.[name]) {
        setOutput((p) => p + `⚠️ No preset '${name}' in YAML\n`);
        return;
      }
      const { cmd, args = [] } = config.presets[name];
      setOutput((p) => p + `🚀 Starting preset: ${name}\n`);
      const proc = await wcRef.current!.spawn(cmd, args, {
        env: { ...(config.env || {}) },
      });
      pipeLogs(proc);
    },
    [config]
  );

  // Run any YAML command (build/test/etc.)
  const runCommand = useCallback(
    async (name: string) => {
      if (!config?.commands?.[name]) {
        setOutput((p) => p + `⚠️ No command '${name}' in YAML\n`);
        return;
      }
      const [cmd, args] = splitCommand(config.commands[name].run);
      setOutput((p) => p + `▶️ Running command: ${name}\n`);
      const proc = await wcRef.current!.spawn(cmd, args, {
        env: { ...(config.env || {}) },
      });
      pipeLogs(proc);
    },
    [config]
  );

  return {
    webContainer,
    selectedFile,
    fileContent,
    handleFileSelect: setSelectedFile,
    handleFileSave,
    output,
    loading,
    previewUrl,
    // new
    startPreset,
    runCommand,
  };
}
