// hooks/usePermissions.ts
import { useEffect, useState } from 'react';

export function usePermissions(): [boolean, string?] {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        // get user media
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // request fullscreen
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
        // screen share check
        await (navigator as any).getDisplayMedia({ video: true });
        setOk(true);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return [ok, error];
}
