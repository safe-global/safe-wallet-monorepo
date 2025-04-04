import type { SlotName } from './SlotProvider'
import { useRegisterSlot, type UseRegisterSlotProps } from './hooks'

/**
 * Higher-order component to register a slot with a condition.
 * This is useful for conditionally rendering components in specific slots.
 */
export const withSlot = <T extends SlotName>({
  Component,
  slotName,
  id,
  useSlotCondition = () => true,
}: Omit<UseRegisterSlotProps<T>, 'condition'> & {
  useSlotCondition: () => boolean
}) => {
  return () => {
    const shouldRegisterSlot = useSlotCondition()
    useRegisterSlot({ slotName, id, Component, condition: shouldRegisterSlot })
    return false
  }
}
