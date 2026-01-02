'use client'

import { useState, useEffect } from 'react'

// MUI
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Link as MuiLink,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'

// Icons
import LockIcon from '@mui/icons-material/Lock'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// Core Components
import CustomTextField from '@core/components/mui/TextField'
import useApi from '@/hooks/useApi'
import { guestFormSchema, otpSchema } from '@/utils/validation'
import { safeParse } from 'valibot'

// Styled Containers
const Wrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(to right, #fafafb, #f3f4fe)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
}))

const StyledCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
  maxWidth: 440,
  width: '100%',
  padding: theme.spacing(6, 5),
  textAlign: 'center',
}))

export default function GuestOtpModal({
  token,
  onVerified,
  isGuest,
}: {
  token: string
  onVerified: (token:string) => Promise<void>
  isGuest?: boolean
}) {
  const theme = useTheme()
  const { fetchFromBackend } = useApi(isGuest)

  const [form, setForm] = useState({ name: '', email: '', otp: '' })
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const sendOtp = async () => {
    setLoading(true)
    const result = safeParse(guestFormSchema, {
      full_name: form.name,
      email: form.email,
    })

    if (!result.success) {
      setError(result.issues[0]?.message || 'Invalid input')
      setLoading(false)
      return
    }

    try {
      const res = await fetchFromBackend('/getOTP', 'POST', {
        full_name: form.name,
        email: form.email,
        test_id: token,
      })
      console
      if (res?.error) {
        setError(res.details?.message || res.error)
      } else if (res) {
        setOtpSent(true)
        setTimer(30) // Start 30s timer
      } else {
        setError('Failed to send OTP. Try again.')
      }
    } catch {
       setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setLoading(true)
    const result = safeParse(otpSchema, {
      email: form.email,
      otp: form.otp,
    })

    if (!result.success) {
      setError(result.issues[0]?.message || 'Invalid OTP')
      setLoading(false)
      return
    }

    try {
      const res = await fetchFromBackend('/verifyOTP', 'POST', {
        email: form.email,
        otp: form.otp,
        test_id: token,
        full_name: form.name,
      })   
      console.log('OTP verification response:')

      res?.test_token ? onVerified(res.test_token) : setError('Invalid OTP.')
    } catch {
      setError('Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Wrapper>
      <StyledCard>
        <Box display="flex" justifyContent="center" mb={2}>
          <LockIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
        </Box>

        <Typography variant="h5" fontWeight={600} mb={1}>
          {otpSent ? 'Verify OTP 🔐' : 'Guest Access 🔓'}
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={4}>
          {otpSent
            ? 'Enter the 6-digit OTP we just emailed to you.'
            : 'Enter your name and email to receive an OTP.'}
        </Typography>

        {!otpSent && (
          <>
            <CustomTextField
              fullWidth
              label="Full Name"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              sx={{ mb: 3 }}
            />
            <CustomTextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              sx={{ mb: 3 }}
            />
          </>
        )}

        {otpSent && (
          <CustomTextField
            fullWidth
            label="OTP"
            type="text"
            value={form.otp}
            onChange={e => handleChange('otp', e.target.value)}
            sx={{ mb: 3 }}
          />
        )}

        {error && (
          <Typography variant="body2" color="error" mb={2}>
            {error}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            backgroundColor: '#7c5cf5',
            '&:hover': { backgroundColor: '#6846e0' },
            mb: 2,
          }}
          onClick={otpSent ? verifyOtp : sendOtp}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: '#fff' }} />
          ) : otpSent ? (
            'Verify OTP'
          ) : (
            'Send OTP'
          )}
        </Button>

        {otpSent && (
          <Box display="flex" flexDirection="column" gap={1} alignItems="center">
            {timer > 0 ? (
              <Typography variant="body2" color="text.secondary">
                Resend OTP in {timer}s
              </Typography>
            ) : (
              <MuiLink
                component="button"
                onClick={sendOtp}
                underline="none"
                disabled={loading}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Resend OTP
              </MuiLink>
            )}

            <MuiLink
              component="button"
              onClick={() => setOtpSent(false)}
              underline="none"
              sx={{
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                fontSize: '0.875rem',
              }}
            >
              <ArrowBackIcon fontSize="small" /> Back to form
            </MuiLink>
          </Box>
        )}
      </StyledCard>
    </Wrapper>
  )
}
