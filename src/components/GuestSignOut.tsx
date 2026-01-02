'use client'

import { useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

const GuestSignOut = () => {
  const { status } = useSession()
  const searchParams = useSearchParams()
  const signedOutRef = useRef(false)

  useEffect(() => {
    const isGuest = searchParams?.get('auth') === 'guest'
    const justSignedIn = sessionStorage.getItem('justSignedIn') === '1'

    if (status === 'authenticated' && isGuest && !signedOutRef.current && !justSignedIn) {
      signedOutRef.current = true
      console.log('🧹 Signing out existing session to allow guest login...')
      signOut({ redirect: false })
    }
  }, [status, searchParams])

  return null
}

export default GuestSignOut
