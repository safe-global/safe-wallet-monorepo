import { type ComponentType, useEffect } from 'react'
import type { SlotComponentProps, SlotName } from '../SlotProvider'
import { useSlotContext } from './useSlotContext'

export type UseRegisterSlotProps<T extends SlotName> = {
  slotName: T
  id: string
  Component: ComponentType<SlotComponentProps<T>>
  condition?: boolean
}

/**
 * Custom hook to register a slot with a condition.
 * This is useful for conditionally rendering components in specific slots.
 */
export const useRegisterSlot = <T extends SlotName>({
  slotName,
  id,
  Component,
  condition = true,
}: UseRegisterSlotProps<T>) => {
  const { registerSlot, unregisterSlot } = useSlotContext()

  useEffect(() => {
    if (condition) {
      registerSlot(slotName, id, Component)
    } else {
      unregisterSlot(slotName, id)
    }

    return () => {
      unregisterSlot(slotName, id)
    }
  }, [condition, registerSlot, unregisterSlot, slotName, Component, id])
}
