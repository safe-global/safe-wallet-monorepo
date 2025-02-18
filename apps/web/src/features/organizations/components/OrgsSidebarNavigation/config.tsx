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
    label: 'Members',
    icon: <SvgIcon component={MembersIcon} inheritViewBox />,
    href: AppRoutes.organizations.members,
  },
  {
    label: 'Settings',
    icon: <SvgIcon component={SettingsIcon} inheritViewBox />,
    href: AppRoutes.organizations.settings,
  },
]
