import { LucideIcon } from 'lucide-react'

export type SidebarData = {
  user: {
    name: string
    email: string
    avatar: string
  }
  navGroups: NavGroup[]
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export type NavItem = {
  title: string
  url?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  badge?: string
  items?: NavSubItem[]
}

export type NavSubItem = {
  title: string
  url: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
}

