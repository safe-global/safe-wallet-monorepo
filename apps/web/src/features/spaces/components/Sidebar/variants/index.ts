import type { ComponentType } from 'react'
import { SafeSidebarContent } from './SafeSidebarContent/SafeSidebarContent'
import { SpacesSidebarContent } from './SpacesSidebarContent/SpacesSidebarContent'
import type { SidebarVariantContentProps } from '@safe-global/views/features/spaces/components/Sidebar/types'

export type SidebarVariantType = 'safe' | 'spaces'

const variantMap: Record<SidebarVariantType, ComponentType<SidebarVariantContentProps>> = {
  safe: SafeSidebarContent,
  spaces: SpacesSidebarContent,
}

export const getSidebarVariant = (type: SidebarVariantType): ComponentType<SidebarVariantContentProps> =>
  variantMap[type]
