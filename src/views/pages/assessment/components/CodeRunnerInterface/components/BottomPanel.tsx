import React, { useState } from "react";
import { Box, Tabs, Tab, IconButton, Tooltip } from "@mui/material";
import { Terminal as TerminalIcon, CheckCircle as CheckCircleIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { Question, SubmissionResult } from "../types";
import OutputPanel from "./OutputPanel";

interface BottomPanelProps {
  question: Question | null;
  result: SubmissionResult | null;
  activeTab: number;
  onChangeTab: (val: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const BottomPanel: React.FC<BottomPanelProps> = ({
  question,
  result,
  activeTab,
  onChangeTab,
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <div 
        className={`bg-white border-t transition-all duration-300 flex flex-col ${
            collapsed ? 'h-[40px]' : 'h-[350px]'
        }`}
    >
      {/* HEADER: TABS + ACTIONS */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 bg-gray-50/80 backdrop-blur-sm h-[36px] shrink-0 select-none">
         <div className="flex items-center h-full">
            <Tabs
                value={activeTab}
                onChange={(_, v) => {
                    onChangeTab(v);
                    if (collapsed) onToggleCollapse(); // Auto expand
                }}
                textColor="primary"
                indicatorColor="primary"
                className="min-h-0 h-full"
                sx={{ 
                    minHeight: '100%',
                    '& .MuiTabs-indicator': { height: 2, borderRadius: '2px 2px 0 0' },
                    '& .MuiTab-root': { 
                        minHeight: '100%', 
                        py: 0,
                        px: 2,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#666',
                        '&.Mui-selected': { color: '#1976d2' }
                    }
                }}
            >
                <Tab 
                    icon={<TerminalIcon sx={{ fontSize: 14, mr: 0.8 }} />} 
                    iconPosition="start" 
                    label="Output" 
                />
                <Tab 
                    icon={<CheckCircleIcon sx={{ fontSize: 14, mr: 0.8, color: result?.status === 'passed' ? 'green' : (result?.status === 'failed' ? 'red' : undefined) }} />} 
                    iconPosition="start" 
                    label="Test Cases" 
                />
            </Tabs>
         </div>

         <div className="flex items-center gap-1">
             <Tooltip title={collapsed ? "Expand" : "Collapse"}>
                 <IconButton size="small" onClick={onToggleCollapse} sx={{ p: 0.5, color: '#666' }}>
                     {collapsed ? <KeyboardArrowUp sx={{ fontSize: 18 }} /> : <KeyboardArrowDown sx={{ fontSize: 18 }} />}
                 </IconButton>
             </Tooltip>
         </div>
      </div>

      {/* CONTENT */}
      {!collapsed && (
          <div className="flex-1 overflow-auto p-4 bg-white">
              {activeTab === 0 && question && (
                  <OutputPanel result={result} question={question} view="output" />
              )}
              {activeTab === 1 && question && (
                  <OutputPanel result={result} question={question} view="tests" />
              )}
          </div>
      )}
    </div>
  );
};

export default BottomPanel;
