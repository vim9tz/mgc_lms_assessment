"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CodeIcon from "@mui/icons-material/Code";
import TimerIcon from "@mui/icons-material/Timer";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PieChartIcon from "@mui/icons-material/PieChart";



export type McqQuestion = {
  question: string;
  yourAnswer: string;
  correct: boolean;
  explanation: string;
};

export type McqSection = {
  category: string;
  timeSpent: string;  // format "mm:ss"
  score: string;
  questions: McqQuestion[];
};

export type TestCase = {
  input: string;
  expected: string;
  passed: boolean;
};

export type CodingQuestion = {
  question: string;
  yourCode: string;
  solution: string;
  testCases: TestCase[];
};

export type CodingSection = {
  category: string;
  timeSpent: string;  // format "mm:ss"
  score: string;
  questions: CodingQuestion[];
};

export type TestData = {
  mcq: McqSection[];
  coding: CodingSection[];
};


type AccordionState = {
  [key: string]: boolean;
};

function TabPanel({ children, value, index }: any) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

const TestSeparate = ({ data, loading }: { data: TestData; loading: boolean }) => {
  const [mainTab, setMainTab] = useState(0);
  const [expanded, setExpanded] = useState<AccordionState>({});
  const [showSolution, setShowSolution] = useState<AccordionState>({});
  const [codingSubTabs, setCodingSubTabs] = useState<{ [key: string]: number }>({});

  const mcqData = data?.mcq || [];
  const codingData = data?.coding || [];

  const overallStats = {
    totalQuestions: mcqData.reduce((acc, section) => acc + section.questions.length, 0),
    correctAnswers: mcqData.reduce((acc, section) =>
      acc + section.questions.filter(q => q.correct).length, 0),
    averageTime: mcqData.reduce((acc, section) => {
      const [min, sec] = section.timeSpent.split(':').map(Number);
      return acc + (min * 60 + sec);
    }, 0) / (mcqData.length || 1),
    totalSections: mcqData.length
  };

  const codingStats = {
    totalQuestions: codingData.reduce((acc, section) => acc + section.questions.length, 0),
    passedTestCases: codingData.reduce((acc, section) =>
      acc + section.questions.reduce((qacc, q) =>
        qacc + q.testCases.filter(tc => tc.passed).length, 0
      ), 0),
    totalTestCases: codingData.reduce((acc, section) =>
      acc + section.questions.reduce((qacc, q) =>
        qacc + q.testCases.length, 0
      ), 0),
    averageTime: codingData.reduce((acc, section) => {
      const [min, sec] = section.timeSpent.split(':').map(Number);
      return acc + (min * 60 + sec);
    }, 0) / (codingData.length || 1),
  };

  useEffect(() => {
    if (mainTab === 0 && mcqData.length > 0) {
      setExpanded({ mcq0: true });
    } else if (mainTab === 1 && codingData.length > 0) {
      setExpanded({ coding0: true });
    }
  }, [mainTab, data]);

  const handleAccordionToggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleSolution = (key: string) => {
    setShowSolution((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <Typography variant="h6" align="center">Loading...</Typography>;
  if (!data) return <Typography variant="h6" align="center">No data available.</Typography>;


  return (
    <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 'none' }}>
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={mainTab}
          onChange={(_, val) => setMainTab(val)}
          sx={{
            mb: 4,
            '& .MuiTab-root': {
              minHeight: 48,
              borderBottom: '2px solid transparent',
              '&.Mui-selected': {
                borderBottomColor: 'primary.main'
              }
            }
          }}
        >
          <Tab label="MCQ Results" icon={<PieChartIcon />} iconPosition="start" />
          <Tab label="Coding Results" icon={<CodeIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={mainTab} index={0}>
          <Grid container spacing={4} sx={{ mb: 6, px: 10 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 1, background: 'transparent', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmojiEventsIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Score</Typography>
                  </Box>
                  <Typography variant="h4" color="primary.main">
                    {Math.round((overallStats.correctAnswers / overallStats.totalQuestions) * 100)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 1, background: 'transparent', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimerIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Average Time</Typography>
                  </Box>
                  <Typography variant="h4" color="primary.main">
                    {Math.floor(overallStats.averageTime / 60)}:{(overallStats.averageTime % 60).toString().padStart(2, '0')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 1, background: 'transparent', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Total Questions</Typography>
                  </Box>
                  <Typography variant="h4" color="primary.main">{overallStats.totalQuestions}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <div className="px-4">
            {data.mcq.map((section, idx) => (
              <Accordion
                key={idx}
                expanded={!!expanded[`mcq${idx}`]}
                onChange={() => handleAccordionToggle(`mcq${idx}`)}
                sx={{
                  mb: 3,
                  border: '1px solid #e0e0e0',
                  borderRadius: '5px !important',
                  '&:before': { display: 'none' },
                  background: 'transparent',
                  boxShadow: 'none !important',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          height: 20,
                          width: 3,
                          background: 'linear-gradient(180deg, #7367F0 0%, #9E95F5 100%)',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(115, 103, 240, 0.25)',
                          transform: 'translateY(-1px)'
                        }}
                      />
                      <Typography sx={{ fontWeight: 600 }}>{section.category}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip
                        icon={<TimerIcon />}
                        label={section.timeSpent}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={section.score}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  {section.questions.map((q, qIdx) => (
                    <Box
                      key={qIdx}
                      sx={{
                        mb: 4,
                        p: 3,
                        border: '1px solid',
                        borderColor: q.correct ? 'success.main' : 'error.main',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        {q.correct ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                        <Typography variant="h6">{q.question}</Typography>
                      </Box>

                      <Box sx={{
                        p: 2,
                        mb: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1
                      }}>
                        <Typography variant="subtitle2" gutterBottom>Your Answer</Typography>
                        <Typography>{q.yourAnswer}</Typography>
                      </Box>
                      <Box sx={{
                        p: 2,
                        borderLeft: '3px solid',
                        borderColor: 'info.main',
                        bgcolor: '#f5f5f5'
                      }}>
                        <Typography variant="subtitle2" gutterBottom>Explanation</Typography>
                        <Typography>{q.explanation}</Typography>
                      </Box>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </TabPanel>

        <TabPanel value={mainTab} index={1}>
          <Grid container spacing={4} sx={{ mb: 6, px: 10 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 1, background: 'transparent', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmojiEventsIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Test Cases Passed</Typography>
                  </Box>
                  <Typography variant="h4" color="primary.main">
                    {Math.round((codingStats.passedTestCases / codingStats.totalTestCases) * 100)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 1, background: 'transparent', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimerIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Average Time</Typography>
                  </Box>
                  <Typography variant="h4" color="primary.main">
                    {Math.floor(codingStats.averageTime / 60)}:{(codingStats.averageTime % 60).toString().padStart(2, '0')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 1, background: 'transparent', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Total Questions</Typography>
                  </Box>
                  <Typography variant="h4" color="primary.main">{codingStats.totalQuestions}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <div className="px-4">
            {data.coding.map((section, idx) => (
              <Accordion
                key={idx}
                expanded={!!expanded[`coding${idx}`]}
                onChange={() => handleAccordionToggle(`coding${idx}`)}
                sx={{
                  mb: 3,
                  border: '1px solid #e0e0e0',
                  borderRadius: '5px !important',
                  '&:before': { display: 'none' },
                  background: 'transparent',
                  boxShadow: 'none !important',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Chip
                      label={section.category}
                      size="small"
                      variant="filled"
                      sx={{
                        backgroundColor: 'grey.200',
                        color: 'grey.700',
                        '& .MuiChip-icon': {
                          color: 'grey.700'
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip
                        icon={<TimerIcon />}
                        label={section.timeSpent}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={section.score}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  {section.questions.map((q, qIdx) => (
                    <Box
                      key={qIdx}
                      sx={{
                        mb: 4,
                        p: 3,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 3 }}>{q.question}</Typography>

                      <Tabs
                        value={codingSubTabs[`coding${idx}-${qIdx}`] || 0}
                        onChange={(_, val) => setCodingSubTabs(prev => ({ ...prev, [`coding${idx}-${qIdx}`]: val }))}
                      >

                        <Tab label="Your Solution" />
                        <Tab label="Test Cases" />
                      </Tabs>

                      <TabPanel value={codingSubTabs[`coding${idx}-${qIdx}`] || 0} index={0}>
                        <Box sx={{
                          p: 2,
                          mb: 2,
                          bgcolor: '#f5f5f5',
                          borderRadius: 1,
                          fontFamily: 'monospace'
                        }}>
                          <pre>{q.yourCode}</pre>
                        </Box>

                        {showSolution[`coding${idx}-${qIdx}`] && (
                          <Box sx={{
                            p: 2,
                            bgcolor: '#f5f5f5',
                            borderRadius: 1,
                            fontFamily: 'monospace'
                          }}>
                            <Typography variant="subtitle2" gutterBottom>Solution:</Typography>
                            <pre>{q.solution}</pre>
                          </Box>
                        )}

                        <Box sx={{ mt: 2, textAlign: 'right' }}>
                          <Chip
                            label={showSolution[`coding${idx}-${qIdx}`] ? "Hide Solution" : "Show Solution"}
                            onClick={() => handleToggleSolution(`coding${idx}-${qIdx}`)}
                            variant="outlined"
                            color="primary"
                          />
                        </Box>
                      </TabPanel>

                      <TabPanel value={codingSubTabs[`coding${idx}-${qIdx}`] || 0} index={1}>
                        {q.testCases.map((tc, tcIdx) => (
                          <Box
                            key={tcIdx}
                            sx={{
                              p: 2,
                              mb: 2,
                              border: '1px solid',
                              borderColor: tc.passed ? 'success.main' : 'error.main',
                              borderRadius: 1
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {tc.passed ? (
                                <CheckCircleIcon color="success" fontSize="small" />
                              ) : (
                                <CancelIcon color="error" fontSize="small" />
                              )}
                              <Typography variant="subtitle2">Test Case {tcIdx + 1}</Typography>
                            </Box>
                            <Typography><strong>Input:</strong> {tc.input}</Typography>
                            <Typography><strong>Expected:</strong> {tc.expected}</Typography>
                          </Box>
                        ))}
                      </TabPanel>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </TabPanel>
      </Box>
    </Card>
  );
};

export default TestSeparate;
