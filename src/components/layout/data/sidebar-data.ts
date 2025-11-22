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
  FolderKanban,
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
      title: '资产',
      items: [
        {
          title: '首页',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '交易历史',
          url: '/history',
          icon: History,
        },
        {
          title: '投资组合',
          url: '/portfolio',
          icon: Briefcase,
        },
        {
          title: '观察区',
          url: '/watchlist',
          icon: Search,
        },
      ],
    },
    {
      title: '分析',
      items: [
        {
          title: '市场分析',
          url: '/analysis',
          icon: BarChart3,
        },
        {
          title: '交易分析',
          url: '/analysis/trading',
          icon: TrendingUp,
        },
        {
          title: '知识库',
          url: '/knowledge',
          icon: BookOpen,
        },
        {
          title: '投资主题',
          url: '/knowledge/topics',
          icon: FolderKanban,
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
        {
          title: 'Hyperliquid API 测试',
          url: '/test-hyperliquid',
          icon: TestTube,
        },
      ],
    },
  ],
}

