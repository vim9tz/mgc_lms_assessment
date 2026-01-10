'use client'

// Next Imports
import Link from 'next/link'
import Logo from '@components/layout/shared/Logo'

// MUI Imports
import Button from '@mui/material/Button'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Coding from '@/views/pages/coding'
import QuizPanel from '@/views/pages/assessment/components/quizPanelV2'
import useApi from '@/hooks/useApi'
import { useQuizHook } from '@/hooks/useQuiz'
import { toast } from 'react-toastify'
import { AttemptWeightageItem, GetAttemptResult } from '@/types/apps/attemptTypes'
import { QuizApiResponse } from '@/types/apps/quizTypes'
import { TreeNode } from '@/libs/github'
import { useSession } from 'next-auth/react'
import TestTimer from './TestTimer'
import ExitFullscreenDialog from './ExitFullscreenDialog'
import { enterFullscreen, isFullscreen, monitorFullscreen } from '@/utils/fullscreen'
import ProgrammingPage from '@/views/pages/ProgrammingPage/ProgrammingPage'
import { getSocket } from '@/lib/socket'
import { useQuizAutosaveSocket } from '@/utils/useQuizAutosaveSocket'
import { useQuizEmitterHook } from '@/hooks/useQuizEmitterHook'
import { useDynamicQuizHook } from '@/hooks/useDynamicQuizHook'
import ResultModal from '@/views/pages/assessment/components/ResultModalV2'
import { Socket } from 'socket.io-client'

import { useAuthStore } from '@/store/useAuthStore';
import { useAssessmentSubmit } from '@/domains/assessment/hooks/useAssessmentSubmit';
import { assessmentApi } from '@/domains/assessment/api/assessment.api';

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const storeToken = useAuthStore((state) => state.token);

  // Fallback to URL token if store is empty (e.g. direct link with token), but prefer store
  const test_id = storeToken || searchParams.get('token')
  
  const subTopicId = searchParams.get('subTopic') || searchParams.get('subtopic_id')
  const practiceId = searchParams.get('practiceId')
  const mockId = searchParams.get('mockId')
  // const test_id = searchParams.get('token') // Removed
  const { fetchFromBackend } = useApi({ token: test_id || undefined })
  const [getAttempt, setGetAttempt] = useState<GetAttemptResult | null>(null)
  const [quizItems, setQuizItems] = useState<AttemptWeightageItem[]>([])
  const [codingItems, setCodingItems] = useState<AttemptWeightageItem[]>([])
  const [questionsData, setQuestionsData] = useState<QuizApiResponse | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [groupedQuestions, setGroupedQuestions] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<{
    allQuizSubmissions: any[]
    allCodeSubmissions: any[]
  }>({ allQuizSubmissions: [], allCodeSubmissions: [] })
  const type = sessionStorage.getItem('type')
  const test_type = sessionStorage.getItem('test_type')

  // console.log('type:', type)
  // console.log('test_type:', test_type)


  const [seconds, setSeconds] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<Socket | null>(null)
  
  // Localhost / Proctoring Toggle State
  const [isProctoringEnabled, setIsProctoringEnabled] = useState(true);
  const [isLocalhost, setIsLocalhost] = useState(false);

  const [proctoringState, setProctoringState] = useState({
        tabSwitches: 0,
        fullscreenViolations: 0,
        copyPasteAttempts: 0,
        mouseLeaves: 0,
        logs: [] as any[],
        systemInfo: {} as any,
        locationDetails: {} as any,
    });

     // Calculate effectiveType early for hooks
     const token = test_id;
     const urlType = searchParams.get('type');
     const sessionType = typeof window !== 'undefined' ? sessionStorage.getItem('type') : null;
     
     // Robust Type Resolution: URL > Session > Token inference > Default
     const effectiveType = urlType || sessionType || (token ? 'geeks_test' : 'test');



    // Capture system info on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            setIsLocalhost(true);
        }

        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: { width: window.screen.width, height: window.screen.height },
            language: navigator.language,
        };
        setProctoringState(prev => ({ ...prev, systemInfo: info }));
    }, []);

    // Proctoring Event Listeners
    const [isInFullscreen, setIsInFullscreen] = useState(false);

    useEffect(() => {
        if (!isProctoringEnabled) return; // 🔴 Exit if disabled
        if (!['assessment', 'geeks_test'].includes(effectiveType)) return;

        const logEvent = (type: string, details: any = {}) => {
            setProctoringState(prev => ({
                ...prev,
                logs: [...prev.logs, { type, timestamp: new Date().toISOString(), ...details }]
            }));
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setProctoringState(prev => ({ ...prev, tabSwitches: prev.tabSwitches + 1 }));
                logEvent('tab_switch_hidden');
            } else {
                logEvent('tab_switch_visible');
            }
        };

        const handleBlur = () => {
            logEvent('window_blur');
        };

        const handleFocus = () => {
            logEvent('window_focus');
        };

        const handleCopyPaste = (e: Event) => {
            e.preventDefault();
            setProctoringState(prev => ({ ...prev, copyPasteAttempts: prev.copyPasteAttempts + 1 }));
            logEvent(e.type); // copy, cut, paste
            toast.warning('Copy/Paste is disabled during assessment!');
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            logEvent('right_click');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setProctoringState(prev => ({ ...prev, fullscreenViolations: prev.fullscreenViolations + 1 }));
                logEvent('fullscreen_exit');
                setIsInFullscreen(false);
            } else {
                setIsInFullscreen(true);
            }
        };

         const handleMouseLeave = () => {
             setProctoringState(prev => ({ ...prev, mouseLeaves: prev.mouseLeaves + 1 }));
             logEvent('mouse_leave');
         };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('cut', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.body.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('cut', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [effectiveType, isProctoringEnabled]);

  const handleOpenResults = () => {

    setShowResults(true);

    // ✅ Always gather both quiz and coding data (don’t return early)
    const allQuizSubmissions = quizSessionHook?.quizSession?.answers || [];

    const codingModules = questionsData?.data?.coding || [];
    const allCodingQuestions = codingModules.flatMap(mod => mod.questions || []);

    const allCodeSubmissions = allCodingQuestions.map((q, index) => ({
      question_id: q.question_id ?? index,
      html_code: sessionStorage.getItem(`htmlCode-${index}`) || '',
      css_code: sessionStorage.getItem(`cssCode-${index}`) || '',
      js_code: sessionStorage.getItem(`jsCode-${index}`) || '',
      python_code: sessionStorage.getItem(`pythonCode-${index}`) || '',
      test_cases: JSON.parse(sessionStorage.getItem(`testcases-${index}`) || '[]'),
    }));

    // ✅ Only show modal if at least one of them exists
    const hasQuiz = allQuizSubmissions.length > 0;
    const hasCoding = allCodeSubmissions.length > 0;

    if (!hasQuiz && !hasCoding) {
      console.warn("No quiz or coding data found — not opening results modal.");
      toast.warning("No answers or code submissions found.");
      setShowResults(false);
      return;
    }

    // ✅ Save payload for ResultModal
    setPendingPayload({ allQuizSubmissions, allCodeSubmissions });
  };


  /* ================= HOOK INTEGRATION ================= */

  const { submitAssessment } = useAssessmentSubmit();

  // 1b) runs *after* user confirms in the modal
  const handleConfirmSubmit = async () => {
    setShowResults(false)

    const { allQuizSubmissions, allCodeSubmissions } = pendingPayload
    const userId = session?.user?.id
    const testId = sessionStorage.getItem('testId')
    const submissionId = sessionStorage.getItem('submission_id')
    const realSubtopicId = sessionStorage.getItem('subtopic_id')

    // For geeks_test, userId might not be required if we have a token/submission_id
    if (!testId && !subTopicId) {
      toast.error('Missing test info')
      return
    }

    const payload = {
      userId,
      testId: testId || undefined,
      subTopicId: subTopicId || undefined,
      effectiveType,
      allQuizSubmissions,
      allCodeSubmissions,
      proctoringState
    }

    const result = await submitAssessment(payload);

    if (result) {
        const courseId = result.data?.course_id || result.course_id; 

        if (effectiveType === 'assessment' || effectiveType === 'geeks_test' || !courseId) {
           if (typeof window !== 'undefined' && !session?.user?.id) {
               toast.info("Result saved. You can close this window.");
           } else {
               window.location.href = '/dashboard';
           }
        } else {
            // Updated Redirect Logic (Already Fixed in Step 499/533)
            const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://app.skillryt.com' : window.location.origin);
            
            if (window.location.hostname === 'localhost') {
                console.log(`[Dev] Forced redirect to current origin: ${window.location.origin}`);
                window.location.href = `${window.location.origin}/my-courses/${courseId}/course-details`; 
            } else {
                window.location.href = `${baseUrl}/my-courses/${courseId}/course-details`;
            }
        }
    }
  }

  const userId = session?.user?.id

  // const socket = getSocket();

  useEffect(() => {
    const codingModules = questionsData?.data?.coding || []
    const allCodingQuestions = codingModules.flatMap(mod => mod.questions || [])
    const totalQuestions = allCodingQuestions.length

    const allCodeSubmissions = []

    for (let index = 0; index < totalQuestions; index++) {
      const html = sessionStorage.getItem(`htmlCode-${index}`) || ''
      const css = sessionStorage.getItem(`cssCode-${index}`) || ''
      const js = sessionStorage.getItem(`jsCode-${index}`) || ''
      const python = sessionStorage.getItem(`pythonCode-${index}`) || ''
      const testCasesForThis = JSON.parse(sessionStorage.getItem(`testcases-${index}`) || '[]')
    
      const question = allCodingQuestions[index]
      const question_id = question?.question_id || index

      allCodeSubmissions.push({
        question_id,
        question_index: index,
        html_code: html,
        css_code: css,
        js_code: js,
        python_code: python,
        test_cases: testCasesForThis
      })
    }
  }, [])
  
  // ... rest of file (getAssessment etc) ...

  const getAssessment = async () => {
    // Determine effective test ID (token or subtopicId depending on context)
    const currentTestId = subTopicId || test_id;
    if (!currentTestId) {
        console.warn("Skipping getAssessment: No ID found");
        return;
    }
    const data = await fetchFromBackend('/questions/assessment/test', 'POST', { subtopic_id: subTopicId })
    console.log('DEBUG: Test Check Data:', data);
    if (data?.error) {
      toast.error('Error while taking test.')
      return
    }
    if (data.weightage?.length === 0) {
      setGetAttempt(null)
    } else {
      setGetAttempt(data)
      const w = data.weightage || [] 
      console.log('DEBUG: Encoded Weightage:', w)
      const quiz = w.filter((item: any) => item.type === 'mcq') // changed from 'quiz'
      const code = w.filter((item: any) => item.type === 'coding')
      setQuizItems(quiz)
      setCodingItems(code)
    }
  }
  const getPracticeAttempt = async () => {
    const data = await fetchFromBackend('/practiceAttempt', 'POST', { practise_id: practiceId })
    if (data?.error) {
      toast.error('Error while loading practice')
      return
    }
    if (data.weightage?.length === 0) {
      setGetAttempt(null)
    } else {
      setGetAttempt(data)
      const quiz = data.weightage.filter((item: any) => item.type === 'quiz')
      const code = data.weightage.filter((item: any) => item.type === 'coding')
      setQuizItems(quiz)
      setCodingItems(code)
    }
  }
  const getMockAttempt = async () => {
    const data = await fetchFromBackend('/mockAttempt', 'POST', { mock_id: mockId })
    if (data?.error) {
      toast.error('Error while loading mock questions')
      return
    }
    if (data.weightage?.length === 0) {
      setGetAttempt(null)
    } else {
      setGetAttempt(data)
      const quiz = data.weightage.filter((item: any) => item.type === 'quiz')
      const code = data.weightage.filter((item: any) => item.type === 'coding')
      setQuizItems(quiz)
      setCodingItems(code)
    }
  }
  const getGuestQuestion = async () => {
    console.log('Calling /guestTest endpoint with:', { test_id: test_id })
    const data = await fetchFromBackend('/guestTest', 'POST', { test_id: test_id })
    console.log('Response from /guestTest endpoint:', data)
    console.log('First coding question:', data?.data?.coding?.[0]?.questions?.[0])
    if (data?.error) {
      toast.error('Error while taking test.')
      return
    }
    setQuestionsData(data)
  }
  const getGuestAttempt = async () => {
    const data = await fetchFromBackend('/guestAttempt', 'POST', { test_id: test_id })
    if (data?.error) {
      toast.error('Error while fetching guest attempt.')
      return
    }
    if (data.weightage?.length === 0) {
      setGetAttempt(null)
    } else {
      setGetAttempt(data)
      const quiz = data.weightage.filter((item: any) => item.type === 'quiz')
      const code = data.weightage.filter((item: any) => item.type === 'coding')
      setQuizItems(quiz)
      setCodingItems(code)
    }
  }



  const handleSubmitTest = async () => {
    if (quizSessionHook.quizSession) {
      setShowResults(true)
    }
    const codingModules = questionsData?.data?.coding || []
    const allCodingQuestions = codingModules.flatMap(mod => mod.questions || [])
    const totalQuestions = allCodingQuestions.length

    const allCodeSubmissions = []

    for (let index = 0; index < totalQuestions; index++) {
      const html = sessionStorage.getItem(`htmlCode-${index}`) || ''
      const css = sessionStorage.getItem(`cssCode-${index}`) || ''
      const js = sessionStorage.getItem(`jsCode-${index}`) || ''
      const python = sessionStorage.getItem(`pythonCode-${index}`) || ''

      const question = allCodingQuestions[index]
      const question_id = question?.question_id || index

      const testCasesForThis = JSON.parse(sessionStorage.getItem(`testcases-${index}`) || '[]')

      allCodeSubmissions.push({
        question_id,
        question_index: index,
        html_code: html,
        css_code: css,
        js_code: js,
        python_code: python,
        test_cases: testCasesForThis
      })
    }

    // Use the robust effectiveType calculated at component level
    const finalType = effectiveType || 'knowledge_check';

    const testId = subTopicId

    if (!testId) {
      toast.error('Missing test info')
      return
    }

    // 📦 Collect code submissions from sessionStorage
    const code_submissions = []
    if (typeof window !== 'undefined') {
      const totalQuestions = groupedQuestions.length

      for (let index = 0; index < totalQuestions; index++) {
        const html = sessionStorage.getItem(`htmlCode-${index}`) || ''
        const css = sessionStorage.getItem(`cssCode-${index}`) || ''
        const js = sessionStorage.getItem(`jsCode-${index}`) || ''
        const python = sessionStorage.getItem(`pythonCode-${index}`) || ''

        const question = groupedQuestions[index]
        const question_id = index

        code_submissions.push({
          question_id,
          html_code: html,
          css_code: css,
          js_code: js,
          python_code: python
        })
      }
    }

    // 4. Construct Payload
    const allQuizSubmissions = quizSessionHook.quizSession?.answers || []
    
    // For 'test' mode, we usually don't have quiz submissions in the same way, but if we do, include them.
    // If it's pure coding (practice), this array might be empty. 
    
    const payload = {
        userId,
        testId,
        effectiveType, // Robust type from URL/Session
        allQuizSubmissions,
        allCodeSubmissions: code_submissions,
        proctoringState, // Pass the whole object for the hook to destructure
    };

    const result = await submitAssessment({
        ...payload,
        subTopicId: subTopicId || undefined,
        testId: testId || undefined
    });

    if (result) {
        // Redirection Logic
        if (effectiveType === 'assessment' || effectiveType === 'geeks_test' || !result.data?.course_id) {
           if (typeof window !== 'undefined' && !session?.user?.id) {
               toast.info("Result saved. You can close this window.");
           } else {
               window.location.href = '/dashboard';
           }
        } else {
            const courseId = result.data.course_id;
            const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://app.skillryt.com' : window.location.origin);
            
            if (window.location.hostname === 'localhost') {
                console.log(`[Dev] Forced redirect to current origin: ${window.location.origin}`);
                window.location.href = `${window.location.origin}/my-courses/${courseId}/course-details`;
            } else {
                window.location.href = `${baseUrl}/my-courses/${courseId}/course-details`;
            }
        }
    }
  }

  const handleExitDecision = (confirm: boolean) => {
    setShowExitConfirm(false)
    if (confirm) {
      window.location.href = '/disqualified'
    }
  }

  const getQuestion = async () => {
    console.log('Calling /questions/assessment/question endpoint with:', { subtopic_id: subTopicId })
    const data = await fetchFromBackend('/questions/assessment/question', 'POST', { subtopic_id: subTopicId, type: effectiveType })
    console.log('Response from /questions/assessment/question endpoint:', data)
    if (data?.error) {
      toast.error('Error while fetching questions.')
      return
    }
    setQuestionsData(data)
  }
const getAssessmentQuestions = async () => {
    try {
        const typeParam = searchParams.get('type');
        const reqType = typeParam || 'knowledge_check';

        const token = searchParams.get('token') || storeToken; // ✅ extract token from URL or Store

        if (!token) {
            console.error("Authentication token missing in getAssessmentQuestions");
            toast.error('Authentication token missing');
            return;
        }

        // Use Domain API (which handles BASE_URL and intercepts request with token if using useApi/httpClient, 
        // but httpClient uses store token. If URL token is different, we might need to handle that.
        // However, standard flow is syncing URL token to store.
        
        // If we strictly need to pass the token explicitly (e.g. Guest mode without store sync yet),
        // we might stick to fetch or update httpClient to allow override.
        // Given 'Clean URL' flow, token SHOULD be in store.
        
        const data = await assessmentApi.getQuestionsByType(subTopicId || '', reqType);
        console.log('Response from Assessment API (Domain):', data);

        const questions = data.data || [];

        const mcqQuestions = questions
            .filter((q: any) => q.type === 'mcq')
            .map((q: any) => {
                const optionsRecord: Record<string, string> = {};
                const correctAnswers: string[] = [];

                if (Array.isArray(q.mcq_options)) {
                    q.mcq_options.forEach((opt: any) => {
                        const optId = String(opt.id);
                        optionsRecord[optId] = opt.text || opt.option || ''; 
                        if (opt.is_correct) {
                            correctAnswers.push(optId);
                        }
                    });
                }

                // Determine frontend type based on mcq_type relation or inference
                // Backend 'mcq_type' might have 'slug' or 'code'. 
                // Common slugs: 'single_choice', 'multiple_choice'
                const backendType = q.mcq_type?.slug || q.mcq_type?.code || '';
                let frontendType = 'single_choice';

                if (backendType === 'multiple_choice' || correctAnswers.length > 1) {
                    frontendType = 'multiple_choice';
                }

                return {
                    ...q,
                    quiz_id: String(q.id), // Components expect string ID
                    question: q.title || q.question || '', // Map title to 'question' prop
                    options: optionsRecord,
                    type: frontendType, // Overwrite 'mcq' with specific UI type
                    correctAnswer: frontendType === 'multiple_choice' ? correctAnswers : (correctAnswers[0] || null),
                    module_name: 'General'
                };
            });

        const codingQuestions = questions
            .filter((q: any) => q.type === 'coding')
            .map((q: any) => {
                const testCases = (q.coding_details || [])
                    .flatMap((detail: any) => detail.coding_testcases || [])
                    .map((tc: any) => ({
                        input: tc.input_data || '',
                        expected_output: tc.expected_output || '',
                        weightage: tc.weightage || 0
                    }));

                return {
                    ...q,
                    question_id: q.id, // Coding components expect question_id
                    title: q.title || `Question ${q.id}`,
                    description: q.content || '', // Map content to description for ProblemStatement
                    test_cases: testCases,
                    module_name: 'General'
                };
            });

        const formattedData = {
            data: {
                mcq: mcqQuestions.length
                    ? [{ module_name: 'General', questions: mcqQuestions }]
                    : [],
                coding: codingQuestions.length
                    ? [{ module_name: 'General', questions: codingQuestions }]
                    : [],
                is_saved_state: false
            }
        };

        setQuestionsData(formattedData);

        if (mcqQuestions.length) {
            setQuizItems([{ type: 'mcq', count: mcqQuestions.length, mod_name: 'General' }] as any);
        }

        if (codingQuestions.length) {
            setCodingItems([{ type: 'coding', count: codingQuestions.length, mod_name: 'General' }] as any);
        }

    } catch (error) {
        console.error(error);
        toast.error('Failed to load questions.');
    }
};

  const getPracticeQuestion = async () => {
    console.log('Calling /practiceQuestions endpoint with:', { practise_id: practiceId })
    const data = await fetchFromBackend('/practiceQuestions', 'POST', { practise_id: practiceId })
    console.log('Response from /practiceQuestions endpoint:', data)
    console.log('First coding question:', data?.data?.coding?.[0]?.questions?.[0])
    if (data?.error) {
      toast.error('Error while fetching practice questions.')
      return
    }
    setQuestionsData(data)
  }
  const getMockQuestion = async () => {
    console.log('Calling /mockQuestions endpoint with:', { mock_id: mockId })
    const data = await fetchFromBackend('/mockQuestions', 'POST', { mock_id: mockId })
    console.log('Response from /mockQuestions endpoint:', data)
    console.log('First coding question:', data?.data?.coding?.[0]?.questions?.[0])
    if (data?.error) {
      toast.error('Error while fetching questions.')
      return
    }
    setQuestionsData(data)
  }


  const groupedQuizQuestions = useMemo(() => {
    if (!questionsData || !quizItems.length) return []
    const quizModules = quizItems.map(item => item.mod_name.trim())
    const result = (questionsData.data.mcq || [])
      .filter(module => quizModules.includes(module.module_name.trim()))
      .map(module => ({
        module_name: module.module_name.trim(),
        questions: module.questions
      }))

    return result
  }, [questionsData, quizItems])

  const quizQuestions = useMemo(() => groupedQuizQuestions.flatMap(g => g.questions), [groupedQuizQuestions])
  const quizModuleMap = useMemo(
    () => groupedQuizQuestions.flatMap(g => g.questions.map(() => g.module_name)),
    [groupedQuizQuestions]
  )

  // const quizSessionHook = useQuizEmitterHook(
  //   "quiz-session",
  //   quizQuestions,
  //   session?.user?.id ?? ""
  // );

  // const quizType = typeof window !== 'undefined' ? sessionStorage.getItem('type') : null;

  // const quizSessionHook =
  //   quizType === 'test'
  //     ? useQuizEmitterHook('quiz-session', quizQuestions, session?.user?.id ?? '')
  //     : useQuizHook('quiz-session', quizQuestions);

  //     console.log(quizType);

  const testId = sessionStorage?.getItem('testId') || '1'

  const quizSessionHook = useDynamicQuizHook(testId, quizQuestions, session?.user?.id);



  // useQuizAutosaveSocket(socket, quizSessionHook.quizSession, session?.user.id, subTopicId );

  const [folderTree, setFolderTree] = useState<TreeNode | null>(null)

  useEffect(() => {
    if (!effectiveType) return;

    const is_timed_assessment = sessionStorage.getItem('is_timed_assessment'); // '0' | '1'
    const isTimed = is_timed_assessment === '1' ? 1 : 0;

    const socket = getSocket();
    socketRef.current = socket;

    let localInterval: NodeJS.Timeout | null = null;
    const submissionId = sessionStorage.getItem('submission_id') || null;

    // 🚿 Remove old handlers to avoid duplicates
    socket.off('timer-update');
    socket.off('timer-complete');
    socket.off('test_started');

    // ---- Handlers ----
    const handleTimerUpdateTimed = ({
      remaining,
      elapsed,
    }: {
      remaining?: number;
      elapsed?: number;
    }) => {

      if (typeof remaining === 'number') {
        setSeconds(remaining);
      }
    };

    const handleTimerComplete = () => {

      alert('⏰ Time is up!');
      socket.off('timer-update', handleTimerUpdateTimed);
    };

    const handleInitialElapsedPractice = ({ elapsed }: { elapsed?: number }) => {

      if (typeof elapsed === 'number') {
        setSeconds(elapsed);

        if (localInterval) clearInterval(localInterval);

        // Local +1s stopwatch
        localInterval = setInterval(() => {
          setSeconds(prev => prev + 1);
        }, 1000);
      }
    };

    // ✅ Attach listeners BEFORE register_user
    if (isTimed === 1) {
      socket.on('timer-update', handleTimerUpdateTimed);
      socket.once('timer-complete', handleTimerComplete);
      socket.once('test_started', () => {});
    } else {
      socket.on('timer-update', handleInitialElapsedPractice);
      socket.once('test_started', () => {});
    }

    const effectiveTestId = (effectiveType === 'geeks_test' && token) ? token : testId;

    // --- Now register user (after listeners are attached) ---
    const payload = {
      userId,
      testId: effectiveTestId,
      token: session?.user?.accessToken,
      testType: effectiveType,
      isTimed,
      submissionId,
    };
    socket.emit('register_user', payload);

    // ---- Cleanup ----
    return () => {

      socket.off('timer-update', handleTimerUpdateTimed);
      socket.off('timer-complete', handleTimerComplete);
      socket.off('test_started');

      if (localInterval) {
        clearInterval(localInterval);

      }

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, testId, token, session?.user?.accessToken, effectiveType]);

  useEffect(() => {
    if (questionsData?.data) {
      const firstNonEmpty = Object.entries(questionsData.data).find(([key, val]: any) => val?.length > 0)
      if (firstNonEmpty) setActiveTab(firstNonEmpty[0])
    }
  }, [questionsData])


  useEffect(() => {
    const folderPath = questionsData?.data?.coding?.[0]?.questions?.[0]?.folder_path
    if (!folderPath) return

    const fetchFolderTree = async () => {
      try {
        const res = await fetch(`/api/github?url=${encodeURIComponent(folderPath)}`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setFolderTree(data)
      } catch (error) {
        console.error('Failed to fetch folder tree:', error)
      }
    }

    fetchFolderTree()
  }, [questionsData?.data?.coding?.[0]?.questions?.[0]?.folder_path])


  const enrichedQuestions = (questionsData?.data?.coding?.[0]?.questions || []).map(q => {

    return {
      ...q,
      folder_tree: folderTree
    }
  })



  useEffect(() => {
    if (subTopicId) {
      const typeParam = searchParams.get('type');
      if (typeParam === 'knowledge_check' || typeParam === 'practice') {
          // Use the new API for these types
          getAssessmentQuestions();
      } else {
          // Fallback to old behavior
          getAssessment()
          getQuestion()
      }
      return
    }
    else if (practiceId) {
      getPracticeAttempt()
      getPracticeQuestion()
      return
    }
    else if (mockId) {
      getMockAttempt()
      getMockQuestion()
      return
    }
    getGuestAttempt()
    getGuestQuestion()
  }, [subTopicId, test_id, practiceId])

  return (
    <div className='w-full is-full'>
      {/* <div className='w-full flex justify-center items-center bg-indigo-100 text-indigo-500 py-2 px-5'> */}

      {/* </div> */}
      <div className='flex justify-between items-center px-4 border'>
        <div className='flex justify-start items-center gap-5'>
          <div className='bg-white border-r   flex justify-center items-center py-4 pr-4 h-fit'>
            <Link href={'/'}>
              <Logo />
            </Link>
          </div>
          <div className='flex gap-2  justify-start items-center'>
            {Object.entries(questionsData?.data || {})
              .filter(([key, val]: any) => val?.length > 0) // only show tabs with non-empty modules
              .map(([key]) => (
                <Button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-1.5 rounded ${activeTab === key
                    ? 'bg-[#7267f03a]'
                    : 'bg-white border border-slate-200 shadow-sm dark:bg-zinc-800 dark:text-white'
                    }`}
                >
                  {key === 'mcq' ? 'Quiz' : key === 'coding' ? 'Coding' : key}
                </Button>
              ))}
          </div>
        </div>

        {/* Cheat Score UI */}
        {(['assessment', 'geeks_test'].includes(effectiveType)) && (
            <div className="flex items-center gap-2 mr-4 bg-red-50 text-red-600 px-3 py-1 rounded border border-red-200">
                <span className="text-sm font-bold">⚠️ Cheating Score:</span>
                <span className="text-lg font-extrabold">{proctoringState.tabSwitches + proctoringState.fullscreenViolations + proctoringState.copyPasteAttempts + proctoringState.mouseLeaves}</span>
            </div>
        )}

        <div className='flex gap-2 justify-end items-center'>
          {/* Localhost Toggle Button (Moved here) */}
          {isLocalhost && (
             <Button 
                variant="outlined" 
                color={isProctoringEnabled ? "error" : "success"} 
                size="small"
                onClick={() => setIsProctoringEnabled(!isProctoringEnabled)}
             >
                 {isProctoringEnabled ? "Disable Proctoring" : "Enable Proctoring"}
             </Button>
          )}

          {(session?.user?.id && (subTopicId || token)) && (
            <TestTimer seconds={seconds} />
          )}
          <div className='bg-slate-200 h-8 w-1 rounded-md'></div>
          {/* <Button variant='contained' color='success' onClick={handleSubmitTest}>
            Submit
          </Button> */}
          <Button variant='contained' color='primary' onClick={handleOpenResults}>Submit</Button>
          { showResults && (
            <ResultModal
              open={showResults}
              onClose={() => setShowResults(false)}
              onConfirm={handleConfirmSubmit}
              answers={pendingPayload.allQuizSubmissions}
              totalQuestions={quizSessionHook.quizSession?.questions.length ?? 0}
              timeTaken={2}
              codeSubmissions={pendingPayload.allCodeSubmissions}
              quizQuestions={quizSessionHook.quizSession}
              codingQuestions={questionsData?.data?.coding?.[0]?.questions}
            />
          )}

        </div>
      </div>

      {activeTab === 'mcq' && quizSessionHook.quizSession ? (
        <QuizPanel
          quizSession={quizSessionHook.quizSession}
          questionModuleMap={quizModuleMap}
          handleAnswerSelect={quizSessionHook.handleAnswerSelect}
          handleClearAnswer={quizSessionHook.handleClearAnswer}
          handleBookmark={quizSessionHook.handleBookmark}
          handleSkip={quizSessionHook.handleSkip}
          handleNext={quizSessionHook.handleNext}
          handlePrevious={quizSessionHook.handlePrevious}
          handleSubmit={quizSessionHook.handleSubmit}
          goToQuestion={quizSessionHook.goToQuestion}
          handleCheckAnswer={() => quizSessionHook.handleCheckAnswer() ?? false}
          updateAnswer={quizSessionHook.updateAnswer}
          timer={quizSessionHook.timer}
        />
      ) : activeTab === 'coding' && questionsData?.data ? (
        (() => {
          const codingModules = questionsData.data.coding || []

          // Filter out modules with questions
          const allCodingQuestions = codingModules
            .filter(mod => Array.isArray(mod.questions) && mod.questions.length > 0)
            .flatMap(mod => mod.questions)

          if (allCodingQuestions.length === 0) {
            return <div className="text-center text-muted">No coding questions available.</div>
          }

          const firstCoding = allCodingQuestions[0]
          const type = firstCoding?.type?.toLowerCase()

          const isSpecialType = type === 'vite+react' || type === 'full_stack' || type === 'fullstack' || type === 'full stack'

          // ⛔ Wait for folderTree before rendering anything
          if (isSpecialType && !folderTree) {
            return <div className="text-primary">Preparing coding environment...</div>
          }

          return isSpecialType
            ? <Coding groupedQuestions={enrichedQuestions} />
            : <ProgrammingPage 
                key={isProctoringEnabled ? 'secure' : 'insecure'}
                groupedQuestions={allCodingQuestions} 
                userId={userId} 
                isProctoringEnabled={isProctoringEnabled} 
              />
        })()
      ) : (
        <div className="text-primary">Loading questions...</div>
      )
      }


      {/* Fullscreen exit warning dialog with countdown */}
      <ExitFullscreenDialog
        open={showExitConfirm}
        onCancel={() => {
          setShowExitConfirm(false)
          enterFullscreen() // user chooses to stay
        }}
        onConfirm={() => handleExitDecision(true)} // user chooses to exit
      />

       {/* Fullscreen Enforcement Overlay */}
       {(['assessment', 'geeks_test'].includes(effectiveType)) && isProctoringEnabled && !isInFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ Assessment Security</h2>
            <p className="mb-6 text-gray-700 max-w-md">
                This assessment requires fullscreen mode. All activity is monitored.
                Please do not switch tabs or exit fullscreen, as these actions are recorded.
            </p>
            <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={() => {
                    enterFullscreen();
                    setTimeout(() => setIsInFullscreen(true), 100);
                }}
            >
                Enter Fullscreen to Start
            </Button>
        </div>
      )}
    </div>
  )
}
