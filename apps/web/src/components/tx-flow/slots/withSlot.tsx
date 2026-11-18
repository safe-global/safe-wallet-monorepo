import type { PropsWithChildren } from 'react'
import type { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { useRegisterSlot } from '@/components/tx-flow/slots/hooks/useRegisterSlot'
import type { UseRegisterSlotProps } from '@/components/tx-flow/slots/hooks/useRegisterSlot'
import type { FEATURES } from '@safe-global/utils/utils/chains'
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
