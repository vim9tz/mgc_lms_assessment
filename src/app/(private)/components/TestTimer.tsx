'use client'

type Props = {
  seconds: number
}

const TestTimer = ({ seconds }: Props) => {
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 border border-gray-200 bg-white p-2 rounded-md">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-slate-600"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <p className="text-sm font-mono font-bold text-slate-600">{formatTime(seconds)}</p>
    </div>
  )
}

export default TestTimer
