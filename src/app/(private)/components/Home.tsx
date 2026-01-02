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

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const subTopicId = searchParams.get('subTopic')
  const practiceId = searchParams.get('practiceId')
  const mockId = searchParams.get('mockId')
  const test_id = searchParams.get('token')
  const { fetchFromBackend } = useApi()
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
     const token = searchParams.get('token');
     const effectiveType = type || (token ? 'geeks_test' : 'test');


    // Capture system info on mount
    useEffect(() => {
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
    }, [effectiveType]);

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


  // 1b) runs *after* user confirms in the modal
  const handleConfirmSubmit = async () => {
    setShowResults(false)

    const { allQuizSubmissions, allCodeSubmissions } = pendingPayload
    // const testId = subTopicId;
    const userId = session?.user?.id

    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction ? 'https://app.skillryt.com' : 'http://localhost:3000';

    const testId = sessionStorage.getItem('testId')

    const sessionType = sessionStorage.getItem('type');
    const submissionId = sessionStorage.getItem('submission_id');
    const realSubtopicId = sessionStorage.getItem('subtopic_id');

    // const token = searchParams.get('token'); // already at top
    // Fallback: if sessionType is missing but we have a token, assume 'geeks_test'
    // Also, if 'test_type' in session is 'geeks_test', prefer that. 
    // const effectiveType = sessionType || (token ? 'geeks_test' : 'test'); // already at top

    // For geeks_test, userId might not be required if we have a token/submission_id
    if ((!userId && effectiveType !== 'geeks_test') || !testId) {
      toast.error('Missing user or test info')
      return
    }

    // specific fix for geeks_test data truncation:
    // we use realSubtopicId if available, otherwise fallback to testId (token)
    const finalTestId = (effectiveType === 'geeks_test' && realSubtopicId) ? realSubtopicId : testId;

    const payload: any = {
      // user_id: userId,
      type: effectiveType,
      test_id: finalTestId,
      allQuizSubmissions,
      allCodeSubmissions,
      tab_switches: proctoringState.tabSwitches,
      copy_paste: proctoringState.copyPasteAttempts,
      fullscreen_violations: proctoringState.fullscreenViolations,
      mouse_leaves: proctoringState.mouseLeaves,
      proctoring_logs: proctoringState.logs,
      system_info: proctoringState.systemInfo,
    }

    if (userId) payload.user_id = userId;
    if (submissionId) payload.submission_id = submissionId;
    
    console.log('handleConfirmSubmit Payload:', payload);

    try {
      const res = await fetchFromBackend('/submitquiz', 'POST', payload)
      console.log('🚀 submitquiz response:', res);

      if (res.success) {
        toast.success('Submitted successfully!')
        const courseId = res.course_id;

        if (effectiveType === 'assessment' || effectiveType === 'geeks_test' || !courseId) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = `${baseUrl}/my-courses/${courseId}/course-details`;
        }

        // window.close()
      } else {
        toast.error('Submission failed.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Server error submitting.')
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

      allCodeSubmissions.push({
        question_index: index,
        html_code: html,
        css_code: css,
        js_code: js,
        python_code: python
      })
    }
  }, [])

  const getAssessment = async () => {
    const data = await fetchFromBackend('/test', 'POST', { subtopic_id: subTopicId })
    if (data?.error) {
      toast.error('Error while taking test.')
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

    const type = typeof window !== 'undefined' ? sessionStorage.getItem('type') : null
    const testId = subTopicId

    if (!userId || !testId) {
      toast.error('Missing user or test info')
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

    if (type === 'test') {
      try {
        // const res = await fetchFromBackend("/endtest", "POST", {
        //   user_id: userId,
        //   test_id: testId,
        // });

        const socket = getSocket()

        socket.emit('submit_test', {
          userId: userId,
          testId: sessionStorage.getItem('testId'),
          type: sessionStorage.getItem('type')
        })

        // if (res?.success) {
        //   toast.success("Test submitted successfully!");
        //   // window.location.href = '/thank-you';
        // } else {
        //   toast.error("Failed to submit test.");
        // }
      } catch (err) {
        console.error('Test submit error:', err)
        toast.error('Server error submitting test.')
      }
    } else {
      const allQuizSubmissions = quizSessionHook.quizSession?.answers || []
      const testCases = JSON.parse(sessionStorage.getItem('testcases') || '[]')

      const payload = {
        user_id: userId,
        test_id: testId,
        allQuizSubmissions,
        allCodeSubmissions
      }

      // console.log('🚀 Final Submission Payload:', payload)

      try {
        const res = await fetchFromBackend('/submitquiz', 'POST', payload)

        if (res?.success) {
          toast.success('Quiz submitted successfully!')
          // window.location.href = '/thank-you';
        } else {
          toast.error('Failed to submit quiz.')
        }
      } catch (err) {
        console.error('Quiz submit error:', err)
        toast.error('Server error submitting quiz.')
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
    console.log('Calling /question endpoint with:', { subtopic_id: subTopicId })
    const data = await fetchFromBackend('/question', 'POST', { subtopic_id: subTopicId })
    console.log('Response from /question endpoint:', data)
    if (data?.error) {
      toast.error('Error while fetching questions.')
      return
    }
    setQuestionsData(data)
  }
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
      getAssessment()
      getQuestion()
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
            : <ProgrammingPage groupedQuestions={allCodingQuestions} userId={userId} />
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
       {(['assessment', 'geeks_test'].includes(effectiveType)) && !isInFullscreen && (
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
