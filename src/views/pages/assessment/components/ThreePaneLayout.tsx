'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  GripVertical,
  GripHorizontal
} from 'lucide-react';

export type PaneType = 'none' | 'left' | 'editor' | 'output';

interface ThreePaneLayoutProps {
  leftContent: React.ReactNode;
  rightTopContent: React.ReactNode;
  rightBottomContent: React.ReactNode;
  leftTitle?: string;
  rightTopTitle?: string;
  rightBottomTitle?: string;
  // Custom header render functions that receive layout controls
  renderLeftHeader?: (props: { isMaximized: boolean; isCollapsed: boolean; onMaximize: () => void; onCollapse: () => void }) => React.ReactNode;
  renderRightTopHeader?: (props: { isMaximized: boolean; isCollapsed: boolean; onMaximize: () => void; onCollapse: () => void }) => React.ReactNode;
  renderRightBottomHeader?: (props: { isMaximized: boolean; isCollapsed: boolean; onMaximize: () => void; onCollapse: () => void }) => React.ReactNode;
}

export default function ThreePaneLayout({
  leftContent,
  rightTopContent,
  rightBottomContent,
  leftTitle = "Problem",
  rightTopTitle = "Editor",
  rightBottomTitle = "Output",
  renderLeftHeader,
  renderRightTopHeader,
  renderRightBottomHeader
}: ThreePaneLayoutProps) {
  // --- STATE ---
  const [maximizedPanel, setMaximizedPanel] = useState<PaneType>('none');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);

  // Resize State
  const [leftWidth, setLeftWidth] = useState(40); // Percentage
  const [rightTopHeight, setRightTopHeight] = useState(60); // Percentage
  const [isResizing, setIsResizing] = useState<'vertical' | 'horizontal' | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // --- RESIZE HANDLERS ---
  const startVerticalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('vertical');
  };

  const startHorizontalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('horizontal');
  };

  const stopResize = useCallback(() => {
    setIsResizing(null);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();

        if (isResizing === 'vertical') {
            // Calculate new left width percentage
            const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            // Constraints: Min 20%, Max 80%
            if (newLeftWidth >= 20 && newLeftWidth <= 80) {
                setLeftWidth(newLeftWidth);
            }
        } else if (isResizing === 'horizontal') {
            const newTopHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
             if (newTopHeight >= 20 && newTopHeight <= 80) {
                setRightTopHeight(newTopHeight);
            }
        }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
        document.body.style.cursor = isResizing === 'vertical' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    } else {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResize]);


  // --- HEADER COMPONENT ---
  const renderHeader = (
    panel: PaneType,
    defaultTitle: string,
    isCollapsed: boolean,
    onCollapse: () => void,
    customRender?: (props: any) => React.ReactNode
  ) => {
     const isMaximized = maximizedPanel === panel;
     const onMaximize = () => setMaximizedPanel(prev => prev === panel ? 'none' : panel);
     
     if (customRender) {
         return customRender({ isMaximized, isCollapsed, onMaximize, onCollapse });
     }

     // Default Header
     return (
        <div className="flex items-center justify-between px-4 h-10 bg-gray-50 border-b border-gray-200 select-none shrink-0">
          <div className="flex items-center gap-2">
             <span className="font-bold text-gray-700 text-xs uppercase tracking-wide">{defaultTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onMaximize}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-500 transition-colors"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            
            {(maximizedPanel === 'none') && (
              <button 
                onClick={onCollapse}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                 {panel === 'left' && (isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />)}
                 {panel === 'output' && (isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </button>
            )}
          </div>
        </div>
     );
  };

  // --- MAXIMIZED VIEW ---
  // --- ANIMATION VARIANTS ---
  const isMaximized = maximizedPanel !== 'none';
  const SMOOTH_TRANSITION = { type: "spring", stiffness: 250, damping: 25 } as const;

  // --- SPLIT LAYOUT ---
  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden bg-white font-sans">
      
      {/* LEFT PANEL */}
      <motion.div 
        layout
        initial={false}
        animate={{ 
          width: maximizedPanel === 'left' ? '100%' : (maximizedPanel !== 'none' ? '0%' : (isLeftCollapsed ? '40px' : `${leftWidth}%`)),
          opacity: 1
        }}
        transition={SMOOTH_TRANSITION}
        className="flex flex-col bg-white h-full relative z-10 border-r border-gray-200"
        style={{ overflow: 'hidden' }}
      >
        {(!isLeftCollapsed || maximizedPanel === 'left') ? (
          <>
            {renderHeader('left', leftTitle, isLeftCollapsed, () => setIsLeftCollapsed(true), renderLeftHeader)}
            <div className="flex-1 overflow-hidden relative min-h-0">{leftContent}</div>
          </>
        ) : (
          <div className="flex flex-col items-center py-4 gap-4 h-full bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setIsLeftCollapsed(false)}>
             <div className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all">
                <ChevronRight size={20} className="text-gray-400" />
             </div>
             <div className="writing-vertical-lr rotate-180 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {leftTitle}
             </div>
          </div>
        )}
      </motion.div>

      {/* RESIZER VERTICAL (Left <-> Right) */}
      {!isLeftCollapsed && !isMaximized && (
          <div
            className="w-1.5 hover:w-2 active:w-2 cursor-col-resize z-20 flex items-center justify-center hover:bg-blue-400/20 transition-all -ml-[3px]"
            onMouseDown={startVerticalResize}
          >
              <div className="h-8 w-1 rounded-full bg-gray-200" />
          </div>
      )}

      {/* RIGHT PANEL (Editor + Output) */}
      <motion.div 
        layout
        animate={{
            width: maximizedPanel === 'left' ? '0%' : (maximizedPanel !== 'none' ? '100%' : `${100 - leftWidth}%`)
        }}
        transition={SMOOTH_TRANSITION}
        className="flex-1 flex flex-col h-full min-w-0 bg-white"
        style={{ overflow: 'hidden' }}
      >
        
        {/* EDITOR (TOP RIGHT) */}
        <motion.div 
          layout
          initial={false}
          animate={{
             height: maximizedPanel === 'editor' ? '100%' : (maximizedPanel === 'output' ? '0%' : (isBottomCollapsed ? 'calc(100% - 40px)' : `${rightTopHeight}%`))
          }}
          transition={SMOOTH_TRANSITION}
          className="flex flex-col bg-white min-h-0 relative z-10"
          style={{ overflow: 'hidden' }}
        >
           {renderHeader('editor', rightTopTitle, false, () => {}, renderRightTopHeader)}
           <div className="flex-1 relative overflow-hidden h-full">{rightTopContent}</div>
        </motion.div>

         {/* RESIZER HORIZONTAL (Editor <-> Output) */}
         {!isBottomCollapsed && !isMaximized && (
            <div 
                className="h-1.5 hover:h-2 active:h-2 cursor-row-resize z-20 flex items-center justify-center hover:bg-blue-400/20 transition-all -mt-[3px]"
                onMouseDown={startHorizontalResize}
            >
                <div className="w-8 h-1 rounded-full bg-gray-200" />
            </div>
         )}

        {/* OUTPUT (BOTTOM RIGHT) */}
        <motion.div 
           layout
           initial={false}
           animate={{ 
             flex: (maximizedPanel === 'output') ? '1 1 0%' : (maximizedPanel === 'editor' ? '0 0 auto' : (isBottomCollapsed ? '0 0 auto' : '1 1 0%')),
             height: (maximizedPanel === 'editor') ? '0px' : 'auto'
           }}
           transition={SMOOTH_TRANSITION}
           className={`bg-white flex flex-col overflow-hidden relative z-0 border-t border-gray-200 ${isBottomCollapsed && maximizedPanel !== 'output' ? 'h-[40px]' : ''}`}
        >
           {(!isBottomCollapsed || maximizedPanel === 'output') ? (
             <>
               {renderHeader('output', rightBottomTitle, isBottomCollapsed, () => setIsBottomCollapsed(true), renderRightBottomHeader)}
               <div className="flex-1 overflow-hidden relative h-full">{rightBottomContent}</div>
             </>
           ) : (
              <div className="flex items-center justify-between px-4 h-10 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setIsBottomCollapsed(false)}>
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{rightBottomTitle}</span>
                 <ChevronUp size={16} className="text-gray-400" />
              </div>
           )}
        </motion.div>

      </motion.div>
    </div>
  );
}

