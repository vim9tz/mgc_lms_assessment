"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import { useCodeRunner, useSaveCode, useSubmitCode, useResetCode } from "@/domains/code-runner/hooks/useCodeRunner";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Drawer,
  IconButton,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  Description,
  Visibility,
  ExitToApp as LogoutIcon, 
  NetworkCheck,
  SlowMotionVideo
} from "@mui/icons-material";
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, ChevronRight, ChevronUp, ChevronDown, 
    LogOut, Play, Code2, Terminal, List as LucideList, X, Loader2, CheckCircle2, XCircle, Eye,
    Save, FileX, RefreshCw
} from 'lucide-react';

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
  expected_output?: string; // Made optional as it might be null for regex without explicit output
  is_public: boolean;
  expected_regex?: string;
  match_mode?: string;
  regex_flags?: string[];
  // V2 Fields
  mode?: 'normal' | 'regex';
  ignore_space?: boolean;
  ignore_case?: boolean;
  numeric_tolerance?: number;
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
  submission?: SubmissionResult;
  is_regex?: boolean;
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
import PythonVisualizer from "./PythonVisualizer";
import ThreePaneLayout, { WindowMaximizeIcon, WindowRestoreIcon } from "../ThreePaneLayout";
import AssessmentLoading from "../AssessmentLoading";

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

  // Exit & Submit Confirmation State
  const router = useRouter();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const handleExit = () => {
      setExitDialogOpen(true);
  };

  const confirmExit = () => {
      setExitDialogOpen(false);
      
      // If opened in new tab/window, try to close it
      if (window.opener) {
          window.close();
      }

      // "Click two time back" logic
      // Go back 2 steps to clear any intermediate states (like pre-launch redirects)
      if (window.history.length > 2) {
          window.history.go(-2);
      } else {
          router.back();
      }
      
      // Fallback just in case
      setTimeout(() => router.back(), 500);
  };

  const handleConfirmSubmit = () => {
      setSubmitDialogOpen(false);
      handleCodeSubmit();
  };

  // Visualizer State
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Navigation placeholders (logic needs to be connected to topicQuestions)
  const [prevQuestionId, setPrevQuestionId] = useState<number | null>(null);
  const [nextQuestionId, setNextQuestionId] = useState<number | null>(null);

  // Splitter State - REMOVED (Handled by ThreePaneLayout)


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
  } = useCodeRunner(currentQuestionId, token);

  const { mutateAsync: submitCode } = useSubmitCode();
  const { mutateAsync: saveCode, isPending: isSaving } = useSaveCode();
  const { mutateAsync: resetCode, isPending: isResetting } = useResetCode();

  // Reset Confirmation State
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleReset = async () => {
    try {
        if (!question) return;

        await resetCode(question.id.toString());
        
        // Reset local state to starter code
        if (question.starter_code) {
           setCode(question.starter_code);
        } else {
           setCode(""); 
        }
        
        setResult(null); // Clear execution results
        setResetDialogOpen(false);
        toast.success("Code reset successfully to starter code.");
    } catch (error) {
        console.error("Reset failed:", error);
        toast.error("Failed to reset code.");
    }
  };

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



  // Handle Save Draft
  // Handle Save Draft
  const handleSaveDraft = async () => {
      try {
          if (!question) return;
          
          await saveCode({
              question_id: question.id,
              code: code,
              language_id: question.programming_language_id || 1
          });
          
          setSaveDialogOpen(false);
          toast.success("Draft saved successfully!");
      } catch (error) {
          console.error("Save failed:", error);
          toast.error("Failed to save draft.");
      }
  };

  // Handle Save & Exit
  const handleSaveAndExit = async () => {
      try {
          if (!question) return;

          await saveCode({
              question_id: question.id,
              code: code,
              language_id: question.programming_language_id || 1
          });
          
          setSaveDialogOpen(false);
          toast.success("Progress saved. Exiting...");
          confirmExit(); // Reuse existing exit logic
          
      } catch (error) {
          console.error("Save & Exit failed:", error);
          toast.error("Failed to save and exit.");
      }
  };


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
          test_cases: question?.test_cases?.map((tc: any) => ({ 
              input: tc.input_data, 
              expected_output: tc.expected_output,
              // V2 Fields
              mode: tc.mode || (question?.is_regex ? 'regex' : 'normal'), // Fallback for old data
              ignore_space: tc.ignore_space,
              ignore_case: tc.ignore_case,
              numeric_tolerance: tc.numeric_tolerance,
              
              // Regex support
              expected_regex: tc.expected_regex,
              match_mode: tc.match_mode,
              regex_flags: tc.regex_flags
          })) || [],
          filename: `solution_${Date.now()}`
        };
        
        let executionData: any = null;
        try {
            // Updated compiler URL as per user request
            const res = await fetch("https://compilers.milliongeniuscoders.com/api/execute/", {
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
        toast.success("Solution submitted successfully!");

      } catch (e: any) {
          console.error(e);
          setResult({ status: "error", output: e.message || "Submission failed. Please try again." });
          toast.error("Submission failed. Please try again.");
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
            expected_output: tc.expected_output,
            // V2 Fields
            mode: tc.mode || (question?.is_regex ? 'regex' : 'normal'), // Fallback for old data
            ignore_space: tc.ignore_space,
            ignore_case: tc.ignore_case,
            numeric_tolerance: tc.numeric_tolerance,

            // Regex support
            expected_regex: tc.expected_regex,
            match_mode: tc.match_mode,
            regex_flags: tc.regex_flags
        })) || [],
        filename: `solution_${Date.now()}`
      };

      // Updated URL
      const res = await fetch("https://compilers.milliongeniuscoders.com/api/execute/", {
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
    return <AssessmentLoading />;
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

  const renderLeftHeader = ({ isMaximized, isCollapsed, onMaximize, onCollapse }: any) => (
      <div className="p-4 pb-0 bg-white z-10 border-b border-gray-100 flex flex-col gap-4">
             {/* Nav & Title */}
             <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                       <Button 
                         startIcon={<LucideList size={18} />} 
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
                      <div className="h-4 w-px bg-gray-300 mx-2" />
                      <div className="flex gap-1">
                        <Tooltip title="Previous Question">
                            <span>
                                <IconButton 
                                disabled={!prevQuestionId} 
                                onClick={() => prevQuestionId && handleSwitchQuestion(prevQuestionId)}
                                size="small"
                                >
                                <ChevronLeft size={18} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Next Question">
                            <span>
                                <IconButton 
                                    disabled={!nextQuestionId} 
                                    onClick={() => nextQuestionId && handleSwitchQuestion(nextQuestionId)}
                                    size="small"
                                >
                                    <ChevronRight size={18} />
                                </IconButton>
                            </span>
                        </Tooltip>
                      </div>
                  </div>

                  <div className="flex items-center gap-2">
                         {/* EXIT BUTTON */}
                         <Button
                            onClick={handleExit}
                            variant="outlined"
                            color="inherit"
                            size="small"
                            startIcon={<LogOut size={16} />}
                            sx={{ 
                                textTransform: 'none', 
                                fontWeight: 600, 
                                borderRadius: '8px', 
                                color: 'text.secondary', 
                                borderColor: 'divider',
                                fontSize: '0.8rem',
                                height: 32,
                                minWidth: 80,
                                '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.300', color: 'error.main' } 
                            }}
                         >
                            Exit
                         </Button>

                         <div className="w-px h-6 bg-gray-200 mx-1" />

                        <Tooltip title={isMaximized ? "Restore" : "Maximize"}>
                            <IconButton onClick={onMaximize} size="small">
                                {isMaximized ? <WindowRestoreIcon size={16} /> : <WindowMaximizeIcon size={16} />}
                            </IconButton>
                        </Tooltip>
                        {!isMaximized && (
                            <Tooltip title="Collapse">
                                <IconButton onClick={onCollapse} size="small">
                                    <ChevronLeft size={16} />
                                </IconButton>
                            </Tooltip>
                        )}
                  </div>
             </div>

             <div className="">
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

             {/* Modern Tabs (Segmented Control - Squared) */}
             <div className="bg-gray-100/80 p-1 rounded-lg flex gap-1 mb-2 self-start">
                <button
                    onClick={() => setLeftTab(0)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${leftTab === 0 ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Description
                </button>
                {question.constraints && (
                    <button
                        onClick={() => setLeftTab(1)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${leftTab === 1 ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Constraints
                    </button>
                )}
             </div>
      </div>
  );

  const LeftContent = (
      <div className="h-full overflow-y-auto p-6 pt-6 no-scrollbar bg-white">
             {leftTab === 0 && (
                <div className="animate-in slide-in-from-bottom-2 fade-in duration-500 question-content-wrapper">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                        
                        /* Force wrapping for all content in description */
                        .question-content-wrapper {
                            width: 100%;
                            overflow-wrap: break-word;
                            word-wrap: break-word;
                            word-break: normal;
                            hyphens: manual;
                        }
                        .question-content-wrapper * {
                            max-width: 100% !important;
                            overflow-wrap: break-word !important; 
                            white-space: normal !important; 
                        }

                        .question-content-wrapper pre,
                        .question-content-wrapper code,
                        .question-content-wrapper pre code {
                            white-space: pre-wrap !important;
                            word-break: break-word !important;
                        }

                        .question-content-wrapper img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                        
                        .question-content-wrapper pre { 
                            overflow-x: hidden;
                            background-color: #f8fafc;
                            padding: 1rem;
                            border-radius: 0.75rem;
                            border: 1px solid #e2e8f0;
                            font-size: 0.9em;
                            color: #334155;
                        }
                        .question-content-wrapper table { display: block; overflow-x: auto; max-width: 100%; border-collapse: collapse; width: 100%; margin: 1rem 0; }
                        .question-content-wrapper th, .question-content-wrapper td { border: 1px solid #e2e8f0; padding: 0.5rem 1rem; }
                        .question-content-wrapper th { background: #f1f5f9; font-weight: 600; text-align: left; }
                    `}</style>

                    {/* Complexity Badges - Moved to Top for visibility */}
                    {(question.expected_time_complexity || question.expected_space_complexity) && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {question.expected_time_complexity && (
                                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100/50 shadow-sm transition-hover hover:bg-blue-100/50">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Time</span>
                                    <span className="font-mono text-xs font-bold">{question.expected_time_complexity}</span>
                                </div>
                            )}
                            {question.expected_space_complexity && (
                                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100/50 shadow-sm transition-hover hover:bg-purple-100/50">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Space</span>
                                    <span className="font-mono text-xs font-bold">{question.expected_space_complexity}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div
                      className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-normal question-content-wrapper prose-headings:text-slate-800 prose-headings:font-bold prose-p:mb-4 prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1 prose-code:rounded prose-code:font-semibold prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-100"
                      dangerouslySetInnerHTML={{ __html: question.content }}
                    />

                    {/* Example Cases - Modernized */}
                    {question.test_cases && question.test_cases.filter((tc: any) => tc.is_public).length > 0 && (
                        <div className="mt-8 space-y-5">
                             <div className="flex items-center gap-2">
                                <span className="h-px bg-slate-200 flex-1"></span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Examples</span>
                                <span className="h-px bg-slate-200 flex-1"></span>
                             </div>
                             
                             {question.test_cases.filter((tc: any) => tc.is_public).map((tc: any, i: number) => (
                                 <div key={i} className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                                     <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                                         <div className="flex items-center gap-2">
                                             <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"></div>
                                             <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700">Example {i + 1}</span>
                                         </div>
                                         {tc.description && <span className="text-[10px] text-slate-500 font-medium">{tc.description}</span>}
                                     </div>
                                     <div className="p-4 grid gap-4 bg-white">
                                         <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                                                <span className="w-1 h-3 bg-slate-200 rounded-sm"></span>
                                                Input
                                            </div>
                                            <code className="block bg-slate-50 border border-slate-100 text-slate-700 rounded-lg p-3 font-mono text-sm overflow-x-auto whitespace-pre leading-relaxed group-hover:border-indigo-100 transition-colors">{tc.input_data}</code>
                                         </div>
                                         <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                                                <span className="w-1 h-3 bg-indigo-200 rounded-sm"></span>
                                                Output
                                            </div>
                                            <code className="block bg-indigo-50/30 border border-indigo-100/50 text-indigo-900 rounded-lg p-3 font-mono text-sm overflow-x-auto whitespace-pre leading-relaxed">{tc.expected_output}</code>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
             )}

             {leftTab === 1 && question.constraints && (
                <div className="animate-in slide-in-from-bottom-2 fade-in duration-500">
                    <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3 text-amber-800">
                             <div className="p-1.5 bg-amber-100 rounded-lg">
                                <ErrorIcon sx={{ fontSize: 18, color: '#d97706' }} />
                             </div>
                             <h4 className="font-bold text-sm">Constraints & Limitations</h4>
                        </div>
                        <div 
                            className="text-amber-900/80 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2"
                            dangerouslySetInnerHTML={{ __html: question.constraints }} 
                        />
                    </div>
                </div>
             )}
      </div>
  );
  
  const renderRightTopHeader = ({ isMaximized, onMaximize }: any) => (
        <div className="h-14 bg-white flex items-center justify-between px-4 shrink-0 z-20">
             <div className="flex items-center gap-3">
                 <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                     <Code2 size={16} strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 leading-none tracking-tight">{question.programming_language || "Code"}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Editor</span>
                 </div>
             </div>

             <div className="flex items-center gap-3">
                 
                  <Tooltip title={isMaximized ? "Restore" : "Maximize"}>
                    <IconButton onClick={onMaximize} size="small" sx={{color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.50' }}}>
                        {isMaximized ? <WindowRestoreIcon size={16} /> : <WindowMaximizeIcon size={16} />}
                    </IconButton>
                 </Tooltip>

                 <div className="w-px h-5 bg-gray-100 mx-1" />

                 {/* Action Group */}
                 <div className="flex items-center p-1 rounded-xl bg-gray-50 border border-gray-100">
                         <Button
                            variant="text"
                            size="small"
                            onClick={() => setResetDialogOpen(true)}
                            startIcon={isResetting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            disabled={isResetting || submitting}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '8px',
                                color: 'text.secondary',
                                minWidth: 'auto',
                                px: 2,
                                fontSize: '0.8rem',
                                '&:hover': { bgcolor: 'white', color: 'error.main', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                            }}
                         >
                            Reset
                         </Button>
                         <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
                     <Button
                        variant="text"
                        size="small"
                        disabled={submitting}
                        onClick={handleCodeRun}
                        startIcon={submitting ? <Loader2 size={14} className="animate-spin" /> : <Play size={15} className="fill-current" />}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 600, 
                            borderRadius: '8px', 
                            color: 'text.secondary', 
                            minWidth: 'auto',
                            px: 2,
                            fontSize: '0.8rem',
                            '&:hover': { bgcolor: 'white', color: 'primary.main', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } 
                        }}
                     >
                        Run
                     </Button>
                     {editorLanguage === 'python' && (
                        <>
                            <div className="w-px h-4 bg-gray-200" />
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => setShowVisualizer(true)}
                                startIcon={<Eye size={15} />}
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 600, 
                                    borderRadius: '8px', 
                                    color: 'text.secondary', 
                                    minWidth: 'auto',
                                    px: 2,
                                    fontSize: '0.8rem',
                                    '&:hover': { bgcolor: 'white', color: 'primary.main', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } 
                                }}
                            >
                                Visualizer
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-600 border border-purple-200 uppercase tracking-wide">
                                    Beta
                                </span>
                            </Button>
                        </>
                     )}
                 </div>


                 <Button
                    variant="outlined"
                    size="small"
                    disabled={submitting}
                    onClick={() => setSaveDialogOpen(true)}
                    startIcon={isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={16} />}
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 600, 
                        borderRadius: '10px', 
                        fontSize: '0.85rem',
                        px: 2,
                        py: 0.8,
                        mr: 1.5,
                        borderColor: '#e0e7ff',
                        color: '#4f46e5',
                        '&:hover': { bgcolor: '#eef2ff', borderColor: '#c7d2fe' }
                    }}
                 >
                    Save
                 </Button>

                 <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={submitting}
                    onClick={() => setSubmitDialogOpen(true)}
                    startIcon={submitting ? <Loader2 size={14} className="animate-spin" /> : <CloudUploadIcon sx={{ fontSize: 18 }} />}
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 700, 
                        borderRadius: '10px', 
                        boxShadow: '0 2px 5px rgba(79, 70, 229, 0.2)',
                        fontSize: '0.85rem',
                        px: 2.5,
                        py: 0.8,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                        '&:hover': { boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)' }
                    }}
                 >
                    Submit
                 </Button>
                 
                
             </div>
        </div>
  );

  const RightTopContent = (
         <div className="h-full relative bg-[#1e1e1e]">
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
  );

   const renderRightBottomHeader = ({ isMaximized, isCollapsed, onMaximize, onCollapse }: any) => (
      <div className="flex items-center justify-between border-b border-gray-100 px-4 h-12 bg-white shrink-0">
            <div className="flex bg-gray-100/80 p-1 rounded-lg gap-1">
                <button
                    onClick={() => setActiveTab(0)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 0 ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                        <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 0 && result?.output ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        Output
                </button>
                <button
                    onClick={() => setActiveTab(1)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 1 ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                        {result?.status === 'passed' ? (
                            <CheckCircle2 size={14} className="text-green-500" />
                        ) : result?.status === 'failed' ? (
                            <XCircle size={14} className="text-red-500" />
                        ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 1 ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        )}
                        Test Results
                </button>
            </div>
            
            <div className="flex items-center gap-1">
                 <Tooltip title={isMaximized ? "Restore" : "Maximize"}>
                    <IconButton onClick={onMaximize} size="small" sx={{color: 'text.secondary'}}>
                        {isMaximized ? <WindowRestoreIcon size={16} /> : <WindowMaximizeIcon size={16} />}
                    </IconButton>
                 </Tooltip>
                 {!isMaximized && (
                    <Tooltip title="Collapse">
                        <IconButton onClick={onCollapse} size="small" sx={{color: 'text.secondary'}}>
                            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </IconButton>
                    </Tooltip>
                 )}
            </div>
      </div>
  );

  const RightBottomContent = (
      <div className="h-full flex flex-col overflow-hidden p-0 bg-white md:bg-gray-50/30">
               {activeTab === 0 && (
                  <div className="p-4 h-full relative overflow-y-auto no-scrollbar">
                      {result?.output ? (
                          <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-h-[50px]">
                              {result.output}
                          </pre>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                                <Terminal size={24} className="text-gray-300" />
                              </div>
                              <div className="text-center">
                                  <p className="text-sm font-semibold text-gray-500">No Output Yet</p>
                                  <p className="text-xs text-gray-400 mt-1">Run your code to see the execution results here.</p>
                              </div>
                          </div>
                      )}
                  </div>
               )}

               {activeTab === 1 && (
                  <div className="p-4 flex flex-col h-full overflow-hidden min-h-0">
                       {/* Summary Header - KEEPING THIS AS IS */}
                       <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0">
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result ? (result.status === 'passed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600') : 'bg-blue-50 text-blue-600'}`}>
                                   {result ? (
                                      result.status === 'passed' ? <CheckCircle /> : <ErrorIcon />
                                   ) : submitting ? (
                                      <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> 
                                   ) : (
                                      <PlayArrow />
                                   )}
                               </div>
                               <div className="flex flex-col">
                                   <span className={`text-sm font-bold ${result ? (result.status === 'passed' ? 'text-green-700' : 'text-red-700') : 'text-blue-700'}`}>
                                       {result ? (result.status === 'passed' ? 'Accepted' : 'Wrong Answer') : (submitting ? 'Running...' : 'Ready to Run')}
                                   </span>
                                   {result ? (
                                      <span className="text-[10px] text-slate-500 font-medium">
                                          {result.test_cases?.filter((t: any) => t.status==='passed').length} / {question.test_cases?.length} tests passed
                                      </span>
                                   ) : (
                                      <span className="text-[10px] text-slate-500 font-medium">
                                          {question.test_cases?.length} test cases available
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
                           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                               {result.test_cases.filter((_, idx) => question.test_cases?.[idx]?.is_public).map((tc, idx) => (
                                   <div key={idx} className="group bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-all shadow-sm">
                                       <div className={`h-1 w-full ${tc.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`} />
                                       <div className="p-3">
                                           <div className="flex justify-between items-center mb-2">
                                               <span className="text-xs font-bold text-slate-700">Case {idx + 1}</span>
                                               <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${tc.status === 'passed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                  {tc.status}
                                               </span>
                                           </div>
                                           
                                           {/* Vertical Stack Layout for Input/Exp/Actual */}
                                           {/* Single Line Grid Layout for Input/Exp/Actual */}
                                           <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-gray-50/50 p-2.5 rounded-md items-center">
                                                {/* Input */}
                                                <Tooltip title={tc.input} arrow placement="top">
                                                    <div className="flex gap-1 overflow-hidden">
                                                        <span className="text-gray-400 font-bold shrink-0">In:</span>
                                                        <span className="text-gray-700 truncate">{tc.input}</span>
                                                    </div>
                                                </Tooltip>

                                                {/* Expected */}
                                                <Tooltip title={tc.expected_output} arrow placement="top">
                                                    <div className="flex gap-1 overflow-hidden">
                                                        <span className="text-gray-400 font-bold shrink-0">Exp:</span>
                                                        <span className="text-green-700 truncate">{tc.expected_output}</span>
                                                    </div>
                                                </Tooltip>

                                                {/* Actual (Result) */}
                                                {tc.status !== 'passed' ? (
                                                    <Tooltip title={tc.actual_output} arrow placement="top">
                                                        <div className="flex gap-1 overflow-hidden bg-red-50 px-1 rounded border border-red-100">
                                                            <span className="text-red-400 font-bold shrink-0">Got:</span>
                                                            <span className="text-red-700 font-bold truncate">{tc.actual_output}</span>
                                                        </div>
                                                    </Tooltip>
                                                ) : (
                                                    <div className="flex gap-1 overflow-hidden items-center text-green-600">
                                                        <CheckCircle style={{ fontSize: 14 }} />
                                                        <span className="font-bold">Passed</span>
                                                    </div>
                                                )}
                                           </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                               {question.test_cases?.filter((t: any) => t.is_public).map((tc: any, idx: number) => (
                                  <div key={idx} className="group bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                                      <div className="h-1 w-full bg-gray-200 group-hover:bg-blue-200 transition-colors" />
                                      <div className="p-3">
                                           <div className="flex justify-between items-center mb-2">
                                               <span className="text-xs font-bold text-slate-700">Case {idx + 1}</span>
                                               <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                                  Waiting
                                               </span>
                                           </div>
                                           <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-gray-50/50 p-2.5 rounded-md items-center">
                                                <Tooltip title={tc.input_data} arrow placement="top">
                                                    <div className="flex gap-1 overflow-hidden">
                                                        <span className="text-gray-400 font-bold shrink-0">In:</span>
                                                        <span className="text-gray-700 truncate">{tc.input_data}</span>
                                                    </div>
                                                </Tooltip>
                                                <Tooltip title={tc.expected_output} arrow placement="top">
                                                    <div className="flex gap-1 overflow-hidden">
                                                        <span className="text-gray-400 font-bold shrink-0">Exp:</span>
                                                        <span className="text-gray-700 truncate">{tc.expected_output}</span>
                                                    </div>
                                                </Tooltip>
                                           </div>
                                      </div>
                                  </div> 
                               ))}
                           </div>
                       )}
                  </div>
               )}
      </div>
  );

  return (
    <div className="h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* DRAWER FOR TOPIC TOGGLE */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
            sx: { width: 450, borderRadius: '0 16px 16px 0', border: 'none' }
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

      <ThreePaneLayout
        leftContent={LeftContent}
        rightTopContent={RightTopContent}
        rightBottomContent={RightBottomContent}
        renderLeftHeader={renderLeftHeader}
        renderRightTopHeader={renderRightTopHeader}
        renderRightBottomHeader={renderRightBottomHeader}
      />
      
    {/* VISUALIZER DIALOG */}
       <Dialog 
        open={showVisualizer} 
        onClose={() => setShowVisualizer(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
            sx: { 
              height: '85vh', 
              borderRadius: 3,
              bgcolor: '#0f172a', // Dark background for the whole dialog
              color: 'white'
            }
        }}
      >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid rgba(255,255,255,0.1)', // Subtle border
            bgcolor: '#1e293b', // Slightly lighter dark for header
            px: 3, 
            py: 2 
          }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                  <TerminalIcon fontSize="small" />
                </div>
                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '0.5px' }}>
                  Code Visualization
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setShowVisualizer(false)} 
                size="small"
                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                  <CloseIcon />
              </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, overflow: 'hidden', height: '100%', bgcolor: '#0f172a' }}>
              <PythonVisualizer code={code} onChangeCode={setCode} />
          </DialogContent>
      </Dialog>


      {/* SUBMIT CONFIRMATION DIALOG */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
            sx: { borderRadius: 4, width: '100%', maxWidth: 460, overflow: 'visible' } // Overflow visible for aesthetic effects if needed
        }}
      >
          <div className="p-0">
               {/* Header Background */}
               <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-t-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CloudUploadIcon sx={{ fontSize: 120 }} />
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/30">
                            <CloudUploadIcon sx={{ fontSize: 32, color: 'white' }} />
                        </div>
                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                            Submit Solution?
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9, px: 2, lineHeight: 1.5 }}>
                            Ready to test your code? This will run against all test cases and record your score.
                        </Typography>
                    </div>
               </div>
               
               <div className="p-6 flex flex-col gap-3">
                   {/* Primary Action: Submit */}
                   <Button 
                     onClick={handleConfirmSubmit}
                     variant="contained" 
                     fullWidth
                     size="large"
                     disabled={submitting}
                     startIcon={submitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                     sx={{ 
                         borderRadius: 3, 
                         textTransform: 'none', 
                         fontWeight: 700, 
                         height: 56,
                         fontSize: '1.05rem',
                         background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                         boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                         '&:hover': { 
                            background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)', 
                            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
                            transform: 'translateY(-1px)'
                         },
                         transition: 'all 0.2s ease'
                     }}
                   >
                       {submitting ? 'Submitting...' : 'Confirm Submission'}
                   </Button>
                   
                   <Button 
                     onClick={() => setSubmitDialogOpen(false)}
                     variant="text" 
                     fullWidth
                     sx={{ 
                         mt: 1, 
                         borderRadius: 3, 
                         textTransform: 'none', 
                         fontWeight: 600, 
                         color: 'text.secondary',
                         height: 48,
                         '&:hover': { bgcolor: 'gray.50', color: 'text.primary' }
                     }}
                   >
                       Cancel
                   </Button>
               </div>
          </div>
      </Dialog>

      {/* SAVE OPTIONS DIALOG */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
            sx: { borderRadius: 4, width: '100%', maxWidth: 520 }
        }}
      >
          <div className="p-6">
               <div className="mb-6">
                   <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                             <Save size={20} />
                        </div>
                        <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a' }}>
                            Save Progress
                        </Typography>
                   </div>
                   <Typography variant="body2" color="text.secondary" sx={{ ml: 1, lineHeight: 1.6 }}>
                       Choose how you want to save your current work.
                   </Typography>
               </div>
               
               <div className="flex flex-col gap-3">
                    {/* Action Card: Save Draft */}
                    <button
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left w-full outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Save Draft</h4>
                            <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                                Save your changes and continue working on this question.
                            </p>
                        </div>
                    </button>

                    {/* Action Card: Save & Exit */}
                    <button
                        onClick={handleSaveAndExit}
                        disabled={isSaving}
                        className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left w-full outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">Save & Exit</h4>
                            <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                                Save your progress and return to the question list.
                            </p>
                        </div>
                    </button>
                    
                   <Button 
                     onClick={() => setSaveDialogOpen(false)}
                     variant="text" 
                     fullWidth
                     sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary', height: 48 }}
                   >
                       Cancel
                   </Button>
               </div>
          </div>
      </Dialog>

      {/* EXIT CONFIRMATION DIALOG */}
      <Dialog
        open={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
            sx: { 
                borderRadius: 4, 
                width: '100%', 
                maxWidth: 480,
                p: 1
            }
        }}
      >
          <div className="p-6 text-center">
               <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5 text-red-600 shadow-sm ring-4 ring-red-50/50">
                   <LogOut size={32} />
               </div>
               <Typography variant="h5" fontWeight={800} gutterBottom sx={{ color: '#111827' }}>
                   Exit Assessment?
               </Typography>
               <Typography variant="body1" color="text.secondary" sx={{ mb: 5, px: 2, lineHeight: 1.6 }}>
                   Are you sure you want to exit? Your progress is saved, but you will leave the current session.
               </Typography>
               
               <div className="flex gap-3">
                   <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => setExitDialogOpen(false)}
                    sx={{ 
                        borderRadius: '12px', 
                        height: 48,
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderColor: 'gray.200',
                        color: 'gray.700',
                        fontSize: '1rem',
                        '&:hover': { borderColor: 'gray.400', bgcolor: 'gray.50' }
                    }}
                   >
                       Cancel
                   </Button>
                   <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={confirmExit}
                    sx={{ 
                        borderRadius: '12px', 
                        height: 48,
                        textTransform: 'none', 
                        fontWeight: 700,
                        fontSize: '1rem',
                        bgcolor: '#ef4444',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                        '&:hover': { bgcolor: '#dc2626', boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)' }
                    }}
                   >
                       Confirm Exit
                   </Button>
               </div>
          </div>
      </Dialog>
      
      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        PaperProps={{
            sx: { borderRadius: '12px', padding: '8px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RefreshCw size={20} className="text-orange-500" />
            Reset to Starter Code?
        </DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary">
                This will permanently delete your current code and revert it to the original starter code. This action cannot be undone.
            </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: '16px' }}>
            <Button 
                onClick={() => setResetDialogOpen(false)}
                variant="outlined"
                color="inherit"
                sx={{ textTransform: 'none', borderRadius: '8px' }}
            >
                Cancel
            </Button>
            <Button 
                onClick={handleReset} 
                variant="contained" 
                color="warning"
                autoFocus
                sx={{ textTransform: 'none', borderRadius: '8px', boxShadow: 'none' }}
            >
                Yes, Reset Code
            </Button>
        </DialogActions>
      </Dialog>
      
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </div>
  );
};

export default CodeRunnerInterface;
