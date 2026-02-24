import type { ComponentType } from 'react'
import { SafeSidebarVariant } from './SafeSidebarVariant'
import { SafeSidebarContent } from './SafeSidebarContent'
import { SpacesSidebarVariant } from './SpacesSidebarVariant'
import { SpacesSidebarContent } from './SpacesSidebarContent'
import type { SpaceSelectorProps } from '../types'

export type SidebarVariantType = 'safe' | 'spaces'

const variantMap: Record<SidebarVariantType, ComponentType<SpaceSelectorProps>> = {
  safe: SafeSidebarContent,
  spaces: SpacesSidebarContent,
}

export const getSidebarVariant = (type: SidebarVariantType): ComponentType<SpaceSelectorProps> => variantMap[type]

export { SafeSidebarVariant, SafeSidebarContent, SpacesSidebarVariant, SpacesSidebarContent }
