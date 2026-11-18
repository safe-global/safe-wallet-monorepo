import type { ComponentType } from 'react'
import { SafeSidebarVariant } from '@/features/spaces/components/Sidebar/variants/SafeSidebarVariant/SafeSidebarVariant'
import { SafeSidebarContent } from '@/features/spaces/components/Sidebar/variants/SafeSidebarContent/SafeSidebarContent'
import { SpacesSidebarVariant } from '@/features/spaces/components/Sidebar/variants/SpacesSidebarVariant/SpacesSidebarVariant'
import { SpacesSidebarContent } from '@/features/spaces/components/Sidebar/variants/SpacesSidebarContent/SpacesSidebarContent'
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
