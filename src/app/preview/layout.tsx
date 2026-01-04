import { NextAuthProvider } from '@/contexts/nextAuthProvider'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import AppReactToastify from '@/libs/styles/AppReactToastify'
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import '@/app/globals.css'

export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()
  const direction = 'ltr'

  return (
    <html lang="en" suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <NextAuthProvider>
            <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
              <ThemeProvider direction={direction} systemMode={systemMode}>
                {children}
                <AppReactToastify direction={direction} hideProgressBar />
              </ThemeProvider>
            </SettingsProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
