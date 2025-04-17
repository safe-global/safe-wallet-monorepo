import type { PropsWithChildren } from 'react'
import type { SlotName } from './SlotProvider'
import { useRegisterSlot, type UseRegisterSlotProps } from './hooks'

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
}: Omit<UseRegisterSlotProps<T>, 'condition'> & {
  useSlotCondition: () => boolean
}) => {
  return ({ children }: PropsWithChildren) => {
    const shouldRegisterSlot = useSlotCondition()
    useRegisterSlot({ slotName, id, Component, label, condition: shouldRegisterSlot })
    return children
  }
}
