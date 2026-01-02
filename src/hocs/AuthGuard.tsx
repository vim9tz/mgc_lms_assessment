// Third-party Imports
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'

// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default async function AuthGuard({ children }: ChildrenType) {
  const session = await getServerSession(authOptions)

  return <>{session ? children : <AuthRedirect />}</>
}
