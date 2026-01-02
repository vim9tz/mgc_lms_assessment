// hooks/usePermissionsCheck.ts
import { useState } from 'react';

type StepStatus = 'pending' | 'success' | 'failure';

interface PermissionResult {
  mic: StepStatus;
  camera: StepStatus;
  fullscreen: StepStatus;
  error: string | null;
  checkPermissions: () => Promise<void>;
}

export function usePermissionsCheck(): PermissionResult {
  const [mic, setMic] = useState<StepStatus>('pending');
  const [camera, setCamera] = useState<StepStatus>('pending');
  const [fullscreen, setFullscreen] = useState<StepStatus>('pending');
  const [error, setError] = useState<string | null>(null);

  const checkPermissions = async () => {
    setError(null);

    // 1. Request Mic & Camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMic('success');
      setCamera('success');
      stream.getTracks().forEach(track => track.stop());
    } catch (e: any) {
      if (e.message.toLowerCase().includes('audio')) setMic('failure');
      if (e.message.toLowerCase().includes('video')) setCamera('failure');
      setError('Mic or camera permission denied.');
      return;
    }

    // 2. Request Fullscreen
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen('success');
      } else {
        setFullscreen('success');
      }
    } catch (e: any) {
      setFullscreen('failure');
      setError('Fullscreen access denied.');
    }
  };

  return {
    mic,
    camera,
    fullscreen,
    error,
    checkPermissions,
  };
}
