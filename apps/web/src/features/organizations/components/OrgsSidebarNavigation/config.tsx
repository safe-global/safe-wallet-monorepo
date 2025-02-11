import React from 'react'
import { AppRoutes } from '@/config/routes'
import HomeIcon from '@/public/images/sidebar/home.svg'
import { SvgIcon } from '@mui/material'
import type { NavItem } from '@/components/sidebar/SidebarNavigation/config'

export const navItems: NavItem[] = [
  {
    label: 'All organizations',
    icon: <SvgIcon component={HomeIcon} inheritViewBox />,
    href: AppRoutes.organizations.members, // Placeholder
  },
  {
    label: 'Members',
    icon: <SvgIcon component={HomeIcon} inheritViewBox />,
    href: AppRoutes.organizations.members,
  },
]
