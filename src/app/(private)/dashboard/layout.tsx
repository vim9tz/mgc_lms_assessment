// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { Button } from '@mui/material'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

import type { ChildrenType } from '@core/types'

import ProgressProvider from '@/components/ProgressBarProvider'

import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'// Import custom cursor component
import LayoutWrapper from '@/@layouts/LayoutWrapper'
import ScrollToTop from '@/@core/components/scroll-to-top'
import Customizer from '@/@core/components/customizer'
import BlankLayout from '@/@layouts/BlankLayout'
import AppReactToastify from '@/libs/styles/AppReactToastify'

import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'
import VerticalLayout from '@/@layouts/VerticalLayout'

// Component Imports
import Header from '@components/layout/horizontal/Header'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import HorizontalLayout from '@/@layouts/HorizontalLayout'


export const metadata = {
  title: 'DevHub Assessment',
  description:
    'DevHub Assessment - Take exam at ease',
};

const RootLayout = async ({ children }: ChildrenType) => {
  const mode = await getMode()
  const systemMode = await getSystemMode();
  const settingsCookie = await getSettingsFromCookie()
  const direction = 'ltr'

  return (
    <>
        <ProgressProvider>
          <VerticalNavProvider>
            <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
              <ThemeProvider direction={direction} systemMode={systemMode}>
                <LayoutWrapper
                  systemMode={systemMode}
                  verticalLayout={
                    <VerticalLayout
                      navbar={<Navbar />}
                      footer={<VerticalFooter />}
                    >
                      {children}
                    </VerticalLayout>
                  }
                  horizontalLayout={
                    <HorizontalLayout header={<Header />}>
                      {children}
                    </HorizontalLayout>
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
                <AppReactToastify direction={direction} hideProgressBar />
              </ThemeProvider>
            </SettingsProvider>
          </VerticalNavProvider>
        </ProgressProvider></>
  );
};

export default RootLayout;
