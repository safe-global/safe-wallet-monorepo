import type { ComponentType } from 'react'
import { SafeSidebarVariant } from './SafeSidebarVariant'
import { SpacesSidebarVariant } from './SpacesSidebarVariant'
import type { SpaceSelectorProps } from '../types'

export type SidebarVariantType = 'safe' | 'spaces'

const variantMap: Record<SidebarVariantType, ComponentType<SpaceSelectorProps>> = {
  safe: SafeSidebarVariant,
  spaces: SpacesSidebarVariant,
}

export const getSidebarVariant = (type: SidebarVariantType): ComponentType<SpaceSelectorProps> => variantMap[type]

export { SafeSidebarVariant, SpacesSidebarVariant }
