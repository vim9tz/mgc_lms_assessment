'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Home from './components/Home';
import { enterFullscreen, isFullscreen, monitorFullscreen } from '@/utils/fullscreen';
import { getSocket } from '@/lib/socket';
import useApi from '@/hooks/useApi';
import { checkTimeSync } from './components/checkTimeSync';

export default function HomePage() {
  const router = useRouter();
  const socket = getSocket();
  const { data: session } = useSession();
  const {fetchFromBackend} = useApi();

  const [hydrated, setHydrated] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const [validTestStatus, setValidTestStatus] = useState<'loading' | 'valid' | 'invalid' | 'timeNotvalid'>('loading');
  const [exitLog, setExitLog] = useState<Record<string, number>>({});
  const [hasRecordedInitial, setHasRecordedInitial] = useState(false);
  const exitAlreadyHandled = useRef(false);

  const recordExit = (reason: string) => {
    if (exitAlreadyHandled.current) return;
    exitAlreadyHandled.current = true;

    const prevLog = JSON.parse(sessionStorage.getItem('fullscreenExitLog') || '{}');
    const updatedLog = {
      ...prevLog,
      [reason]: (prevLog[reason] || 0) + 1,
    };

    sessionStorage.setItem('fullscreenExitLog', JSON.stringify(updatedLog));
    setExitLog(updatedLog);

    setTimeout(() => {
      exitAlreadyHandled.current = false;
    }, 1000);
  };

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Step 1: Check test validity and setup session
  useEffect(() => {
    const checkValidity = async (subTopicId: string) => {
      try {
        const checkRes = await fetchFromBackend('/checkCheck', 'POST', {
          subtopic_id: subTopicId,
        });

        console.log( 'check res ' , checkRes);
        if (checkRes.error || checkRes.valid !== true) {
          // setValidTestStatus('invalid');
          setValidTestStatus('valid');

        } else {
          setValidTestStatus('valid');
          // sessionStorage.setItem('test_type', checkRes?.is_practise==true ? "practise" : "test");
          console.log('john' , subTopicId , checkRes , );

          sessionStorage.setItem('test_type', checkRes?.type);

          sessionStorage.setItem('is_timed_assessment', checkRes?.is_timed_assessment);

          console.log( checkRes , 's_id')

          sessionStorage.setItem('submission_id', checkRes?.submission_id);



          
        }
      } catch (e) {
        setValidTestStatus('invalid');
      }
    };

    if (!hydrated || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const subTopicId = params.get('subTopic');
    const token = params.get('token');
    const practiceId = params.get('practiceId');
    const mockId = params.get('mockId');
    const typeParam = params.get('type');

    if (!subTopicId && !token) {
      router.replace('/dashboard');
      return;
    }   

    sessionStorage.setItem('fullscreenExitLog', JSON.stringify({}));

    const initTest = async () => {
      if (subTopicId) {
        sessionStorage.setItem('type', 'test');
        sessionStorage.setItem('testId', subTopicId);
        await checkValidity(subTopicId);
      } else if (token) {
        sessionStorage.setItem('type', 'geeks_test');
        sessionStorage.setItem('testId', token);
        
        try {
          const guestRes = await fetchFromBackend('/guestAttempt', 'POST', { test_id: token });
          console.log('🚀 guestRes keys:', Object.keys(guestRes || {}));
          console.log('🚀 guestRes values:', guestRes);
          if (guestRes && !guestRes.error) {
             // Fallback to 'assessment' if type is missing
             const tType = guestRes.type || 'assessment';
             sessionStorage.setItem('test_type', tType);
             
             // Infer is_timed_assessment if not explicit
             const isTimed = guestRes.is_timed_assessment ?? (guestRes.test_duration > 0 ? 1 : 0);
             sessionStorage.setItem('is_timed_assessment', String(isTimed));
             
             if (guestRes.submission_id) {
               sessionStorage.setItem('submission_id', guestRes.submission_id);
             }
             if (guestRes.subtopic_id) {
                // This is the actual numeric/DB ID for the test
                sessionStorage.setItem('subtopic_id', guestRes.subtopic_id);
             } else if (guestRes.test_id && guestRes.test_id !== token) {
                // If test_id is returned and different from token, it might be the real ID
                sessionStorage.setItem('subtopic_id', guestRes.test_id);
             }
          }
        } catch (error) {
          console.error("Error fetching guest attempt:", error);
        }

        setValidTestStatus('valid');
      }
      else if (practiceId || mockId) {
        setValidTestStatus('valid');
      }

      setInitComplete(true);
    };

    initTest();
  }, [hydrated, router]);

  // Step 2: Fullscreen + Monitoring
  useEffect(() => {
    if (!initComplete || validTestStatus !== 'valid') return;

    setTimeout(() => {
      if (!isFullscreen() && !hasRecordedInitial) {
        recordExit('initial-not-fullscreen');
        setHasRecordedInitial(true);
      }
    }, 300);

    enterFullscreen();

    monitorFullscreen({
      onEnter: () => {},
      onExit: () => {
        recordExit('fullscreen-exit');
      },
    });

    const onVisibility = () => {
      if (document.hidden) recordExit('tab-switch');
    };
    const onBlur = () => {
      recordExit('window-blur');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [initComplete, validTestStatus]);

  // Step 3: Emit exit log
  useEffect(() => {
    if (!initComplete || !session?.user?.id || validTestStatus !== 'valid') return;

    const params = new URLSearchParams(window.location.search);
    const subTopic = params.get('subTopic');

    if (!subTopic || Object.keys(exitLog).length === 0) return;

    socket.emit('exitLogUpdate', {
      userId: session.user.id,
      subTopic,
      exitLog,
    });
  }, [exitLog, initComplete, session, validTestStatus]);

  // Step 4: Render conditions
  if (!hydrated || !initComplete || validTestStatus === 'loading') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white text-gray-600 text-xl">
        Loading test environment...
      </div>
    );
  }

  if (validTestStatus === 'invalid') {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">❌ This test is invalid or already attempted.</h1>
        <p className="mb-6 text-lg">Please choose an option below to continue:</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => router.replace('/dashboard')}
            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => signOut()}
            className="px-5 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Sign Out
          </button>
          <button
            onClick={() => window.close()}
            className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return <Home />;
}
