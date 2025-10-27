'use client'

import { useLayout } from '@/contexts/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import Image from 'next/image'
import logo from '@/assets/icon.svg'
import logoDark from '@/assets/icon-dark.svg'
import { useTheme } from '@/contexts/theme-provider'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { resolvedTheme } = useTheme()
  console.log(resolvedTheme)
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <div className='flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
            <Image src={resolvedTheme !== 'dark' ? logoDark : logo} alt="AIpha Trader" width={32} height={32} />
          </div>
          <div className='grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>AIpha Trader</span>
            <span className='truncate text-xs'>投资决策辅助</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

