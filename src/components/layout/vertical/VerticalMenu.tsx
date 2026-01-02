import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import { Menu, MenuItem } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const VerticalMenu = ({ scrollMenu }: Props) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()

  const { isBreakpointReached } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
          className: 'bs-full overflow-y-auto overflow-x-hidden',
          onScroll: container => scrollMenu(container, false)
        }
        : {
          options: { wheelPropagation: false, suppressScrollX: true },
          onScrollY: container => scrollMenu(container, true)
        })}
    >
      <Menu menuItemStyles={menuItemStyles(verticalNavOptions, theme)}>
        {/* Flat list of Menu Items */}
        <MenuItem href='/dashboard' icon={<i className='tabler-chart-pie-2' />}>
          Dashboard
        </MenuItem>
        <MenuItem href='/my-courses' icon={<i className='tabler-smart-home' />}>
          Courses
        </MenuItem>
        <MenuItem href='/playground' icon={<i className='tabler-truck' />}>
          Playground
        </MenuItem>
        <MenuItem href='/leaderboard' icon={<i className='tabler-school' />}>
          Leaderboard
        </MenuItem>
        {/* <MenuItem href='/dashboards/drives' icon={<i className='tabler-smart-home' />}>
          drives
        </MenuItem> */}
        {/* <MenuItem href='/dashboards/labs' icon={<i className='tabler-smart-home' />}>
          labs
        </MenuItem> */}
        {/* <MenuItem href='/dashboards/leaderboard' icon={<i className='tabler-smart-home' />}>
          leaderboard
        </MenuItem> */}
        {/* <MenuItem href='/dashboards/analytics' icon={<i className='tabler-trending-up' />}>
          analytics
        </MenuItem>
        <MenuItem href='/dashboards/ecommerce' icon={<i className='tabler-shopping-cart' />}>
          eCommerce
        </MenuItem>
        <MenuItem href='/dashboards/academy' icon={<i className='tabler-school' />}>
          academy
        </MenuItem>
        <MenuItem href='/dashboards/logistics' icon={<i className='tabler-truck' />}>
          logistics
        </MenuItem> */}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
