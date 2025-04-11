import { useEffect } from 'react'
import type { SlotItem, SlotName } from '../SlotProvider'
import { useSlotContext } from './useSlotContext'

export type UseRegisterSlotProps<T extends SlotName> = {
  slotName: T
  id: string
  Component: SlotItem<T>['Component']
  label?: SlotItem<T>['label']
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
  label,
  condition = true,
}: UseRegisterSlotProps<T>) => {
  const { registerSlot, unregisterSlot } = useSlotContext()

  useEffect(() => {
    if (condition) {
      registerSlot({ slotName, id, Component, label })
    } else {
      unregisterSlot(slotName, id)
    }

    return () => {
      unregisterSlot(slotName, id)
    }
  }, [condition, registerSlot, unregisterSlot, slotName, Component, label, id])
}
