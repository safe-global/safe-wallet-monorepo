import { useContext } from 'react'
import { SlotContext } from '@/components/tx-flow/slots/SlotProvider'

export const useSlotContext = () => {
  const context = useContext(SlotContext)
  if (!context) {
    throw new Error('useSlotContext must be used within a SlotProvider')
  }
  return context
}
