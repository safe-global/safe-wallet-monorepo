import type { ComponentType } from 'react'
import { SafeTopbarContent } from './SafeTopbarContent'
import { SpacesTopbarContent } from './SpacesTopbarContent'

export type TopbarVariantType = 'safe' | 'spaces'

const variantMap: Record<TopbarVariantType, ComponentType> = {
  safe: SafeTopbarContent,
  spaces: SpacesTopbarContent,
}

export const getTopbarVariant = (type: TopbarVariantType): ComponentType => variantMap[type]

export { SafeTopbarContent, SpacesTopbarContent }
