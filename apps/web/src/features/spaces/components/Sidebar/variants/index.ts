import type { ComponentType } from 'react'
import { SafeSidebarVariant } from './SafeSidebarVariant/SafeSidebarVariant'
import { SafeSidebarContent } from './SafeSidebarContent/SafeSidebarContent'
import { SpacesSidebarVariant } from './SpacesSidebarVariant/SpacesSidebarVariant'
import { SpacesSidebarContent } from './SpacesSidebarContent/SpacesSidebarContent'
import type { SidebarVariantContentProps } from '@safe-global/views/features/spaces/components/Sidebar/types'

export type { SidebarVariantContentProps }

export type SidebarVariantType = 'safe' | 'spaces'

const variantMap: Record<SidebarVariantType, ComponentType<SidebarVariantContentProps>> = {
  safe: SafeSidebarContent,
  spaces: SpacesSidebarContent,
}

export const getSidebarVariant = (type: SidebarVariantType): ComponentType<SidebarVariantContentProps> =>
  variantMap[type]

export { SafeSidebarVariant, SafeSidebarContent, SpacesSidebarVariant, SpacesSidebarContent }
