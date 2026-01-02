// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ChildrenType } from '@core/types'

// Context Imports
import { HorizontalNavProvider } from '@menu/contexts/horizontalNavContext'

// Component Imports
import LayoutContent from './components/horizontal/LayoutContent'

// Util Imports

// Styled Component Imports
import StyledContentWrapper from './styles/playground/StyledContentWrapper'
import { playgroundLayoutClasses } from './utils/layoutClasses'

type HorizontalLayoutProps = ChildrenType & {
  header?: ReactNode
  footer?: ReactNode
}

const PlaygroundLayout = (props: HorizontalLayoutProps) => {
  // Props
  const { header, footer, children } = props

  return (
    <div className={classnames(playgroundLayoutClasses.root, 'flex flex-auto')}>
      <HorizontalNavProvider>
        <StyledContentWrapper className={classnames(playgroundLayoutClasses.contentWrapper, 'flex flex-col is-full')}>
          {header || null}
          <LayoutContent>{children}</LayoutContent>
          {footer || null}
        </StyledContentWrapper>
      </HorizontalNavProvider>
    </div>
  )
}

export default PlaygroundLayout
