import type { ComponentType } from 'react'
import { SafeSidebarVariant } from './SafeSidebarVariant'
import { SafeSidebarContent } from './SafeSidebarContent'
import { SpacesSidebarVariant } from './SpacesSidebarVariant'
import { SpacesSidebarContent } from './SpacesSidebarContent'
import type { SidebarVariantContentProps } from '../types'

export type { SidebarVariantContentProps }

export type SidebarVariantType = 'safe' | 'spaces'

const variantMap: Record<SidebarVariantType, ComponentType<SidebarVariantContentProps>> = {
  safe: SafeSidebarContent,
  spaces: SpacesSidebarContent,
}

export const getSidebarVariant = (type: SidebarVariantType): ComponentType<SidebarVariantContentProps> =>
  variantMap[type]

export { SafeSidebarVariant, SafeSidebarContent, SpacesSidebarVariant, SpacesSidebarContent }
