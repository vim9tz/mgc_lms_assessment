'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/router'

/**
 * Loading screen displayed when environment or data is initializing.
 */
export const LoadingScreen = () => (
  <div className="w-full h-screen flex items-center justify-center bg-white text-gray-600 text-xl">
    Loading test environment...
  </div>
)

/**
 * Screen shown when test is invalid or already attempted.
 */
export const InvalidTestScreen = () => {
  const router = useRouter()

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">
        ❌ This test is invalid or already attempted.
      </h1>
      <p className="mb-6 text-lg">Please choose an option below to continue:</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => router.replace('/dashboard')}
          className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </button>
        <button
          onClick={async () => {
             if (typeof window !== 'undefined') {
                 await signOut({ redirect: false });
                 window.location.href = `${window.location.origin}/login`;
             }
          }}
          className="px-5 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Sign Out
        </button>
        <button
          onClick={() => window.close()}
          className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Close Window
        </button>
      </div>
    </div>
  )
}
