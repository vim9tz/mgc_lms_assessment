
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircularProgress } from '@mui/material';
import { useAuthStore } from '@/store/useAuthStore';
import { useSSOExchange } from '@/domains/auth/hooks/useSSOExchange';
import AssessmentLoading from '@/views/pages/assessment/components/AssessmentLoading';

export const dynamic = 'force-dynamic';

function LaunchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { exchange, isLoading } = useSSOExchange();
    const [status, setStatus] = useState('Initializing secure session...');
    const setToken = useAuthStore((state) => state.setToken)

    console.log('[LaunchPage] Render cycle started');

    useEffect(() => {
        console.log('[LaunchPage] Component mounted or dependencies changed');
        const code = searchParams.get('code');
        const verifier = searchParams.get('code_verifier');
        const subtopic_id = searchParams.get('subtopic_id');
        const type = searchParams.get('type');
        
        console.log('[LaunchPage] URL Params:', { code, verifier, subtopic_id, type });

        if (!code) {
            console.error('[LaunchPage] No code found in URL');
            setStatus('Error: No launch code provided.');
            return;
        }

        const runExchange = async () => {
            console.log('[LaunchPage] Starting exchange...');
            try {
                const data = await exchange({ code, code_verifier: verifier });
                console.log('[LaunchPage] Exchange success:', data);
                
                if (data.token) {
                    // Store token in Zustand (persisted)
                    console.log('[LaunchPage] Setting token in store');
                    setToken(data.token);
                    
                    setStatus('Redirecting to assessment...');
                    
                    // Redirect without exposing token in URL (Clean URL) but keeping context
                    const question_coding_id = searchParams.get('question_coding_id');
                    
                    if (subtopic_id && (type === 'knowledge_check' || type === 'practice') && !question_coding_id) {
                         const target = `/preview?subtopic_id=${subtopic_id}&type=${type}`;
                         console.log('[LaunchPage] Redirecting to:', target);
                         router.push(target);
                    } else {
                         let target = '/assessment';
                         if (question_coding_id) {
                             target += `?question_coding_id=${question_coding_id}`;
                         }
                         console.log('[LaunchPage] Redirecting to:', target);
                         router.push(target);
                    }
                } else {
                    console.error('[LaunchPage] No token in response data');
                    setStatus('Authentication failed: No token received.');
                }
            } catch (err: any) {
                console.error('[LaunchPage] Exchange error:', err);
                setStatus(`Authentication failed: ${err.message || 'Unknown error'}`);
            }
        };

        runExchange();
    }, [searchParams, router, exchange, setToken]);

    return (
       <AssessmentLoading />
    );
}

export default function LaunchPage() {
    return (
        <Suspense fallback={<AssessmentLoading />}>
            <LaunchContent />
        </Suspense>
    );
}
