
import { useState } from 'react';
import { assessmentApi } from '../api/assessment.api';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/useAuthStore';

interface SubmitPayload {
  allQuizSubmissions: any[];
  allCodeSubmissions: any[];
  proctoringState: any;
  subTopicId?: string;
  testId?: string;
  userId?: string;
  effectiveType: string;
}

export const useAssessmentSubmit = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: session } = useSession();
    const storeToken = useAuthStore((state) => state.token);

    const submitAssessment = async (payload: SubmitPayload) => {
        setIsSubmitting(true);
        try {
            const { 
                allQuizSubmissions, 
                allCodeSubmissions, 
                proctoringState, 
                subTopicId, 
                testId, 
                userId,
                effectiveType 
            } = payload;

            const finalTestId = (effectiveType === 'geeks_test' && sessionStorage.getItem('subtopic_id')) 
                ? sessionStorage.getItem('subtopic_id') 
                : (testId || subTopicId);

            if (!finalTestId) {
                toast.error("Missing assessment ID");
                setIsSubmitting(false);
                return;
            }

            const submissionData = {
                user_id: userId,
                test_id: finalTestId,
                type: effectiveType,
                allQuizSubmissions,
                allCodeSubmissions,
                allocation_mode: effectiveType,
                tab_switches: proctoringState.tabSwitches,
                copy_paste: proctoringState.copyPasteAttempts,
                fullscreen_violations: proctoringState.fullscreenViolations,
                mouse_leaves: proctoringState.mouseLeaves,
                proctoring_logs: proctoringState.logs,
                system_info: proctoringState.systemInfo,
                submission_id: sessionStorage.getItem('submission_id')
            };

            console.log("🚀 Submitting Assessment via Domain Hook:", submissionData);
            
            const response = await assessmentApi.submit(submissionData);

            if (response.success) {
                toast.success("Assessment Submitted Successfully!");
                return response.data; // Return data for redirection logic in component
            } else {
                toast.error(response.message || "Submission failed");
                return null;
            }

        } catch (error: any) {
            console.error("Submission Error:", error);
            toast.error(error.message || "Server Error during submission");
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { submitAssessment, isSubmitting };
};
