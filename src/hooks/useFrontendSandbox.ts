"use client";

import { useEffect, useRef, useState } from "react";
import type {
  FileSystemTree,
  WebContainer as WC,
  WebContainerProcess,
} from "@webcontainer/api";
import { getWebContainerInstance } from "@/libs/webcontainerInstance";
import type { TreeNode } from "@/app/(private)/tree";

export function useFrontendSandbox(folderTree: TreeNode) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string>("📁 Mounting files...\n");
  const [loading, setLoading] = useState<boolean>(true);

  const wcRef = useRef<WC>();

  // Recursively turn your TreeNode into WebContainer's FileSystemTree
  const buildFs = (n: TreeNode): FileSystemTree =>
    n.type === "file"
      ? { [n.name]: { file: { contents: n.content || "" } } }
      : {
          [n.name]: {
            directory: (n.children || []).reduce((acc, c) => {
              return Object.assign(acc, buildFs(c));
            }, {} as FileSystemTree),
          },
        };

  // Helper to stream logs into state
  async function pipeLogs(proc: WebContainerProcess) {
    const reader = proc.output.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = typeof value === "string" ? value : dec.decode(value);
      setTerminalOutput((t) => t + chunk);
    }
  }

  useEffect(() => {
    (async () => {
      // 1) Boot WebContainer
      const container = await getWebContainerInstance();
      wcRef.current = container;

      // 2) Listen for any HTTP servers
      ;(container as any).on("server-ready", (e: { url: string }) => {
        setPreviewUrl(e.url);
        setTerminalOutput((t) => t + `\n⚡ server-ready ➔ ${e.url}\n`);
      });

      // 3) Flatten out only the *contents* of folderTree (drop the top-level "frontend/" wrapper)
      const flatFs = (folderTree.children || []).reduce((acc, c) => {
        return Object.assign(acc, buildFs(c));
      }, {} as FileSystemTree);

      await container.mount(flatFs);
      setTerminalOutput((t) => t + "✅ Files mounted\n🔧 Installing dependencies...\n");

      // 4) npm install
      const installProc = await container.spawn("npm", ["install"]);
      await pipeLogs(installProc);

      setTerminalOutput((t) => t + "\n🚀 Starting Next.js dev server...\n");

      // 5) npm run dev
      const devProc = await container.spawn("npm", ["run", "dev"]);
      await pipeLogs(devProc);

      setLoading(false);
    })();
  }, [folderTree]);

  return { previewUrl, terminalOutput, loading };
}
