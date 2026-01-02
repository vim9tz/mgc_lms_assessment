'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  CircularProgress,
  Slide,
  DialogActions,
  DialogTitle,
  DialogContent,
  Button
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WifiIcon from '@mui/icons-material/Wifi';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { checkTimeSync } from './checkTimeSync';
import { checkSpeedTest } from './checkSpeedTest';
import { checkExtensions } from './checkExtensions';
import { checkPermissions } from './checkPermissions';

import { enterFullscreen, isFullscreen, monitorFullscreen } from '@/utils/fullscreen';

type StepResult = {
  name: string;
  icon: JSX.Element;
  status: 'pending' | 'success' | 'failure';
  message?: string;
};

export default function PreFlight({ onReady }: { onReady: () => void }) {
  const [steps, setSteps] = useState<StepResult[]>([
    { name: 'Clock Sync', icon: <AccessTimeIcon />, status: 'pending' },
    { name: 'Network Speed', icon: <WifiIcon />, status: 'pending' },
    { name: 'Extension Check', icon: <SecurityIcon />, status: 'pending' },
    { name: 'Permissions Check', icon: <VisibilityIcon />, status: 'pending' },
    { name: 'Fullscreen (F11)', icon: <VisibilityIcon />, status: 'pending' }
  ]);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Handle user-triggered exit (Esc/F11) or refresh fullscreen loss
  useEffect(() => {
    if (!isFullscreen()) {
      setShowExitConfirm(true);
    }

    monitorFullscreen({
      onEnter: () => setStepStatus(4, 'success'),
      onExit: () => setShowExitConfirm(true)
    });
  }, []);

  const setStepStatus = (
    index: number,
    status: StepResult['status'],
    message?: string
  ) => {
    setSteps(prev =>
      prev.map((step, i) =>
        i === index ? { ...step, status, message } : step
      )
    );
  };



  const runChecks = async () => {
    const checks: [() => Promise<[boolean, string?]>, number][] = [
      // [checkTimeSync, 0],
      [checkSpeedTest, 1],
      [checkExtensions, 2],
      [checkPermissions, 3]
    ];

    for (const [fn, index] of checks) {
      setStepStatus(index, 'pending');
      try {
        const [ok, msg] = await fn();
        if (!ok) {
          setStepStatus(index, 'failure', msg || 'Check failed');
          return;
        }
        setStepStatus(index, 'success');
      } catch (err: any) {
        setStepStatus(index, 'failure', err.message || 'Unexpected error');
        return;
      }
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <>
      {/* Main preflight check dialog */}
      <Dialog open fullWidth maxWidth="xs">
        <div className="p-6 space-y-6 text-center">
          <h2 className="text-2xl font-bold text-indigo-600">🧪 Pre-Test Checks</h2>
          <p className="text-gray-600 text-sm">
            Press <b>F11</b> or click the button below to enter fullscreen. All checks must pass before starting the test.
          </p>

          <Button
            variant="outlined"
            color="primary"
            onClick={enterFullscreen}
          >
            🔳 Enter Fullscreen
          </Button>

          <div className="space-y-4 mt-4">
            {steps.map((s, idx) => (
              <Slide
                key={s.name}
                direction="up"
                in
                mountOnEnter
                unmountOnExit
                timeout={300 + idx * 100}
              >
                <div className="flex items-start space-x-3 text-left border-b pb-3 border-gray-100">
                  <div className="mt-1 text-indigo-500">{s.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    {s.status === 'pending' && (
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <CircularProgress size={14} /> Checking…
                      </div>
                    )}
                    {s.status === 'success' && (
                      <div className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircleIcon fontSize="small" /> Passed
                      </div>
                    )}
                    {s.status === 'failure' && (
                      <div className="text-red-600 text-sm flex items-center gap-1">
                        <ErrorOutlineIcon fontSize="small" /> {s.message || 'Failed'}
                      </div>
                    )}
                  </div>
                </div>
              </Slide>
            ))}
          </div>

          {steps.every(s => s.status === 'success') && (
            <div className="mt-6">
              <button
                onClick={onReady}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                ✅ Start Test
              </button>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
