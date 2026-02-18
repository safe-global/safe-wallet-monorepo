import type { LucideIcon } from 'lucide-react'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

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

export interface SpaceSelectorProps {
  spaceName?: string
  spaceInitial?: string
  selectedSpace?: GetSpaceResponse
  spaces?: GetSpaceResponse[]
}
