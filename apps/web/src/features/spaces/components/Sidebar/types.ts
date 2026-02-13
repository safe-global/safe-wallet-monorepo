import type { LucideIcon } from 'lucide-react'

export interface SidebarItemConfig {
  icon: LucideIcon
  label: string
  href: string
  badge?: number
  isActive?: boolean
}

export interface SidebarGroupConfig {
  label: string
  items: SidebarItemConfig[]
}

export interface SidebarWrapperProps {
  // Common props for both wrappers if needed in the future
}
