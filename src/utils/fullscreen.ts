// utils/fullscreen.ts

export function enterFullscreen() {
  try {
    const el = document.documentElement;
    console.log('[Fullscreen] Attempting fullscreen...');
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
    else console.warn('[Fullscreen] Fullscreen API not supported');
  } catch (error) {
    console.error('[Fullscreen] Error entering fullscreen:', error);
  }
}

export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

export function monitorFullscreen({
  onEnter,
  onExit
}: {
  onEnter?: () => void;
  onExit: () => void;
}) {
  const events = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange'
  ];

  events.forEach(event =>
    document.addEventListener(event, () => {
      if (isFullscreen()) {
        console.log('[Fullscreen] ✅ Entered fullscreen');
        onEnter?.();
      } else {
        console.warn('[Fullscreen] ❌ Exited fullscreen');
        onExit();
      }
    })
  );

  // Optionally: catch F11 or Escape manually
  window.addEventListener('keydown', e => {
    if (e.key === 'F11' || e.key === 'Escape') {
      setTimeout(() => {
        if (!isFullscreen()) {
          onExit();
        }
      }, 500);
    }
  });
}
