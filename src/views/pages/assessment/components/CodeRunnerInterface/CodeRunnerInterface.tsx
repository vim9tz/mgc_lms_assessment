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
    DialogActions,
    Popover,
    Switch,
    FormControlLabel,
    Portal
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
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
    SlowMotionVideo,
  Fullscreen,
  FullscreenExit,
  Remove,
    Cancel
} from "@mui/icons-material";
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
    LogOut, Play, Code2, Terminal, List as LucideList, X, Loader2, CheckCircle2, XCircle, Eye,
    Save, FileX, RefreshCw,
    CheckCircleIcon,
    CheckCircle2Icon,
    Settings,
    Palette,
    Moon,
    Sun,
    Monitor,
    Type,
    GripVertical
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
    status?: "passed" | "failed" | "error"; // Made optional to support new API
    input?: string;
    expected_output?: string;
    actual_output?: string;
    passed?: boolean;
    // New fields based on user JSON
    error?: string;
    output?: string;
    normalized_output?: string;
    execution_time?: number;
    name?: string;
    mode?: string;
    expected_regex?: string;
    match_mode?: string;
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
    const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);
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

    // Editor Settings & Themes
    const [editorTheme, setEditorTheme] = useState("vs");
    const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
    const [editorFontSize, setEditorFontSize] = useState(14);
    const [editorSettingsTab, setEditorSettingsTab] = useState(0); // 0: Appearance, 1: Editor
    
    // Advanced Editor Options
    const [showMinimap, setShowMinimap] = useState(true);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [wordWrap, setWordWrap] = useState(true);
    const [autoClosingBrackets, setAutoClosingBrackets] = useState(true);

    const themes = [
        { id: 'vs-dark', name: 'Dark Default', type: 'dark', color: '#1e1e1e' },
        { id: 'vs', name: 'Light Default', type: 'light', color: '#ffffff' },
        { id: 'hc-black', name: 'High Contrast', type: 'dark', color: '#000000' },
        { id: 'monokai', name: 'Monokai', type: 'dark', color: '#272822' },
        { id: 'cobalt', name: 'Cobalt', type: 'dark', color: '#002240' },
        { id: 'dracula', name: 'Dracula', type: 'dark', color: '#282a36' },
        { id: 'night-owl', name: 'Night Owl', type: 'dark', color: '#011627' },
        { id: 'tokyo-night', name: 'Tokyo Night', type: 'dark', color: '#1a1b26' },
        { id: 'one-dark-pro', name: 'One Dark Pro', type: 'dark', color: '#282c34' },
        { id: 'material-ocean', name: 'Material Ocean', type: 'dark', color: '#0f111a' },
        { id: 'synthwave-84', name: 'SynthWave 84', type: 'dark', color: '#2b213a' },
        { id: 'shades-of-purple', name: 'Shades of Purple', type: 'dark', color: '#2d2b55' },
        { id: 'rose-pine', name: 'Rose Pine', type: 'dark', color: '#191724' },
        { id: 'oceanic-next', name: 'Oceanic Next', type: 'dark', color: '#1b2b34' },
        { id: 'solarized-dark', name: 'Solarized Dark', type: 'dark', color: '#002b36' },
        { id: 'solarized-light', name: 'Solarized Light', type: 'light', color: '#fdf6e3' },
        { id: 'github-dark', name: 'Github Dark', type: 'dark', color: '#24292e' },
        { id: 'nord', name: 'Nord', type: 'dark', color: '#2e3440' }
    ];



    const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
        setSettingsAnchor(event.currentTarget);
    };

    const handleSettingsClose = () => {
        setSettingsAnchor(null);
    };

    const handleThemeChange = (themeId: string) => {
        setEditorTheme(themeId);
        // localStorage.setItem('editor-theme', themeId);
    };

    const handleEditorWillMount = (monaco: any) => {
        // Define additional themes
        const customThemes = [
            { id: 'monokai', bg: '#272822' },
            { id: 'cobalt', bg: '#002240' },
            { id: 'dracula', bg: '#282a36' },
            { id: 'night-owl', bg: '#011627' },
            { id: 'tokyo-night', bg: '#1a1b26' },
            { id: 'one-dark-pro', bg: '#282c3c' },
            { id: 'material-ocean', bg: '#0f111a' },
            { id: 'synthwave-84', bg: '#2b213a' },
            { id: 'shades-of-purple', bg: '#2d2b55' },
            { id: 'rose-pine', bg: '#191724' },
            { id: 'oceanic-next', bg: '#1b2b34' },
            { id: 'solarized-dark', bg: '#002b36' },
            { id: 'solarized-light', bg: '#fdf6e3', base: 'vs' },
            { id: 'github-dark', bg: '#24292e' },
            { id: 'nord', bg: '#2e3440' }
        ];

        customThemes.forEach(t => {
            monaco.editor.defineTheme(t.id, {
                base: (t as any).base || 'vs-dark',
                inherit: true,
                rules: [],
                colors: { 'editor.background': (t as any).bg }
            });
        });
    };


    const [expanded, setExpanded] = useState<number | false>(false)

    const handleChange =
        (panel: number) => (_: any, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false)
        }

    // Load Settings from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('mgc-editor-preferences');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                if (prefs.theme) setEditorTheme(prefs.theme);
                if (prefs.fontSize) setEditorFontSize(prefs.fontSize);
                if (prefs.minimap !== undefined) setShowMinimap(prefs.minimap);
                if (prefs.lineNumbers !== undefined) setShowLineNumbers(prefs.lineNumbers);
                if (prefs.wordWrap !== undefined) setWordWrap(prefs.wordWrap);
                if (prefs.autoBrackets !== undefined) setAutoClosingBrackets(prefs.autoBrackets);
            } catch (e) {
                console.error("Failed to load editor preferences", e);
            }
        }
    }, []);

    // Save Settings to LocalStorage
    useEffect(() => {
        const prefs = {
            theme: editorTheme,
            fontSize: editorFontSize,
            minimap: showMinimap,
            lineNumbers: showLineNumbers,
            wordWrap: wordWrap,
            autoBrackets: autoClosingBrackets
        };
        localStorage.setItem('mgc-editor-preferences', JSON.stringify(prefs));
    }, [editorTheme, editorFontSize, showMinimap, showLineNumbers, wordWrap, autoClosingBrackets]);

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
  const [isFullScreen, setIsFullScreen] = useState(false);

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
    const handleSaveDraft = async () => {
        // Validate empty code
        if (!code || !code.trim()) {
            toast.warn("No code inside! Please write something before saving.");
            return;
        }

        try {
            if (!question) return;

            await saveCode({
                question_id: question.id,
                code: code,
                language_id: question.programming_language_id || 1
            });

            // Update sidebar status instantly
            if (question.topic_id) {
                fetchTopicQuestions(question.topic_id);
            }

            setSaveDialogOpen(false);
            toast.success("Draft saved successfully!");
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save draft.");
        }
    };

    // Handle Save & Exit
    const handleSaveAndExit = async () => {
        // Validate empty code
        if (!code || !code.trim()) {
            toast.warn("No code inside! Please write something before saving.");
            return;
        }

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
            setIsBottomCollapsed(false); // Ensure panel is open
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
            setActiveTab(1); // Show Tests Tab
            setIsBottomCollapsed(false); // Ensure panel is open

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
            const res = await fetch("https://dev-compilers.skillryt.com/api/execute/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || errData.detail || "Execution failed");
            }

            const data = await res.json();

            // Check if we have a "Global/Syntax" error that should apply to all cases
            // Usually execution stops at 1 output if there's a syntax error.
            const globalErrorCandidate = data?.length === 1 && data[0].error && data[0].error !== 'Output mismatch.' ? data[0].error : null;

            const mappedTestCases: TestCaseResult[] = question?.test_cases?.map((originalTC: any, i: number) => {
                const r = data?.[i];
                
                // If we have a direct result, use it
                if (r) {
                    return {
                        status: r.passed ? "passed" : "failed",
                        error: r.error,
                        input: originalTC?.input_data || r.input,
                        expected_output: originalTC?.expected_output || r.expected_output,
                        actual_output: r.output
                    };
                }

                // If no direct result (e.g. crash prevented this case from running)
                return {
                    status: "failed", 
                    error: "Execution skipped.", // distinct from null/mismatch
                    input: originalTC?.input_data,
                    expected_output: originalTC?.expected_output,
                    actual_output: ""
                };
            }) || [];

            const allPassed = mappedTestCases.length > 0 && mappedTestCases.every(tc => tc.status === "passed");
            let mainOutput = data?.[0]?.output || "";

            // Heuristic for Execution/Runtime Errors vs Logic Errors
            // 1. If we have a failed case where the error is NOT "Output mismatch.", it's likely a runtime/syntax error.
            // Note: We no longer check count mismatch since we normalized the list above.
            const runtimeErrorCase = mappedTestCases.find(tc => tc.status === 'failed' && tc.error && tc.error !== 'Output mismatch.' && tc.error !== "Execution skipped.");
            
            const isExecutionError = !!runtimeErrorCase || !!globalErrorCandidate;

            // If we have a runtime/syntax error, ensure it's in the main Output tab
            if (globalErrorCandidate) {
                mainOutput = globalErrorCandidate;
            } else if (runtimeErrorCase && runtimeErrorCase.error) {
                 // Fallback if not detected as global but exists
                mainOutput = runtimeErrorCase.error;
            }

            const timeComplexity = data?.[0]?.time_complexity;
            const spaceComplexity = data?.[0]?.space_complexity;
            // API typically returns cpuTime (seconds) and memory (KB)
            // We'll treat cpuTime as seconds and display as ms
            const runtime = data?.[0]?.cpuTime ? parseFloat(data[0].cpuTime) * 1000 : 0;
            const memory = data?.[0]?.memory ? parseFloat(data[0].memory) : 0;

            const finalStatus = isExecutionError ? "error" : (allPassed ? "passed" : "failed");

            setResult({
                status: finalStatus,
                runtime,
                memory,
                output: mainOutput,
                test_cases: mappedTestCases,
                time_complexity: timeComplexity,
                space_complexity: spaceComplexity
            });

            // If it's a global execution error, show output tab. Otherwise show test results.
            if (isExecutionError) {
                setActiveTab(0);
            } else {
                setActiveTab(1);
            }

        } catch (e: any) {
            console.error(e);
            setResult({
                status: "error",
                output: e.message || "Code execution failed. Please check your connection.",
            });
            setActiveTab(0); // Switch to Output tab to show error
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
        <div className="bg-white z-10 border-b border-zinc-200 flex flex-col">
            {/* Top Navigation Bar */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                
                {/* Left: Questions & Nav */}
                {/* Left: Questions & Nav */}
                <div className="flex items-center gap-2">
                    <Tooltip title="Topic Questions">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all group"
                        >
                            <div className="w-6 h-6 rounded-md bg-white text-slate-700 flex items-center justify-center shadow-sm">
                                <LucideList size={13} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">Questions</span>
                        </button>
                    </Tooltip>

                    <div className="h-4 w-px bg-zinc-200 mx-1" />

                    <div className="flex items-center bg-zinc-50 rounded-lg p-0.5 border border-zinc-100">
                        <Tooltip title="Previous Question">
                            <span>
                                <IconButton
                                    disabled={!prevQuestionId}
                                    onClick={() => prevQuestionId && handleSwitchQuestion(prevQuestionId)}
                                    size="small"
                                    sx={{ 
                                        borderRadius: '6px',
                                        width: 24,
                                        height: 24,
                                        '&:hover': { bgcolor: 'white', shadow: 'sm', color: 'primary.main' }
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Next Question">
                            <span>
                                <IconButton
                                    disabled={!nextQuestionId}
                                    onClick={() => nextQuestionId && handleSwitchQuestion(nextQuestionId)}
                                    size="small"
                                    sx={{ 
                                        borderRadius: '6px',
                                        width: 24,
                                        height: 24,
                                        '&:hover': { bgcolor: 'white', shadow: 'sm', color: 'primary.main' }
                                    }}
                                >
                                    <ChevronRight size={16} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleExit}
                        variant="outlined"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '8px',
                            color: 'text.secondary',
                            borderColor: '#e2e8f0', // slate-200
                            fontSize: '0.8rem',
                            minWidth: 'auto',
                            height: 32,
                            px: 1.5,
                            transition: 'all 0.2s',
                            '&:hover': { 
                                bgcolor: '#ff000082', 
                                color: '#ef4444', // red-500
                                borderColor: 'transparent',
                                boxShadow: 'inset 0 0 0 1px #fee2e2' // subtle danger ring instead of hard border
                            }
                        }}
                    >
                        <LogOut size={14} className="mr-1.5" />
                        Exit
                    </Button>

                    <div className="w-px h-4 bg-zinc-200" />

                    <div className="flex items-center gap-1">
                        <Tooltip title={isMaximized ? "Restore View" : "Maximize View"}>
                            <IconButton 
                                onClick={onMaximize} 
                                size="small"
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.50' } }}
                            >
                                {isMaximized ? <WindowRestoreIcon size={18} /> : <WindowMaximizeIcon size={18} />}
                            </IconButton>
                        </Tooltip>
                        
                        {!isMaximized && (
                            <Tooltip title="Collapse Panel">
                                <IconButton 
                                    onClick={onCollapse} 
                                    size="small"
                                    sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.50' } }}
                                >
                                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Spacing Wrapper */}
            <div className="px-6 pt-3">

            {/* Question Details Header - stacked layout */}
            <div className="mb-6">
                {/* Top Row: Meta & Actions */}
                <div className="flex items-center gap-3 mb-3">
                    {/* Number */}
                    <div className="flex items-center justify-center h-6 px-2.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 font-mono text-xs font-bold shadow-sm">
                        #{(topicQuestions?.findIndex(q => q.id.toString() === currentQuestionId.toString()) + 1 || 0).toString().padStart(2, '0')}
                    </div>

                    {/* Difficulty */}
                    <div className={`h-6 flex items-center px-2.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                        question.difficulty === 'easy' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : question.difficulty === 'medium' 
                                ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                        {question.difficulty}
                    </div>
                </div>

                {/* Second Row: Title */}
                <Typography component="h1" variant="h4" fontWeight={800} sx={{ color: '#1e293b', lineHeight: 1.25, fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 1 }}>
                    {question.title}
                </Typography>

                {/* Third Row: Complexity (if available) */}
                {(result?.time_complexity || result?.space_complexity) && (
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-500 mt-2">
                         {result.time_complexity && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-50 text-zinc-600 border border-zinc-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {result.time_complexity}
                            </span>
                        )}
                        {result.space_complexity && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-50 text-zinc-600 border border-zinc-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                {result.space_complexity}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Modern Tabs (Segmented Control - Squared) */}
            <div className="bg-zinc-100/80 p-1 rounded-lg flex gap-1 mb-2 self-start">
                <button
                    onClick={() => setLeftTab(0)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${leftTab === 0 ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    Description
                </button>
                {question.constraints && (
                    <button
                        onClick={() => setLeftTab(1)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${leftTab === 1 ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Constraints
                    </button>
                )}
            </div>
            </div> {/* Closing Content Spacing Wrapper */}
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
                    {/* {(question.expected_time_complexity || question.expected_space_complexity) && (
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
                    )} */}

                    <div
                        className="prose prose-zinc max-w-none text-zinc-600 leading-relaxed font-normal question-content-wrapper prose-headings:text-zinc-800 prose-headings:font-bold prose-p:mb-4 prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1 prose-code:rounded prose-code:font-semibold prose-pre:bg-zinc-50 prose-pre:border prose-pre:border-zinc-100"
                        dangerouslySetInnerHTML={{ __html: question.content }}
                    />

                    {/* Example Cases - Modernized */}
                    {question.test_cases && question.test_cases.filter((tc: any) => tc.is_public).length > 0 && (
                        <div className="mt-8 space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="h-px bg-zinc-300 flex-1"></span>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-2">Examples</span>
                                <span className="h-px bg-zinc-300 flex-1"></span>
                            </div>

                            {question.test_cases.filter((tc: any) => tc.is_public).map((tc: any, i: number) => (
                                <div key={i} className="group bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                                    <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-indigo-400"></div>
                                            <span className="text-xs font-bold text-zinc-600 group-hover:text-indigo-700">Example {i + 1}</span>
                                        </div>
                                        {tc.description && <span className="text-[10px] text-zinc-500 font-medium">{tc.description}</span>}
                                    </div>
                                    <div className="p-4 grid gap-4 bg-white">
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
                                                <span className="w-1 h-3 bg-zinc-300 rounded-sm"></span>
                                                Input
                                            </div>
                                            <code className="block bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-lg p-3 font-mono text-sm overflow-x-auto whitespace-pre leading-relaxed group-hover:border-indigo-100 transition-colors">{tc.input_data}</code>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
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
        <div className="h-14 md:h-12 bg-white flex items-center justify-between px-2 md:px-4 shrink-0 z-20 border-b border-zinc-100/50">
            <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hidden sm:flex">
                    <Code2 size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-bold text-zinc-800 leading-none tracking-tight">{question.programming_language || "Code"}</span>
                    {/* <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">Editor</span> */}
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">

                <Tooltip title={isMaximized ? "Restore" : "Maximize"}>
                    <IconButton onClick={onMaximize} size="small" sx={{ color: 'text.secondary', display: { xs: 'none', md: 'inline-flex' }, '&:hover': { color: 'primary.main', bgcolor: 'primary.50' } }}>
                        {isMaximized ? <WindowRestoreIcon size={16} /> : <WindowMaximizeIcon size={16} />}
                    </IconButton>
                </Tooltip>

                <div className="w-px h-5 bg-zinc-200 mx-1 hidden md:block" />

                {/* Action Group */}
                <div className="flex items-center rounded-[8px] bg-zinc-50/50 border border-zinc-200/60 p-0.5">
                    <Tooltip title="Reset Code">
                        <Button
                            variant="text"
                            size="small"
                            onClick={() => setResetDialogOpen(true)}
                            disabled={isResetting || submitting}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '6px',
                                color: 'text.secondary',
                                minWidth: '32px',
                                px: { xs: 1, sm: 2 },
                                height: 32,
                                '&:hover': { bgcolor: 'white', color: 'error.main', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                            }}
                        >
                            {isResetting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            <span className="hidden sm:inline ml-2 text-xs">Reset</span>
                        </Button>
                    </Tooltip>
                    
                    <div className="w-px h-4 bg-zinc-200 mx-0.5" />
                    
                    <Tooltip title="Run Code">
                        <Button
                            variant="text"
                            size="small"
                            disabled={submitting}
                            onClick={handleCodeRun}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '6px',
                                color: 'text.secondary',
                                minWidth: '32px',
                                px: { xs: 1, sm: 2 },
                                height: 32, 
                                '&:hover': { bgcolor: 'white', color: 'primary.main', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                            }}
                        >
                             {submitting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-current" />}
                             <span className="hidden sm:inline ml-2 text-xs">Run</span>
                        </Button>
                    </Tooltip>

                    {editorLanguage === 'python' && (
                        <>
                            <div className="w-px h-4 bg-zinc-200 mx-0.5" />
                            <Tooltip title="Visualizer (Beta)">
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setShowVisualizer(true)}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        color: 'text.secondary',
                                        minWidth: '32px',
                                        px: { xs: 1, sm: 2 },
                                        height: 32,
                                        '&:hover': { bgcolor: 'white', color: 'primary.main', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                                    }}
                                >
                                    <Eye size={14} />
                                    <span className="hidden sm:inline ml-2 text-xs">Visualize</span>
                                </Button>
                            </Tooltip>
                        </>
                    )}
                </div>


                <Button
                    variant="outlined"
                    size="small"
                    disabled={submitting}
                    onClick={() => setSaveDialogOpen(true)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        px: { xs: 0, sm: 3 },
                        minWidth: { xs: 36, sm: 'auto' }, // Icon only on mobile
                        height: 36,
                        borderColor: '#e0e7ff',
                        color: '#4f46e5',
                        '&:hover': { bgcolor: '#eef2ff', borderColor: '#c7d2fe' }
                    }}
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                     <span className="hidden sm:inline ml-2">Save</span>
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={submitting}
                    onClick={() => setSubmitDialogOpen(true)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        px: { xs: 2, sm: 3 },
                        height: 36,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                        boxShadow: '0 2px 5px rgba(79, 70, 229, 0.2)',
                        '&:hover': { boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)' }
                    }}
                >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CloudUploadIcon sx={{ fontSize: 18 }} />}
                    <span className="hidden sm:inline ml-2">Submit</span>
                </Button>

                <div className="w-px h-5 bg-zinc-200 mx-1 hidden md:block" />

                <Tooltip title="Editor Settings">
                    <IconButton 
                        onClick={handleSettingsClick} 
                        size="small" 
                        sx={{ 
                            bgcolor: settingsAnchor ? 'primary.50' : 'transparent',
                            color: settingsAnchor ? 'primary.main' : 'text.secondary',
                            border: '1px solid',
                            borderColor: settingsAnchor ? 'primary.100' : 'transparent',
                            '&:hover': { color: 'primary.main', bgcolor: 'primary.50' } 
                        }}
                    >
                        <Settings size={18} />
                    </IconButton>
                </Tooltip>

            </div>
        </div>
    );

    const currentThemeData = themes.find(t => t.id === editorTheme) || themes[0];

    const RightTopContent = (
        <div className="h-full relative" style={{ backgroundColor: currentThemeData.color }}>
            <Editor
                height="100%"
                language={editorLanguage}
                value={code}
                onChange={(v) => setCode(v || "")}
                theme={editorTheme}
                beforeMount={handleEditorWillMount}
                options={{
                    minimap: { enabled: showMinimap },
                    fontSize: editorFontSize,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                    lineNumbers: showLineNumbers ? 'on' : 'off',
                    wordWrap: wordWrap ? 'on' : 'off',
                    autoClosingBrackets: autoClosingBrackets ? 'always' : 'never',
                    lineHeight: 24,
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    guides: {
                        indentation: true,
                        bracketPairs: true
                    }
                }}
            />
        </div>
    );

    const renderRightBottomHeader = ({ isMaximized, isCollapsed, onMaximize, onCollapse }: any) => (
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 h-12 bg-white shrink-0">
            <div className="flex bg-zinc-200/80 p-1 rounded-lg gap-1">
                <button
                    onClick={() => setActiveTab(0)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 0 ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 0 && result?.output ? 'bg-blue-500' : 'bg-zinc-400'}`} />
                    Output
                </button>
                <button
                    onClick={() => setActiveTab(1)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 1 ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    {result?.status === 'passed' ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                    ) : result?.status === 'failed' ? (
                        <XCircle size={14} className="text-red-500" />
                    ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 1 ? 'bg-blue-500' : 'bg-zinc-400'}`} />
                    )}
                    Test Results
                </button>
            </div>

            <div className="flex items-center gap-1">
                <Tooltip title={isMaximized ? "Restore" : "Maximize"}>
                    <IconButton onClick={onMaximize} size="small" sx={{ color: 'text.secondary' }}>
                        {isMaximized ? <WindowRestoreIcon size={16} /> : <WindowMaximizeIcon size={16} />}
                    </IconButton>
                </Tooltip>
                {!isMaximized && (
                    <Tooltip title="Collapse">
                        <IconButton onClick={onCollapse} size="small" sx={{ color: 'text.secondary' }}>
                            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </IconButton>
                    </Tooltip>
                )}
            </div>
        </div>
    );


    const RightBottomContent = (
        <div className="h-full flex flex-col overflow-hidden p-0 bg-white md:bg-zinc-50/30">
            {activeTab === 0 && (
                <div className="p-4 h-full relative overflow-y-auto no-scrollbar">
                    {result?.output ? (
                        <pre className={`font-mono text-sm whitespace-pre-wrap border rounded-lg p-3 shadow-sm min-h-[50px] ${
                            result.status === 'error' 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-white text-zinc-700 border-zinc-200'
                        }`}>
                            {result.output}
                        </pre>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
                            <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                                <Terminal size={24} className="text-zinc-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-zinc-500">No Output Yet</p>
                                <p className="text-xs text-zinc-400 mt-1">Run your code to see the execution results here.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 1 && (
                <div className="flex flex-col h-full overflow-hidden min-h-0 bg-[#FAFAFA]">

                    {/* Compact Modern Header */}
                    <div className="shrink-0 px-4 py-3 bg-white border-b border-zinc-100 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10">
                        <div className="flex items-center gap-3">
                            {/* Status Pill */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm transition-all ${
                                result 
                                ? (result.status === 'passed' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-rose-50 text-rose-700 border-rose-100')
                                : 'bg-zinc-50 text-zinc-600 border-zinc-100'
                            }`}>
                                {result ? (
                                    result.status === 'passed' ? <CheckCircle2 size={14} className="stroke-[2.5]" /> : <XCircle size={14} className="stroke-[2.5]" />
                                ) : submitting ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Play size={14} />
                                )}
                                <span>
                                    {result ? (
                                        result.status === 'passed' ? 'All Passed' : 'Test Failed'
                                    ) : (
                                        submitting ? 'Running...' : 'Ready'
                                    )}
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="h-4 w-px bg-zinc-200" />

                            {/* Counts */}
                            <span className="text-xs font-medium text-zinc-500">
                                {result ? (
                                    <span className={result.status === 'passed' ? 'text-emerald-600' : 'text-zinc-600'}>
                                        {result.test_cases?.filter((t: any) => t.status === 'passed').length}
                                        <span className="text-zinc-400 mx-1">/</span>
                                        {question.test_cases?.length} passed
                                    </span>
                                ) : (
                                    <span>{question.test_cases?.length} cases loaded</span>
                                )}
                            </span>
                        </div>

                        {/* Runtime - Minimal */}
                        {/* {result && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                                <span className="uppercase tracking-wider text-[10px]">Time</span>
                                <span className="font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                                    {result.runtime?.toFixed(0)} ms
                                </span>
                            </div>
                        )} */}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {/* Clean Minimalist Test Cases */}
                        {result?.test_cases
                            ?.filter((_, idx) => question.test_cases?.[idx]?.is_public)
                            .map((tc, idx) => {
                                // console.log('Test Case Debug:', { idx, passed: tc.passed, status: tc.status, error: tc.error, tc }); 
                                const passed = tc.passed ?? tc.status === 'passed';
                                return (
                                    <Accordion
                                        key={idx}
                                        expanded={expanded === idx}
                                        onChange={handleChange(idx)}
                                        disableGutters
                                        elevation={0}
                                        sx={{
                                            bgcolor: 'white',
                                            '&:before': { display: 'none' },
                                            borderRadius: '8px',
                                            border: '1px solid',
                                            borderColor: expanded === idx 
                                                ? (passed ? '#d1fae5' : '#fee2e2') 
                                                : 'transparent',
                                            boxShadow: expanded === idx 
                                                ? '0 4px 12px -2px rgba(0,0,0,0.05)' 
                                                : 'none',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: expanded === idx ? 'white' : '#fff',
                                                borderColor: expanded === idx 
                                                    ? (passed ? '#d1fae5' : '#fee2e2') 
                                                    : (passed ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'),
                                                boxShadow: expanded !== idx ? '0 2px 8px -2px rgba(0,0,0,0.05)' : undefined
                                            }
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ChevronDown size={14} className="text-zinc-400" />}
                                            sx={{
                                                minHeight: '48px',
                                                px: 2,
                                                '& .MuiAccordionSummary-content': { margin: 0, alignItems: 'center', width: 'calc(100% - 24px)' }
                                            }}
                                        >
                                           <div className="flex items-center gap-3 w-full overflow-hidden">
                                                {/* 1. Icon */}
                                                {passed ? (
                                                    <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                                                ) : (
                                                    <XCircle className="text-rose-500 shrink-0" size={18} />
                                                )}

                                                {/* 2. Test Case Label - Hidden on small screens if overly crowded, but useful context */}
                                                <span className={`text-[13px] font-semibold tracking-tight whitespace-nowrap shrink-0 ${expanded === idx ? 'text-zinc-800' : 'text-zinc-600'}`}>
                                                    Case {idx + 1}
                                                </span>
                                                
                                                <div className="h-4 w-px bg-zinc-200 shrink-0 mx-1" />

                                                {/* 3. Input Summary */}
                                                <div className="flex items-center gap-2 min-w-0 overflow-hidden relative group shrink-0 max-w-[140px] md:max-w-[200px]">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">In:</span>
                                                    <Tooltip title={tc.input || "No Input"}>
                                                        <span className="font-mono text-xs text-zinc-600 truncate bg-zinc-50/80 px-1.5 py-0.5 rounded border border-zinc-200/50 w-full cursor-default">
                                                            {tc.input || <span className="opacity-50 italic">Empty</span>}
                                                        </span>
                                                    </Tooltip>
                                                </div>

                                                {/* 4. Error Summary (Only if Failed) */}
                                                {/* 4. Status Message (Error or Success) */}
                                                {/* 4. Status Message (Error or Success) */}
                                                <div className="h-4 w-px bg-zinc-200 shrink-0 mx-1" />
                                                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                                                    {passed ? (
                                                        <span className="text-xs font-medium text-emerald-600 truncate">
                                                            Test Case Passed
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="text-[10px] font-bold text-rose-500/70 uppercase tracking-wider shrink-0 hidden sm:block">Err:</span>
                                                            <Tooltip title={tc.error || "Output mismatch."}>
                                                                <span className="text-xs truncate font-medium text-rose-600 w-full cursor-help">
                                                                    {tc.error || "Output mismatch..."}
                                                                </span>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {/* Spacer to push expand icon */}
                                                <div className="grow" />
                                           </div>
                                        </AccordionSummary>

                                        <AccordionDetails sx={{ p: 0 }}>
                                             {/* Content Wrapper */}
                                             <div className="px-4 pb-6 pt-0 flex flex-col gap-3">
                                                <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent w-full" />
                                                
                                                {/* Input (Full View - Optional, user implied 'accordiant not open... show input', but if truncated in summary, seeing full here is nicer. Keeping minimal as requested 'then open inside expected output and your output')
                                                    Status: Removed per strict interpretation of user request to "open inside expected output and your output"
                                                */}

                                                {/* Error Message (Detailed View) */}
                                                {!passed && (
                                                    <div>
                                                        <span className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest pl-1 mb-1 block">Error Message</span>
                                                        <div className="bg-rose-50 border border-rose-100/80 rounded-md py-2 px-3 font-mono text-xs text-rose-700 flex items-start gap-2">
                                                            <div className="shrink-0 mt-0.5 opacity-70">
                                                                <XCircle size={14} />
                                                            </div>
                                                            <span className="whitespace-pre-wrap break-words leading-relaxed">{tc.error || "Output mismatch."}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Comparison Grid */}
                                                <div className={`grid gap-3 ${passed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                                                    <div className="min-w-0">
                                                        <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest pl-1 mb-1 block">Expected Output</span>
                                                        <div className="bg-white border border-emerald-100 rounded-md py-2 px-3 font-mono text-xs text-zinc-700 relative overflow-hidden break-words whitespace-pre-wrap">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400/20" />
                                                            {tc.expected_output}
                                                        </div>
                                                    </div>

                                                    {!passed && (
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest pl-1 mb-1 block">Your Output</span>
                                                            <div className="bg-white border border-rose-100 rounded-md py-2 px-3 font-mono text-xs text-rose-700 relative overflow-hidden break-words whitespace-pre-wrap">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-400/20" />
                                                                <span className="opacity-90">{tc.actual_output || tc.output}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                             </div>
                                        </AccordionDetails>
                                    </Accordion>
                                )
                            })}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-screen bg-zinc-50 overflow-hidden font-sans">

            {/* DRAWER FOR TOPIC TOGGLE */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { 
                        width: { xs: '100%', sm: 420 }, 
                        borderRadius: { xs: 0, sm: '0 24px 24px 0' }, 
                        border: 'none',
                        boxShadow: '8px 0 32px rgba(0,0,0,0.08)'
                    }
                }}
            >
                {/* Header */}
                <Box p={3} borderBottom="1px solid" borderColor="divider" display="flex" alignItems="center" justifyContent="space-between" bgcolor="#ffffff">
                    <div>
                        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px', color: '#0f172a' }}>
                            Topic Questions
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
                            {topicQuestions.length} challenges available
                        </Typography>
                    </div>
                    <IconButton 
                        onClick={() => setDrawerOpen(false)} 
                        size="small" 
                        sx={{ 
                            color: 'text.secondary',
                            bgcolor: 'action.hover', 
                            '&:hover': { bgcolor: 'error.50', color: 'error.main' }
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* List Container */}
                <Box sx={{ overflowY: 'auto', flex: 1, p: 2, bgcolor: '#f8fafc' }} className="custom-scrollbar">
                    {loadingTopicQuestions ? (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={200} gap={2}>
                            <CircularProgress size={24} thickness={5} sx={{ color: 'primary.main' }} />
                            <Typography variant="caption" color="text.secondary">Loading list...</Typography>
                        </Box>
                    ) : (
                        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {topicQuestions.map((q, index) => {
                                const isCurrent = q.id.toString() === currentQuestionId;
                                const isSolved = q.status === 'solved';
                                const isAttempted = q.status === 'attempted';

                                return (
                                    <ListItem key={q.id} disablePadding>
                                        <ListItemButton
                                            selected={isCurrent}
                                            onClick={() => handleSwitchQuestion(q.id)}
                                            sx={{
                                                borderRadius: '8px', 
                                                py: 1.5,
                                                px: 2,
                                                bgcolor: isCurrent ? '#ffffff' : 'transparent',
                                                border: '1px solid',
                                                // Active border 50% transparent (using mapped color or rgba equivalent of indigo-600)
                                                borderColor: isCurrent ? 'rgba(79, 70, 229, 0.5)' : 'transparent', 
                                                boxShadow: isCurrent ? '0 4px 20px rgba(79, 70, 229, 0.12)' : 'none',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                '&:hover': {
                                                    bgcolor: isCurrent ? '#ffffff' : 'zinc.50',
                                                    borderColor: isCurrent ? 'rgba(79, 70, 229, 0.5)' : 'zinc.200',
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                },
                                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                '&.Mui-selected': { bgcolor: '#ffffff', '&:hover': { bgcolor: '#ffffff' } }
                                            }}
                                        >
                                            {/* Active Indicator Bar */}
                                            {isCurrent && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
                                            )}

                                            {/* Status Dot */}
                                            <div className="flex items-center justify-center mr-3 shrink-0">
                                                {isSolved ? (
                                                    // Improved Solved: Filled green circle, clean and neat
                                                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                                                        <CheckCircle2 size={16} className="stroke-[3]" />
                                                    </div>
                                                ) : isAttempted ? (
                                                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                                                    </div>
                                                ) : (
                                                    // Improved Inactive Number: clearly visible, neat, high contrast
                                                    <div className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-300 text-zinc-600 shadow-sm">
                                                        <span className="text-[11px] font-bold">{(index + 1).toString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Question Info */}
                                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Typography 
                                                        variant="body2" 
                                                        fontWeight={isCurrent ? 700 : 600} 
                                                        color={isCurrent ? 'text.primary' : 'text.zinc.700'}
                                                        noWrap
                                                        sx={{ fontSize: '0.95rem' }}
                                                    >
                                                        {q.title}
                                                    </Typography>
                                                </div>
                                            </div>

                                            {/* Difficulty Badge */}
                                            <div className="ml-3 shrink-0">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                                                    q.difficulty === 'easy' 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                        : q.difficulty === 'medium' 
                                                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {q.difficulty}
                                                </span>
                                            </div>
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                    
                    {!loadingTopicQuestions && topicQuestions.length === 0 && (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={200} color="text.disabled">
                             <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                                <ListIcon sx={{ fontSize: 24, opacity: 0.3 }} />
                            </div>
                            <Typography variant="body2">No questions found.</Typography>
                        </Box>
                    )}
                </Box>
            </Drawer>

      <ThreePaneLayout
        leftContent={LeftContent}
        rightTopContent={RightTopContent}
        rightBottomContent={RightBottomContent}
        renderLeftHeader={renderLeftHeader}
        renderRightTopHeader={renderRightTopHeader}
        renderRightBottomHeader={renderRightBottomHeader}
        isBottomCollapsed={isBottomCollapsed}
        onBottomCollapseChange={setIsBottomCollapsed}
      />
      
    {/* VISUALIZER DIALOG */}
       <Dialog 
        open={showVisualizer} 
        onClose={() => setShowVisualizer(false)}
        maxWidth="xl"
        fullWidth
        fullScreen={isFullScreen}
        PaperProps={{
            sx: { 
              height: isFullScreen ? '100%' : '85vh', 
              borderRadius: isFullScreen ? 0 : 3,
              bgcolor: 'background.paper', // White/Theme default
              color: 'text.primary',
              overflow: 'hidden' 
            }
        }}
      >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper', // White
            px: 2, 
            py: 1.5,
            minHeight: 56
          }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <TerminalIcon fontSize="small" />
                </div>
                <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: '0.2px', color: 'text.primary' }}>
                  Code Visualization
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                  {/* Toggle Full Screen */}
                  <Tooltip title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
                      <IconButton 
                        onClick={() => setIsFullScreen(!isFullScreen)} 
                        size="small"
                        sx={{ 
                            color: 'text.secondary', 
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } 
                        }}
                      >
                          {isFullScreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                      </IconButton>
                  </Tooltip>

                  {/* Close */}
                  <Tooltip title="Close">
                      <IconButton 
                        onClick={() => setShowVisualizer(false)} 
                        size="small"
                        sx={{ 
                            color: 'text.secondary', 
                            '&:hover': { bgcolor: 'error.50', color: 'error.main' } 
                        }}
                      >
                          <CloseIcon fontSize="small" />
                      </IconButton>
                  </Tooltip>
              </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0, overflow: 'hidden', height: '100%', bgcolor: 'background.default' }}>
              <PythonVisualizer code={code} onChangeCode={setCode} />
          </DialogContent>
      </Dialog>

            {/* DRAGGABLE EDITOR SETTINGS PANEL */}
            <AnimatePresence>
                {settingsAnchor && (
                    <Portal>
                        {/* Overlay to handle close on click outside (optional, but requested behavior usually implies this or a dedicated close) */}
                        <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 1290 }} 
                            onClick={handleSettingsClose} 
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            drag
                            dragMomentum={false}
                            dragElastic={0.1}
                            style={{
                                position: 'fixed',
                                top: 80,
                                right: 40,
                                zIndex: 1300,
                                width: 320,
                                cursor: 'default'
                            }}
                        >
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    maxHeight: '80vh',
                                    borderRadius: '24px',
                                    boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    overflow: 'hidden',
                                    backdropFilter: 'blur(30px) saturate(150%)',
                                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                                    '@supports not (backdrop-filter: blur(30px))': {
                                        bgcolor: 'rgba(255, 255, 255, 0.98)'
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header with Drag Handle */}
                                <Box 
                                    p={3} 
                                    pb={2} 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="space-between" 
                                    borderBottom="1px solid" 
                                    borderColor="rgba(0,0,0,0.04)"
                                    sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
                                            <Settings size={14} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.01em', fontSize: '13px' }}>
                                                Workspace Settings
                                            </Typography>
                                            <div className="flex items-center gap-1 opacity-50">
                                                 <GripVertical size={10} />
                                                 <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Draggable</Typography>
                                            </div>
                                        </div>
                                    </div>
                                    <IconButton 
                                        onClick={handleSettingsClose} 
                                        size="small" 
                                        sx={{ 
                                            color: 'text.secondary',
                                            bgcolor: 'rgba(0,0,0,0.03)',
                                            '&:hover': { bgcolor: 'error.50', color: 'error.main' }
                                        }}
                                    >
                                        <X size={14} />
                                    </IconButton>
                                </Box>

                                {/* Sophisticated Tabs */}
                                <Box px={3} mb={1} mt={1}>
                                    <div className="flex p-1 bg-black/[0.03] rounded-2xl gap-1">
                                        <button
                                            onClick={() => setEditorSettingsTab(0)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                                editorSettingsTab === 0 
                                                ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/[0.03]' 
                                                : 'text-zinc-400 hover:text-zinc-600'
                                            }`}
                                        >
                                            <Palette size={12} strokeWidth={2.5} />
                                            UI
                                        </button>
                                        <button
                                            onClick={() => setEditorSettingsTab(1)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                                editorSettingsTab === 1 
                                                ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/[0.03]' 
                                                : 'text-zinc-400 hover:text-zinc-600'
                                            }`}
                                        >
                                            <Code2 size={12} strokeWidth={2.5} />
                                            Editor
                                        </button>
                                    </div>
                                </Box>

                                <Box p={2.5} pt={1.5} sx={{ overflowY: 'auto' }} className="custom-scrollbar">
                                    {editorSettingsTab === 0 ? (
                                        <div className="space-y-5">
                                            {/* Themes section */}
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <Typography variant="caption" fontWeight={800} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
                                                        Themes
                                                    </Typography>
                                                    <Chip label={`${themes.length}`} size="small" sx={{ height: 18, fontSize: '9px', fontWeight: 800, bgcolor: 'zinc.100', color: 'zinc.900' }} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {themes.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => handleThemeChange(t.id)}
                                                            className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                                                                editorTheme === t.id 
                                                                ? 'bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/20' 
                                                                : 'bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                                                            }`}
                                                        >
                                                            <div 
                                                                className="w-3.5 h-3.5 rounded-full shadow-inner transition-transform"
                                                                style={{ backgroundColor: t.color, border: t.type === 'light' ? '1px solid #e2e8f0' : 'none' }}
                                                            />
                                                            <span className="truncate">{t.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            {/* Font Size */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3 text-zinc-800">
                                                    <Type size={12} className="text-zinc-400" strokeWidth={2.5} />
                                                    <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Font Size</Typography>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-black/[0.03] p-1 rounded-xl">
                                                    {[12, 14, 16, 18, 20].map((size) => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setEditorFontSize(size)}
                                                            className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                                                                editorFontSize === size 
                                                                ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/[0.03]' 
                                                                : 'text-zinc-500 hover:text-zinc-700'
                                                            }`}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 mb-2 text-zinc-800">
                                                    <Monitor size={12} className="text-zinc-400" strokeWidth={2.5} />
                                                    <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Behavior</Typography>
                                                </div>
                                                
                                                {[
                                                    { icon: <Monitor size={14} />, label: 'Minimap', state: showMinimap, setter: setShowMinimap },
                                                    { icon: <ChevronRight size={14} />, label: 'Lines', state: showLineNumbers, setter: setShowLineNumbers },
                                                    { icon: <RefreshCw size={14} />, label: 'Wrap', state: wordWrap, setter: setWordWrap },
                                                    { icon: <Code2 size={14} />, label: 'Brackets', state: autoClosingBrackets, setter: setAutoClosingBrackets },
                                                ].map((option, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-zinc-100/80 hover:border-zinc-200 transition-colors">
                                                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '11px', color: 'text.primary' }}>{option.label}</Typography>
                                                        <Switch 
                                                            checked={option.state} 
                                                            onChange={(e) => option.setter(e.target.checked)} 
                                                            size="small"
                                                            sx={{ 
                                                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#18181b' },
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#edf1ffff' }
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Box>

                                {/* Sophisticated Minimal Footer */}
                                <Box px={3} py={2.5} bgcolor="rgba(0,0,0,0.02)" borderTop="1px solid rgba(0,0,0,0.04)" display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 800, fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.3 }}>
                                        Engine v2.1
                                    </Typography>
                                    <button 
                                        onClick={handleSettingsClose} 
                                        className="px-5 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] active:scale-95"
                                    >
                                        Save
                                    </button>
                                </Box>
                            </Box>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>


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
                                    transform: 'tranzincY(-1px)'
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
                                '&:hover': { bgcolor: 'zinc.50', color: 'text.primary' }
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
                            className="group flex items-start gap-4 p-4 rounded-2xl border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left w-full outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-zinc-800 group-hover:text-blue-700 transition-colors">Save Draft</h4>
                                <p className="text-sm text-zinc-500 mt-0.5 leading-snug">
                                    Save your changes and continue working on this question.
                                </p>
                            </div>
                        </button>

                        {/* Action Card: Save & Exit */}
                        <button
                            onClick={handleSaveAndExit}
                            disabled={isSaving}
                            className="group flex items-start gap-4 p-4 rounded-2xl border border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left w-full outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-zinc-800 group-hover:text-indigo-700 transition-colors">Save & Exit</h4>
                                <p className="text-sm text-zinc-500 mt-0.5 leading-snug">
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
                                borderColor: 'zinc.200',
                                color: 'zinc.700',
                                fontSize: '1rem',
                                '&:hover': { borderColor: 'zinc.400', bgcolor: 'zinc.50' }
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
