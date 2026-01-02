'use client'

import { useTheme } from '@mui/material/styles'
import React, { useEffect, useState ,useMemo } from 'react'

const AuthIllustrationWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure we only render after the theme is available
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use useMemo to derive isDarkMode efficiently
  const isDarkMode = useMemo(() => theme.palette.mode === 'dark', [theme.palette.mode])

  if (!mounted) return null // Prevents initial flicker by not rendering until theme is detected


  return (
    <div className="relative w-full h-full flex justify-center bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      {/* Background Shapes */}
      <div className="absolute -top-20 left-[30%] h-[234px] w-[238px] -z-10 opacity-10">
        <svg
          width="238"
          height="234"
          viewBox="0 0 238 234"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute"
        >
          <rect
            x="87.9395"
            y="0.5"
            width="149"
            height="149"
            rx="19.5"
            stroke="currentColor"
            className={`opacity-16 ${
              isDarkMode ? 'text-zinc-500' : 'text-fuchsia-400'
            }`}
          />
          <rect
            y="33.5608"
            width="200"
            height="200"
            rx="10"
            fill="currentColor"
            className={`opacity-8 ${
              isDarkMode ? 'text-zinc-500' : 'text-fuchsia-400'
            }`}
          />
        </svg>
      </div>
      <div className="absolute -bottom-16 right-[30%] h-[180px] w-[180px] -z-10 opacity-10">
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute"
        >
          <rect
            x="1"
            y="1"
            width="178"
            height="178"
            rx="19"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 8"
            className={`opacity-16 ${
              isDarkMode ? 'text-zinc-500' : 'text-fuchsia-400'
            }`}
          />
          <rect
            x="22.5"
            y="22.5"
            width="135"
            height="135"
            rx="10"
            fill="currentColor"
            className={`opacity-8 ${
              isDarkMode ? 'text-zinc-500' : 'text-fuchsia-400'
            }`}
          />
        </svg>
      </div>
     {/* Glow Effect (Changes based on dark/light mode) */}
     <div
        className={`absolute left-0 right-0 top-0 -z-10 m-auto h-full w-1/2 rounded-full blur-[100px] ${
          isDarkMode ? 'bg-indigo-900/70 opacity-30' : 'bg-indigo-900 opacity-20'
        }`}
      />
      {/* Child Content */}
      <div className="relative">{children}</div>
    </div>
  )
}

export default AuthIllustrationWrapper
