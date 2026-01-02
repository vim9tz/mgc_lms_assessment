// hooks/useSpeedTest.ts
import { useEffect, useState } from 'react';

export function useSpeedTest(thresholdMbps = 1): [boolean, string?] {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        const start = performance.now();
        const response = await fetch('/speed-test-1mb.bin', {
          cache: 'no-store',
        });
        const blob = await response.blob();
        const end = performance.now();

        const durationSeconds = (end - start) / 1000;
        const sizeMB = blob.size / (1024 * 1024); // size in MB
        const mbps = (sizeMB / durationSeconds) * 8; // convert to Mbps

        console.log(`[SpeedTest] File size: ${sizeMB.toFixed(2)} MB`);
        console.log(`[SpeedTest] Duration: ${durationSeconds.toFixed(2)}s`);
        console.log(`[SpeedTest] Calculated speed: ${mbps.toFixed(2)} Mbps`);

        if (mbps >= thresholdMbps) {
          setOk(true);
        } else {
          throw new Error(`${mbps.toFixed(2)} Mbps < ${thresholdMbps}`);
        }
      } catch (e: any) {
        console.error('[SpeedTest] error:', e.message);
        setError(e.message);
      }
    })();
  }, []);

  return [ok, error];
}
