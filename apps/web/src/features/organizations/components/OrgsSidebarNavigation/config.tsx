import React, { type ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import HomeIcon from '@/public/images/sidebar/home.svg'
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
    icon: <SvgIcon component={HomeIcon} inheritViewBox />,
    href: AppRoutes.organizations.safeAccounts,
  },
  {
    label: 'Members',
    icon: <SvgIcon component={HomeIcon} inheritViewBox />,
    href: AppRoutes.organizations.index,
  },
  {
    label: 'Settings',
    icon: <SvgIcon component={HomeIcon} inheritViewBox />,
    href: AppRoutes.organizations.settings,
  },
]
