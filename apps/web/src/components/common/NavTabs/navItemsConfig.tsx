import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'

export type NavItem = {
  label: string
  icon?: ReactElement
  href: string
  tag?: ReactElement
  disabled?: boolean
  externalUrl?: string
}

export const transactionNavItems = [
  { label: 'Queue', href: AppRoutes.transactions.queue },
  { label: 'History', href: AppRoutes.transactions.history },
  { label: 'Messages', href: AppRoutes.transactions.messages },
]

export const balancesNavItems = [
  { label: 'Tokens', href: AppRoutes.balances.index },
  { label: 'Positions', href: AppRoutes.balances.positions },
  { label: 'NFTs', href: AppRoutes.balances.nfts },
]

export const settingsNavItems = [
  { label: 'Setup', href: AppRoutes.settings.setup },
  { label: 'Appearance', href: AppRoutes.settings.appearance },
  { label: 'Security', href: AppRoutes.settings.security },
  { label: 'Notifications', href: AppRoutes.settings.notifications },
  { label: 'Modules', href: AppRoutes.settings.modules },
  { label: 'Safe Apps', href: AppRoutes.settings.safeApps.index },
  { label: 'Data', href: AppRoutes.settings.data },
  { label: 'Environment variables', href: AppRoutes.settings.environmentVariables },
]

export const generalSettingsNavItems = [
  { label: 'Cookies', href: AppRoutes.settings.cookies },
  { label: 'Appearance', href: AppRoutes.settings.appearance },
  { label: 'Notifications', href: AppRoutes.settings.notifications },
  { label: 'Security', href: AppRoutes.settings.security },
  { label: 'Data', href: AppRoutes.settings.data },
  { label: 'Environment variables', href: AppRoutes.settings.environmentVariables },
]

export const safeAppsNavItems = [
  { label: 'All apps', href: AppRoutes.apps.index },
  { label: 'My custom apps', href: AppRoutes.apps.custom },
]
