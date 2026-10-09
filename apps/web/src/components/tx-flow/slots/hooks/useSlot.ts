import { useMemo } from 'react'
import type { SlotName, SlotItem } from '@views/components/tx-flow/slots/SlotProvider'
import { useSlotContext } from './useSlotContext'

export const useSlot = <T extends SlotName>(slotName: T, id?: string): SlotItem<T>[] => {
  const { getSlot } = useSlotContext()
  const slot = useMemo(() => getSlot(slotName, id), [getSlot, slotName, id])
  return slot
}
