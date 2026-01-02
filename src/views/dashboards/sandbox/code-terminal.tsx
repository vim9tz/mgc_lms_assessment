"use client";

import React, { useState } from "react";
import { Card, Typography, Button, CircularProgress } from "@mui/material";
import { PlayArrow } from "@mui/icons-material";

interface CodeTerminalProps {
  previewUrl: string;
  terminalOutput: string;
  loading?: boolean;
}

export default function CodeTerminal({
  previewUrl,
  terminalOutput,
  loading = false,
}: CodeTerminalProps) {
  const [showTerminal, setShowTerminal] = useState(true);

  return (
    <Card className="h-full flex flex-col shadow">
      {/* toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <Typography variant="subtitle2">Live Preview</Typography>
        <div className="flex gap-2 items-center">
          <Button
            size="small"
            variant="text"
            onClick={() => setShowTerminal((v) => !v)}
          >
            {showTerminal ? "Hide Terminal" : "Show Terminal"}
          </Button>
        </div>
      </div>

      {/* content */}
      <div className="flex-1 relative">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className={`w-full ${
              showTerminal ? "h-1/2" : "h-full"
            } border-none`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Waiting for server…
          </div>
        )}

        {showTerminal && (
          <pre className="absolute bottom-0 w-full h-1/2 bg-black text-green-400 p-2 overflow-auto text-xs font-mono">
            {terminalOutput}
          </pre>
        )}
      </div>
    </Card>
  );
}
