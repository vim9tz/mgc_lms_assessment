"use client";

import React, { useEffect, useState } from "react";
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
  Description,
  QueryStats
} from "@mui/icons-material";

// Monaco editor (client-only)
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const ComplexityChart = dynamic(() => import("./ComplexityChart"), { ssr: false });
import { ComplexityComparison } from "./components/ComplexityComparison";

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
    <div className="flex h-screen bg-gray-100">
      
      {/* DRAWER FOR TOPIC TOGGLE */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
            sx: { width: 320 }
        }}
      >
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center" borderBottom={1} borderColor="divider">
              <Typography variant="h6" fontWeight={600}>Topic Questions</Typography>
              <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
          </Box>
          <List>
              {loadingTopicQuestions && <Box p={2} textAlign="center"><CircularProgress size={24} /></Box>}
              {!loadingTopicQuestions && topicQuestions.map(q => {
                  const isCurrent = q.id.toString() === currentQuestionId;
                  
                  let StatusIcon = <div className="w-3 h-3 rounded-full bg-gray-300" />;
                  if (q.status === 'solved') {
                      StatusIcon = <div className="w-3 h-3 rounded-full bg-green-500" />;
                  } else if (q.status === 'attempted') {
                      StatusIcon = <div className="w-3 h-3 rounded-full bg-orange-400" />;
                  }

                  return (
                      <ListItem key={q.id} disablePadding>
                          <ListItemButton 
                             selected={isCurrent}
                             onClick={() => handleSwitchQuestion(q.id)}
                          >
                              <ListItemIcon sx={{ minWidth: 24, pr: 1 }}>
                                  {StatusIcon}
                              </ListItemIcon>
                              <ListItemText 
                                  primary={q.title} 
                                  secondary={q.difficulty.toUpperCase()}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: isCurrent ? 700 : 400 }}
                                  secondaryTypographyProps={{ variant: 'caption', color: q.difficulty === 'easy' ? 'green' : q.difficulty === 'medium' ? 'orange' : 'red' }}
                              />
                          </ListItemButton>
                      </ListItem>
                  );
              })}
              {!loadingTopicQuestions && topicQuestions.length === 0 && (
                  <Box p={2} textAlign="center" color="text.secondary">No other questions found.</Box>
              )}
          </List>
      </Drawer>


      {/* LEFT PANEL */}
      <div className="w-5/12 bg-white border-r flex flex-col relative overflow-hidden">
        <div className="p-6 pb-2 bg-white z-10 sticky top-0">
             {/* TOPIC BUTTON & NAVIGATION */}
             <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Button 
                     startIcon={<ListIcon />} 
                     variant="outlined" 
                     size="small"
                     onClick={() => setDrawerOpen(true)}
                  >
                     Questions
                  </Button>

                  <Box display="flex" gap={1}>
                      <IconButton 
                         disabled={!prevQuestionId} 
                         onClick={() => prevQuestionId && handleSwitchQuestion(prevQuestionId)}
                         size="small"
                         aria-label="Previous Question"
                      >
                         <NavigateBefore />
                      </IconButton>
                      <IconButton 
                         disabled={!nextQuestionId} 
                         onClick={() => nextQuestionId && handleSwitchQuestion(nextQuestionId)}
                         size="small"
                         aria-label="Next Question"
                      >
                         <NavigateNext />
                      </IconButton>
                  </Box>
             </Box>

             <Typography variant="h5" fontWeight={700}>
               {question.title}
             </Typography>

             <Chip
               label={question.difficulty.toUpperCase()}
               color={
                 question.difficulty === "easy"
                   ? "success"
                   : question.difficulty === "medium"
                   ? "warning"
                   : "error"
               }
               size="small"
               className="mt-2"
             />

             {(result?.time_complexity || result?.space_complexity) && (
                <div className="mt-3 flex gap-3 flex-wrap">
                    {result.time_complexity && (
                        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-medium">
                            Time: {result.time_complexity}
                        </div>
                    )}
                    {result.space_complexity && (
                        <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-medium">
                            Space: {result.space_complexity}
                        </div>
                    )}
                </div>
             )}
        </div>
        
        {/* TAB HEADERS */}
        <div className="px-6 border-b sticky top-[140px] bg-white z-10">
             <Tabs value={leftTab} onChange={(_, v) => setLeftTab(v)} aria-label="Problem Tabs">
                 <Tab label="Description" sx={{ textTransform: 'none', minWidth: 'auto', mr: 2, fontWeight: 600 }} />
                 {question.constraints && (
                     <Tab label="Constraints" sx={{ textTransform: 'none', minWidth: 'auto', fontWeight: 600 }} />
                 )}
             </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-4 custom-scrollbar" style={{ maxWidth: '100%' }}>
             {leftTab === 0 && (
                <>
                    <div
                      className="prose text-slate-700 leading-relaxed text-sm question-content"
                      style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        hyphens: 'auto',
                        maxWidth: '100%',
                        width: '100%'
                      }}
                      dangerouslySetInnerHTML={{ __html: question.content }}
                    />
                    <style>{`
                      .question-content,
                      .question-content * {
                        max-width: 100% !important;
                        word-break: break-word !important;
                        overflow-wrap: anywhere !important;
                      }
                      .question-content pre, 
                      .question-content code {
                        white-space: pre-wrap !important;
                        word-break: break-all !important;
                        overflow-wrap: anywhere !important;
                      }
                      .question-content img, 
                      .question-content table {
                        max-width: 100% !important;
                      }
                      .question-content p,
                      .question-content li,
                      .question-content span,
                      .question-content div {
                        word-break: break-word !important;
                        overflow-wrap: anywhere !important;
                      }
                    `}</style>

                    {/* EXPECTED COMPLEXITY BADGES */}
                    {(question.expected_time_complexity || question.expected_space_complexity) && (
                        <div className="flex flex-wrap gap-4 mt-6 mb-6">
                            {question.expected_time_complexity && (
                                <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-lg text-sm text-blue-700 shadow-sm transition-all hover:shadow-md hover:bg-blue-50">
                                    <span className="font-semibold text-[10px] uppercase tracking-wider text-blue-400">Time</span>
                                    <span className="font-bold font-mono">{question.expected_time_complexity}</span>
                                </div>
                            )}
                            {question.expected_space_complexity && (
                                <div className="flex items-center gap-2 bg-purple-50/50 border border-purple-100 px-3 py-1.5 rounded-lg text-sm text-purple-700 shadow-sm transition-all hover:shadow-md hover:bg-purple-50">
                                    <span className="font-semibold text-[10px] uppercase tracking-wider text-purple-400">Space</span>
                                    <span className="font-bold font-mono">{question.expected_space_complexity}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* LIVE EXECUTION STATS (IN DESCRIPTION) */}
                    {result && (
                        <div className="mb-8 mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                             <div className="bg-white border boundary-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                          <div className={`w-2.5 h-2.5 rounded-full ${result.status === 'passed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}></div>
                                          <span className="font-bold tracking-tight text-sm text-slate-800">Execution Result</span>
                                      </div>
                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${result.status === 'passed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                          {result.status.toUpperCase()}
                                      </span>
                                  </div>

                                  <div className="flex items-end gap-1 mb-2">
                                      <span className={`text-3xl font-extrabold ${result.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                                          {result.test_cases?.filter(tc => tc.status === 'passed').length}
                                      </span>
                                      <span className="text-sm text-slate-500 mb-1.5 font-medium">
                                          / {question.test_cases?.length || 0} Test Cases Passed
                                      </span>
                                  </div>
                                  
                                  {/* Progress Bar */}
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4 border border-slate-200">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${result.status === 'passed' ? 'bg-green-500' : 'bg-orange-500'}`}
                                        style={{ width: `${(result.test_cases?.filter(tc => tc.status === 'passed').length || 0) / (question.test_cases?.length || 1) * 100}%` }}
                                      ></div>
                                  </div>

                                  {(result.time_complexity || result.space_complexity) && (
                                     <div className="flex flex-col gap-4 pt-3 border-t border-slate-100">
                                         {/* Text Stats */}
                                         <div className="flex gap-4">
                                            {result.time_complexity && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Time Complexity</span>
                                                    <span className="text-xs font-mono font-semibold text-blue-600 mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block w-fit">{result.time_complexity}</span>
                                                </div>
                                            )}
                                            {result.space_complexity && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Space Complexity</span>
                                                    <span className="text-xs font-mono font-semibold text-purple-600 mt-0.5 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block w-fit">{result.space_complexity}</span>
                                                </div>
                                            )}
                                         </div>

                                       {(question.expected_time_complexity || question.expected_space_complexity) && (
  <div className="relative overflow-hidden mt-6 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
    {/* Subtle Background */}
    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-slate-50/50 to-white/0" />
    
    <div className="relative rounded-xl p-6 bg-white/60">
      {/* Header with improved typography */}
      <div className="flex flex-col items-center mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60">
          Analytics Engine
        </span>
        <h3 className="text-lg font-bold text-slate-800">
          Performance Analysis
        </h3>
        <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
      </div>

      {/* Charts Grid - Fixed width and spacing */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Time Complexity Card */}
        {question.expected_time_complexity && result.time_complexity && (
          <div className="group relative flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
            <div className="w-full flex justify-center overflow-visible"> 
              {/* Ensure ComplexityChart has 'responsive: true' in its config */}
              <ComplexityChart
                type="Time"
                expected={question.expected_time_complexity}
                actual={result.time_complexity}
              />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">
              Runtime Efficiency
            </p>
          </div>
        )}

        {/* Space Complexity Card */}
        {question.expected_space_complexity && result.space_complexity && (
          <div className="group relative flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
            <div className="w-full flex justify-center overflow-visible">
              <ComplexityChart
                type="Space"
                expected={question.expected_space_complexity}
                actual={result.space_complexity}
              />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition-colors">
              Memory Footprint
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
                                     </div>
                                  )}
                             </div>
                        </div>
                    )}

                    {question.test_cases && question.test_cases.filter((tc: any) => tc.is_public).length > 0 && (
                        <div className="mt-8">
                             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
                                Example Test Cases
                             </h3>
                             
                             <div className="flex flex-col gap-4">
                                 {question.test_cases.filter((tc: any) => tc.is_public).map((tc: any, i: number) => (
                                     <div key={i} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                         <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
                                         
                                         <div className="p-4 pl-6">
                                             <div className="flex justify-between items-center mb-3">
                                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example {i + 1}</span>
                                                 {tc.description && (
                                                     <span className="text-xs text-slate-500 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{tc.description}</span>
                                                 )}
                                             </div>
                                             
                                             <div className="grid gap-3">
                                                 <div>
                                                     <div className="flex items-center gap-2 mb-1">
                                                         <span className="text-xs font-semibold text-slate-600">Input</span>
                                                     </div>
                                                     <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-sm text-slate-700 overflow-x-auto">
                                                         {tc.input_data}
                                                     </div>
                                                 </div>
                                                 <div>
                                                     <div className="flex items-center gap-2 mb-1">
                                                         <span className="text-xs font-semibold text-slate-600">Output</span>
                                                     </div>
                                                     <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-sm text-slate-700 overflow-x-auto">
                                                         {tc.expected_output}
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </>
             )}

             {leftTab === 1 && question.constraints && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="prose max-w-none text-slate-700 bg-yellow-50/50 p-4 rounded-lg border border-yellow-100/50">
                         <div dangerouslySetInnerHTML={{ __html: question.constraints }} />
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* RIGHT PANEL (Editor) */}
      <div className="w-7/12 flex flex-col bg-[#1e1e1e]">
        <div className="flex items-center justify-between px-4 h-12 bg-[#252526]">
          <div className="flex items-center gap-2 text-gray-300">
            <CodeIcon fontSize="small" />
            {question.programming_language || "Code"}
          </div>

          <Button
            size="small"
            variant="contained"
            startIcon={
              submitting ? <CircularProgress size={16} /> : <PlayArrow />
            }
            disabled={submitting}
            onClick={handleCodeRun}
          >
            {submitting ? "Running..." : "Run Code"}
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />
            }
            disabled={submitting}
            onClick={handleCodeSubmit}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>

        <Editor
          height="100%"
          language={editorLanguage}
          value={code}
          onChange={(v) => setCode(v || "")}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 14 }}
        />

        {/* OUTPUT */}
        <div className="bg-white h-2/5 border-t flex flex-col min-h-0">
          <div className="shrink-0 bg-gray-50 border-b px-2">
            <Tabs 
                value={activeTab} 
                onChange={(_, v) => setActiveTab(v)}
                sx={{ minHeight: 40 }}
            >
            <Tab 
                icon={<TerminalIcon sx={{ fontSize: 16 }} />} 
                iconPosition="start"
                label="Output" 
                sx={{ 
                    minHeight: 40, 
                    fontSize: '0.75rem', 
                    textTransform: 'none', 
                    py: 1 
                }}
            />
            <Tab
              icon={
                result?.status === "passed" ? (
                  <CheckCircle color="success" sx={{ fontSize: 16 }} />
                ) : (
                  result?.status === "failed" ? (
                     <ErrorIcon color="error" sx={{ fontSize: 16 }} />
                  ) : <div className="w-4 h-4 bg-gray-300 rounded-full" />
                )
              }
              iconPosition="start"
              label="Tests"
              sx={{ 
                minHeight: 40, 
                fontSize: '0.75rem', 
                textTransform: 'none', 
                py: 1
              }}
            />
            <Tab
              icon={<QueryStats sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Analysis"
              sx={{ 
                minHeight: 40, 
                fontSize: '0.75rem', 
                textTransform: 'none', 
                py: 1
              }}
            />
          </Tabs>
          </div>

          <Box p={0} className="flex-1 overflow-y-auto min-h-0 bg-white custom-scrollbar">
            {activeTab === 0 && (
              <pre className="p-4 whitespace-pre-wrap text-sm font-mono text-gray-700">{result?.output || <span className="text-gray-400 italic">Run code to see output...</span>}</pre>
            )}

            {activeTab === 1 && (
               <div className="p-4 space-y-4">
                  
                  {/* Summary Stats (Compact) */}
                  <div className="flex items-center gap-4 text-sm bg-gray-50 border border-gray-100 rounded-md p-2 px-3">
                        <div className="flex items-center gap-2">
                             <span className="text-gray-500 font-medium">Total Cases:</span>
                             <span className="font-bold text-gray-800">{question?.test_cases?.length || 0}</span>
                        </div>
                        {result && (
                            <>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-medium">Passed:</span>
                                    <span className={`font-bold ${result.test_cases?.every(t => t.status === 'passed') ? 'text-green-600' : 'text-gray-800'}`}>
                                        {result.test_cases?.filter(tc => tc.status === 'passed').length ?? 0}
                                    </span>
                                </div>
                            </>
                        )}
                  </div>

                  {/* CASE 1: NO RESULT (Initial) */}
                  {(!result && question?.test_cases) && (
                      <div className="space-y-1">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Public Test Cases</div>
                          
                          {question.test_cases.filter((tc: any) => tc.is_public).length > 0 ? (
                              question.test_cases.filter((tc: any) => tc.is_public).map((tc: any, i: number) => (
                                 <div key={i} className="group flex flex-col gap-1 p-2 rounded-md border border-transparent hover:bg-gray-50 hover:border-gray-100 transition-all">
                                     <div className="flex items-center justify-between">
                                         <span className="text-xs font-semibold text-gray-700">{tc.description || `Case ${i + 1}`}</span>
                                         <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">Public</span>
                                     </div>
                                     <div className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-1 text-xs font-mono text-gray-600 mt-1">
                                         <span className="text-gray-400">In:</span>
                                         <span className="truncate">{tc.input_data}</span>
                                         <span className="text-gray-400">Out:</span>
                                         <span className="truncate">{tc.expected_output}</span>
                                     </div>
                                 </div>
                              ))
                          ) : (
                              <div className="text-xs text-gray-400 italic pl-1">No public test cases to display.</div>
                          )}
                      </div>
                  )}

                  {/* CASE 2: RESULTS (Minimal List) */}
                  {result?.test_cases && (
                     <div className="space-y-2">
                        {result.test_cases
                            .map((tc, i) => ({ ...tc, originalIndex: i }))
                            .filter((_, i) => question?.test_cases?.[i]?.is_public)
                            .map((tc, index) => (
                                <div key={tc.originalIndex} className="flex items-start gap-3 p-2 rounded-md text-sm border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors">
                                    {/* Icon */}
                                    <div className="mt-0.5">
                                        {tc.status === "passed" 
                                            ? <CheckCircle className="text-green-500" sx={{ fontSize: 18 }} />
                                            : <ErrorIcon className="text-red-500" sx={{ fontSize: 18 }} />
                                        }
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-700 text-xs">Test Case {tc.originalIndex + 1}</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs font-mono">
                                            <span className="text-gray-400 select-none">Input:</span>
                                            <span className="text-gray-800 break-words">{tc.input}</span>
                                            
                                            <span className="text-gray-400 select-none">Expected:</span>
                                            <span className="text-gray-800 break-words">{tc.expected_output}</span>
                                            
                                            {tc.status !== 'passed' && (
                                                <>
                                                    <span className="text-red-400 select-none font-medium">Actual:</span>
                                                    <span className="text-red-700 break-words font-medium">{tc.actual_output}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                     </div>
                  )}
               </div>
            )}

            {activeTab === 2 && (
                <div className="p-4">
                    <ComplexityComparison 
                        code={code} 
                        language={editorLanguage}
                        compilerStats={{
                            runtime: result?.runtime || 0,
                            memory: result?.memory || 0,
                            timeComplexity: result?.time_complexity,
                            spaceComplexity: result?.space_complexity
                        }}
                    />
                </div>
            )}
          </Box>
        </div>
      </div>
    </div>
  );
};

export default CodeRunnerInterface;
