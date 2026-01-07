"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
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
  test_cases?: TestCaseResult[];
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

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState("// Loading...");
  const [languageId, setLanguageId] = useState<number>(1);
  const [editorLanguage, setEditorLanguage] = useState<string>("php");

  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [leftTab, setLeftTab] = useState(0); // 0 = Description, 1 = Constraints

  // Drawer & Topic Questions State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [topicQuestions, setTopicQuestions] = useState<TopicQuestion[]>([]);
  const [loadingTopicQuestions, setLoadingTopicQuestions] = useState(false);
  
  // Mobile Tab State: 0 = Problem, 1 = Code, 2 = Result
  const [mobileTab, setMobileTab] = useState(0);

  // Sync prop change
  useEffect(() => {
    setCurrentQuestionId(propQuestionId);
  }, [propQuestionId]);

  // Derived Navigation
  const currentIndex = topicQuestions.findIndex(q => q.id.toString() === currentQuestionId);
  const prevQuestionId = currentIndex > 0 ? topicQuestions[currentIndex - 1].id : null;
  const nextQuestionId = currentIndex >= 0 && currentIndex < topicQuestions.length - 1 ? topicQuestions[currentIndex + 1].id : null;

  /* ================= FETCH QUESTION ================= */
  
  const BASE_URL = process.env.LARAVEL_API_URL || "https://api.microcollege.in/api";

  useEffect(() => {
    const fetchQuestion = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        console.log("[CodeRunner] Starting fetchQuestion", { currentQuestionId, token });
        setLoading(true);
        setQuestion(null); 
        setError(null);

        const headers: HeadersInit = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        console.log("[CodeRunner] sending request to:", `${BASE_URL}/code-runner/questions/${currentQuestionId}`);
        const res = await fetch(
          `${BASE_URL}/code-runner/questions/${currentQuestionId}`,
          { headers, signal: controller.signal }
        );
        clearTimeout(timeoutId);

        console.log("[CodeRunner] Response received", res.status);

        if (res.status === 401) {
            console.error("Unauthorized: Redirecting to login...");
            signOut({ callbackUrl: '/' }); 
            return;
        }

        if (!res.ok) {
            const text = await res.text();
            console.error("[CodeRunner] Fetch Error Body:", text);
            throw new Error(`Failed to fetch question: ${res.statusText}`);
        }

        const json = await res.json();
        const data = json.data ?? json;

        console.log("Question Data:", data);

        setQuestion(data);

        // Prep editor code
        if (data.user_code) {
           setCode(data.user_code);
        } else if (data.starter_code) {
           setCode(data.starter_code);
        }
        
        if (data.programming_language_id)
          setLanguageId(data.programming_language_id);

        if (data.programming_language) {
          const lang = data.programming_language.toLowerCase();
          if (lang.includes("python")) setEditorLanguage("python");
          else if (lang.includes("java")) setEditorLanguage("java");
          else if (lang.includes("php")) setEditorLanguage("php");
          else if (lang.includes("script")) setEditorLanguage("javascript");
          else setEditorLanguage(lang);
        }

        // Fetch Topic Questions if valid topic_id
        if (data.topic_id) {
            fetchTopicQuestions(data.topic_id, headers);
        }

      } catch (e: any) {
        if (e.name === 'AbortError') {
             console.error("[CodeRunner] Fetch timeout");
             setError("Request timed out. Please check backend connection.");
        } else {
             console.error("[CodeRunner] Exception:", e);
             setError(`Unable to load question: ${e.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentQuestionId) {
        fetchQuestion();
    }
  }, [currentQuestionId, token]);

  const fetchTopicQuestions = async (topicId: number, headers: HeadersInit) => {
      try {
          if (topicQuestions.length > 0 && topicQuestions[0].id !== topicId) {
             // Optimistic caching could trigger here
          }
          
          setLoadingTopicQuestions(true);
          const res = await fetch(`${BASE_URL}/code-runner/topics/${topicId}/questions`, { headers });
          if (res.ok) {
              const json = await res.json();
              setTopicQuestions(json.data || []);
          }
      } catch (e) {
          console.error("Failed to load topic questions", e);
      } finally {
          setLoadingTopicQuestions(false);
      }
  };

  /* ================= SUBMIT CODE ================= */

  const handleCodeSubmit = async () => {
      try {
        setSubmitting(true);
        
        // --- RUN LOGIC (EXECUTE ON COMPILER FIRST) ---
        const langMap: Record<string, string> = {
          python: "1", java: "2", c: "3", cpp: "4", "c++": "4", javascript: "10", js: "10", node: "10", php: "1"
        };
        const langKey = (question?.programming_language?.toLowerCase() || editorLanguage || "").replace(" language", "");
        const compilerLangId = langMap[langKey] || "1";
        const runPayload = {
          code,
          language: compilerLangId,
          test_cases: question?.test_cases?.map(tc => ({ input: tc.input_data, expected_output: tc.expected_output })) || [],
          filename: `solution_${Date.now()}`
        };
        
        let executionData: any = null;
        try {
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
        
        setResult({
          status: allPassed ? "passed" : "failed",
          output: mainOutput,
          test_cases: mappedTestCases
        });

        // 2. Submit to Backend
        const headers: HeadersInit = { "Content-Type": "application/json", Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const backendPayload = {
            question_id: currentQuestionId, // Use currentQuestionId state
            code,
            language_id: languageId,
            execution_results: {
                output: mainOutput,
                test_cases: mappedTestCases.map((tc: any) => ({
                    passed: tc.status === 'passed',
                    output: tc.actual_output,
                }))
            }
        };

        const submitRes = await fetch(`${BASE_URL}/code-runner/submit`, {
            method: "POST", headers, body: JSON.stringify(backendPayload),
        });

        if (submitRes.status === 401) {
             signOut({ callbackUrl: '/' });
             return;
        }

        if (!submitRes.ok) throw new Error("Submission failed");
        
        // Refresh topic questions to update 'solved' status if passed
        if (allPassed && question?.topic_id) {
            fetchTopicQuestions(question.topic_id, headers);
        }
        
        setActiveTab(1); // Switch to results

      } catch (e) {
          console.error(e);
          setResult({ status: "error", output: "Submission failed. Please try again." });
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
        test_cases: question?.test_cases?.map(tc => ({
            input: tc.input_data,
            expected_output: tc.expected_output
        })) || [],
        filename: `solution_${Date.now()}`
      };

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

      const allPassed = mappedTestCases.every(tc => tc.status === "passed");
      const mainOutput = data?.[0]?.output || "";

      setResult({
        status: allPassed ? "passed" : "failed",
        output: mainOutput,
        test_cases: mappedTestCases
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
      <div className="w-5/12 bg-white border-r flex flex-col relative">
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

        <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
             {leftTab === 0 && (
                <>
                    <div
                      className="prose max-w-none text-slate-700 leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: question.content }}
                    />

                    {question.test_cases && question.test_cases.filter(tc => tc.is_public).length > 0 && (
                        <div className="mt-8">
                             <Accordion defaultExpanded variant="outlined" sx={{ borderRadius: 2 }}>
                                 <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                     <Typography variant="subtitle2" fontWeight={700}>Examples</Typography>
                                 </AccordionSummary>
                                 <AccordionDetails sx={{ p: 0 }}>
                                     <div className="flex flex-col">
                                         {question.test_cases.filter(tc => tc.is_public).map((tc, i) => (
                                             <div key={i} className={`p-4 ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                                                 <div className="flex items-start gap-4 text-xs font-mono">
                                                     <div className="flex-1">
                                                         <span className="text-slate-500 font-semibold block mb-1">Input:</span>
                                                         <div className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-800 break-all">
                                                             {tc.input_data}
                                                         </div>
                                                     </div>
                                                     <div className="flex-1">
                                                         <span className="text-slate-500 font-semibold block mb-1">Output:</span>
                                                         <div className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-800 break-all">
                                                             {tc.expected_output}
                                                         </div>
                                                     </div>
                                                 </div>
                                                 {tc.description && (
                                                     <div className="mt-2 text-xs text-slate-500 italic">
                                                         Note: {tc.description}
                                                     </div>
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                 </AccordionDetails>
                             </Accordion>
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
                          
                          {question.test_cases.filter(tc => tc.is_public).length > 0 ? (
                              question.test_cases.filter(tc => tc.is_public).map((tc, i) => (
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
          </Box>
        </div>
      </div>
    </div>
  );
};

export default CodeRunnerInterface;
