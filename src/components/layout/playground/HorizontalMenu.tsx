// MUI Imports
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import HorizontalNav, { Menu, MenuItem } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'

// import { GenerateHorizontalMenu } from '@components/GenerateMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalMenuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Menu Data Imports
// import menuData from '@/data/navigation/horizontalMenuData'

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <i className='tabler-chevron-right' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({ open, transitionDuration }: RenderVerticalExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const HorizontalMenu = () => {
  // Hooks
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()

  // Vars
  const { transitionDuration } = verticalNavOptions

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor: 'var(--mui-palette-background-paper)'
      }}
    >
      <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        {/* <SubMenu label='dashboards' icon={<i className='tabler-smart-home' />}> */}
          <MenuItem href='/dashboard' icon={<i className='tabler-chart-pie-2' />}>
            Dashboard
          </MenuItem>
          <MenuItem href='/my-courses' icon={<i className='tabler-smart-home' />}>
            Courses
          </MenuItem>
          <MenuItem href='/playground' icon={<i className='tabler-truck' />}>
            Playground
          </MenuItem>
          <MenuItem href='/leaderboard'>
          <span className='flex gap-2 items-center '>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" d="m18.165 2.765l.255.032c.674.093 1.566.218 2.071.724c.414.413.573 1.085.668 1.685l.056.386c.126.91.159 2.102-.056 3.426c-.424 2.613-1.815 5.731-5.308 8.145c-.019.188-.02.378-.016.568l.01.284c.016.437.032.873-.09 1.298c-.19.66-.867 1.095-1.5 1.407l-.31.147l-.4.176c-.748.318-1.758.644-2.391.01c-.38-.379-.536-.935-.663-1.488l-.047-.207a8 8 0 0 0-.2-.774q-.075-.22-.162-.445a3 3 0 0 1-.203.225c-.345.345-.86.586-1.284.755c-.463.183-.987.343-1.472.475l-.249.066l-.477.119l-.432.1l-.517.11l-.323.063a1.01 1.01 0 0 1-1.177-1.177l.086-.431l.154-.698l.124-.51l.094-.36c.132-.484.292-1.008.476-1.47c.168-.425.409-.94.754-1.285l.08-.077l-.064-.026a8 8 0 0 0-.519-.177l-.277-.085c-.694-.21-1.436-.436-1.897-.898c-.56-.559-.371-1.41-.101-2.118l.11-.274l.177-.4l.147-.31c.312-.632.747-1.309 1.407-1.499c.35-.1.714-.106 1.08-.096l.22.007c.286.01.571.021.85-.006c2.414-3.494 5.532-4.885 8.145-5.309a11.8 11.8 0 0 1 3.171-.088" className="duoicon-secondary-layer" opacity="0.3"/><path fill="currentColor" fillRule="evenodd" d="M15.536 8.466c-1.088-1.089-2.948-.591-3.346.896a2 2 0 0 0 .517 1.932c1.088 1.089 2.948.591 3.346-.896a2 2 0 0 0-.517-1.932M8.353 15.44a1 1 0 0 0-1.1-.06l-.11.074l-.093.083l-.125.158c-.26.376-.408.896-.523 1.382l-.108.468l-.051.213l.191-.046l.418-.096c.578-.135 1.219-.31 1.613-.665a1 1 0 0 0 .088-1.314l-.082-.094l-.024-.023z" className="duoicon-primary-layer"/></svg>
          Leaderboard
          </span>
        </MenuItem>
          {/* <MenuItem href='/dashboards/drives' icon={<i className='tabler-smart-home' />}>
            drives
          </MenuItem> */}
          {/* <MenuItem href='/dashboards/labs' icon={<i className='tabler-smart-home' />}>
            labs
          </MenuItem> */}
          {/* <MenuItem href='/dashboards/leaderboard' icon={<i className='tabler-smart-home' />}>
            leaderboard
          </MenuItem>
          <MenuItem href='/dashboards/analytics' icon={<i className='tabler-trending-up' />}>
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
        {/* </SubMenu> */}
      </Menu>
      {/* <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        <GenerateHorizontalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </HorizontalNav>
  )
}

export default HorizontalMenu
