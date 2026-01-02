"use client"
import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Stack,
  useTheme,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import QuizRoundedIcon from "@mui/icons-material/QuizRounded"
import CodeRoundedIcon from "@mui/icons-material/CodeRounded"
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded"

type AnswerType = {
  questionId: string
  answer?: string | string[] | boolean | null
  isBookmarked?: boolean
  isSkipped?: boolean
}

type CodeLang = "html_code" | "css_code" | "js_code" | "python_code"

const codeLangLabels: Record<CodeLang, string> = {
  html_code: "HTML",
  css_code: "CSS",
  js_code: "JS",
  python_code: "Python",
}

type TestCaseResult = {
  passed: boolean
  name?: string
  input?: string
  expectedOutput?: string
  actualOutput?: string
}

type CodeSubmission = {
  question_id: string | number
  html_code: string
  css_code: string
  js_code: string
  python_code: string
  test_cases: TestCaseResult[]
}

type QuizSession = {
  questions: any[]
  currentIndex: number
  answers: AnswerType[]
}

type CodingQuestion = {
  question_id: string | number
  title: string
  type: string
  description?: string
  html_code?: string
  css_code?: string
  js_code?: string
  python_code?: string
  test_cases?: any[]
  folder_path?: string | null
  solution?: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  totalQuestions: number
  timeTaken: number
  codeSubmissions?: CodeSubmission[]
  quizQuestions?: QuizSession | null 
  codingQuestions?: CodingQuestion[]
  answers?: AnswerType[]
}

export default function ResultModal({ open, onClose, onConfirm, codeSubmissions = [], quizQuestions }: Props) {
  const theme = useTheme()
  const [quizExpanded, setQuizExpanded] = useState(false)
  const [codingExpanded, setCodingExpanded] = useState(false)

  const answers = quizQuestions?.answers ?? []
  const questions = quizQuestions?.questions ?? []

  const statusByQuestion = questions.map((q: any) => {
    const ans = answers.find((a) => a.questionId === q.quiz_id)
    const attempted = ans && ans.answer !== null && ans.answer !== ""
    if (ans?.isSkipped) return "skipped" as const
    return attempted ? ("attempted" as const) : ("not_attempted" as const)
  })
  const attemptedCount = statusByQuestion.filter((s) => s === "attempted").length
  const skippedCount = statusByQuestion.filter((s) => s === "skipped").length
  const notAttemptedCount = statusByQuestion.filter((s) => s === "not_attempted").length

  const getStatusStyles = (status: "attempted" | "skipped" | "not_attempted") => {
    switch (status) {
      case "attempted":
        return {
          borderColor: "success.main",
          badgeBg: "success.light",
          badgeColor: "white",
          chip: { label: "Attempted", color: "success" as const },
        }
      case "skipped":
        return {
          borderColor: "warning.main",
          badgeBg: "warning.light",
          badgeColor: "white",
          chip: { label: "Skipped", color: "warning" as const },
        }
      default:
        return {
          borderColor: "error.main",
          badgeBg: "error.light",
          badgeColor: "white",
          chip: { label: "Not Attempted", color: "error" as const },
        }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(0,0,0,0.06)",
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
          backgroundImage: "none",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2.5,
        }}
      >
        <Box sx={{ display: "flex flex-col flex-wrap", alignItems: "baseline", gap: 1, p: "10px" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
            Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review your submissions
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Accordion - Quiz */}
      <Accordion
        elevation={0}
        disableGutters
        expanded={quizExpanded}
        onChange={(_, exp) => setQuizExpanded(exp)}
        sx={{
          "&:before": { display: "none" },
          borderBottom: "1px solid",
          borderColor: "divider",
          marginBlockEnd: "0rem !important",
          borderRadius:"0px",
          padding: "10px",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon />}
          sx={{
            px: 3,
            py: 2,
            "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5, m: 0 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <div className="flex justify-start gap-2">
              <QuizRoundedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Quiz
            </Typography>
            </div>
            {/* Minimal summary chips */}
            <Chip
              size="small"
              label={`Completed ${attemptedCount}`}
              sx={{ bgcolor: "success.light", color: "white", borderRadius: 1 }}
            />
            <Chip
              size="small"
              label={`Skipped ${skippedCount}`}
              sx={{ bgcolor: "warning.light", color: "white", borderRadius: 1 }}
            />
            <Chip
              size="small"
              label={`Pending ${notAttemptedCount}`}
              sx={{ bgcolor: "grey.100", color: "text.secondary", borderRadius: 1 }}
            />
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2}>
            {questions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Box
                  component="img"
                  src="/images/No_data_Found.png"
                  alt="No submissions"
                  sx={{ width: 140, mx: "auto", mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No quiz questions available
                </Typography>
              </Box>
            ) : (
              questions.map((q: any, idx: number) => {
                const ans = answers.find((a) => a.questionId === q.quiz_id)
                const attempted = ans && ans.answer !== null && ans.answer !== ""
                const status: "attempted" | "skipped" | "not_attempted" = ans?.isSkipped
                  ? "skipped"
                  : attempted
                    ? "attempted"
                    : "not_attempted"
                const s = getStatusStyles(status)

                return (
                  <Paper
                    key={q.quiz_id}
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      transition: "background-color .15s ease",
                      "&:hover": { bgcolor: "grey.50" },
                      position: "relative",
                      pl: 2.5,
                      "&:before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 6,
                        bgcolor: s.borderColor,
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1.5,
                        gap: 2,
                      }}
                    >
                      {/* small squared status badge with question number */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box
                          aria-label={`Question ${idx + 1} status`}
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: s.badgeBg,
                            color: s.badgeColor,
                            fontSize: 12,
                            fontWeight: 700,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {"Q" + (idx + 1)}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={s.chip.label}
                        color={s.chip.color}
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>

                    <Box sx={{ mb: 0.5 }} dangerouslySetInnerHTML={{ __html: q.content }} />
                  </Paper>
                )
              })
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Accordion - Coding */}
      <Accordion
        elevation={0}
        disableGutters
        expanded={codingExpanded}
        onChange={(_, exp) => setCodingExpanded(exp)}
        sx={{
          "&:before": { display: "none" },
          borderTop: "1px solid",
          borderColor: "divider",
          marginBlockEnd: "0rem !important",
          borderRadius:"0px",
          padding: "10px",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon />}
          sx={{
            px: 3,
            py: 2,
            "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5, m: 0 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <div className="flex justify-start gap-2">
            <CodeRoundedIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Coding
            </Typography>
            </div>
            <Chip
              size="small"
              label={`${codeSubmissions.length} submission${codeSubmissions.length === 1 ? "" : "s"}`}
              sx={{
                bgcolor: codeSubmissions.length === 0 ? "grey.100" : "success.light",
                color: codeSubmissions.length === 0 ? "text.secondary" : "white",
                borderRadius: 1,
              }}
            />
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2}>
            {codeSubmissions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Box
                  component="img"
                  src="/images/No_data_Found.png"
                  alt="No submissions"
                  sx={{ width: 140, mx: "auto", mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No coding submissions yet
                </Typography>
              </Box>
            ) : (
              codeSubmissions.map((cs, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    transition: "background-color .15s ease",
                    "&:hover": { bgcolor: "grey.50" },
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, mb: 1.5 }}>
                    Coding Question {idx + 1}
                  </Typography>

                  <Stack spacing={1.25}>
                    {(Object.keys(codeLangLabels) as CodeLang[]).map((key) => (
                      <Box
                        key={key}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1.5,
                          overflow: "hidden",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 1.25,
                            py: 0.75,
                            bgcolor: "grey.50",
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                            {codeLangLabels[key]}
                          </Typography>
                        </Box>

                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: { xs: 1, sm: 1.25 },
                            whiteSpace: "pre-wrap",
                            fontSize: 13,
                            lineHeight: 1.6,
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            bgcolor: "background.paper",
                          }}
                        >
                          {cs?.[key] ? (
                            cs[key]
                          ) : (
                            <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>
                              {"<empty>"}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Divider />
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 4,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            boxShadow: "none",
            "&:hover": {
              bgcolor: "action.hover",
              boxShadow: "none",
            },
          }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              bgcolor: "primary.main",
              filter: "brightness(0.95)",
            },
          }}
        >
          Confirm & Submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}
