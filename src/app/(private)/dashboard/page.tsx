'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import HeroCard from '@/views/dash/HeroCard';
import AssessmentList from '@/views/dash/AssesmentList';
import useApi from '@/hooks/useApi';

import { CircularProgress } from '@mui/material';
import { GeeksTestSubmissionType, UserDetailsType } from './attemptTypes'; // Add UserDetailsType

export default function Page(): JSX.Element {
  const { fetchFromBackend } = useApi();
  const { data: session } = useSession();

  const [loading, setLoading] = useState<boolean>(true);
  const [submissions, setSubmissions] = useState<GeeksTestSubmissionType[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetailsType | null>(null);

  const userId = session?.user?.id;

  const getAssessment = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetchFromBackend('/getGeeksSubmission', 'POST', {
        user_id: userId,
      });

      if (response?.error) {
        toast.error('Error while fetching test submissions.');
        return;
      }

      setSubmissions(response.tests || []);
      setUserDetails(response.user_details || null);
      // console.log(response);
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) getAssessment();
  }, [userId]);

  return (
    <div className="relative flex flex-col gap-6 w-full h-fit items-center justify-center overflow-hidden">
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <HeroCard userDetails={userDetails} />
          <AssessmentList submissions={submissions} />
        </>
      )}
    </div>
  );
}
