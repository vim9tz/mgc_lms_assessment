'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import AssessmentLoading from '@/views/pages/assessment/components/AssessmentLoading'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, hasHydrated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // If we have a token, we represent a valid session (either rehydrated or just set)
    if (token) {
      setIsChecking(false)
      return
    }

    // If no token, we must wait for hydration to complete to be sure
    if (!hasHydrated) return

    // If hydrated and still no token...
    router.replace('/login')
  }, [token, hasHydrated, router])

  if (isChecking) {
    return <AssessmentLoading />
  }

  return <>{children}</>
}
