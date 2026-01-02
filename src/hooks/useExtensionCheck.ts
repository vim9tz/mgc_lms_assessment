// hooks/useExtensionCheck.ts
import { useEffect, useState } from 'react';

export function useExtensionCheck(): [boolean, string?] {
  const [ok, setOk] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    // Very limited: detect React/Redux devtools
    if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      setOk(false);
      setError('DevTools extension detected');
    }
  }, []);

  return [ok, error];
}
