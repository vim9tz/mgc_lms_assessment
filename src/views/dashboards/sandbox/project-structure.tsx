"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Folder, File } from "lucide-react";
import { cn } from "@/libs/utils";
import type { TreeNode } from "@/app/(private)/tree";

interface ProjectStructureProps {
  rootTree: TreeNode;
  onFileSelect: (path: string) => void;
  currentFile: string;
}

export function ProjectStructure({ rootTree, onFileSelect, currentFile }: ProjectStructureProps) {
  const [tree, setTree] = useState<TreeNode>(rootTree);
  const [openSet, setOpenSet] = useState<Set<string>>(() => {
    const set = new Set<string>();
    set.add(rootTree.name);
    rootTree.children?.forEach(child => {
      if (child.type === "folder") set.add(`${rootTree.name}/${child.name}`);
    });
    return set;
  });

  useEffect(() => {
    setTree(rootTree);
    setOpenSet(() => {
      const set = new Set<string>();
      set.add(rootTree.name);
      rootTree.children?.forEach(child => {
        if (child.type === "folder") set.add(`${rootTree.name}/${child.name}`);
      });
      return set;
    });
  }, [rootTree]);

  const toggle = (path: string) => {
    setOpenSet(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const recurse = (node: TreeNode, parentPath?: string): JSX.Element => {
    const fullPath = node.path ?? (parentPath ? `${parentPath}/${node.name}` : node.name);
    const isOpen = openSet.has(fullPath);

    // folders first, then files, alphabetical
    const sorted = (node.children ?? []).slice().sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div key={fullPath} className="ml-2">
        <div
          className={cn(
            "flex items-center gap-2 p-1 rounded-md cursor-pointer",
            "hover:bg-gray-200 dark:hover:bg-gray-700",
            node.type === "folder" ? "" : "pl-6",
            currentFile === fullPath
              ? "bg-primary dark:bg-primary text-white"
              : "text-gray-800 dark:text-gray-300"
          )}
          onClick={() => (node.type === "folder" ? toggle(fullPath) : onFileSelect(fullPath))}
        >
          {node.type === "folder" ? (
            <>
              {isOpen ? (
                <ChevronDown size={16} className="text-gray-600 dark:text-gray-200" />
              ) : (
                <ChevronRight size={16} className="text-gray-600 dark:text-gray-200" />
              )}
              <Folder size={16} className="text-yellow-500 dark:text-yellow-400" />
            </>
          ) : (
            <File size={16} className="text-green-500 dark:text-green-400" />
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>

        {node.type === "folder" && isOpen && (
          <div>
            {sorted.map(child => recurse(child, fullPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-auto h-full bg-white dark:bg-zinc-900 p-2">
      {recurse(tree)}
    </div>
  );
}
