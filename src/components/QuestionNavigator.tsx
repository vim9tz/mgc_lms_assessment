"use client"
import React from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"

type Answer = {
  answer: string | string[] | boolean | null
  isSkipped: boolean
}

type Props = {
  quizSession: {
    answers: Answer[]
  } | null
  currentIndex: number
  questionModuleMap: string[]
  onClick: (idx: number) => void
}

export default function QuestionNavigator({ quizSession, currentIndex, questionModuleMap, onClick }: Props) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const [canScrollUp, setCanScrollUp] = React.useState(false)
  const [canScrollDown, setCanScrollDown] = React.useState(false)

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 0)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }, [])

  React.useEffect(() => {
    updateScrollState()
  }, [updateScrollState, quizSession, questionModuleMap])

  if (!quizSession) return null

  // Group questions by module
  const moduleGroups = quizSession.answers.reduce(
    (acc, ans, idx) => {
      const module = questionModuleMap[idx]
      if (!acc[module]) {
        acc[module] = []
      }
      acc[module].push({ ans, idx })
      return acc
    },
    {} as Record<string, { ans: Answer; idx: number }[]>,
  )

  const completed = quizSession.answers.filter((ans) => ans.answer && !ans.isSkipped).length
  const skipped = quizSession.answers.filter((ans) => ans.isSkipped).length
  const total = quizSession.answers.length

  const handleScroll = () => {
    updateScrollState()
  }

  const scrollByAmount = (direction: "up" | "down") => {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(120, Math.floor(el.clientHeight * 0.8))
    el.scrollBy({ top: direction === "up" ? -amount : amount, behavior: "smooth" })
  }

  return (
    <Card className="border-x rounded-none h-full overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          {canScrollUp && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white/90 to-transparent" />
          )}
          {/* <div className="absolute top-0 left-0 right-0 z-20 flex justify-center">
            <button
              type="button"
              aria-label="Scroll up"
              onClick={() => scrollByAmount("up")}
              disabled={!canScrollUp}
              className={`h-7 w-full cursor-pointer rounded-none bg-white/90 text-gray-600 hover:bg-white transition ${
                canScrollUp ? "" : "opacity-0 pointer-events-none"
              }`}
            >
              <ChevronDown className="w-4 h-4 mx-auto rotate-180" />
            </button>
          </div> */}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto overscroll-contain scrollbar-hide"
            role="list"
            aria-label="Question navigator"
          >
            <div className="grid grid-cols-2 w-fit gap-2 p-2">
              {Object.entries(moduleGroups).map(([module, questions], moduleIndex) => (
                <React.Fragment key={module}>
                  {moduleIndex > 0 && (
                    <div className="col-span-2 w-full flex justify-center items-center">
                      <div className="w-full h-1.5"></div>
                    </div>
                  )}
                  {questions.map(({ ans, idx }) => {
                    let bgClass = "bg-slate-100"
                    let tooltipText = "Not Viewed"

                    if (currentIndex === idx) {
                      bgClass = "ring-2 ring-blue-500 bg-[#7367f0] text-white border-blue-500"
                      tooltipText = "Current Question"
                    } else if (!ans.answer && !ans.isSkipped) {
                      bgClass = "bg-slate-100"
                      tooltipText = "Not Viewed"
                    } else if (ans.isSkipped) {
                      bgClass = "bg-yellow-300"
                      tooltipText = "Skipped"
                    } else if (ans.answer) {
                      bgClass = "bg-green-300"
                      tooltipText = "Answered"
                    }

                    return (
                      <div
                        key={idx}
                        title={tooltipText}
                        role="button"
                        aria-label={`Question ${idx + 1}: ${tooltipText}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") onClick(idx)
                        }}
                        className={`w-7 h-7 rounded-sm flex justify-center items-center text-xs cursor-pointer select-none ${bgClass}`}
                        onClick={() => onClick(idx)}
                      >
                        {idx + 1}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {canScrollDown && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white/90 to-transparent" />
          )}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center">
            <button
              type="button"
              aria-label="Scroll down"
              onClick={() => scrollByAmount("down")}
              disabled={!canScrollDown}
              className={`h-7 w-full rounded-none cursor-pointer bg-white/50 text-gray-600 hover:bg-white transition ${
                canScrollDown ? "" : "opacity-0 pointer-events-none"
              }`}
            >
              <ChevronDown className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1">
            <div className="bg-white border-t border-slate-200 px-3 py-1 text-center">
              <div className="text-blue-500 text-lg font-bold">{completed}</div>
              <div className="text-blue-600 text-xs font-medium">Completed</div>
            </div>
            <div className="bg-white border-t border-slate-200 px-3 py-1 text-center">
              <div className="text-yellow-500 text-lg font-bold">{skipped}</div>
              <div className="text-yellow-600 text-xs font-medium">Skip</div>
            </div>
            <div className="bg-white border-t border-slate-200 px-3 py-1 text-center rounded-b-md">
              <div className="text-gray-500 text-lg font-bold">{total}</div>
              <div className="text-gray-600 text-xs font-medium">Total</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
