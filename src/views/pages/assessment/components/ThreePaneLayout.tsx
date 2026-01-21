'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
} from 'lucide-react';

export const WindowMaximizeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M3 9h18" opacity="0.4" strokeWidth="2" />
  </svg>
);

export const WindowRestoreIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 9V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" strokeWidth="2" opacity="0.4" />
    <rect x="4" y="9" width="11" height="11" rx="3" />
    <path d="M4 13h11" opacity="0.4" strokeWidth="2" />
  </svg>
);

export type PaneType = 'none' | 'left' | 'editor' | 'output';

interface ThreePaneLayoutProps {
  leftContent: React.ReactNode;
  rightTopContent: React.ReactNode;
  rightBottomContent: React.ReactNode;
  leftTitle?: string;
  rightTopTitle?: string;
  rightBottomTitle?: string;
  renderLeftHeader?: (props: { isMaximized: boolean; isCollapsed: boolean; onMaximize: () => void; onCollapse: () => void }) => React.ReactNode;
  renderRightTopHeader?: (props: { isMaximized: boolean; isCollapsed: boolean; onMaximize: () => void; onCollapse: () => void }) => React.ReactNode;
  renderRightBottomHeader?: (props: { isMaximized: boolean; isCollapsed: boolean; onMaximize: () => void; onCollapse: () => void }) => React.ReactNode;
}

const TRANSITION: Transition = { 
  type: 'spring', 
  stiffness: 350, 
  damping: 32, 
  mass: 0.8,
  restDelta: 0.001 
};

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
  const [maximizedPanel, setMaximizedPanel] = useState<PaneType>('none');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const [rightTopHeight, setRightTopHeight] = useState(55);
  const [isResizing, setIsResizing] = useState<'vertical' | 'horizontal' | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = (type: 'vertical' | 'horizontal') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(type);
  };

  const stopResize = useCallback(() => setIsResizing(null), []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isResizing === 'vertical') {
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth >= 10 && newWidth <= 90) setLeftWidth(newWidth);
    } else {
      const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      if (newHeight >= 10 && newHeight <= 90) setRightTopHeight(newHeight);
    }
  }, [isResizing]);

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

  const renderHeaderUI = (
    panel: PaneType,
    defaultTitle: string,
    isCollapsed: boolean,
    onCollapse: () => void,
    customRender?: (props: any) => React.ReactNode
  ) => {
    const isMaximized = maximizedPanel === panel;
    const onMaximize = () => setMaximizedPanel(prev => prev === panel ? 'none' : panel);
    
    // If we are collapsed, we don't show the custom header because it's usually too wide
    if (customRender && !isCollapsed && maximizedPanel === 'none' || (customRender && isMaximized)) {
      return customRender({ isMaximized, isCollapsed, onMaximize, onCollapse });
    }

    return (
      <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100 select-none shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 max-w-[70%]">
          <span className="font-bold text-slate-700 text-xs uppercase tracking-widest truncate">{defaultTitle}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={onMaximize} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
          >
            {isMaximized ? <WindowRestoreIcon size={16} /> : <WindowMaximizeIcon size={16} />}
          </button>
          {maximizedPanel === 'none' && (
            <button 
              onClick={onCollapse} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
            >
              {panel === 'left' && (isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)}
              {panel === 'output' && (isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Determine widths and heights for animation
  const getLayoutStyles = () => {
    if (maximizedPanel === 'left') return { left: '100%', right: '0%', top: '100%', bottom: '0%' };
    if (maximizedPanel === 'editor') return { left: '0%', right: '100%', top: '100%', bottom: '0%' };
    if (maximizedPanel === 'output') return { left: '0%', right: '100%', top: '0%', bottom: '100%' };
    
    return { 
      left: isLeftCollapsed ? '48px' : `${leftWidth}%`, 
      right: isLeftCollapsed ? 'calc(100% - 48px)' : `${100 - leftWidth}%`, 
      top: isBottomCollapsed ? 'calc(100% - 48px)' : `${rightTopHeight}%`, 
      bottom: isBottomCollapsed ? '48px' : `${100 - rightTopHeight}%` 
    };
  };

  const styles = getLayoutStyles();

  return (
    <div ref={containerRef} className="flex h-screen w-full bg-[#f8fafc] overflow-hidden relative">
      
      {/* LEFT PANE */}
      <motion.div 
        animate={{ width: styles.left }}
        initial={false}
        transition={TRANSITION}
        className="flex flex-col h-full bg-white relative overflow-hidden shrink-0 border-r border-slate-200/60 z-10"
      >
        <div className="flex-1 flex flex-col min-w-[48px] h-full overflow-hidden">
          {renderHeaderUI('left', leftTitle, isLeftCollapsed, () => setIsLeftCollapsed(!isLeftCollapsed), renderLeftHeader)}
          <motion.div 
            animate={{ 
              opacity: isLeftCollapsed || (maximizedPanel !== 'none' && maximizedPanel !== 'left') ? 0 : 1,
              x: isLeftCollapsed ? -20 : 0
            }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            {leftContent}
          </motion.div>
          
          {isLeftCollapsed && maximizedPanel === 'none' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsLeftCollapsed(false)} 
              className="absolute inset-x-0 bottom-0 top-12 flex flex-col items-center py-6 cursor-pointer hover:bg-slate-50 transition-colors gap-6 group"
            >
              <div className="w-1.5 h-32 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors" />
              <div className="[writing-mode:vertical-lr] text-[10px] font-black text-slate-300 group-hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">Expand {leftTitle}</div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* VERTICAL RESIZER */}
      <motion.div 
        animate={{ 
          opacity: maximizedPanel === 'none' && !isLeftCollapsed ? 1 : 0,
          pointerEvents: maximizedPanel === 'none' && !isLeftCollapsed ? 'auto' : 'none',
          width: maximizedPanel === 'none' && !isLeftCollapsed ? '4px' : '0px'
        }}
        onMouseDown={startResize('vertical')}
        className="bg-transparent hover:bg-indigo-500/10 cursor-col-resize transition-all z-20 shrink-0 flex items-center justify-center group"
      >
        <div className="w-0.5 h-16 bg-slate-200 rounded-full group-hover:bg-indigo-400/50 transition-all group-hover:scale-x-150" />
      </motion.div>

      {/* RIGHT CONTAINER */}
      <motion.div 
        animate={{ width: styles.right }}
        initial={false}
        transition={TRANSITION}
        className="flex flex-col h-full overflow-hidden shrink-0 relative z-10"
      >
        {/* TOP PANE (EDITOR) */}
        <motion.div 
          animate={{ height: styles.top }}
          transition={TRANSITION}
          className="flex flex-col bg-white overflow-hidden border-b border-slate-200/60 relative z-10"
        >
          <div className="flex-1 flex flex-col min-h-[0px] h-full overflow-hidden">
             {renderHeaderUI('editor', rightTopTitle, false, () => {}, renderRightTopHeader)}
             <motion.div 
               animate={{ opacity: maximizedPanel === 'output' ? 0 : 1 }}
               transition={{ duration: 0.2 }}
               className="flex-1 overflow-hidden relative"
             >
                {rightTopContent}
             </motion.div>
          </div>
        </motion.div>

        {/* HORIZONTAL RESIZER */}
        <motion.div 
          animate={{ 
            opacity: maximizedPanel === 'none' && !isBottomCollapsed ? 1 : 0,
            pointerEvents: maximizedPanel === 'none' && !isBottomCollapsed ? 'auto' : 'none',
            height: maximizedPanel === 'none' && !isBottomCollapsed ? '4px' : '0px'
          }}
          onMouseDown={startResize('horizontal')}
          className="bg-transparent hover:bg-indigo-500/10 cursor-row-resize transition-all z-20 flex items-center justify-center group"
        >
          <div className="h-0.5 w-32 bg-slate-200 rounded-full group-hover:bg-indigo-400/50 transition-all group-hover:scale-y-150" />
        </motion.div>

        {/* BOTTOM PANE (OUTPUT) */}
        <motion.div 
          animate={{ height: styles.bottom }}
          transition={TRANSITION}
          className="flex flex-col bg-white overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] relative z-10"
        >
          <div className="flex-1 flex flex-col min-h-[48px] h-full overflow-hidden">
            {renderHeaderUI('output', rightBottomTitle, isBottomCollapsed, () => setIsBottomCollapsed(!isBottomCollapsed), renderRightBottomHeader)}
            <motion.div 
              animate={{ 
                opacity: isBottomCollapsed || maximizedPanel === 'editor' ? 0 : 1,
                y: isBottomCollapsed ? 20 : 0
              }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
            >
              {rightBottomContent}
            </motion.div>
            
            {isBottomCollapsed && maximizedPanel === 'none' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsBottomCollapsed(false)} 
                className="absolute inset-0 top-12 flex items-center px-8 cursor-pointer hover:bg-slate-50 transition-colors gap-8 group"
              >
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors" />
                <div className="text-[10px] font-black text-slate-300 group-hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">Expand {rightBottomTitle}</div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
