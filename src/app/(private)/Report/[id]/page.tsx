'use client'

import React, { useEffect, useState } from 'react'
import { Grid } from '@mui/material'
import { useRouter, useParams } from 'next/navigation'
import useApi from '@/hooks/useApi'
import TestResultHeader from '../TestResultHeader'
import TestSeparate from '../TestSeparate'


const ReportPage = () => {
  const { fetchFromBackend } = useApi()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [courseData, setCourseData] = useState<any>(null)

  useEffect(() => {
    if (!id) return

    setLoading(true)

    fetchFromBackend('/getSubmission', 'POST', {
      user_id: 5, // TODO: Replace with actual logged-in user ID
      subtopic_id: id,
      type: 'geeks_test',
    })
      .then((response) => {
        if (response?.status === 401) {
          router.push(process.env.NEXT_PUBLIC_APP_URL || '/')
          return
        }

        if (!response?.error) {
          setCourseData(response.data)
          // console.log('✅ Loaded data:', response.data)
        } else {
          console.error('❌ API error:', response.error)
        }
      })
      .catch((error) => {
        console.error('🚨 Fetch error:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  return (
    <Grid container spacing={2} sx={{ width: '100%' }}>
      <Grid item xs={12}>
        <div className="w-full p-4">
          {loading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : courseData?.test_details ? (
            <TestResultHeader
              key={id} // ⬅️ Fix hydration mismatch
              data={courseData.test_details}
              loading={loading}
            />
          ) : (
            <div className="italic text-sm text-gray-500">No test details available.</div>
          )}
        </div>
      </Grid>

      <Grid item xs={12}>
        <div className="w-full p-4">
          <TestSeparate
            key={id + '-test'} // Safe re-render
            data={courseData}
            loading={loading}
          />
        </div>
      </Grid>
    </Grid>
  )
}

export default ReportPage
