'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { CircularProgress } from '@mui/material'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, hasHydrated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    console.log('AuthGuard Check:', { token, hasHydrated })
    
    // If we have a token, we represent a valid session (either rehydrated or just set)
    if (token) {
      console.log('AuthGuard: Access granted (Token Present)')
      setIsChecking(false)
      return
    }

    // If no token, we must wait for hydration to complete to be sure
    if (!hasHydrated) return

    // If hydrated and still no token...
    console.warn('AuthGuard: Access denied, redirecting to login')
    router.replace('/login')
  }, [token, hasHydrated, router])

  if (isChecking) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <CircularProgress />
        <div className="text-sm text-muted-foreground">
          Checking Authentication...<br/>
          Hydrated: {String(hasHydrated)}<br/>
          Token Present: {String(!!token)}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
