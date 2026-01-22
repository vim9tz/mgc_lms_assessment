
import { useState, useEffect } from 'react';
import { codeRunnerApi } from '../api/codeRunner.api';
import { toast } from 'react-toastify';
import { signOut } from 'next-auth/react';

export const useCodeRunner = (questionId?: string, token?: string) => {
    const [question, setQuestion] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [topicQuestions, setTopicQuestions] = useState<any[]>([]);
    const [loadingTopicQuestions, setLoadingTopicQuestions] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchQuestion = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await codeRunnerApi.getQuestion(id);
            // Handling the data unwrapping here or in API. 
            // The API returns 'data' property usually directly from httpClient response.data.
            // But let's check structure.
            const q = data.data ?? data; 
            setQuestion(q);
            return q;
        } catch (err: any) {
            console.error("Fetch Question Error:", err);
            if (err.response?.status === 401) {
                 signOut({ callbackUrl: '/' });
            } else {
                 setError(err.message || "Failed to load question");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchTopicQuestions = async (topicId: number) => {
        setLoadingTopicQuestions(true);
        try {
            const data = await codeRunnerApi.getTopicQuestions(topicId);
            setTopicQuestions(data.data || []);
        } catch (err) {
            console.error("Topic Questions Error:", err);
        } finally {
            setLoadingTopicQuestions(false);
        }
    };

    const submitCode = async (payload: any) => {
        setSubmitting(true);
        try {
            const data = await codeRunnerApi.submit(payload);
            return data;
        } catch (err: any) {
            console.error("Submit Code Error:", err);
            if (err.response?.status === 401) {
                signOut({ callbackUrl: '/' });
            }
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (questionId) {
            fetchQuestion(questionId).then((q) => {
                if (q?.topic_id) {
                    fetchTopicQuestions(q.topic_id);
                }
            });
        }
    }, [questionId, token]);

    return {
        question,
        loading,
        error,
        topicQuestions,
        loadingTopicQuestions,
        submitting,
        fetchQuestion,
        fetchTopicQuestions,
        submitCode
    };
};

export const useSubmitCode = () => {
    const [isPending, setIsPending] = useState(false);

    const mutateAsync = async (payload: any) => {
        setIsPending(true);
        try {
            return await codeRunnerApi.submitCode(payload);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending };
};

export const useSaveCode = () => {
    const [isPending, setIsPending] = useState(false);

    const mutateAsync = async (payload: any) => {
        setIsPending(true);
        try {
            return await codeRunnerApi.saveCode(payload);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending };
};

export const useResetCode = () => {
    const [isPending, setIsPending] = useState(false);

    const mutateAsync = async (questionId: string) => {
        setIsPending(true);
        try {
            return await codeRunnerApi.resetCode(questionId);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending };
};
