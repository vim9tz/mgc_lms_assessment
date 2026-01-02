// Create a Providers component to wrap your application with all the components requiring 'use client', such as next-nprogress-bar or your different contexts...
'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

const ProgressProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <ProgressBar
        height="4px"
        color="#7367F0"
        options={{ showSpinner: false }}
        delay={200} // ✅ Set a 200ms delay before the progress bar appears
        startPosition={0.3} // ✅ Start the progress bar at 30% instead of 0%
        shallowRouting
      />
    </>
  );
};

export default ProgressProviders;
