import React, { useEffect, useState } from "react";
import { CircularProgress, Box, IconButton, Tooltip } from "@mui/material";
import { KeyboardDoubleArrowRight } from "@mui/icons-material";
import { CodeRunnerInterfaceProps, Question, SubmissionResult, TopicQuestion, TestCaseResult } from "./types";
import TopicDrawer from "./components/TopicDrawer";
import LeftPanel from "./components/LeftPanel";
import EditorPanel from "./components/EditorPanel";
import BottomPanel from "./components/BottomPanel";

const CodeRunnerInterface: React.FC<CodeRunnerInterfaceProps> = ({
  questionId: propQuestionId,
  token,
}) => {
  // State for current question ID
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(propQuestionId);

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Layout State
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  
  // NOTE: activeTab now refers to Bottom Panel tabs (0: Output, 1: Test Cases)
  const [activeTab, setActiveTab] = useState(0); 
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  const [code, setCode] = useState("// Loading...");
  const [languageId, setLanguageId] = useState<number>(1);
  const [editorLanguage, setEditorLanguage] = useState<string>("php");

  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drawer & Topic Questions State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [topicQuestions, setTopicQuestions] = useState<TopicQuestion[]>([]);
  const [loadingTopicQuestions, setLoadingTopicQuestions] = useState(false);

  useEffect(() => {
    setCurrentQuestionId(propQuestionId);
  }, [propQuestionId]);

  // Derived Navigation
  const currentIndex = topicQuestions.findIndex(q => q.id.toString() === currentQuestionId);
  const prevQuestionId = currentIndex > 0 ? topicQuestions[currentIndex - 1].id : null;
  const nextQuestionId = currentIndex >= 0 && currentIndex < topicQuestions.length - 1 ? topicQuestions[currentIndex + 1].id : null;

  /* ================= FETCH QUESTION ================= */
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        setQuestion(null);
        setError(null);

        const headers: HeadersInit = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(
          `http://localhost:8001/api/code-runner/questions/${currentQuestionId}`,
          { headers }
        );

        if (!res.ok) throw new Error("Failed to fetch question");

        const json = await res.json();
        const data = json.data ?? json;

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

        // Fetch Topic Questions
        if (data.topic_id) {
            fetchTopicQuestions(data.topic_id, headers);
        }
        
        // Reset Output
        setResult(null);

      } catch (e) {
        console.error(e);
        setError("Unable to load question");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [currentQuestionId, token]);

  const fetchTopicQuestions = async (topicId: number, headers: HeadersInit) => {
      try {
          if (topicQuestions.length > 0 && topicQuestions[0].id !== topicId) {
             // Optimistic caching
          }
          
          setLoadingTopicQuestions(true);
          const res = await fetch(`http://localhost:8001/api/code-runner/topics/${topicId}/questions`, { headers });
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

  /* ================= RUN / SUBMIT ================= */

  const runCodeLogic = async (isSubmit: boolean) => {
      setSubmitting(true);
      if (!isSubmit) setResult(null);

      // Auto-open bottom panel
      setBottomPanelCollapsed(false);
      setActiveTab(0); // Show Output Tab initially

      try {
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

        const compilerRes = await fetch("https://compilers.milliongeniuscoders.com/api/execute/", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(runPayload),
        });
        
        let executionData: any[] = [];
        if (compilerRes.ok) {
            executionData = await compilerRes.json();
        } else {
            throw new Error("Compiler Execution Failed");
        }

        const mappedTestCases: TestCaseResult[] = (executionData || []).map((r: any, i: number) => {
            const original = question?.test_cases?.[i];
            return {
                status: r.passed ? "passed" : "failed",
                input: original?.input_data || r?.input || '',
                expected_output: original?.expected_output || r?.expected_output || '',
                actual_output: r?.output || r?.actual_output || '',
                passed: r.passed,
            };
        });

        const allPassed = mappedTestCases.length > 0 && mappedTestCases.every(tc => tc.status === "passed");
        const mainOutput = executionData?.[0]?.output || "";

        setResult({
            status: allPassed ? "passed" : "failed",
            output: mainOutput,
            test_cases: mappedTestCases
        });
        
        // If we have distinct test case results, prefer showing Test Cases tab?
        // Let's stick to Output tab unless Submit which usually implies checking tests
        if (isSubmit || mappedTestCases.length > 0) {
            setActiveTab(1); // Switch to Test Cases tab if we have structured test results
        }

        if (isSubmit) {
            const headers: HeadersInit = { "Content-Type": "application/json", Accept: "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;

            const backendPayload = {
                question_id: currentQuestionId,
                code,
                language_id: languageId,
                execution_results: {
                    output: mainOutput,
                    test_cases: mappedTestCases.map((tc) => ({
                        passed: tc.status === 'passed',
                        output: tc.actual_output,
                    }))
                }
            };

            const submitRes = await fetch("http://localhost:8001/api/code-runner/submit", {
                method: "POST", headers, body: JSON.stringify(backendPayload),
            });

            if (!submitRes.ok) throw new Error("Submission failed");

            if (allPassed && question?.topic_id) {
                fetchTopicQuestions(question.topic_id, headers);
            }
        }

      } catch (e) {
          console.error(e);
          setResult({ status: "error", output: "Execution/Submission failed. Please check connection." });
      } finally {
          setSubmitting(false);
      }
  };


  const handleSwitchQuestion = (id: number) => {
      setDrawerOpen(false);
      setCurrentQuestionId(id.toString());
      setResult(null);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><CircularProgress /></div>;
  if (error && !question) return <div className="flex items-center justify-center h-screen text-red-600">{error}</div>;
  if (!question) return <div className="p-10 text-center">Question not found</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <TopicDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={loadingTopicQuestions}
        topicQuestions={topicQuestions}
        currentQuestionId={currentQuestionId}
        onSwitchQuestion={handleSwitchQuestion}
      />

      {/* COLLAPSED LEFT STRIP */}
      {!leftPanelOpen && (
          <Box className="w-10 border-r bg-white flex flex-col items-center py-4 gap-4 shrink-0 transition-all">
             <Tooltip title="Expand Problem" placement="right">
                 <IconButton onClick={() => setLeftPanelOpen(true)} size="small">
                     <KeyboardDoubleArrowRight fontSize="small" />
                 </IconButton>
             </Tooltip>
          </Box>
      )}

      {/* LEFT PANEL (Problem Content) */}
      {leftPanelOpen && (
        <LeftPanel
            question={question}
            drawerOpen={drawerOpen}
            onCollapse={() => setLeftPanelOpen(false)}
            onOpenDrawer={() => setDrawerOpen(true)}
            onPrev={prevQuestionId ? () => handleSwitchQuestion(prevQuestionId) : null}
            onNext={nextQuestionId ? () => handleSwitchQuestion(nextQuestionId) : null}
        />
      )}

      {/* RIGHT COLUMN (Editor + Output) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          {/* TOP: Editor */}
          <div className="flex-1 overflow-hidden min-h-0 relative">
            <EditorPanel
                question={question}
                code={code}
                editorLanguage={editorLanguage}
                submitting={submitting}
                onChangeCode={setCode}
                onRun={() => runCodeLogic(false)}
                onSubmit={() => runCodeLogic(true)}
            />
          </div>

          {/* BOTTOM: Output & Test Cases */}
          <BottomPanel 
              question={question}
              result={result}
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              collapsed={bottomPanelCollapsed}
              onToggleCollapse={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
          />

      </div>
    </div>
  );
};

export default CodeRunnerInterface;
