 "use client"

import { signOut } from 'next-auth/react'
import React, { useEffect } from 'react'

function LogOut () {

    useEffect(() => {
        // Clear session storage on logout
        signOut({ redirect: true, callbackUrl: '/login' })
    }, [])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">You have been logged out</h1>
        <p className="text-lg mb-6">Thank you for using our application!</p>
        <a href="/" className="text-blue-500 hover:underline">Return to Home</a>
      </div>
    </div>
  )
}

export default LogOut
