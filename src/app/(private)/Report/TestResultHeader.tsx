'use client'
import React from 'react'
import { Button } from '@mui/material'
import { Download, Share } from '@mui/icons-material'
import {
  CircleFadingArrowUp,
  Star,
  Clock,
  Trophy,
  BookOpen,
  User,
  GraduationCap,
  Hash,
  CalendarDays,
  Globe,
  Network,
  AlertCircle,
  MousePointer2,
  Copy,
  ScanLine
} from 'lucide-react';




type TestDetails = {
  start_time?: string
  obtained_marks?: number
  total_marks?: number
  [key: string]: any // Extend as needed
}

type Props = {
  data: TestDetails | null | undefined
  loading: boolean
}

function TestResultHeader({ data, loading }: Props) {
  return (
    <>
      {/* <!-- Main Header Section --> */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Data Structures & Algorithms</h1>
                <p className="text-gray-600 mt-1">Final Assessment Report</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 ">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Student Name</p>
                    <p className="font-semibold text-gray-900">{data?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold text-gray-900">{data?.batch} </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 ">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <Hash size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Roll Number</p>
                    <p className="font-semibold text-gray-900">{data?.roll_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Test Date</p>
                    {data?.start_time ? new Date(data.start_time).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 ">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <Globe size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Browser Used</p>
                    <p className="font-semibold text-gray-900 break-all">Chrome 122.0.6261.112</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <Network size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IP Address</p>
                    <p className="font-semibold text-gray-900">192.168.1.105</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col justify-between gap-4 lg:min-w-[280px]">
            <div className="flex gap-2 justify-center sm:justify-end">
              <Button
                variant="contained"
                startIcon={<Download />}
                className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
              >
                Download Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Share
              </Button>
            </div>
            <div className="w-full h-full border-2 border-gray-200 p-4 sm:p-6 rounded-xl text-center">
              <p className="text-gray-600">Overall Score</p>

              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2">
                {data?.obtained_marks} / {data?.total_marks}
              </h2>

              <div className="w-full bg-gray-100 h-2 mt-4 rounded-full">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${data?.obtained_marks && data?.total_marks
                        ? Math.min((data.obtained_marks / data.total_marks) * 100, 100)
                        : 0
                      }%`
                  }}
                ></div>
              </div>
            </div>

          </div>
        </div>

        {/* Cheating Detection Section */}
        <div className="mt-6 border-2 border-red-200 rounded-xl p-4">
          <div className="text-red-600 font-semibold mb-3 flex items-center gap-2">
            <AlertCircle size={20} />
            Suspicious Activities Detected
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer2 size={20} className="text-orange-500" />
                <span className="font-medium">Tab Switches</span>
              </div>
              <p className="text-sm text-gray-600">{data?.tab_switches} instances detected</p>
              <p className="text-xs text-gray-500 mt-1">Last switch at 10:45 AM</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <Copy size={20} className="text-orange-500" />
                <span className="font-medium">Copy-Paste Attempts</span>
              </div>
              <p className="text-sm text-gray-600">{data?.copy_paste}  attempts detected</p>
              <p className="text-xs text-gray-500 mt-1">From external sources</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <ScanLine size={20} className="text-orange-500" />
                <span className="font-medium">Screen Recording</span>
              </div>
              <p className="text-sm text-gray-600">Detected at 10:30 AM</p>
              <p className="text-xs text-gray-500 mt-1">Duration: 2 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* <!-- Performance Metrics Section --> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex justify-start items-center gap-2">
              <div className="w-10 h-10 border rounded-lg flex items-center justify-center">
                <CircleFadingArrowUp />
              </div>
              <h3 className="text-gray-600 text-sm font-medium">Grade Achieved</h3>
            </div>
            <span className="text-green-500 text-xl font-bold px-2 py-0.5 bg-green-50 rounded-full">
            {data?.grade}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex justify-start items-center gap-2">
              <div className="w-10 h-10 border rounded-lg flex items-center justify-center">
                <Star />
              </div>
              <h3 className="text-gray-600 text-sm font-medium">Accuracy Rate</h3>
            </div>
            <span className="text-blue-500 text-xl font-bold px-2 py-0.5 bg-blue-50 rounded-full">
            {data?.percentage}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex justify-start items-center gap-2">
              <div className="w-10 h-10 border rounded-lg flex items-center justify-center">
                <Clock />
              </div>
              <h3 className="text-gray-600 text-sm font-medium">Time Taken</h3>
            </div>
            <span className="text-purple-500 text-xl font-bold px-2 py-0.5 bg-purple-50 rounded-full">
  {(() => {
    const minutes = Math.floor(data?.time_taken_minutes ?? 0);
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  })()}
</span>

          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 transform hover:scale-102 transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex justify-start items-center gap-2">
              <div className="w-10 h-10 border rounded-lg flex items-center justify-center">
                <Trophy />
              </div>
              <h3 className="text-gray-600 text-sm font-medium">Class Rank</h3>
            </div>
            <span className="text-amber-500 text-xl font-bold px-2 py-0.5 bg-amber-50 rounded-full">
              #3
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default TestResultHeader
