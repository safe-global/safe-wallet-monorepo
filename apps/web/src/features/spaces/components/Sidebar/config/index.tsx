import {
  House,
  ArrowRightLeft,
  WalletCards,
  BookUser,
  UsersRound,
  Shield,
  Settings,
  Wallet,
  Coins,
  LayoutGrid,
  Repeat2,
  Orbit,
  Database,
  TrendingUp,
  CircleHelp,
  ChevronLeft,
  PanelRight,
  EllipsisVertical,
} from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import type { SidebarItemConfig, SidebarGroupConfig } from '../types'

export const spacesMainNavigation: SidebarItemConfig[] = [
  {
    icon: House,
    label: 'Home',
    href: AppRoutes.spaces.index,
  },
  {
    icon: ArrowRightLeft,
    label: 'Transactions',
    href: AppRoutes.spaces.transactions,
    badge: 1,
  },
  {
    icon: WalletCards,
    label: 'Accounts',
    href: AppRoutes.spaces.safeAccounts,
  },
  {
    icon: BookUser,
    label: 'Address book',
    href: AppRoutes.spaces.addressBook,
  },
]

export const spacesSetupGroup: SidebarGroupConfig = {
  label: 'Setup',
  items: [
    {
      icon: UsersRound,
      label: 'Team',
      href: AppRoutes.spaces.members,
    },
    {
      icon: Shield,
      label: 'Security',
      href: AppRoutes.spaces.security,
      activeMemberOnly: true,
    },
    {
      icon: Settings,
      label: 'Settings',
      href: AppRoutes.spaces.settings,
      activeMemberOnly: true,
    },
  ],
}

export const safeMainNavigation: SidebarItemConfig[] = [
  {
    icon: Wallet,
    label: 'Overview',
    href: '/home',
  },
  {
    icon: ArrowRightLeft,
    label: 'Transactions',
    href: '/transactions',
    badge: 1,
  },
  {
    icon: Coins,
    label: 'Assets',
    href: '/balances',
  },
  {
    icon: LayoutGrid,
    label: 'Apps',
    href: '/apps',
  },
]

export const safeDefiGroup: SidebarGroupConfig = {
  label: 'Defi',
  items: [
    {
      icon: Repeat2,
      label: 'Swap',
      href: '/swap',
    },
    {
      icon: Orbit,
      label: 'Bridge',
      href: '/bridge',
    },
    {
      icon: Database,
      label: 'Earn',
      href: '/earn',
    },
    {
      icon: TrendingUp,
      label: 'Stake',
      href: '/stake',
    },
  ],
}

export const icons = {
  CircleHelp,
  ChevronLeft,
  PanelRight,
  EllipsisVertical,
}
