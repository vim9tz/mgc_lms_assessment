// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { Button } from '@mui/material'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

import type { ChildrenType } from '@core/types'

import Providers from '@/components/Providers'
import ProgressProvider from '@/components/ProgressBarProvider'

import { getMode, getSystemMode } from '@core/utils/serverHelpers'

import '@/app/globals.css'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import '@assets/iconify-icons/generated-icons.css'// Import custom cursor component
import CustomCursor from '@/customcursor/CustomCursor'
import LayoutWrapper from '@/@layouts/LayoutWrapper'
import VerticalLayout from '@/@layouts/VerticalLayout'
import ScrollToTop from '@/@core/components/scroll-to-top'
import Customizer from '@/@core/components/customizer'
import AuthRedirect from '@/components/AuthRedirect'
import AuthGuard from '@/hocs/AuthGuard'
import BlankLayout from '@/@layouts/BlankLayout'

export const metadata = {
  title: 'Assessment -  KGISL EDU',
  description:
    'Assessment - Take exam at ease',
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
  const direction = 'ltr'

  return (
    <html id='__next' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />

        {/* Custom Cursor (Client Component) */}
        {/* <CustomCursor /> */}
     
          <ProgressProvider>
            <Providers direction={direction}>
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
              {/* <Customizer dir={direction} disableDirection /> */}
            </Providers>
          </ProgressProvider>
      </body>
    </html>
  );
};

export default RootLayout;
