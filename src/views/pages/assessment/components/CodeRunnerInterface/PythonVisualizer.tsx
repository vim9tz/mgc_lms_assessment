"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  CircularProgress, 
  Slider, 
  Typography, 
  Paper, 
  Grid, 
  IconButton,
  Alert,
  Chip,
  Tooltip,
  Divider,
  Collapse
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  BugReport as BugIcon,
  Speed,
  Refresh,
  KeyboardArrowDown,
  KeyboardArrowRight
} from '@mui/icons-material';
import types from 'prop-types'; // Note: pyodide execution allows importing types in python, not JS here, but we are in TSX.

// --- TYPES ---

interface TraceStep {
  line: number;
  event: 'call' | 'line' | 'return' | 'exception';
  func_name: string;
  stack: { name: string; line: number }[];
  locals: Record<string, any>;
  globals: Record<string, any>;
  stdout: string;
}

interface PythonVisualizerProps {
  code: string;
  input?: string; 
  onChangeCode?: (newCode: string) => void;
}

declare global {
  interface Window {
    loadPyodide: any;
  }
}

// --- TRACER SCRIPT (ENHANCED) ---
const TRACER_SCRIPT = `
import sys
import json
import io
import inspect
import types

class TraceRunner:
    def __init__(self, max_steps=2000):
        self.trace_data = []
        self.stdout_buffer = io.StringIO()
        self.max_steps = max_steps
        self.step_count = 0
        
    def serialize_obj(self, obj, depth=0):
        if depth > 4: return {"type": "ref", "value": "..."}
        
        try:
            t_name = type(obj).__name__
            
            # Primitives
            if isinstance(obj, (int, float, bool, type(None))):
                return {"type": "primitive", "value": obj}
            elif isinstance(obj, str):
                return {"type": "string", "value": obj}
            
            # Collections
            elif isinstance(obj, list):
                if depth > 2: return {"type": "list", "value": "[...]"}
                return {"type": "list", "value": [self.serialize_obj(i, depth+1) for i in obj]}
            elif isinstance(obj, tuple):
                 if depth > 2: return {"type": "tuple", "value": "(...)"}
                 return {"type": "tuple", "value": [self.serialize_obj(i, depth+1) for i in obj]}
            elif isinstance(obj, set):
                 if depth > 2: return {"type": "set", "value": "{...}"}
                 return {"type": "set", "value": [self.serialize_obj(i, depth+1) for i in list(obj)]}
            elif isinstance(obj, dict):
                 if depth > 2: return {"type": "dict", "value": "{...}"}
                 return {"type": "dict", "value": [[self.serialize_obj(k, depth+1), self.serialize_obj(v, depth+1)] for k, v in obj.items()]}
            
            # Functions & Methods
            elif isinstance(obj, (types.FunctionType, types.MethodType)):
                 return {"type": "function", "value": f"function {obj.__name__}()"}
            
            # Classes
            elif isinstance(obj, type):
                 return {"type": "class", "value": f"class {obj.__name__}"}
            
            # Custom Objects (Instances)
            elif hasattr(obj, '__dict__'):
                 if depth > 2: return {"type": "instance", "class": t_name, "value": "{...}"}
                 attrs = {k: self.serialize_obj(v, depth+1) for k, v in obj.__dict__.items() if not k.startswith('__')}
                 return {"type": "instance", "class": t_name, "value": attrs}
            
            else:
                r = repr(obj)
                if ' object at 0x' in r:
                    r = r.split(' at 0x')[0] + '>'
                return {"type": "object", "value": r}

        except Exception as e:
             return {"type": "error", "value": f"<serialize_err: {str(e)}>"}

    def trace_lines(self, frame, event, arg):
        if event not in ['line', 'return', 'exception', 'call']: return
        
        # Safety Check
        self.step_count += 1
        if self.step_count > self.max_steps:
            raise Exception(f"Step limit exceeded ({self.max_steps}). Infinite loop detected?")

        co = frame.f_code
        if co.co_filename.startswith('<') and co.co_filename != '<string>': return 

        safe_locals = {k: self.serialize_obj(v) for k, v in frame.f_locals.items() if not k.startswith('__')}
        safe_globals = {k: self.serialize_obj(v) for k, v in frame.f_globals.items() if not k.startswith('__') and k not in ['TraceRunner', 'sys', 'json', 'io', 'runner', 'inspect']}
        
        # Capture Stack
        stack = []
        curr = frame
        while curr:
             if curr.f_code.co_filename == '<string>':
                 stack.append({"name": curr.f_code.co_name, "line": curr.f_lineno})
             curr = curr.f_back
        stack.reverse()

        step = {
            "line": frame.f_lineno,
            "event": event,
            "func_name": co.co_name,
            "stack": stack,
            "locals": safe_locals,
            "globals": safe_globals,
            "stdout": self.stdout_buffer.getvalue()
        }
        self.trace_data.append(step)
        return self.trace_lines

    def run(self, user_code):
        old_stdout = sys.stdout
        sys.stdout = self.stdout_buffer
        self.trace_data = [] # Reset
        self.step_count = 0
        self.stdout_buffer.seek(0)
        self.stdout_buffer.truncate(0)
        
        try:
            sys.settrace(self.trace_lines)
            try:
                exec(user_code, {})
            except Exception as e:
                self.trace_data.append({
                    "line": -1,
                    "event": "exception",
                    "func_name": "<module>",
                    "stack": [],
                    "locals": {},
                    "globals": {},
                    "stdout": self.stdout_buffer.getvalue() + f"\\nException: {type(e).__name__}: {str(e)}"
                })
            finally:
                sys.settrace(None)
        finally:
            sys.stdout = old_stdout
            
        return json.dumps(self.trace_data)

runner = TraceRunner(max_steps=2000)
`;

// --- UI COMPONENTS ---

const EditableValue: React.FC<{ value: any; name?: string; onEdit?: (newVal: string) => void }> = ({ value, name, onEdit }) => {
    const [editing, setEditing] = useState(false);
    const [tempVal, setTempVal] = useState(String(value.value));
    const isPrimitive = ['primitive', 'string'].includes(value?.type);

    const handleCommit = () => {
        setEditing(false);
        if (onEdit && tempVal !== String(value.value)) { 
            onEdit(tempVal);
        }
    };

    if (editing) {
        return (
            <input 
                autoFocus
                value={tempVal}
                onChange={(e) => setTempVal(e.target.value)}
                onBlur={handleCommit}
                onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                className="bg-input text-foreground text-xs px-1 rounded border border-primary outline-none min-w-[40px]"
                style={{ width: `${Math.max(tempVal.length, 3)}ch`, maxWidth: '100%' }}
            />
        );
    }

    const handleClick = () => {
        if (isPrimitive && onEdit) {
            setTempVal(String(value.value));
            setEditing(true);
        }
    };

    return (
        <span 
             onClick={handleClick} 
             className={`${isPrimitive && onEdit ? 'cursor-pointer hover:bg-muted rounded px-1 -mx-1 transition-colors relative group' : ''}`}
        >
            <HeapValue data={value} />
            {isPrimitive && onEdit && (
                <span className="absolute -top-4 left-0 bg-primary text-primary-foreground text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Click to Edit
                </span>
            )}
        </span>
    );
};

const HeapValue: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return <span>-</span>;
    
    if (data.type === 'primitive') return <span className="text-chart-3 font-mono">{String(data.value)}</span>;
    if (data.type === 'string') return <span className="text-chart-2 font-mono">"{data.value}"</span>;
    if (data.type === 'function') return <span className="text-chart-5 font-mono italic">{data.value}</span>;
    if (data.type === 'class') return <span className="text-chart-1 font-bold">{data.value}</span>;
    if (data.type === 'object') return <span className="text-muted-foreground italic">{data.value}</span>;
    
    if (data.type === 'instance') {
        const entries = Object.entries(data.value);
        if (entries.length === 0) return <span className="text-muted-foreground">{data.class} {'{}'}</span>;
        
        return (
            <div className="flex flex-col gap-1 item-start">
                 <span className="text-xs font-bold text-chart-1">{data.class}</span>
                 <div className="border border-border bg-muted/30 rounded p-1.5 pl-2 flex flex-col gap-1">
                     {entries.map(([k, v]: any, i: number) => (
                         <div key={i} className="flex gap-2 text-sm">
                              <span className="text-muted-foreground font-mono text-xs">{k}:</span>
                              <HeapValue data={v} />
                         </div>
                     ))}
                 </div>
            </div>
        );
    }
    
    if (data.type === 'list' || data.type === 'tuple' || data.type === 'set') {
        return (
            <div className="flex flex-wrap gap-1 items-center">
                <div className={`flex items-center border ${data.type === 'list' ? 'border-chart-1/30 bg-chart-1/10' : 'border-chart-4/30 bg-chart-4/10'} rounded overflow-hidden`}>
                    {data.value.map((item: any, i: number) => (
                        <div key={i} className="px-2 py-0.5 border-r border-border/50 last:border-0 text-sm">
                            <HeapValue data={item} />
                        </div>
                    ))}
                    {data.value.length === 0 && <span className="px-2 py-0.5 text-xs text-muted-foreground">empty</span>}
                </div>
            </div>
        );
    }

    if (data.type === 'dict') {
         return (
            <div className="flex flex-col gap-1">
                 <div className="border border-chart-3/30 bg-chart-3/10 rounded p-1">
                     {data.value.map(([k, v]: any, i: number) => (
                         <div key={i} className="flex gap-2 text-sm items-center">
                              <span className="font-mono text-muted-foreground"><HeapValue data={k} />:</span>
                              <HeapValue data={v} />
                         </div>
                     ))}
                     {data.value.length === 0 && <span className="text-xs text-muted-foreground px-1">empty</span>}
                 </div>
            </div>
         );
    }

    return <span>{String(data.value)}</span>;
};


const PythonVisualizer: React.FC<PythonVisualizerProps> = ({ code, onChangeCode }) => {
  const [loading, setLoading] = useState(true);
  const [pyodide, setPyodide] = useState<any>(null);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initStatus, setInitStatus] = useState("Initializing...");
  const [speed, setSpeed] = useState(800);
  
  // LIVE MODE & INPUT STATE
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const [stdIn, setStdIn] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false); 
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // Fixed Type

  // Sync prop code
  useEffect(() => { if (!isLiveMode) setLocalCode(code); }, [code, isLiveMode]);

  // Auto-detect input requirement
  useEffect(() => {
      if ((code || "").includes('input(') || (localCode || "").includes('input(')) {
          setShowInput(true);
      }
  }, [code, localCode]);

  // Code Change Handler
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateCode(e.target.value);
  };

  const updateCode = (newVal: string) => {
      setLocalCode(newVal);
      if (error) setError(null);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
          if (onChangeCode) onChangeCode(newVal);
      }, 800);
  };

  const handleInputChange = (val: string) => {
      setStdIn(val);
  };

  const handleVarEdit = (name: string, newVal: string) => {
      const regex = new RegExp(`^(\\s*)${name}\\s*=\\s*.*$`, 'm'); 
      const match = localCode.match(regex);
      
      if (match) {
          const indentation = match[1] || '';
          const newCode = localCode.replace(regex, `${indentation}${name} = ${newVal}`);
          setIsLiveMode(true); 
          updateCode(newCode);
      }
  };

  // Playback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>; // Fixed Type
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < trace.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, trace.length, speed]);

  // Load Engine
  useEffect(() => {
    let mounted = true;
    const loadEngine = async () => {
      try {
        if (window.loadPyodide) {
           await initPyodide(window.loadPyodide);
           return;
        }
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        script.async = true;
        
        script.onload = async () => {
            // @ts-ignore
            await initPyodide(window.loadPyodide);
        };
        script.onerror = () => setError("Failed to load Python Engine.");
        document.body.appendChild(script);
      } catch (e) { setError("Critical Error."); }
    };

    const initPyodide = async (loader: any) => {
        try {
            setInitStatus("Loading Engine...");
            const py = await loader({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
            await py.loadPackage("micropip"); 
            if (mounted) {
                setPyodide(py);
                setLoading(false);
            }
        } catch (e) { setError("Init Failed"); }
    };
    loadEngine();
    return () => { mounted = false; };
  }, []);

  // Run Trace
  useEffect(() => {
    if (!pyodide || !code) return;
    const generateTrace = async () => {
      try {
        setError(null);

        // Reset imports in case
        await pyodide.runPythonAsync(TRACER_SCRIPT);
        pyodide.globals.set("user_code_str", localCode || code);
        pyodide.globals.set("user_input_str", stdIn); 
        await pyodide.runPythonAsync(`import sys; import io; sys.stdin = io.StringIO(user_input_str)`);
        
        const jsonResult = await pyodide.runPythonAsync(`runner.run(user_code_str)`);
        const parsedTrace = JSON.parse(jsonResult);
        
        if (!Array.isArray(parsedTrace) || parsedTrace.length === 0) {
             setTrace([{ line: 0, event: 'return', func_name: '<module>', stack: [], locals: {}, globals: {}, stdout: "No output." }]);
        } else {
            // Check for EOFError (Input needed)
            const last = parsedTrace[parsedTrace.length - 1];
            
            // Check for EOFError string or exception
            if (last && last.event === 'exception' && String(last.stdout).includes('EOFError')) {
                 // Mark as waiting
                 setWaitingForInput(true);
                 if (!showInput) setShowInput(true);

                 // Show the partial trace up to the pause
                 const pausedStep = { ...last, event: 'line' as const };
                 const finalTrace = [...parsedTrace.slice(0, -1), pausedStep];
                 setTrace(finalTrace);
                 setCurrentStep(finalTrace.length - 1);
            } else {
                 setWaitingForInput(false);
                 setTrace(parsedTrace);
                 if (currentStep >= parsedTrace.length) {
                    setCurrentStep(Math.max(0, parsedTrace.length - 1));
                 }
            }
        }
      } catch (err: any) {
        // Fallback for uncaught pyodide crash
        if (err.message && err.message.includes("EOFError")) {
             setShowInput(true);
             setWaitingForInput(true);
        } else {
             console.error(err);
             setError("Execution Failed: " + err.message);
        }
      }
    };
    
    // Debounce to prevent rapid fire
    const timer = setTimeout(generateTrace, 500);
    return () => clearTimeout(timer);

  }, [pyodide, code, localCode, stdIn]); // Dependencies

  if (loading) return (
    <Box 
      height="100%" 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      className="bg-background text-foreground"
      gap={3}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <CircularProgress size={50} thickness={4} sx={{ color: 'var(--primary)', position: 'relative' }} />
      </div>
      <Box textAlign="center">
        <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary', mb: 1 }}>
          Initializing Python Engine
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {initStatus}
        </Typography>
      </Box>
    </Box>
  );

  const currentData = trace[currentStep] || {};

  const handleLineClick = (lineIndex: number) => {
      const targetLine = lineIndex + 1;
      let nextStepIndex = trace.findIndex((step, idx) => idx > currentStep && step.line === targetLine);
      if (nextStepIndex === -1) {
          nextStepIndex = trace.findIndex((step) => step.line === targetLine);
      }
      if (nextStepIndex !== -1) {
          setCurrentStep(nextStepIndex);
      }
  };

  return (
    <Box display="flex" flexDirection="column" height="100%" className="bg-background text-foreground">
        
        {/* ERROR BANNER */}
        {error && (
            <Alert 
                severity="error" 
                onClose={() => setError(null)}
                sx={{ 
                    borderRadius: 0, 
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    color: '#fca5a5',
                    '& .MuiAlert-icon': { color: '#f87171' }
                }}
            >
                {error}
            </Alert>
        )}

        {/* TOOLBAR */}
        <Box p={1.5} className="border-b border-border bg-card" display="flex" alignItems="center" gap={2}>
             <IconButton onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} sx={{ color: 'text.primary' }}>
                 <SkipPrevious />
             </IconButton>
             
             <IconButton onClick={() => setIsPlaying(!isPlaying)} sx={{ color: 'primary.main', bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }} className="bg-primary/10 hover:bg-primary/20">
                 {isPlaying ? <Pause /> : <PlayArrow />}
             </IconButton>
             
             <IconButton onClick={() => setCurrentStep(Math.min(trace.length - 1, currentStep + 1))} disabled={currentStep >= trace.length - 1} sx={{ color: 'text.primary' }}>
                 <SkipNext />
             </IconButton>

             <Box flex={1} mx={2}>
                <Slider 
                   value={currentStep} 
                   max={Math.max(0, trace.length - 1)} 
                   onChange={(_, v) => setCurrentStep(v as number)}
                   sx={{ color: 'primary.main', height: 6 }}
                />
             </Box>
             
             <Box display="flex" alignItems="center" gap={2} mr={2}>
                 <Box display="flex" alignItems="center" gap={1} sx={{ opacity: isLiveMode ? 1 : 0.5, transition: '0.2s' }}>
                     <Refresh sx={{ fontSize: 16, color: isLiveMode ? 'success.main' : 'text.disabled', animation: isLiveMode ? 'spin 2s linear infinite' : 'none' }} />
                     <Typography variant="caption" sx={{ color: isLiveMode ? 'success.main' : 'text.disabled', fontWeight: 700 }}>LIVE RUN</Typography>
                     <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                 </Box>

                 <Tooltip title="Toggle Standard Input Box">
                    <Chip 
                        label="INPUT" 
                        size="small" 
                        color={stdIn ? "info" : "default"} 
                        onClick={() => setShowInput(!showInput)} 
                        sx={{ cursor: 'pointer', fontWeight: 700, height: 24 }} 
                    />
                 </Tooltip>

                 <Tooltip title="Allow editing code to immediately re-run simulation">
                    <Chip 
                        label={isLiveMode ? "EDITING" : "Edit Code"} 
                        size="small" 
                        color={isLiveMode ? "success" : "default"}
                        onClick={() => setIsLiveMode(!isLiveMode)}
                        sx={{ cursor: 'pointer', fontWeight: 700, height: 24 }}
                    />
                 </Tooltip>
             </Box>

             <Typography variant="body2" color="text.secondary" fontWeight={600} minWidth={80} textAlign="right">
                 {currentStep + 1} / {trace.length}
             </Typography>
        </Box>

        {/* MAIN SPLIT */}
        <Grid container flex={1} overflow="hidden" sx={{ height: 'calc(100% - 60px)' }}> {/* Subtract toolbar height approx */}
            
            {/* LEFT: CODE & OUTPUT */}
            <Grid item xs={12} md={7} className="border-r border-border" display="flex" flexDirection="column" height="100%" overflow="hidden">
                
                {/* EDITOR */}
                <Box flex={1} overflow="auto" p={2} className="bg-background" position="relative">
                    <Box display="flex" justifyContent="space-between">
                         <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>
                             {isLiveMode ? "LIVE EDITOR (TYPE TO AUTO-RUN)" : "CODE EXECUTION (CLICK LINE TO JUMP)"}
                         </Typography>
                    </Box>

                    {/* RENDERED CODE (UNDERLAY) */}
                    <Paper 
                        sx={{ 
                            p: 2, 
                            fontFamily: 'monospace', 
                            fontSize: '14px', 
                            lineHeight: '1.6', 
                            bgcolor: 'background.paper', // Or card
                            color: isLiveMode ? 'transparent' : 'text.primary', 
                            boxShadow: 'none',
                            position: 'relative'
                        }}
                    >
                        {(localCode || "").split('\n').map((line, i) => {
                             const isCurrentLine = (i + 1) === currentData.line;
                             const isException = currentData.event === 'exception';
                             return (
                               <Box 
                                 key={i} 
                                 onClick={() => !isLiveMode && handleLineClick(i)}
                                 sx={{
                                     // We might need alpha for lights. MUI theme usually handles it or use alpha utility
                                     // But using direct colors for highlighting is sometimes safer for legibility if theme is unknown
                                     bgcolor: isCurrentLine ? (isException ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)') : 'transparent',
                                     borderLeft: isCurrentLine ? (isException ? '3px solid #ef4444' : '3px solid #10b981') : '3px solid transparent',
                                     borderRadius: 1,
                                     px: 1, 
                                     display: 'flex',
                                     cursor: isLiveMode ? 'text' : 'pointer',
                                     '&:hover': { bgcolor: (!isLiveMode && isCurrentLine) ? undefined : 'action.hover' }
                                 }}
                               >
                                  <span style={{ color: 'var(--mui-palette-text-disabled)', marginRight: 16, width: 24, textAlign: 'right', display: 'inline-block', userSelect: 'none' }}>{i + 1}</span>
                                  <span style={{ whiteSpace: 'pre' }}>{line || ' '}</span>
                               </Box>
                             );
                        })}
                    </Paper>

                    {/* LIVE EDITOR (OVERLAY) */}
                    {isLiveMode && (
                        <textarea
                            value={localCode}
                            onChange={handleCodeChange}
                            spellCheck={false}
                            style={{
                                position: 'absolute',
                                top: 16, 
                                left: 16, right: 16, bottom: 16,
                                width: 'calc(100% - 32px)',
                                height: 'auto',
                                minHeight: '100%',
                                background: 'transparent',
                                color: 'var(--foreground)',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                padding: '16px',
                                paddingLeft: '56px',
                                paddingTop: '22px',
                            }} 
                        />
                    )}
                </Box>

                {/* STANDARD INPUT DRAWER */}
                {showInput && (
                    <Box 
                        p={2} 
                        className="border-t border-border bg-card" 
                        bgcolor={waitingForInput ? "warning.light" : undefined} // Or subtle yellow
                        sx={{ bgcolor: waitingForInput ? 'rgba(234, 179, 8, 0.1)' : undefined }}
                        position="relative"
                    >
                         <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="caption" color={waitingForInput ? "warning.main" : "text.secondary"} sx={{ display: 'block', letterSpacing: 1, fontWeight: 700 }}>
                                {waitingForInput ? "⚠️ WAITING FOR USER INPUT" : "STANDARD INPUT (Stdin)"}
                            </Typography>
                            {waitingForInput && (
                                <Typography variant="caption" sx={{ color: 'warning.main',  animation: 'pulse 2s infinite' }}>
                                    Program paused at input()
                                </Typography>
                            )}
                        </Box>

                        <textarea 
                            value={stdIn} 
                            onChange={(e) => handleInputChange(e.target.value)} 
                            className={`w-full bg-muted text-foreground p-2 rounded border font-mono text-sm outline-none transition-colors ${waitingForInput ? 'border-warning ring-1 ring-warning/50' : 'border-input focus:border-primary'}`}
                            placeholder="Type input here. If your code detects input(), it will read from here sequentially. For multiple inputs, use separate lines."
                            rows={3}
                        />
                         <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
                    </Box>
                )}

                {/* STDOUT */}
                <Box p={2} className="border-t border-border bg-background" minHeight={showInput ? 100 : 120} maxHeight={200} overflow="auto" position="relative">
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>STANDARD OUTPUT</Typography>
                    <Box fontFamily="monospace" fontSize="13px" className="text-chart-2">
                        {currentData.stdout ? currentData.stdout.split('\n').map((l: string, i: number) => (
                            <div key={i}>{l || <br/>}</div>
                        )) : <span className="text-muted-foreground">Waiting for output...</span>}
                    </Box>
                </Box>
            </Grid>

            {/* RIGHT: STACK & HEAP */}
            <Grid item xs={12} md={5} display="flex" flexDirection="column" className="bg-background" height="100%" overflow="hidden">
                 
                 {/* CALL STACK */}
                 <Box p={2} className="border-b border-border" minHeight={150}>
                      <Typography variant="caption" color="primary.main" sx={{ mb: 1, display: 'block', letterSpacing: 1, fontWeight: 700 }}>CALL STACK</Typography>
                      <Box display="flex" flexDirection="column-reverse" gap={1}>
                          {currentData.stack && currentData.stack.map((frame: any, i: number) => (
                              <Box key={i} className="bg-primary/10 border border-primary/20" p={1} borderRadius={1}>
                                  <Typography variant="body2" color="primary.light" fontWeight={600}>{frame.name}()</Typography>
                                  <Typography variant="caption" color="primary.main">Line {frame.line}</Typography>
                              </Box>
                          ))}
                          {(!currentData.stack || currentData.stack.length === 0) && <span className="text-muted-foreground text-sm italic">Global Frame</span>}
                      </Box>
                 </Box>

                 {/* LOCALS / HEAP */}
                 <Box flex={1} overflow="auto" p={2} sx={{ overflowX: 'hidden' }}>
                      <Typography variant="caption" className="text-chart-3" sx={{ mb: 1, display: 'block', letterSpacing: 1, fontWeight: 700 }}>VARIABLES (HEAP)</Typography>
                      
                      {currentData.locals && Object.keys(currentData.locals).length > 0 ? (
                          <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm items-start">
                              {Object.entries(currentData.locals).map(([k, v]) => (
                                  <React.Fragment key={k}>
                                      <div className="text-muted-foreground font-bold text-xs text-right pt-0.5 select-none">{k}:</div>
                                      <div className="min-w-0 break-all">
                                          <EditableValue value={v} name={k} onEdit={(newVal) => handleVarEdit(k, newVal)} />
                                      </div>
                                  </React.Fragment>
                              ))}
                          </div>
                      ) : (
                          <Typography variant="caption" color="text.secondary" fontStyle="italic">No local variables.</Typography>
                      )}

                      <Divider sx={{ my: 2, borderColor: 'divider' }} />

                       {/* GLOBALS */}
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>GLOBALS</Typography>
                      {currentData.globals && Object.keys(currentData.globals).length > 0 ? (
                           <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm items-start">
                              {Object.entries(currentData.globals).map(([k, v]) => (
                                  <React.Fragment key={k}>
                                      <div className="text-muted-foreground font-medium text-xs text-right pt-0.5 select-none">{k}:</div>
                                      <div className="min-w-0 break-all">
                                          <EditableValue value={v} name={k} onEdit={(newVal) => handleVarEdit(k, newVal)} />
                                      </div>
                                  </React.Fragment>
                              ))}
                           </div>
                      ) : <span className="text-muted-foreground text-xs">Empty</span>}
                 </Box>
            </Grid>

        </Grid>
    </Box>
  );
};

export default PythonVisualizer;
