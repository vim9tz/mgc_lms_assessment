export async function checkExtensions(): Promise<[boolean, string?]> {
    try {
      if (typeof window === 'undefined') return [true];
  
      // Skip in development
      if (process.env.NODE_ENV !== 'production') return [true];
  
      // Heuristic check: detect injected global hooks
      const suspiciousGlobals = Object.keys(window).filter((key) =>
        /(devtools|hook|redux|extension)/i.test(key)
      );
  
      if (suspiciousGlobals.length > 0) {
        console.warn("🛑 Suspicious global objects detected:", suspiciousGlobals);
        return [
          false,
          `Browser extensions are not allowed during this test. 
  Please disable all extensions:
  
  1. Go to chrome://extensions (or your browser's extensions page).
  2. Disable all extensions.
  3. Refresh this page.`,
        ];
      }
  
      return [true];
    } catch (err: any) {
      console.error("❌ checkExtensions error:", err);
      return [false, `Extension check failed: ${err.message || err}`];
    }
  }
  