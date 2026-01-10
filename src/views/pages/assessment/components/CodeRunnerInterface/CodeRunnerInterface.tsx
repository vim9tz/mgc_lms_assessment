"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import { useCodeRunner } from "@/domains/code-runner/hooks/useCodeRunner";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Chip,
  Divider,
  Box,
  Tab,
  Tabs,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Tooltip
} from "@mui/material";
import {
  PlayArrow,
  CheckCircle,
  Error as ErrorIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon,
  CloudUpload as CloudUploadIcon,
  List as ListIcon,
  Close as CloseIcon,
  NavigateNext,
  NavigateBefore,
  KeyboardDoubleArrowRight,
  KeyboardDoubleArrowLeft,
  Description
} from "@mui/icons-material";

// Monaco editor (client-only)
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });


/* ================= PROPS ================= */

interface CodeRunnerInterfaceProps {
  questionId: string;
  token?: string;
}

/* ================= TYPES ================= */

interface QuestionTestCase {
  id: number;
  description?: string;
  input_data: string;
  expected_output: string;
  is_public: boolean;
}

interface Question {
  id: number;
  topic_id?: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  content: string;
  constraints?: string;
  programming_language?: string;
  programming_language_id?: number;
  starter_code?: string;
  user_code?: string;
  test_cases?: QuestionTestCase[];
  expected_time_complexity?: string;
  expected_space_complexity?: string;
  submission?: SubmissionResult; // Nested submission data from backend
}

interface TopicQuestion {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  status: "solved" | "attempted" | "unsolved";
}

interface TestCaseResult {
  status: "passed" | "failed" | "error";
  input?: string;
  expected_output?: string;
  actual_output?: string;
  passed?: boolean;
}

interface SubmissionResult {
  status: "passed" | "failed" | "error";
  output?: string;
  runtime?: number;
  memory?: number;
  test_cases?: TestCaseResult[];
  time_complexity?: string;
  space_complexity?: string;
}

/* ================= COMPONENT ================= */

import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const CodeRunnerInterface: React.FC<CodeRunnerInterfaceProps> = ({
  questionId: propQuestionId,
  token,
}) => {

  console.log("Question ID:", propQuestionId);
  // State for current question ID (handling internal switching)
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(propQuestionId);

  // Missing States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Output, 1: Tests
  const [leftTab, setLeftTab] = useState(0); // 0: Description, 1: Constraints
  
  const [code, setCode] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("python");
  const [languageId, setLanguageId] = useState<number>(1);
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  // Navigation placeholders (logic needs to be connected to topicQuestions)
  const [prevQuestionId, setPrevQuestionId] = useState<number | null>(null);
  const [nextQuestionId, setNextQuestionId] = useState<number | null>(null);

  // Splitter State
  const [editorHeight, setEditorHeight] = useState(60); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate new height based on mouse position relative to container
        const newHeightPixels = mouseMoveEvent.clientY - containerRect.top;
        const newHeightPercentage = (newHeightPixels / containerRect.height) * 100;

        // Limit the height between 20% and 80% to prevent full collapse
        if (newHeightPercentage >= 20 && newHeightPercentage <= 80) {
          setEditorHeight(newHeightPercentage);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
       window.addEventListener("mousemove", resize);
       window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  /* ================= HOOK INTEGRATION ================= */

  // Important: signOut logic is now handled in the hooks/httpClient 
  // but if we had explicit signOut here, it should be:
  // signOut({ callbackUrl: window.location.origin });
  
  // Checking existing implementation...
  // It seems imports were fixed but let's just make sure we don't have stray signOuts.


  const { 
      question, 
      loading, 
      error, 
      topicQuestions, 
      loadingTopicQuestions, 
      submitting: hookSubmitting,
      fetchTopicQuestions,
      submitCode
  } = useCodeRunner(currentQuestionId, token);

  // Sync hook state to local state if needed, or replace usage dependent on UI
  // The hook handles fetching active question and topic questions.
  
  // We need to sync question data to local state for editor initialization 
  // ONLY when question changes.
  useEffect(() => {
     if (question) {
        if (question.user_code) {
           setCode(question.user_code);
        } else if (question.starter_code) {
           setCode(question.starter_code);
        }
        
        if (question.programming_language_id)
          setLanguageId(question.programming_language_id);

        if (question.programming_language) {
          const lang = question.programming_language.toLowerCase();
          if (lang.includes("python")) setEditorLanguage("python");
          else if (lang.includes("java")) setEditorLanguage("java");
          else if (lang.includes("php")) setEditorLanguage("php");
          else if (lang.includes("script")) setEditorLanguage("javascript");
          else setEditorLanguage(lang);
        }

        // Prefill Result if submission exists
        if (question.submission) {
            setResult({
                status: question.submission.status,
                output: question.submission.output,
                time_complexity: question.submission.time_complexity,
                space_complexity: question.submission.space_complexity,
                test_cases: question.submission.test_cases
            });
        } else {
            setResult(null); // Reset if no submission for this question
        }
     }
  }, [question]);

  // Update navigation buttons based on topic questions list
  useEffect(() => {
    if (topicQuestions && topicQuestions.length > 0 && currentQuestionId) {
        const idx = topicQuestions.findIndex(q => q.id.toString() === currentQuestionId.toString());
        if (idx !== -1) {
            setPrevQuestionId(idx > 0 ? topicQuestions[idx - 1].id : null);
            setNextQuestionId(idx < topicQuestions.length - 1 ? topicQuestions[idx + 1].id : null);
        }
    }
  }, [topicQuestions, currentQuestionId]);


  const handleCodeSubmit = async () => {
      try {
        setSubmitting(true);
        
        // --- RUN LOGIC (EXECUTE ON COMPILER FIRST) ---
        // keeping this direct as requested (only refactoring microcollege api)
        const langMap: Record<string, string> = {
          python: "1", java: "2", c: "3", cpp: "4", "c++": "4", javascript: "10", js: "10", node: "10", php: "1"
        };
        const langKey = (question?.programming_language?.toLowerCase() || editorLanguage || "").replace(" language", "");
        const compilerLangId = langMap[langKey] || "1";
        const runPayload = {
          code,
          language: compilerLangId,
          test_cases: question?.test_cases?.map((tc: any) => ({ input: tc.input_data, expected_output: tc.expected_output })) || [],
          filename: `solution_${Date.now()}`
        };
        
        let executionData: any = null;
        try {
            // Updated compiler URL as per user request
            const res = await fetch("https://dev-compilers.skillryt.com/api/execute/", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(runPayload),
            });
            if (res.ok) executionData = await res.json();
        } catch (e) {
            console.error("Exec failed during submit", e);
        }
        
        const mappedTestCases = (executionData || []).map((r: any, i: number) => {
             const original = question?.test_cases?.[i];
             return {
                 status: r.passed ? "passed" : "failed",
                 input: original?.input_data || r?.input || '',
                 expected_output: original?.expected_output || r?.expected_output || '',
                 actual_output: r?.output || r?.actual_output || ''
             };
        });
        
        const allPassed = mappedTestCases.length > 0 && mappedTestCases.every((tc: any) => tc.status === "passed");
        const mainOutput = executionData?.[0]?.output || "Submission Executed";

        // Extract Complexity
        const timeComplexity = executionData?.[0]?.time_complexity;
        const spaceComplexity = executionData?.[0]?.space_complexity;
        const runtime = executionData?.[0]?.cpuTime ? parseFloat(executionData[0].cpuTime) * 1000 : 0; // Convert s to ms if needed, check API
        const memory = executionData?.[0]?.memory ? parseFloat(executionData[0].memory) : 0; // KB usually

        setResult({
          status: allPassed ? "passed" : "failed",
          output: mainOutput,
          runtime: runtime,
          memory: memory,
          test_cases: mappedTestCases,
          time_complexity: timeComplexity,
          space_complexity: spaceComplexity
        });

        // 2. Submit to Backend using HOOK
        const backendPayload = {
            question_id: currentQuestionId, 
            code,
            language_id: languageId,
            execution_results: {
                output: mainOutput,
                test_cases: mappedTestCases.map((tc: any) => ({
                    passed: tc.status === 'passed',
                    output: tc.actual_output,
                })),
                time_complexity: timeComplexity,
                space_complexity: spaceComplexity
            }
        };

        const submitData = await submitCode(backendPayload);
        
        // Refresh topic questions to update 'solved' status if passed
        if (allPassed && question?.topic_id) {
            fetchTopicQuestions(question.topic_id);
        }
        
        setActiveTab(1); // Switch to results

      } catch (e: any) {
          console.error(e);
          setResult({ status: "error", output: e.message || "Submission failed. Please try again." });
      } finally {
          setSubmitting(false);
      }
  };

  /* ================= RUN CODE (FRONTEND) ================= */

  const handleCodeRun = async () => {
    try {
      setSubmitting(true);
      setResult(null);
      setActiveTab(1); // Show Output Tab or Tests Tab

      const langMap: Record<string, string> = {
        python: "1", java: "2", c: "3", cpp: "4", "c++": "4", javascript: "10", js: "10", node: "10", php: "1"
      };
      
      const langKey = (question?.programming_language?.toLowerCase() || editorLanguage || "").replace(" language", "");
      const compilerLangId = langMap[langKey] || "1";

      const payload = {
        code,
        language: compilerLangId,
        test_cases: question?.test_cases?.map((tc: any) => ({
            input: tc.input_data,
            expected_output: tc.expected_output
        })) || [],
        filename: `solution_${Date.now()}`
      };

      // Updated URL
      const res = await fetch("https://dev-compilers.skillryt.com/api/execute/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Execution failed");

      const data = await res.json();
      
      const mappedTestCases: TestCaseResult[] = (data || []).map((r: any, i: number) => {
          const original = question?.test_cases?.[i];
          return {
              status: r.passed ? "passed" : "failed",
              input: original?.input_data || r.input,
              expected_output: original?.expected_output || r.expected_output,
              actual_output: r.output
          };
      });

      const allPassed = mappedTestCases.length > 0 && mappedTestCases.every(tc => tc.status === "passed");
      const mainOutput = data?.[0]?.output || "";
      
      const timeComplexity = data?.[0]?.time_complexity;
      const spaceComplexity = data?.[0]?.space_complexity;
      // API typically returns cpuTime (seconds) and memory (KB)
      // We'll treat cpuTime as seconds and display as ms
      const runtime = data?.[0]?.cpuTime ? parseFloat(data[0].cpuTime) * 1000 : 0; 
      const memory = data?.[0]?.memory ? parseFloat(data[0].memory) : 0;

      setResult({
        status: allPassed ? "passed" : "failed",
        runtime,
        memory,
        output: mainOutput,
        test_cases: mappedTestCases,
        time_complexity: timeComplexity,
        space_complexity: spaceComplexity
      });

    } catch (e) {
      console.error(e);
      setResult({
        status: "error",
        output: "Code execution failed. Please check your connection.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI HELPERS ================= */

  const handleSwitchQuestion = (id: number) => {
      setDrawerOpen(false);
      setCurrentQuestionId(id.toString());
      setResult(null);
  };

  /* ================= UI STATES ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  if (!question) {
    return <div className="p-10 text-center">Question not found</div>;
  }

  /* ================= RENDER ================= */

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 p-4 gap-4 overflow-hidden font-sans">
      
      {/* DRAWER FOR TOPIC TOGGLE */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
            sx: { width: 320, borderRadius: '0 16px 16px 0', border: 'none' }
        }}
      >
          <Box p={3} display="flex" justifyContent="space-between" alignItems="center" borderBottom="1px solid #f3f4f6">
              <Typography variant="h6" fontWeight={700} color="text.primary">Questions</Typography>
              <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
          </Box>
          <List sx={{ pt: 1 }}>
              {loadingTopicQuestions && <Box p={4} textAlign="center"><CircularProgress size={24} /></Box>}
              {!loadingTopicQuestions && topicQuestions.map(q => {
                  const isCurrent = q.id.toString() === currentQuestionId;
                  
                  let StatusIcon = <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />;
                  if (q.status === 'solved') {
                      StatusIcon = <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />;
                  } else if (q.status === 'attempted') {
                      StatusIcon = <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm" />;
                  }

                  return (
                      <ListItem key={q.id} disablePadding sx={{ px: 2, py: 0.5 }}>
                          <ListItemButton 
                             selected={isCurrent}
                             onClick={() => handleSwitchQuestion(q.id)}
                             sx={{ 
                                 borderRadius: 2,
                                 '&.Mui-selected': { bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.lighter' } }
                             }}
                          >
                              <ListItemIcon sx={{ minWidth: 24, pr: 1 }}>
                                  {StatusIcon}
                              </ListItemIcon>
                              <ListItemText 
                                  primary={q.title} 
                                  secondary={q.difficulty.toUpperCase()}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: isCurrent ? 600 : 400, color: isCurrent ? 'text.primary' : 'text.secondary' }}
                                  secondaryTypographyProps={{ 
                                      variant: 'caption', 
                                      fontWeight: 600,
                                      sx: { 
                                          fontSize: '0.65rem', 
                                          mt: 0.5, 
                                          display: 'inline-block',
                                          px: 1, 
                                          py: 0.2, 
                                          borderRadius: 1, 
                                          bgcolor: q.difficulty === 'easy' ? 'success.lighter' : q.difficulty === 'medium' ? 'warning.lighter' : 'error.lighter',
                                          color: q.difficulty === 'easy' ? 'success.dark' : q.difficulty === 'medium' ? 'warning.dark' : 'error.dark' 
                                      }
                                  }}
                              />
                          </ListItemButton>
                      </ListItem>
                  );
              })}
              {!loadingTopicQuestions && topicQuestions.length === 0 && (
                  <Box p={3} textAlign="center" color="text.disabled" fontSize="0.875rem">No other questions found.</Box>
              )}
          </List>
      </Drawer>


      {/* LEFT PANEL - PROBLEM DESCRIPTION */}
      <div className="w-full md:w-5/12 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative transition-all duration-300 hover:shadow-md">
        
        {/* Header */}
        <div className="p-5 pb-0 bg-white z-10 sticky top-0">
             {/* Nav & Title */}
             <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                       <Button 
                         startIcon={<ListIcon />} 
                         variant="text" 
                         size="small"
                         onClick={() => setDrawerOpen(true)}
                         sx={{ 
                             color: 'text.secondary', 
                             textTransform: 'none', 
                             fontSize: '0.85rem',
                             minWidth: 'auto',
                             px: 1,
                             '&:hover': { bgcolor: 'grey.50', color: 'text.primary' } 
                         }}
                      >
                         Questions
                      </Button>
                  </div>

                  <div className="flex gap-1">
                      <Tooltip title="Previous Question" placement="bottom">
                          <span>
                            <IconButton 
                               disabled={!prevQuestionId} 
                               onClick={() => prevQuestionId && handleSwitchQuestion(prevQuestionId)}
                               size="small"
                               sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                            >
                               <NavigateBefore fontSize="small" />
                            </IconButton>
                          </span>
                      </Tooltip>
                      <Tooltip title="Next Question" placement="bottom">
                          <span>
                             <IconButton 
                                disabled={!nextQuestionId} 
                                onClick={() => nextQuestionId && handleSwitchQuestion(nextQuestionId)}
                                size="small"
                                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                             >
                                <NavigateNext fontSize="small" />
                             </IconButton>
                          </span>
                      </Tooltip>
                  </div>
             </div>

             <div className="mb-4">
                 <div className="flex items-center gap-3 mb-2">
                     <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                       {question.title}
                     </Typography>
                     <Chip
                        label={question.difficulty}
                        size="small"
                        sx={{ 
                            fontWeight: 700, 
                            textTransform: 'capitalize', 
                            height: 24,
                            bgcolor: question.difficulty === "easy" ? '#ecfdf5' : question.difficulty === "medium" ? '#fffbeb' : '#fef2f2',
                            color: question.difficulty === "easy" ? '#059669' : question.difficulty === "medium" ? '#d97706' : '#dc2626',
                            border: '1px solid',
                            borderColor: question.difficulty === "easy" ? '#a7f3d0' : question.difficulty === "medium" ? '#fde68a' : '#fecaca',
                        }}
                     />
                 </div>
                 
                 {/* Quick Stats optional line */}
                 {(result?.time_complexity || result?.space_complexity) && (
                    <div className="flex gap-3 text-xs font-medium text-gray-500">
                        {result.time_complexity && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {result.time_complexity}
                            </span>
                        )}
                    </div>
                 )}
             </div>

             {/* Modern Tabs */}
             <div className="border-b border-gray-100">
                 <Tabs 
                    value={leftTab} 
                    onChange={(_, v) => setLeftTab(v)} 
                    aria-label="Problem Tabs"
                    sx={{ minHeight: 40 }}
                    TabIndicatorProps={{ sx: { height: 2, borderRadius: '2px 2px 0 0' } }}
                 >
                     <Tab label="Description" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1, fontSize: '0.9rem' }} />
                     {question.constraints && (
                         <Tab label="Constraints" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1, fontSize: '0.9rem' }} />
                     )}
                 </Tabs>
             </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
             {leftTab === 0 && (
                <div className="animate-in fade-in duration-300 question-content-wrapper">
                    <div
                      className="prose prose-sm md:prose-base max-w-none text-slate-700 leading-relaxed font-normal"
                      dangerouslySetInnerHTML={{ __html: question.content }}
                    />
                    
                    <style jsx global>{`
                        .question-content-wrapper img { max-width: 100%; height: auto; }
                        .question-content-wrapper pre { 
                            overflow-x: auto; 
                            max-width: 100%; 
                            white-space: pre; 
                            background-color: #f8fafc;
                            padding: 0.75rem;
                            border-radius: 0.5rem;
                            border: 1px solid #e2e8f0;
                        }
                        .question-content-wrapper table { display: block; overflow-x: auto; max-width: 100%; }
                        .question-content-wrapper code { overflow-wrap: break-word; }
                        .question-content-wrapper pre code { white-space: pre; overflow-wrap: normal; }
                    `}</style>
                    
                    {/* Complexity Requirements */}
                    {(question.expected_time_complexity || question.expected_space_complexity) && (
                        <div className="flex flex-wrap gap-3 mt-8">
                            {question.expected_time_complexity && (
                                <div className="flex flex-col bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Time Complexity</span>
                                    <span className="font-mono font-bold text-slate-700">{question.expected_time_complexity}</span>
                                </div>
                            )}
                            {question.expected_space_complexity && (
                                <div className="flex flex-col bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Space Complexity</span>
                                    <span className="font-mono font-bold text-slate-700">{question.expected_space_complexity}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Example Cases */}
                    {question.test_cases && question.test_cases.filter((tc: any) => tc.is_public).length > 0 && (
                        <div className="mt-8 space-y-4">
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Examples</div>
                             
                             {question.test_cases.filter((tc: any) => tc.is_public).map((tc: any, i: number) => (
                                 <div key={i} className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                                     <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                         <span className="text-xs font-bold text-slate-700">Example {i + 1}</span>
                                         {tc.description && <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-gray-200">{tc.description}</span>}
                                     </div>
                                     <div className="p-4 grid gap-3">
                                         <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Input</div>
                                            <code className="block bg-white border border-gray-200 rounded-lg p-2 font-mono text-sm text-slate-700 overflow-x-auto whitespace-pre">{tc.input_data}</code>
                                         </div>
                                         <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Output</div>
                                            <code className="block bg-white border border-gray-200 rounded-lg p-2 font-mono text-sm text-slate-700 overflow-x-auto whitespace-pre">{tc.expected_output}</code>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
             )}

             {leftTab === 1 && question.constraints && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 text-amber-900/80 text-sm leading-relaxed" 
                         dangerouslySetInnerHTML={{ __html: question.constraints }} 
                    />
                </div>
            )}
        </div>
      </div>


      {/* RIGHT PANEL - CODE & OUTPUT */}
      <div className="w-full md:w-7/12 flex flex-col gap-4 overflow-hidden">
          {/* EDITOR CARD */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative transition-all duration-300 hover:shadow-md">
            
            {/* Toolbar */}
            <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0 z-20">
                 <div className="flex items-center gap-3">
                     <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600">
                         <CodeIcon fontSize="small" />
                     </span>
                     <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 leading-none">{question.programming_language || "Code"}</span>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-0.5">Editor</span>
                     </div>
                 </div>

                 <div className="flex items-center gap-2">
                     <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        disabled={submitting}
                        onClick={handleCodeRun}
                        startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <PlayArrow sx={{ fontSize: 18 }} />}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 600, 
                            borderRadius: '8px', 
                            color: 'text.secondary', 
                            borderColor: 'divider',
                            fontSize: '0.85rem',
                            '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.400' } 
                        }}
                     >
                        Run
                     </Button>
                     <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={submitting}
                        onClick={handleCodeSubmit}
                        startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <CloudUploadIcon sx={{ fontSize: 18 }} />}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 600, 
                            borderRadius: '8px', 
                            boxShadow: 'none',
                            fontSize: '0.85rem',
                            px: 2,
                            '&:hover': { boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }
                        }}
                     >
                        Submit
                     </Button>
                 </div>
            </div>

            {/* MONACO EDITOR */}
            <div 
               style={{ height: `${editorHeight}%` }} 
               className="relative w-full overflow-hidden bg-[#1e1e1e]"
            >
               <Editor
                 height="100%"
                 language={editorLanguage}
                 value={code}
                 onChange={(v) => setCode(v || "")}
                 theme="vs-dark"
                 options={{ 
                     minimap: { enabled: false }, 
                     fontSize: 14, 
                     fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                     lineHeight: 24,
                     padding: { top: 16 },
                     scrollBeyondLastLine: false,
                     automaticLayout: true
                 }}
               />
            </div>

            {/* RESIZER */}
            <div
                className="h-1.5 w-full bg-gray-50 border-y border-gray-200 cursor-row-resize z-10 flex items-center justify-center hover:bg-indigo-50 transition-colors group shrink-0"
                onMouseDown={startResizing}
            >
                <div className="w-12 h-1 bg-gray-300 rounded-full group-hover:bg-indigo-300 transition-colors" />
            </div>

            {/* OUTPUT PANEL */}
            <div 
               style={{ height: `calc(${100 - editorHeight}% - 6px)` }} 
               className="bg-white flex flex-col min-h-0 relative z-0"
            >
                {/* Output Tabs */}
                <div className="flex items-center gap-1 border-b border-gray-100 px-2 h-10 bg-white shrink-0">
                    <button
                        onClick={() => setActiveTab(0)}
                        className={`flex items-center gap-2 px-3 h-full text-xs font-semibold border-b-2 transition-all ${activeTab === 0 ? 'border-primary-main text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                         <TerminalIcon sx={{ fontSize: 16 }} className={activeTab === 0 ? "text-indigo-500" : "text-gray-400"} />
                         Output
                    </button>
                    <button
                        onClick={() => setActiveTab(1)}
                        className={`flex items-center gap-2 px-3 h-full text-xs font-semibold border-b-2 transition-all ${activeTab === 1 ? 'border-primary-main text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                         {result?.status === 'passed' ? (
                             <CheckCircle sx={{ fontSize: 16 }} className="text-green-500" />
                         ) : result?.status === 'failed' ? (
                             <ErrorIcon sx={{ fontSize: 16 }} className="text-red-500" />
                         ) : (
                             <div className="w-3.5 h-3.5 rounded bg-gray-200" />
                         )}
                         Test Cases
                    </button>
                </div>

                {/* Output Content */}
                <Box className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white md:bg-gray-50/30">
                     {activeTab === 0 && (
                        <div className="p-4 h-full relative">
                            {result?.output ? (
                                <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-h-[100px]">
                                    {result.output}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 gap-2">
                                    <TerminalIcon sx={{ fontSize: 40 }} />
                                    <span className="text-sm font-medium">Run your code to see output</span>
                                </div>
                            )}
                        </div>
                     )}

                     {activeTab === 1 && (
                        <div className="p-4 flex flex-col h-full overflow-hidden">
                             {/* Summary Header */}
                             <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result ? (result.status === 'passed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600') : 'bg-gray-100 text-gray-400'}`}>
                                         {result ? (
                                            result.status === 'passed' ? <CheckCircle /> : <ErrorIcon />
                                         ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> 
                                         )}
                                     </div>
                                     <div className="flex flex-col">
                                         <span className={`text-sm font-bold ${result ? (result.status === 'passed' ? 'text-green-700' : 'text-red-700') : 'text-gray-500'}`}>
                                             {result ? (result.status === 'passed' ? 'Accepted' : 'Wrong Answer') : 'Ready to Run'}
                                         </span>
                                         {result && (
                                            <span className="text-xs text-slate-500 font-medium">
                                                {result.test_cases?.filter((t: any) => t.status==='passed').length} / {question.test_cases?.length} tests passed
                                            </span>
                                         )}
                                     </div>
                                 </div>
                                 {result && (
                                     <div className="text-right">
                                         <div className="text-xs font-bold text-slate-700">{result.runtime?.toFixed(0)} ms</div>
                                         <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Runtime</div>
                                     </div>
                                 )}
                             </div>

                             {/* Test Cases List */}
                             {result?.test_cases ? (
                                 <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                     {result.test_cases.filter((_, idx) => question.test_cases?.[idx]?.is_public).map((tc, idx) => (
                                         <div key={idx} className="group bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-all overflow-hidden shadow-sm">
                                             <div className={`h-1 w-full ${tc.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`} />
                                             <div className="p-3">
                                                 <div className="flex justify-between items-start mb-2">
                                                     <span className="text-xs font-bold text-slate-700">Case {idx + 1}</span>
                                                     <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${tc.status === 'passed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                        {tc.status}
                                                     </span>
                                                 </div>
                                                 <div className="grid gap-2 text-xs font-mono">
                                                     <div className="grid grid-cols-[50px_1fr] gap-2">
                                                         <span className="text-gray-400 font-medium">Input:</span>
                                                         <span className="text-gray-700 break-all">{tc.input}</span>
                                                     </div>
                                                     <div className="grid grid-cols-[50px_1fr] gap-2">
                                                         <span className="text-gray-400 font-medium">Exp:</span>
                                                         <span className="text-gray-700 break-all">{tc.expected_output}</span>
                                                     </div>
                                                     {tc.status !== 'passed' && (
                                                         <div className="grid grid-cols-[50px_1fr] gap-2 bg-red-50/50 p-1.5 rounded -mx-1.5 mt-1">
                                                             <span className="text-red-400 font-medium">Got:</span>
                                                             <span className="text-red-700 break-all font-bold">{tc.actual_output}</span>
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2">
                                     {question.test_cases?.filter((t: any) => t.is_public).map((tc: any, i: number) => (
                                        <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between opacity-70">
                                            <span className="text-xs font-bold text-gray-500">Case {i + 1}</span>
                                            <div className="flex gap-2 text-gray-300">
                                                <div className="w-16 h-2 bg-gray-100 rounded"></div>
                                                <div className="w-8 h-2 bg-gray-100 rounded"></div>
                                            </div>
                                        </div> 
                                     ))}
                                 </div>
                             )}
                        </div>
                     )}
                </Box>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CodeRunnerInterface;
