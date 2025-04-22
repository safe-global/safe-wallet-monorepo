import type { PropsWithChildren } from 'react'
import type { SlotName } from './SlotProvider'
import { useRegisterSlot, type UseRegisterSlotProps } from './hooks'
import type { FEATURES } from '@/utils/featureToggled'
import { useHasFeature } from '@/hooks/useChains'

/**
 * Higher-order component to register a slot with a condition.
 * This is useful for conditionally rendering components in specific slots.
 */
export const withSlot = <T extends SlotName>({
  Component,
  label,
  slotName,
  id,
  useSlotCondition = () => true,
  feature,
}: Omit<UseRegisterSlotProps<T>, 'condition'> & {
  useSlotCondition?: () => boolean
  feature?: FEATURES
}) => {
  return ({ children }: PropsWithChildren) => {
    const shouldRegisterSlot = useSlotCondition()
    const isFeatureEnabled = feature ? useHasFeature(feature) : true
    useRegisterSlot({ slotName, id, Component, label, condition: shouldRegisterSlot && isFeatureEnabled })
    return children
  }
}
