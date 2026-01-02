'use client'

// Component Imports
import LayoutHeader from '@layouts/components/playground/Header'

import Navigation from './Navigation'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'
import Navbar from '@/@layouts/components/playground/Navbar'
import NavbarContent from '../playground/NavbarContent'

const Header = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <>
      <LayoutHeader>
      <Navbar>
          <NavbarContent />
        </Navbar>
        {!isBreakpointReached && <Navigation />}
      </LayoutHeader>
      {isBreakpointReached && <Navigation />}
    </>
  )
}

export default Header
