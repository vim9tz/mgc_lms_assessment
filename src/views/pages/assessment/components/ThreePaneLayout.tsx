'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  GripVertical
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
  isBottomCollapsed?: boolean;
  onBottomCollapseChange?: (collapsed: boolean) => void;
  maximizedPanel?: PaneType;
  onMaximizePanelChange?: (panel: PaneType) => void;
  onLayoutReset?: () => void;
  leftWidth?: number;
  onLeftWidthChange?: (width: number) => void;
  rightTopHeight?: number;
  onRightTopHeightChange?: (height: number) => void;
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
  renderRightBottomHeader,
  isBottomCollapsed: controlledBottomCollapsed,
  onBottomCollapseChange,
  maximizedPanel: controlledMaximizedPanel,
  onMaximizePanelChange,
  onLayoutReset,
  leftWidth: controlledLeftWidth,
  onLeftWidthChange,
  rightTopHeight: controlledRightTopHeight,
  onRightTopHeightChange
}: ThreePaneLayoutProps) {
  const [internalMaximizedPanel, setInternalMaximizedPanel] = useState<PaneType>('none');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [internalBottomCollapsed, setInternalBottomCollapsed] = useState(false);
  const [internalLeftWidth, setInternalLeftWidth] = useState(40);
  const [internalRightTopHeight, setInternalRightTopHeight] = useState(55);

  const leftWidth = controlledLeftWidth !== undefined ? controlledLeftWidth : internalLeftWidth;
  const setLeftWidth = (width: number) => {
    if (onLeftWidthChange) onLeftWidthChange(width);
    else setInternalLeftWidth(width);
  };

  const rightTopHeight = controlledRightTopHeight !== undefined ? controlledRightTopHeight : internalRightTopHeight;
  const setRightTopHeight = (height: number) => {
    if (onRightTopHeightChange) onRightTopHeightChange(height);
    else setInternalRightTopHeight(height);
  };

  const maximizedPanel = controlledMaximizedPanel !== undefined ? controlledMaximizedPanel : internalMaximizedPanel;
  const setMaximizedPanel = (panel: PaneType | ((prev: PaneType) => PaneType)) => {
    if (onMaximizePanelChange) {
      if (typeof panel === 'function') {
        onMaximizePanelChange(panel(maximizedPanel));
      } else {
        onMaximizePanelChange(panel);
      }
    } else {
      setInternalMaximizedPanel(panel);
    }
    
    // If we are restoring, notify parent so it can adjust sizes if needed
    const nextPanel = typeof panel === 'function' ? panel(maximizedPanel) : panel;
    if (nextPanel === 'none' && onLayoutReset) {
      onLayoutReset();
    }
  };

  const isBottomCollapsed = controlledBottomCollapsed !== undefined ? controlledBottomCollapsed : internalBottomCollapsed;
  const setIsBottomCollapsed = (collapsed: boolean) => {
    if (onBottomCollapseChange) {
      onBottomCollapseChange(collapsed);
    } else {
      setInternalBottomCollapsed(collapsed);
    }
  };
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
    const isAnyMaximized = maximizedPanel !== 'none';
    const isAutoMinimized = isAnyMaximized && !isMaximized;
    const isSmall = isCollapsed || isAutoMinimized;
    
    const onMaximize = () => setMaximizedPanel(prev => prev === panel ? 'none' : panel);
    const onRestore = (e: React.MouseEvent) => {
      e.stopPropagation();
      setMaximizedPanel('none');
      if (isCollapsed) onCollapse();
    };
    
    // If we are small (manually collapsed or auto-minimized), show ultra-minimal UI
    if (isSmall) {
      const isNarrowStrip = panel === 'left' || maximizedPanel === 'left';
      
      const handleBackgroundClick = () => {
        if (isAutoMinimized) {
          onMaximize();
        } else if (isCollapsed) {
          onCollapse();
        }
      };

      if (isNarrowStrip) {
        return (
          <div 
            onClick={handleBackgroundClick}
            className="flex flex-col items-center justify-start py-6 w-full h-full bg-slate-50/80 border-r border-slate-200/60 cursor-pointer hover:bg-white transition-all gap-8 overflow-hidden select-none group"
          >
             <button 
                onClick={onRestore}
                title="Restore Workspace"
                className="p-1.5 bg-white rounded-md text-slate-400 hover:text-indigo-600 hover:scale-110 shadow-sm border border-slate-200/60 transition-all active:scale-90"
              >
                <WindowRestoreIcon size={12} />
              </button>
              <div className="[writing-mode:vertical-lr] flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-[0.2em] whitespace-nowrap transition-colors">
                  {defaultTitle}
                </span>
              </div>
          </div>
        );
      } else {
        return (
          <div 
            onClick={handleBackgroundClick}
            className="flex items-center justify-between px-4 h-10 bg-slate-50/80 border-b border-slate-200/60 cursor-pointer hover:bg-white transition-all select-none group"
          >
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-[0.2em]">
                {defaultTitle}
              </span>
            </div>
            <button 
              onClick={onRestore}
              title="Restore Workspace"
              className="p-1.5 bg-white rounded-md text-slate-400 hover:text-indigo-600 hover:scale-110 shadow-sm border border-slate-200/60 transition-all active:scale-90"
            >
              <WindowRestoreIcon size={12} />
            </button>
          </div>
        );
      }
    }

    if (customRender) {
      return customRender({ isMaximized, isCollapsed, onMaximize, onCollapse });
    }

    return (
      <div className={`flex items-center h-12 bg-white border-b border-gray-100 select-none shrink-0 overflow-hidden transition-all duration-300 ${isCollapsed && panel === 'left' ? 'justify-center px-0' : 'justify-between px-4'}`}>
        {(!isCollapsed || panel !== 'left') && (
          <div className="flex items-center gap-2 max-w-[70%]">
            <span className="font-bold text-slate-700 text-[10px] uppercase tracking-widest truncate">
              {isCollapsed && panel === 'output' ? `Expand ${defaultTitle}` : defaultTitle}
            </span>
          </div>
        )}
        
        <div className={`flex items-center gap-1 shrink-0 ${isCollapsed && panel === 'left' ? 'hidden' : ''}`}>
          <button 
            onClick={onMaximize} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <WindowRestoreIcon size={14} /> : <WindowMaximizeIcon size={14} />}
          </button>
          {maximizedPanel === 'none' && (
            <button 
              onClick={onCollapse} 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {panel === 'left' && (isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)}
              {panel === 'output' && (isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
            </button>
          )}
        </div>

        {isCollapsed && panel === 'left' && (
          <button 
            onClick={onCollapse} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    );
  };

  // Determine widths and heights for animation
  const getLayoutStyles = () => {
    const MIN_SIZE = '40px';
    
    if (maximizedPanel === 'left') return { 
      left: `calc(100% - ${MIN_SIZE})`, 
      right: MIN_SIZE, 
      top: '50%', 
      bottom: '50%' 
    };
    if (maximizedPanel === 'editor') return { 
      left: MIN_SIZE, 
      right: `calc(100% - ${MIN_SIZE})`, 
      top: `calc(100% - ${MIN_SIZE})`, 
      bottom: MIN_SIZE 
    };
    if (maximizedPanel === 'output') return { 
      left: MIN_SIZE, 
      right: `calc(100% - ${MIN_SIZE})`, 
      top: MIN_SIZE, 
      bottom: `calc(100% - ${MIN_SIZE})` 
    };
    
    return { 
      left: isLeftCollapsed ? MIN_SIZE : `${leftWidth}%`, 
      right: isLeftCollapsed ? `calc(100% - ${MIN_SIZE})` : `${100 - leftWidth}%`, 
      top: isBottomCollapsed ? `calc(100% - ${MIN_SIZE})` : `${rightTopHeight}%`, 
      bottom: isBottomCollapsed ? MIN_SIZE : `${100 - rightTopHeight}%` 
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
        <div className="flex-1 flex flex-col min-w-[0px] h-full overflow-hidden">
          {renderHeaderUI('left', leftTitle, isLeftCollapsed, () => setIsLeftCollapsed(!isLeftCollapsed), renderLeftHeader)}
          <motion.div 
            animate={{ 
              opacity: isLeftCollapsed || (maximizedPanel !== 'none' && maximizedPanel !== 'left') ? 0 : 1,
              x: (isLeftCollapsed || (maximizedPanel !== 'none' && maximizedPanel !== 'left')) ? -20 : 0
            }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            {leftContent}
          </motion.div>
        </div>
      </motion.div>

      {/* VERTICAL RESIZER */}
      <motion.div 
        animate={{ 
          opacity: maximizedPanel === 'none' && !isLeftCollapsed ? 1 : 0,
          pointerEvents: maximizedPanel === 'none' && !isLeftCollapsed ? 'auto' : 'none',
          width: maximizedPanel === 'none' && !isLeftCollapsed ? '10px' : '0px'
        }}
        onMouseDown={startResize('vertical')}
        className={`relative hover:bg-slate-50/50 cursor-col-resize transition-all z-30 shrink-0 flex items-center justify-center group ${isResizing === 'vertical' ? 'bg-slate-100/50' : ''}`}
      >
        <div className={`w-px h-full transition-all duration-300 ${isResizing === 'vertical' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'bg-slate-200/60 group-hover:bg-indigo-400/40'}`} />
        
        <div className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-10 bg-zinc-900 rounded-full 
          transition-all duration-300 flex items-center justify-center shadow-lg shadow-zinc-900/40
          ${isResizing === 'vertical' ? 'opacity-100 scale-y-110' : 'opacity-0 group-hover:opacity-100 scale-y-75 group-hover:scale-y-100'}
        `}>
          <GripVertical size={10} strokeWidth={3} className="text-white/90" />
        </div>
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
               animate={{ 
                 opacity: (maximizedPanel !== 'none' && maximizedPanel !== 'editor') ? 0 : 1,
                 pointerEvents: (maximizedPanel !== 'none' && maximizedPanel !== 'editor') ? 'none' : 'auto'
               }}
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
            height: maximizedPanel === 'none' && !isBottomCollapsed ? '10px' : '0px'
          }}
          onMouseDown={startResize('horizontal')}
          className={`relative hover:bg-slate-50/50 cursor-row-resize transition-all z-30 flex items-center justify-center group ${isResizing === 'horizontal' ? 'bg-slate-100/50' : ''}`}
        >
          <div className={`h-px w-full transition-all duration-300 ${isResizing === 'horizontal' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'bg-slate-200/60 group-hover:bg-indigo-400/40'}`} />
          
          <div className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-10 bg-zinc-900 rounded-full 
            transition-all duration-300 flex items-center justify-center shadow-lg shadow-zinc-900/40
            ${isResizing === 'horizontal' ? 'opacity-100 scale-x-110' : 'opacity-0 group-hover:opacity-100 scale-x-75 group-hover:scale-x-100'}
          `}>
            <GripVertical size={10} strokeWidth={3} className="text-white/90 rotate-90" />
          </div>
        </motion.div>

        {/* BOTTOM PANE (OUTPUT) */}
        <motion.div 
          animate={{ height: styles.bottom }}
          transition={TRANSITION}
          className="flex flex-col bg-white overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] relative z-10"
        >
          <div className="flex-1 flex flex-col min-h-[0px] h-full overflow-hidden">
            {renderHeaderUI('output', rightBottomTitle, isBottomCollapsed, () => setIsBottomCollapsed(!isBottomCollapsed), renderRightBottomHeader)}
            <motion.div 
              animate={{ 
                opacity: (isBottomCollapsed || (maximizedPanel !== 'none' && maximizedPanel !== 'output')) ? 0 : 1,
                pointerEvents: (isBottomCollapsed || (maximizedPanel !== 'none' && maximizedPanel !== 'output')) ? 'none' : 'auto',
                y: isBottomCollapsed ? 20 : 0
              }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
            >
              {rightBottomContent}
            </motion.div>
            
            {/* {isBottomCollapsed && maximizedPanel === 'none' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsBottomCollapsed(false)} 
                className="absolute inset-x-0 bottom-0 top-0 z-20 flex items-center px-8 cursor-pointer hover:bg-white/90 transition-all gap-8 group backdrop-blur-[2px]"
              >
                <div className="flex-1 h-px bg-slate-200 group-hover:bg-indigo-200 transition-colors" />
                <div className="flex items-center gap-3">
                   <ChevronUp size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                   <div className="text-[10px] font-black text-slate-400 group-hover:text-indigo-500 uppercase tracking-[0.2em] transition-colors">Expand {rightBottomTitle}</div>
                </div>
                <div className="flex-1 h-px bg-slate-200 group-hover:bg-indigo-200 transition-colors" />
              </motion.div>
            )} */}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
