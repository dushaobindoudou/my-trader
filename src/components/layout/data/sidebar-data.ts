import {
  LayoutDashboard,
  TrendingUp,
  History,
  Briefcase,
  BookOpen,
  Settings,
  BarChart3,
  Search,
  TestTube,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { useWeb3Auth } from '@/contexts/web3auth-context';


export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '',
  },
  navGroups: [
    {
      title: '核心',
      items: [
        {
          title: '首页',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '交易',
          url: '/trades',
          icon: TrendingUp,
        },
        {
          title: '投资组合',
          url: '/portfolio',
          icon: Briefcase,
        },
        {
          title: '自选股',
          url: '/watchlist',
          icon: Search,
        },
      ],
    },
    {
      title: '分析与学习',
      items: [
        {
          title: '市场分析',
          url: '/analysis',
          icon: BarChart3,
        },
        {
          title: '交易历史',
          url: '/history',
          icon: History,
        },
        {
          title: '知识库',
          url: '/knowledge',
          icon: BookOpen,
        },
      ],
    },
    {
      title: '系统',
      items: [
        {
          title: '设置',
          url: '/settings',
          icon: Settings,
        },
        {
          title: '认证测试',
          url: '/test-auth',
          icon: TestTube,
        },
      ],
    },
  ],
}

