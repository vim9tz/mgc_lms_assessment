'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Trophy, Clock, Book, Menu, Layers3 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { DialogHeader } from '../dashboards/sandbox/ui/dialog';
import { useRouter } from 'next/navigation'
import { GeeksTestSubmissionType } from '../../app/(private)/dashboard/attemptTypes';


interface AssessmentListProps {
  submissions: GeeksTestSubmissionType[];
}

export default function AssessmentList({ submissions }: AssessmentListProps) {

  const router = useRouter()

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedAssessment, setSelectedAssessment] = useState<GeeksTestSubmissionType | null>(null);

  const categories = useMemo(() => {
    const unique = new Set(submissions.map(s => s.title || 'Uncategorized'));
    return ['All', ...Array.from(unique)];
  }, [submissions]);

  const dateOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" }
  ];

  const filteredAssessments = useMemo(() => {
    return submissions.filter(item => {
      const categoryMatch =
        selectedCategory === "All" || (item.title ?? '') === selectedCategory;

      const itemDate = new Date(item.start_time || item.end_time || new Date());
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      let dateMatch = true;
      if (dateFilter === "today") {
        dateMatch = itemDate.toDateString() === today.toDateString();
      } else if (dateFilter === "week") {
        dateMatch = itemDate >= weekAgo;
      } else if (dateFilter === "month") {
        dateMatch = itemDate >= monthAgo;
      }

      return categoryMatch && dateMatch;
    });
  }, [submissions, selectedCategory, dateFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full mx-auto border rounded-xl"
    >
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 px-10 border rounded-t-xl">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold text-gradient">Assessments</h2>
          <Badge variant="outline">{filteredAssessments.length} Tests</Badge>
        </div>
        <div className="flex gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="flex items-center gap-2">
                  <Menu className="w-4 h-4 text-muted-foreground" /> {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-10 py-5">
        <AnimatePresence>
          {filteredAssessments.map((assessment, index) => {
            const percentage = Math.round(
              (assessment.obtained_marks / (assessment.total_marks || 1)) * 100
            );
            return (
              <motion.div
                key={assessment.test_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => setSelectedAssessment(assessment)}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {assessment.title || 'Untitled'}
                      <Badge variant="secondary">{assessment.title || 'Other'}</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {new Date(assessment.start_time || assessment.end_time).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {assessment.description || 'No description available.'}
                    </p>

                    <Progress value={percentage} className="h-2 mb-4" />

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-sm">{percentage}%</span>
                      </div>
                      {percentage === 0 && <Badge variant="outline">New</Badge>}
                      {percentage === 100 && (
                        <Badge className="bg-green-700 hover:bg-green-600">Completed</Badge>
                      )}
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full cursor-pointer" variant="outline">
                        {percentage > 0 ? (
                          <>
                            <Book className="w-4 h-4 mr-2" /> Continue
                          </>
                        ) : (
                          <>
                            <Rocket className="w-4 h-4 mr-2" /> Start
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal for separated quiz and coding modules */}
      <Dialog open={!!selectedAssessment} onClose={() => setSelectedAssessment(null)} fullWidth maxWidth="xl">
        <DialogContent className="!max-w-6xl p-6" style={{ width: '100%', maxWidth: '1100px' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Layers3 className="w-6 h-6" /> Module Breakdown
            </DialogTitle>
          </DialogHeader>

          {/* Quiz Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-primary mb-2"> Quiz Modules</h3>
            {selectedAssessment?.quiz_modules?.length ? (
              <div className="space-y-3">
                {selectedAssessment.quiz_modules.map((mod, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center border border-muted rounded-lg px-4 py-3 hover:bg-muted/50 shadow-sm transition-all"
                  >
                    <div>
                      <p className="font-semibold text-base">{mod.module_name}</p>
                      <p className="text-xs text-muted-foreground">Module ID: {mod.module_id}</p>
                    </div>
                    <p className="text-sm font-medium text-red-600">Questions: {mod.quiz_question_count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No quiz modules found.</p>
            )}
          </div>

          {/* Coding Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-primary mb-2"> Coding Modules</h3>
            {selectedAssessment?.coding_modules?.length ? (
              <div className="space-y-3">
                {selectedAssessment.coding_modules.map((mod, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center border border-muted rounded-lg px-4 py-3 hover:bg-muted/50 shadow-sm transition-all"
                  >
                    <div>
                      <p className="font-semibold text-base">{mod.module_name}</p>
                      <p className="text-xs text-muted-foreground">Module ID: {mod.module_id}</p>
                    </div>
                    <p className="text-sm font-medium text-indigo-600">Questions: {mod.coding_question_count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No coding modules found.</p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-4 mt-10">
            <Button variant="outline" onClick={() => setSelectedAssessment(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                router.push(`/Report/${selectedAssessment?.test_id}`)
              }}
            >
              📊 See Detailed Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </motion.div>
  );
}
