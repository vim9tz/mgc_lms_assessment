// src\components\Providers.tsx
// Type Imports

import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { NextAuthProvider } from '@/contexts/nextAuthProvider'
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'

// Styled Component Imports
import AppReactToastify from '@/libs/styles/AppReactToastify'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'
import AuthGuard from '@/hocs/AuthGuard'
import GuestSignOut from './GuestSignOut'
import RemoveAuthGuestParam from './RemoveAuthGuestParam'

type Props = ChildrenType & {
  direction: Direction
}
export const revalidate = 0;

const Providers = async (props: Props) => {
  // Props
  const { children, direction } = props

  // Vars
  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()

  return (
    <NextAuthProvider>
      <GuestSignOut />
      <RemoveAuthGuestParam />
      <AuthGuard>
        <VerticalNavProvider>
          <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
            <ThemeProvider direction={direction} systemMode={systemMode}>
              {children}
              <AppReactToastify direction={direction} hideProgressBar />
            </ThemeProvider>
          </SettingsProvider>
        </VerticalNavProvider></AuthGuard>
    </NextAuthProvider>
  )
}

export default Providers
