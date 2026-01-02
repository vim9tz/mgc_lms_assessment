export function setupFullscreenCheck(
    onSuccess: () => void,
    onExitAttempt: () => void
  ) {
    const isFullscreen = (): boolean => {
      const full = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      console.log('[FullscreenCheck] isFullscreen:', full);
      return full;
    };
  
    const enterFullscreen = () => {
      try {
        const el = document.documentElement;
        console.log('[FullscreenCheck] Attempting to enter fullscreen...');
        if (el.requestFullscreen) el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
        else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
        else console.warn('[FullscreenCheck] Fullscreen API not supported.');
      } catch (err) {
        console.error('[FullscreenCheck] Fullscreen request failed:', err);
      }
    };
  
    const monitor = () => {
      console.log('[FullscreenCheck] Monitoring fullscreen state...');
      document.addEventListener('fullscreenchange', () => {
        if (isFullscreen()) {
          console.log('[FullscreenCheck] ✅ Entered fullscreen');
          onSuccess();
        } else {
          console.warn('[FullscreenCheck] ❌ Exited fullscreen');
          onExitAttempt();
        }
      });
  
      window.addEventListener('keydown', e => {
        if (e.key === 'F11' || e.key === 'Escape') {
          console.log(`[FullscreenCheck] Key pressed: ${e.key}`);
          setTimeout(() => {
            if (!isFullscreen()) {
              onExitAttempt();
            }
          }, 500);
        }
      });
    };
  
    return {
      isFullscreen,
      enterFullscreen,
      monitor
    };
  }
  