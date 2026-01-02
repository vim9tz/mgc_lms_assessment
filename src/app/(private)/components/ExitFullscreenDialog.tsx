'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  styled
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import devtools from 'devtools-detect';

const MAX_ATTEMPTS = 300;
const COUNTDOWN_SECONDS = 10 * 60; // 10 minutes

interface ExitFullscreenDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  exitLog?: Record<string, number>;
}

// Blinking styled component
const BlinkingCountdown = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.error.main,
  '&.blink': {
    animation: 'blinker 0.8s step-start infinite'
  },
  '@keyframes blinker': {
    '50%': { opacity: 0 }
  }
}));

export default function ExitFullscreenDialog({
  open,
  onCancel,
  onConfirm,
  exitLog
}: ExitFullscreenDialogProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const devtoolsCheckerRef = useRef<NodeJS.Timeout | null>(null);

  const totalAttempts = useMemo(() => {
    if (!exitLog || typeof exitLog !== 'object') return 0;
    return Object.values(exitLog).reduce((sum, count) => sum + (Number(count) || 0), 0);
  }, [exitLog]);

  const isLastAttempt = totalAttempts >= MAX_ATTEMPTS;
  const progress = (countdown / COUNTDOWN_SECONDS) * 100;

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (devtoolsCheckerRef.current) clearInterval(devtoolsCheckerRef.current);
    timerRef.current = null;
    devtoolsCheckerRef.current = null;
  }, []);

  const startTimers = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    setDevToolsOpen(devtools.isOpen);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearTimers();
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    devtoolsCheckerRef.current = setInterval(() => {
      setDevToolsOpen(devtools.isOpen);
    }, 1500);
  }, [clearTimers, onConfirm]);

  useEffect(() => {
    if (open) {
      clearTimers(); // Prevent duplicate intervals
      startTimers();
    } else {
      clearTimers();
    }

    return () => clearTimers();
  }, [open, startTimers, clearTimers]);

  // Pause timers on tab switch (blur)
  useEffect(() => {
    const handleBlur = () => clearTimers();
    const handleFocus = () => {
      if (open) startTimers();
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [open, clearTimers, startTimers]);

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (['backdropClick', 'escapeKeyDown'].includes(reason)) return;
      }}
      disableEscapeKeyDown
      aria-labelledby="fullscreen-warning-title"
      aria-describedby="fullscreen-warning-description"
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          p: 2,
          borderRadius: 2,
          boxShadow: 6,
          position: 'relative',
          overflow: 'hidden'
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${100 - progress}%`,
          height: '4px',
          bgcolor: 'error.main',
          transition: 'width 1s linear'
        }}
      />

      <DialogTitle
        id="fullscreen-warning-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'error.main',
          fontWeight: 'bold'
        }}
      >
        <WarningAmberIcon fontSize="large" /> You left fullscreen!
      </DialogTitle>

      <DialogContent id="fullscreen-warning-description" sx={{ textAlign: 'center', pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Exiting fullscreen or switching tabs is not allowed during the test.
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
          Total Attempts: {totalAttempts} / {MAX_ATTEMPTS}
        </Typography>

        {devToolsOpen && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Please close DevTools to continue the test.
          </Typography>
        )}

        <BlinkingCountdown
          variant="h3"
          className={countdown <= 3 ? 'blink' : ''}
        >
          {countdown}
        </BlinkingCountdown>
        <Typography variant="caption" color="text.secondary">
          seconds until auto-disqualification
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            clearTimers();
            onCancel();
          }}
          disabled={isLastAttempt || devToolsOpen}
          sx={{ textTransform: 'none' }}
        >
          {devToolsOpen
            ? 'Close DevTools to resume'
            : isLastAttempt
              ? 'No attempts left'
              : 'No, stay and resume'}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            clearTimers();
            onConfirm();
          }}
          sx={{ textTransform: 'none' }}
        >
          Yes, exit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
