'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PaneType = 'none' | 'left' | 'editor' | 'output';

interface ThreePaneLayoutProps {
  leftContent: React.ReactNode;
  rightTopContent: React.ReactNode;
  rightBottomContent: React.ReactNode;
  leftTitle?: string;
  rightTopTitle?: string;
  rightBottomTitle?: string;
}

export default function ThreePaneLayout({
  leftContent,
  rightTopContent,
  rightBottomContent,
  leftTitle = "Problem",
  rightTopTitle = "Editor",
  rightBottomTitle = "Output"
}: ThreePaneLayoutProps) {
  const [maximizedPanel, setMaximizedPanel] = useState<PaneType>('none');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);

  // Animation variants
  const panelVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const toggleMaximize = (panel: PaneType) => {
    setMaximizedPanel(prev => prev === panel ? 'none' : panel);
  };

  // Helper to render header controls
  const HeaderControls = ({ 
    panel, 
    isCollapsed, 
    onCollapse, 
    title 
  }: { 
    panel: PaneType, 
    isCollapsed?: boolean, 
    onCollapse?: () => void,
    title: string 
  }) => (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200 select-none">
      <div className="flex items-center gap-2">
         <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => toggleMaximize(panel)}
          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
          title={maximizedPanel === panel ? "Restore" : "Maximize"}
        >
          {maximizedPanel === panel ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        {onCollapse && maximizedPanel === 'none' && (
          <button 
            onClick={onCollapse}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
             {/* Icon logic depends on panel position */}
             {panel === 'left' && (isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />)}
             {panel === 'output' && (isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
          </button>
        )}
      </div>
    </div>
  );

  // If any panel is maximized, render it full screen
  if (maximizedPanel !== 'none') {
    return (
      <div className="fixed inset-0 z-50 bg-white p-4">
        <div className="h-full flex flex-col border border-slate-200 rounded-lg shadow-2xl overflow-hidden">
           {maximizedPanel === 'left' && (
             <>
               <HeaderControls panel="left" title={leftTitle} />
               <div className="flex-1 overflow-auto bg-white">{leftContent}</div>
             </>
           )}
           {maximizedPanel === 'editor' && (
             <>
               <HeaderControls panel="editor" title={rightTopTitle} />
               <div className="flex-1 overflow-hidden bg-white relative">{rightTopContent}</div>
             </>
           )}
           {maximizedPanel === 'output' && (
             <>
               <HeaderControls panel="output" title={rightBottomTitle} />
               <div className="flex-1 overflow-auto bg-white">{rightBottomContent}</div>
             </>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* LEFT PANEL */}
      <motion.div 
        layout
        initial={false}
        animate={{ 
          width: isLeftCollapsed ? '40px' : '35%',
          opacity: 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col border-r border-slate-200 bg-white h-full shrink-0 relative"
      >
        {!isLeftCollapsed ? (
          <>
            <HeaderControls 
              panel="left" 
              title={leftTitle} 
              isCollapsed={isLeftCollapsed}
              onCollapse={() => setIsLeftCollapsed(true)} 
            />
            <div className="flex-1 overflow-hidden">{leftContent}</div>
          </>
        ) : (
          <div className="flex flex-col items-center py-4 gap-4 h-full bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setIsLeftCollapsed(false)}>
             <div className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all">
                <ChevronRight size={20} className="text-slate-400" />
             </div>
             <div className="writing-vertical-lr rotate-180 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {leftTitle}
             </div>
          </div>
        )}
      </motion.div>

      {/* RIGHT SPLIT */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* EDITOR (TOP RIGHT) */}
        <motion.div 
          layout
          className="flex-1 flex flex-col bg-white min-h-0 relative z-10"
        >
           <HeaderControls panel="editor" title={rightTopTitle} />
           <div className="flex-1 relative overflow-hidden">{rightTopContent}</div>
        </motion.div>

        {/* OUTPUT (BOTTOM RIGHT) */}
        <motion.div 
           layout
           initial={false}
           animate={{ 
             height: isBottomCollapsed ? '40px' : '40%',
           }}
           transition={{ type: 'spring', stiffness: 300, damping: 30 }}
           className="border-t border-slate-200 bg-white shrink-0 flex flex-col overflow-hidden relative z-20 shadow-[-1px_-4px_15px_rgba(0,0,0,0.05)]"
        >
           {!isBottomCollapsed ? (
             <>
               <HeaderControls 
                 panel="output" 
                 title={rightBottomTitle} 
                 isCollapsed={isBottomCollapsed}
                 onCollapse={() => setIsBottomCollapsed(true)} 
               />
               <div className="flex-1 overflow-hidden relative">{rightBottomContent}</div>
             </>
           ) : (
              <div className="flex items-center justify-between px-4 h-10 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-t border-slate-200" onClick={() => setIsBottomCollapsed(false)}>
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{rightBottomTitle}</span>
                 <ChevronUp size={16} className="text-slate-400" />
              </div>
           )}
        </motion.div>

      </div>
    </div>
  );
}
