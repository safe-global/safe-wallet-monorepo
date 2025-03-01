import { Chip } from '@/components/common/Chip'
import ABIcon from '@/public/images/sidebar/address-book.svg'
import TransactionIcon from '@/public/images/sidebar/transactions.svg'
import React, { type ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import HomeIcon from '@/public/images/sidebar/home.svg'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import MembersIcon from '@/public/images/sidebar/members.svg'
import AccountsIcon from '@/public/images/sidebar/bank.svg'
import { SvgIcon } from '@mui/material'

export type DynamicNavItem = {
  label: string
  icon?: ReactElement
  href: (pathParam: string) => string
  tag?: ReactElement
  disabled?: boolean
}

export const navItems: DynamicNavItem[] = [
  {
    label: 'Home',
    icon: <SvgIcon component={HomeIcon} inheritViewBox />,
    href: AppRoutes.organizations.index,
  },
  {
    label: 'Safe Accounts',
    icon: <SvgIcon component={AccountsIcon} inheritViewBox sx={{ '& path': { fill: 'none !important' } }} />,
    href: AppRoutes.organizations.safeAccounts,
  },
  {
    label: 'Transactions',
    icon: <SvgIcon component={TransactionIcon} inheritViewBox />,
    href: (_) => _, // TODO: Replace with empty page
    disabled: true,
    tag: <Chip label="Soon" sx={{ backgroundColor: 'background.main', color: 'static.main' }} />,
  },
  {
    label: 'Members',
    icon: <SvgIcon component={MembersIcon} inheritViewBox />,
    href: AppRoutes.organizations.members,
  },
  {
    label: 'Address book',
    icon: <SvgIcon component={ABIcon} inheritViewBox />,
    href: (_) => _, // TODO: Replace with empty page
    disabled: true,
    tag: <Chip label="Soon" sx={{ backgroundColor: 'background.main', color: 'static.main' }} />,
  },
  {
    label: 'Settings',
    icon: <SvgIcon component={SettingsIcon} inheritViewBox />,
    href: AppRoutes.organizations.settings,
  },
]
