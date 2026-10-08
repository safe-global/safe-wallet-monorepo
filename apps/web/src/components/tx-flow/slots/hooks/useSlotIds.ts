import { useMemo } from 'react'
import type { SlotName } from '@views/components/tx-flow/slots/SlotProvider'
import { useSlotContext } from './useSlotContext'

export const useSlotIds = <T extends SlotName>(slotName: T): string[] => {
  const { getSlotIds } = useSlotContext()
  const slotIds = useMemo(() => getSlotIds(slotName), [getSlotIds, slotName])
  return slotIds
}
