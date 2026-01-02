export async function checkSpeedTest(): Promise<[boolean, string?]> {
    try {
      const start = performance.now();
      const response = await fetch('/speed-test-10mb.bin', { cache: 'no-store' });
      const blob = await response.blob();
      const duration = (performance.now() - start) / 1000;
      const sizeMB = blob.size / (1024 * 1024);
      const mbps = (sizeMB / duration) * 8;
  
      if (mbps >= 1) return [true];
      return [false, `${mbps.toFixed(2)} Mbps < 1`];
    } catch (err: any) {
      return [false, err.message];
    }
  }
  