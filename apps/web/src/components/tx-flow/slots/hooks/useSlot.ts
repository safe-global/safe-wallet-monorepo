import { type ComponentType, useMemo } from 'react'
import type { SlotComponentProps, SlotName } from '../SlotProvider'
import { useSlotContext } from './useSlotContext'

export const useSlot = <T extends SlotName>(slotName: T): ComponentType<SlotComponentProps<T>>[] => {
  const { getSlot } = useSlotContext()
  const slot = useMemo(() => getSlot(slotName), [getSlot, slotName])
  return slot
}
