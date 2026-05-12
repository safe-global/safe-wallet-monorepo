import {
  House,
  ArrowRightLeft,
  WalletCards,
  BookUser,
  UsersRound,
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
  Shield,
  History,
  Scale,
} from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import type { SidebarItemConfig, SidebarGroupConfig } from '../types'

export const spacesMainNavigation: SidebarItemConfig[] = [
  {
    icon: House,
    label: 'Home',
    href: AppRoutes.spaces.index,
  },
  // TODO: Activate when Spaces Transactions page is ready
  // {
  //   icon: ArrowRightLeft,
  //   label: 'Transactions',
  //   href: AppRoutes.spaces.transactions,
  // },
  {
    icon: WalletCards,
    label: 'Safe accounts',
    href: AppRoutes.spaces.safeAccounts,
  },
  {
    icon: BookUser,
    label: 'Address book',
    href: AppRoutes.spaces.addressBook,
  },
  {
    icon: History,
    label: 'Activity',
    href: AppRoutes.spaces.activity,
    activeMemberOnly: true,
  },
  {
    icon: Scale,
    label: 'Policies',
    href: AppRoutes.spaces.policies,
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
      label: 'Security hub',
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
    href: AppRoutes.home,
  },
  {
    icon: Coins,
    label: 'Assets',
    href: AppRoutes.balances.index,
  },
  {
    icon: ArrowRightLeft,
    label: 'Transactions',
    href: AppRoutes.transactions.history,
  },
  {
    icon: BookUser,
    label: 'Address book',
    href: AppRoutes.addressBook,
  },
  {
    icon: LayoutGrid,
    label: 'Apps',
    href: AppRoutes.apps.index,
  },
]

export const safeDefiGroup: SidebarGroupConfig = {
  label: 'Defi',
  items: [
    {
      icon: Repeat2,
      label: 'Swap',
      href: AppRoutes.swap,
    },
    {
      icon: Orbit,
      label: 'Bridge',
      href: AppRoutes.bridge,
    },
    {
      icon: Database,
      label: 'Earn',
      href: AppRoutes.earn,
    },
    {
      icon: TrendingUp,
      label: 'Stake',
      href: AppRoutes.stake,
    },
  ],
}

export const icons = {
  CircleHelp,
  ChevronLeft,
  PanelRight,
  EllipsisVertical,
}
