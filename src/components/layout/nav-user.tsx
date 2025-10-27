'use client'

import Link from 'next/link'
import {
  ChevronsUpDown,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useWeb3Auth } from '@/contexts/web3auth-context';


type NavUserProps = {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()

  const { user: web3User, logout, address, getBalance, connectorName, networkName, networkChainId, switchChainTo } = useWeb3Auth();

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 16)}...${address.slice(-4)}`;
  };

  const getUserDisplayName = () => {
    if (!web3User) return '未知用户';
    return web3User.name || web3User.email || address?.substring(2, 4) || 'unknown user';
  };

  const getUserAvatar = () => {
    if (!web3User) return '';
    return '';
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
                <AvatarFallback className='rounded-lg'>
                  {getUserDisplayName().substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden'>
                <span className='truncate font-semibold'>{getUserDisplayName()}</span>
                <span className='truncate text-xs'>{web3User?.email || formatAddress(address) || ''}</span>
              </div>
              <ChevronsUpDown className='ms-auto size-4 group-data-[collapsible=icon]:hidden' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
                  <AvatarFallback className='rounded-lg'>
                    {getUserDisplayName().substring(0, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>{getUserDisplayName()}</span>
                  <span className='truncate text-xs'>{web3User?.email || formatAddress(address) || ''}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href='/settings'>
                  <User />
                  个人资料
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/settings'>
                  <Settings />
                  设置
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

