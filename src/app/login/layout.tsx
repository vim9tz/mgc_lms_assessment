// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { Button } from '@mui/material'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

import type { ChildrenType } from '@core/types'

import Providers from '@/components/Providers'
import ProgressProvider from '@/components/ProgressBarProvider'


import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'// Import custom cursor component
import LayoutWrapper from '@/@layouts/LayoutWrapper'
import ScrollToTop from '@/@core/components/scroll-to-top'
import Customizer from '@/@core/components/customizer'
import BlankLayout from '@/@layouts/BlankLayout'
import { SettingsProvider } from '@core/contexts/settingsContext'
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'
import ThemeProvider from '@components/theme'
import AppReactToastify from '@/libs/styles/AppReactToastify'
import { NextAuthProvider } from '@/contexts/nextAuthProvider'

export const metadata = {
  title: 'Assessment Login - KGISL EDU',
  description:
    'Assessment Login - login to access your exam',
  icons: {
    icon: [
      { url: '/favicon.ico', media: '(prefers-color-scheme: light)' },
      { url: '/favicon.ico', media: '(prefers-color-scheme: dark)' }
    ],
  },
};

const RootLayout = async ({ children }: ChildrenType) => {
  const mode = await getMode()
  const systemMode = await getSystemMode();
  const settingsCookie = await getSettingsFromCookie()

  const direction = 'ltr'

  return (
    <html id='__next' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />

        {/* Custom Cursor (Client Component) */}
        {/* <CustomCursor /> */}
     
          <ProgressProvider>
            {/* <Providers direction={direction}> */}
            <NextAuthProvider>
            <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
            <ThemeProvider direction={direction} systemMode={systemMode}>
              <LayoutWrapper
                systemMode={systemMode}

                horizontalLayout={
                  <BlankLayout systemMode={systemMode}>
                    {children}
                  </BlankLayout>
                }
              />
              <ScrollToTop className='mui-fixed'>
                <Button
                  variant='contained'
                  className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'
                >
                  <i className='tabler-arrow-up' />
                </Button>
              </ScrollToTop>
              <AppReactToastify direction={direction} hideProgressBar />
            </ThemeProvider>
          </SettingsProvider>
              
              {/* <Customizer dir={direction} disableDirection /> */}
            {/* </Providers> */}
            </NextAuthProvider>
          </ProgressProvider>
      </body>
    </html>
  );
};

export default RootLayout;
