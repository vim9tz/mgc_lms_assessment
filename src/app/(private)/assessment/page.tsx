'use client';
import AssessmentQuiz from "@/views/pages/assessment";
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export default function Assessment() {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    console.log('Assessment Page Loaded. Token in store:', token);
  }, [token]);

  return (
    <AssessmentQuiz/>
  );
}
