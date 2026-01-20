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
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  BugReport as BugIcon,
  Speed,
  Refresh
} from '@mui/icons-material';

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

class TraceRunner:
    def __init__(self):
        self.trace_data = []
        self.stdout_buffer = io.StringIO()
        
    def serialize_obj(self, obj, depth=0):
        if depth > 2: return {"type": "ref", "value": "... (max depth)"}
        
        t = type(obj).__name__
        try:
            if isinstance(obj, (int, float, bool, type(None))):
                return {"type": "primitive", "value": obj}
            elif isinstance(obj, str):
                return {"type": "string", "value": obj}
            elif isinstance(obj, list):
                return {"type": "list", "value": [self.serialize_obj(i, depth+1) for i in obj], "id": id(obj)}
            elif isinstance(obj, tuple):
                return {"type": "tuple", "value": [self.serialize_obj(i, depth+1) for i in obj], "id": id(obj)}
            elif isinstance(obj, set):
                return {"type": "set", "value": [self.serialize_obj(i, depth+1) for i in list(obj)], "id": id(obj)}
            elif isinstance(obj, dict):
                return {"type": "dict", "value": [[self.serialize_obj(k, depth+1), self.serialize_obj(v, depth+1)] for k, v in obj.items()], "id": id(obj)}
            else:
                return {"type": "object", "value": repr(obj), "id": id(obj)}
        except:
             return {"type": "error", "value": "<unserializable>"}

    def trace_calls(self, frame, event, arg):
        if event != 'call': return
        return self.trace_lines

    def trace_lines(self, frame, event, arg):
        if event not in ['line', 'return', 'exception', 'call']: return
        
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
                    "stdout": self.stdout_buffer.getvalue() + f"\\nException: {str(e)}"
                })
            finally:
                sys.settrace(None)
        finally:
            sys.stdout = old_stdout
            
        return json.dumps(self.trace_data)

runner = TraceRunner()
`;

// --- UI COMPONENTS ---

const EditableValue: React.FC<{ value: any; name?: string; onEdit?: (newVal: string) => void }> = ({ value, name, onEdit }) => {
    const [editing, setEditing] = useState(false);
    const [tempVal, setTempVal] = useState(String(value.value));
    
    // Primitive check
    const isPrimitive = ['primitive', 'string'].includes(value?.type);

    const handleCommit = () => {
        setEditing(false);
        if (onEdit && tempVal !== String(value.value)) { // Basic check
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
                className="bg-slate-700 text-white text-xs px-1 rounded border border-blue-500 outline-none min-w-[40px]"
                style={{ width: `${Math.max(tempVal.length, 3)}ch` }}
            />
        );
    }

    // Interactive Handler
    const handleClick = () => {
        // Only allow editing primitives for now to keep it safe
        if (isPrimitive && onEdit) {
            setTempVal(String(value.value));
            setEditing(true);
        }
    };

    return (
        <span 
             onClick={handleClick} 
             className={`${isPrimitive && onEdit ? 'cursor-pointer hover:bg-white/10 rounded px-1 -mx-1 transition-colors relative group' : ''}`}
        >
            <HeapValue data={value} />
            {isPrimitive && onEdit && (
                <span className="absolute -top-4 left-0 bg-blue-600 text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Click to Edit
                </span>
            )}
        </span>
    );
};

const HeapValue: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return <span>-</span>;
    
    if (data.type === 'primitive') return <span className="text-amber-400 font-mono">{String(data.value)}</span>;
    if (data.type === 'string') return <span className="text-emerald-400 font-mono">"{data.value}"</span>;
    if (data.type === 'object') return <span className="text-gray-400 italic">{data.value}</span>;
    
    // Recursive rendering for collections (Edit disabled for inner items for simplicity for now)
    if (data.type === 'list' || data.type === 'tuple' || data.type === 'set') {
        return (
            <div className="flex flex-wrap gap-1 items-center">
                <span className="text-xs text-gray-500 mr-1">{data.type === 'list' ? 'list' : data.type}</span>
                <div className={`flex border ${data.type === 'list' ? 'border-blue-500/30 bg-blue-500/10' : 'border-purple-500/30 bg-purple-500/10'} rounded overflow-hidden`}>
                    {data.value.map((item: any, i: number) => (
                        <div key={i} className="px-2 py-1 border-r border-white/10 last:border-0 text-sm">
                            <HeapValue data={item} />
                        </div>
                    ))}
                    {data.value.length === 0 && <span className="px-2 py-1 text-xs text-gray-500">empty</span>}
                </div>
            </div>
        );
    }

    if (data.type === 'dict') {
         return (
            <div className="flex flex-col gap-1">
                 <span className="text-xs text-gray-500">dict</span>
                 <div className="border border-orange-500/30 bg-orange-500/10 rounded p-1">
                     {data.value.map(([k, v]: any, i: number) => (
                         <div key={i} className="flex gap-2 text-sm">
                              <span className="font-mono text-gray-300"><HeapValue data={k} />:</span>
                              <HeapValue data={v} />
                         </div>
                     ))}
                     {data.value.length === 0 && <span className="text-xs text-gray-500 px-1">empty</span>}
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
  const [waitingForInput, setWaitingForInput] = useState(false); // New State
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync prop code
  useEffect(() => { if (!isLiveMode) setLocalCode(code); }, [code, isLiveMode]);

  // Auto-detect input requirement
  useEffect(() => {
      if (code.includes('input(') || localCode.includes('input(')) {
          setShowInput(true);
      }
  }, [code, localCode]);

  // Code Change Handler
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateCode(e.target.value);
  };

  const updateCode = (newVal: string) => {
      setLocalCode(newVal);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
          if (onChangeCode) onChangeCode(newVal);
      }, 800);
  };

  // Input Change Handler (Re-run on input change too)
  const handleInputChange = (val: string) => {
      setStdIn(val);
      // We rely on stdIn dependency in useEffect to trigger re-run, 
      // but we should debounce it to avoid too many runs while typing.
      // However, useEffect [stdIn] triggers immediately. 
      // Correct approach: Update local state, then debounce-update a "debouncedStdIn" or just reuse the timer logic to trigger a force update?
      // Simpler: Just rely on the useEffect debouncing?? No, the useEffect [stdIn] is not debounced.
      // Let's implement valid debounce for stdin triggering.
      
      // actually, to keep it simple, we will just setStdIn immediately and let it run. 
      // If it's too slow, we can add debounce later. For now, immediate is "Live".
  };

  // Variable Hot-Edit Handler
  const handleVarEdit = (name: string, newVal: string) => {
      // Heuristic: Try to find "name = ..." 
      // This is simple regex replacement. It won't work for complex scopes but works for the user's "global init" case.
      // We look for: name = [anything] or name= [anything]
      // We essentially try to find the assignment of this variable.
      
      const regex = new RegExp(`^(\\s*)${name}\\s*=\\s*.*$`, 'm'); // Multiline find
      const match = localCode.match(regex);
      
      if (match) {
          // Replace the whole line with "name = newVal"
          // We preserve indentation (match[1])
          const indentation = match[1] || '';
          
          // If newVal is a string, wrap quotes if not already? The input gives raw string "10" or "hello".
          // User types exactly what they want in python literal value.
          
          const newCode = localCode.replace(regex, `${indentation}${name} = ${newVal}`);
          // enable live mode so they can see it happened
          setIsLiveMode(true); 
          updateCode(newCode);
      } else {
          // Toast or ignore if not found assignment
          console.log("Could not find assignment for variable " + name);
      }
  };

  // Logger
  const log = (msg: string, data?: any) => {
    console.log(`[Visualizer]: ${msg}`, data || '');
  };

  // Playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
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

  // Run Trace (Triggered by code prop change from parent)
  useEffect(() => {
    if (!pyodide || !code) return;
    const generateTrace = async () => {
      try {
        // If live mode, keep current step if possible? No, safer to reset or try to stay close.
        // For now reset to 0 or keep absolute index if valid
        setError(null);

        await pyodide.runPythonAsync(TRACER_SCRIPT);
        pyodide.globals.set("user_code_str", code);
        pyodide.globals.set("user_input_str", stdIn); 
        await pyodide.runPythonAsync(`import sys; import io; sys.stdin = io.StringIO(user_input_str)`);
        
        const jsonResult = await pyodide.runPythonAsync(`runner.run(user_code_str)`);
        const parsedTrace = JSON.parse(jsonResult);
        
        if (!Array.isArray(parsedTrace) || parsedTrace.length === 0) {
             setTrace([{ line: 0, event: 'return', func_name: '<module>', stack: [], locals: {}, globals: {}, stdout: "No output." }]);
        } else {
            setTrace(parsedTrace);
            
            // Check for EOFError (Input needed)
            const last = parsedTrace[parsedTrace.length - 1];
            if (last.event === 'exception' && (last.stdout.includes("EOFError") || (last.stack?.length > 0 && last.stack[0].name === 'input'))) {
                 // Remove the exception step so visualizer stops on the line causing it
                 parsedTrace.pop();
                 setTrace([...parsedTrace]);
                 setWaitingForInput(true); // New state we need to add
                 if (!showInput) setShowInput(true);
            } else {
                 setWaitingForInput(false);
            }
            
            if (currentStep >= parsedTrace.length) {
                setCurrentStep(Math.max(0, parsedTrace.length - 1));
            }
        }
      } catch (err: any) {
        // If the unexpected happens (like Pyodide crash)
        if (err.message && err.message.includes("EOFError")) {
             setShowInput(true);
             setWaitingForInput(true);
             // Don't set global error
        } else {
             setError("Execution Failed: " + err.message);
        }
      }
    };
    generateTrace();
  }, [pyodide, code, stdIn]);

  if (loading) return <Box p={4} textAlign="center"><CircularProgress size={30} /><Typography sx={{mt:2}}>{initStatus}</Typography></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const currentData = trace[currentStep] || {};

  const handleLineClick = (lineIndex: number) => {
      const targetLine = lineIndex + 1;
      
      // Find next occurrence after current step
      let nextStepIndex = trace.findIndex((step, idx) => idx > currentStep && step.line === targetLine);
      
      // If not found ahead, wrap around to find from start
      if (nextStepIndex === -1) {
          nextStepIndex = trace.findIndex((step) => step.line === targetLine);
      }

      if (nextStepIndex !== -1) {
          setCurrentStep(nextStepIndex);
      } else {
          // Optional: Show toast "Line not executed"
      }
  };

  return (
    <Box display="flex" flexDirection="column" height="100%" bgcolor="#0f172a" color="white">
        
        {/* TOOLBAR */}
        <Box p={1.5} borderBottom="1px solid rgba(255,255,255,0.1)" display="flex" alignItems="center" gap={2} bgcolor="#1e293b">
             <IconButton onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} sx={{ color: 'white' }}>
                 <SkipPrevious />
             </IconButton>
             
             <IconButton onClick={() => setIsPlaying(!isPlaying)} sx={{ color: '#38bdf8', bgcolor: 'rgba(56, 189, 248, 0.1)', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.2)' } }}>
                 {isPlaying ? <Pause /> : <PlayArrow />}
             </IconButton>
             
             <IconButton onClick={() => setCurrentStep(Math.min(trace.length - 1, currentStep + 1))} disabled={currentStep >= trace.length - 1} sx={{ color: 'white' }}>
                 <SkipNext />
             </IconButton>

             <Box flex={1} mx={2}>
                <Slider 
                   value={currentStep} 
                   max={Math.max(0, trace.length - 1)} 
                   onChange={(_, v) => setCurrentStep(v as number)}
                   sx={{ color: '#38bdf8', height: 6 }}
                />
             </Box>
             
             <Box display="flex" alignItems="center" gap={2} mr={2}>
                 <Box display="flex" alignItems="center" gap={1} sx={{ opacity: isLiveMode ? 1 : 0.5, transition: '0.2s' }}>
                     <Refresh sx={{ fontSize: 16, color: isLiveMode ? '#4ade80' : 'gray', animation: isLiveMode ? 'spin 2s linear infinite' : 'none' }} />
                     <Typography variant="caption" sx={{ color: isLiveMode ? '#4ade80' : 'gray', fontWeight: 700 }}>LIVE RUN</Typography>
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
                        label={isLiveMode ? "EDITING" : "READ ONLY"} 
                        size="small" 
                        color={isLiveMode ? "success" : "default"}
                        onClick={() => setIsLiveMode(!isLiveMode)}
                        sx={{ cursor: 'pointer', fontWeight: 700, height: 24 }}
                    />
                 </Tooltip>
             </Box>

             <Typography variant="body2" color="gray" fontWeight={600} minWidth={80} textAlign="right">
                 {currentStep + 1} / {trace.length}
             </Typography>
        </Box>

        {/* MAIN SPLIT */}
        <Grid container flex={1} overflow="hidden">
            
            {/* LEFT: CODE & OUTPUT */}
            <Grid item xs={12} md={7} borderRight="1px solid rgba(255,255,255,0.1)" display="flex" flexDirection="column">
                
                {/* EDITOR */}
                <Box flex={1} overflow="auto" p={2} bgcolor="#0f172a" position="relative">
                    <Box display="flex" justifyContent="space-between">
                         <Typography variant="caption" color="gray" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>
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
                            bgcolor: '#1e293b', 
                            color: isLiveMode ? 'transparent' : '#e2e8f0', // Hide text in live mode, keep bg
                            boxShadow: 'none',
                            position: 'relative'
                        }}
                    >
                        {localCode.split('\n').map((line, i) => {
                             const isCurrentLine = (i + 1) === currentData.line;
                             const isException = currentData.event === 'exception';
                             return (
                               <Box 
                                 key={i} 
                                 onClick={() => !isLiveMode && handleLineClick(i)}
                                 sx={{ 
                                     bgcolor: isCurrentLine ? (isException ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)') : 'transparent',
                                     borderLeft: isCurrentLine ? (isException ? '3px solid #ef4444' : '3px solid #10b981') : '3px solid transparent',
                                     borderRadius: 1,
                                     px: 1, 
                                     display: 'flex',
                                     cursor: isLiveMode ? 'text' : 'pointer',
                                     '&:hover': { bgcolor: (!isLiveMode && isCurrentLine) ? undefined : 'rgba(255,255,255,0.05)' }
                                 }}
                               >
                                  <span style={{ color: '#475569', marginRight: 16, width: 24, textAlign: 'right', display: 'inline-block', userSelect: 'none' }}>{i + 1}</span>
                                  {/* In Live Mode, this text is invisible but layout must match */}
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
                                top: 16, // Match padding of parent Box (p=2 -> 16px) + Paper (p=2 -> ??) 
                                // Actually Paper has p=2. Box has p=2.
                                // We need exact overlay.
                                // Easiest: Absolute over the Paper.
                                left: 16, right: 16, bottom: 16,
                                width: 'calc(100% - 32px)',
                                height: 'auto',
                                minHeight: '100%',
                                background: 'transparent',
                                color: '#e2e8f0',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                padding: '16px', // Match Paper padding
                                paddingLeft: '56px', // Logic: 16px (Paper padding) + 16px (Span margin) + 24px (Span width) = 56px?
                                // Line number area is: px:1 in box + span width 24 + mr 16.
                                // Box px:1 is 8px.
                                // Total Left Padding = 16px (Paper) + 8px (Box) + 24px (Width) + 16px (Right Margin) = 64px
                            }} 
                        />
                    )}
                </Box>

                {/* STANDARD INPUT DRAWER */}
                {showInput && (
                    <Box p={2} borderTop="1px solid rgba(255,255,255,0.1)" bgcolor="#1e293b">
                        <Typography variant="caption" color="gray" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>STANDARD INPUT (Stdin)</Typography>
                        <textarea 
                            value={stdIn} 
                            onChange={(e) => handleInputChange(e.target.value)} 
                            className="w-full bg-slate-900 text-gray-300 p-2 rounded border border-slate-700 font-mono text-sm outline-none focus:border-blue-500"
                            placeholder="Enter input for input() calls here..."
                            rows={3}
                        />
                    </Box>
                )}

                {/* STDOUT */}
                <Box p={2} borderTop="1px solid rgba(255,255,255,0.1)" bgcolor="#020617" minHeight={showInput ? 100 : 120} maxHeight={200} overflow="auto" position="relative">
                    <Typography variant="caption" color="gray" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>STANDARD OUTPUT</Typography>
                    <Box fontFamily="monospace" fontSize="13px" color="#22c55e">
                        {currentData.stdout ? currentData.stdout.split('\n').map((l: string, i: number) => (
                            <div key={i}>{l || <br/>}</div>
                        )) : <span className="text-gray-700">Waiting for output...</span>}
                    </Box>
                    
                    {/* Waiting Indicator */}
                    {waitingForInput && (
                        <div className="absolute top-2 right-2 flex items-center gap-2 bg-amber-500/10 border border-amber-500/50 px-2 py-1 rounded">
                             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                             <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">Waiting for Input</span>
                        </div>
                    )}
                </Box>
            </Grid>

            {/* RIGHT: STACK & HEAP */}
            <Grid item xs={12} md={5} display="flex" flexDirection="column" bgcolor="#0f172a">
                 
                 {/* CALL STACK */}
                 <Box p={2} borderBottom="1px solid rgba(255,255,255,0.1)" minHeight={150}>
                      <Typography variant="caption" color="#38bdf8" sx={{ mb: 1, display: 'block', letterSpacing: 1, fontWeight: 700 }}>CALL STACK</Typography>
                      <Box display="flex" flexDirection="column-reverse" gap={1}>
                          {currentData.stack && currentData.stack.map((frame: any, i: number) => (
                              <Box key={i} bgcolor="rgba(56, 189, 248, 0.1)" p={1} borderRadius={1} border="1px solid rgba(56, 189, 248, 0.2)">
                                  <Typography variant="body2" color="#e0f2fe" fontWeight={600}>{frame.name}()</Typography>
                                  <Typography variant="caption" color="#7dd3fc">Line {frame.line}</Typography>
                              </Box>
                          ))}
                          {(!currentData.stack || currentData.stack.length === 0) && <span className="text-gray-600 text-sm italic">Global Frame</span>}
                      </Box>
                 </Box>

                 {/* LOCALS / HEAP */}
                 <Box flex={1} overflow="auto" p={2}>
                      <Typography variant="caption" color="#fcd34d" sx={{ mb: 1, display: 'block', letterSpacing: 1, fontWeight: 700 }}>VARIABLES (HEAP)</Typography>
                      
                      {currentData.locals && Object.keys(currentData.locals).length > 0 ? (
                          <div className="flex flex-col gap-3">
                              {Object.entries(currentData.locals).map(([k, v]) => (
                                  <div key={k} className="flex flex-col gap-1 bg-slate-800/50 p-2 rounded border border-slate-700">
                                      <div className="text-xs text-gray-400 font-bold">{k}</div>
                                      <div className="pl-2">
                                          {/* Locals might be harder to replace as they are transient. We'll enable it but it might only work for locals defined in the currently visible function scope if we parse correctly. For now we focus on global simple replacement for the user's scenario. */}
                                          <EditableValue value={v} name={k} onEdit={(newVal) => handleVarEdit(k, newVal)} />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <Typography variant="caption" color="gray" fontStyle="italic">No local variables.</Typography>
                      )}

                      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                       {/* GLOBALS */}
                      <Typography variant="caption" color="gray" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>GLOBALS</Typography>
                      {currentData.globals && Object.keys(currentData.globals).length > 0 ? (
                           <div className="flex flex-col gap-2">
                              {Object.entries(currentData.globals).map(([k, v]) => (
                                  <div key={k} className="flex justify-between items-center text-sm border-b border-slate-800 pb-1">
                                      <span className="text-slate-400">{k}</span>
                                      <EditableValue value={v} name={k} onEdit={(newVal) => handleVarEdit(k, newVal)} />
                                  </div>
                              ))}
                           </div>
                      ) : <span className="text-gray-700 text-xs">Empty</span>}
                 </Box>
            </Grid>

        </Grid>
    </Box>
  );
};

export default PythonVisualizer;
