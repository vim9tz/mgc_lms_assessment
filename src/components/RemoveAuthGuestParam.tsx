'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const RemoveAuthGuestParam = () => {
  const { status } = useSession()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const cleanedRef = useRef(false)

  useEffect(() => {
    const isGuestAuth = searchParams?.get('auth') === 'guest'

    if (status === 'authenticated' && isGuestAuth && !cleanedRef.current) {
      cleanedRef.current = true

      const params = new URLSearchParams(searchParams.toString())
      params.delete('auth')

      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname

      router.replace(newUrl, { scroll: false }) // ✅ clean URL silently
    }
  }, [status, searchParams, pathname, router])

  return null
}

export default RemoveAuthGuestParam
