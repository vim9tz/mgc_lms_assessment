"use client"
import React, { useState } from 'react'
import { GridPattern } from '@/components/magicui/grid-pattern'
import { HyperText } from '@/components/magicui/hyper-text'
import { cn } from '@/lib/utils'
import { UserDetailsType } from '../../app/(private)/dashboard/attemptTypes'

interface HeroCardProps {
  userDetails: UserDetailsType | null
}

export default function HeroCard({ userDetails }: HeroCardProps) {
  if (!userDetails) return null

  return (
    <div className="relative flex flex-col w-full h-fit items-center justify-center overflow-hidden rounded-lg border bg-background ">
      <GridPattern
        width={30}
        height={30}
        x={-1}
        y={-1}
        strokeDasharray={"4 2"}
        className={cn(
          "[mask-image:radial-gradient(1000px_circle_at_center_left,white,transparent)]",
        )}
      />

      <div className="grid grid-cols-2 w-full p-10">
        <div className="flex w-full gap-4 justify-start items-center ">
          <div className="w-28 h-28 z-10 rounded-xl overflow-hidden border-4 border-slate-200/50 shadow-md">
            <img
              src={userDetails.avatar_url || "/student/student_4.jpg"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left ">
            <HyperText>{userDetails.name}</HyperText>
            <p className="text-sm text-gray-500">{userDetails.email}</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 pt-1">
                <button className="p-0.5 cursor-pointer rounded-md bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </button>
                <button className="p-0.5 cursor-pointer rounded-md bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </button>
                <button className="p-0.5 cursor-pointer rounded-md bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className='flex justify-end items-end gap-10'>
  {userDetails.total_tests !== null && userDetails.total_tests !== undefined && (
    <div className='flex flex-col justify-end items-end border-2 border-dashed rounded-md py-1 px-4'>
      <p className="text-sm font-medium text-rose-500">Attended Assessment Count</p>
      <p className='sr-only'>{userDetails.total_tests}</p> {/* fallback for screen readers */}
      <HyperText className='text-rose-500'>{`${userDetails.total_tests}`}</HyperText>
    </div>
  )}

  {userDetails.average_marks !== null && userDetails.average_marks !== undefined && (
    <div className='flex flex-col justify-end items-end border-2 border-dashed rounded-md py-1 px-4'>
      <p className="text-sm font-medium text-indigo-500">Avg Assessment Score</p>
      <p className='sr-only'>{userDetails.average_marks}</p> {/* fallback for screen readers */}
      <HyperText className='text-indigo-500'>{`${userDetails.average_marks}`}</HyperText>
    </div>
  )}
</div>

      </div>

      <div className="w-full flex justify-center relative">
        <div className="absolute inset-0 bg-cover bg-[url('/faq-header.png')] opacity-30" />
        <div className="w-full text-center backdrop-blur-sm bg-white/10 p-6 relative z-10">
          <p className="text-sm font-medium text-gray-500 italic">&ldquo;Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.&rdquo;</p>
          <p className="text-xs text-gray-400 mt-1">- Abigail Adams</p>
        </div>
      </div>
    </div>
  )
}
