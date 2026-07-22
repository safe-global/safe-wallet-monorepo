import { Chip } from '@/components/common/Chip'
import ABIcon from '@/public/images/sidebar/address-book.svg'
import TransactionIcon from '@/public/images/sidebar/transactions.svg'
import React, { type ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import HomeIcon from '@/public/images/sidebar/home.svg'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import MembersIcon from '@/public/images/sidebar/members.svg'
import AccountsIcon from '@/public/images/sidebar/wallet.svg'
import { History, Shield } from 'lucide-react'

export type DynamicNavItem = {
  label: string
  icon?: ReactElement
  href: string
  tag?: ReactElement
  disabled?: boolean
  activeMemberOnly?: boolean
}

export const navItems: DynamicNavItem[] = [
  {
    label: 'Dashboard',
    icon: <HomeIcon />,
    href: AppRoutes.spaces.index,
  },
  {
    label: 'Safe accounts',
    icon: <AccountsIcon />,
    href: AppRoutes.spaces.safeAccounts,
  },
  {
    label: 'Transactions',
    icon: <TransactionIcon />,
    href: '', // TODO: Replace with empty page
    disabled: true,
    tag: <Chip label="Soon" sx={{ backgroundColor: 'background.main', color: 'primary.light' }} />,
  },
  {
    label: 'Members',
    icon: <MembersIcon />,
    href: AppRoutes.spaces.members,
  },
  {
    label: 'Address book',
    icon: <ABIcon />,
    href: AppRoutes.spaces.addressBook,
  },
  {
    label: 'Activity',
    icon: <History className="size-5" />,
    href: AppRoutes.spaces.activity,
    activeMemberOnly: true,
  },
  {
    label: 'Security',
    icon: <Shield className="size-5" />,
    href: AppRoutes.spaces.security,
    activeMemberOnly: true,
  },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
    href: AppRoutes.spaces.settings,
    activeMemberOnly: true,
  },
]
