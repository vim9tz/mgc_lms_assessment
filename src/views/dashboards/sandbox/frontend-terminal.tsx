// rename to FrontendTerminal if you like
"use client";

import React, { useState } from "react";
import { Card, Typography, Button, CircularProgress } from "@mui/material";
import { PlayArrow } from "@mui/icons-material";

interface Props {
  previewUrl: string;
  terminalOutput: string;
  loading: boolean;
  // no runProject here — we auto-boot on mount
}

export default function FrontendTerminal({
  previewUrl,
  terminalOutput,
  loading,
}: Props) {
  const [showTerminal, setShowTerminal] = useState(false);

  return (
    <Card className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center border-b px-4 py-2">
        <Typography className="text-sm font-medium">Live Preview</Typography>
        {loading ? <CircularProgress size={16} /> : null}
        <Button
          size="small"
          variant="text"
          onClick={() => setShowTerminal((v) => !v)}
        >
          {showTerminal ? "Hide Logs" : "Show Logs"}
        </Button>
      </div>

      {/* Preview / Logs */}
      <div className="flex-1 relative">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className={`w-full ${showTerminal ? "h-1/2" : "h-full"} border-none`}
            title="Next.js Preview"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Waiting for Next.js…
          </div>
        )}

        {showTerminal && (
          <pre className="absolute bottom-0 w-full h-1/2 bg-black text-green-400 p-2 text-xs overflow-auto">
            {terminalOutput}
          </pre>
        )}
      </div>
    </Card>
  );
}
