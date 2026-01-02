import { useEffect, useState } from 'react';

export function useTimeSync(): [boolean, string?] {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('http://127.0.0.1:8000/api/servertime', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!resp.ok) {
          throw new Error(`Server returned ${resp.status}`);
        }

        const { serverTime } = await resp.json(); // Only call .json() once
        console.log('🕒 Server time:', serverTime);

        const drift = Math.abs(Date.now() - new Date(serverTime).getTime());
        console.log('⏱️ Clock drift (ms):', drift);

        if (drift < 5000) {
          setOk(true);
        } else {
          throw new Error(`Clock drift ${Math.floor(drift / 1000)}s`);
        }
      } catch (e: any) {
        console.error('[useTimeSync] error:', e);
        setError(e.message);
      }
    })();
  }, []);

  return [ok, error];
}
