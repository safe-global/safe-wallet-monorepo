import { type ComponentType, useMemo } from 'react'
import type { SlotComponentProps, SlotName } from '../SlotProvider'
import { useSlotContext } from './useSlotContext'

export const useSlot = <T extends SlotName>(slotName: T, id?: string): ComponentType<SlotComponentProps<T>>[] => {
  const { getSlot } = useSlotContext()
  const slot = useMemo(() => getSlot(slotName, id), [getSlot, slotName, id])
  return slot
}
