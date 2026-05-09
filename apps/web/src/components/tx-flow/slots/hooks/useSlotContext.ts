import { useContext } from 'react'
import { SlotContext } from '../SlotProvider'

export const useSlotContext = () => {
  const context = useContext(SlotContext)
  if (!context) {
    throw new Error('useSlotContext must be used within a SlotProvider')
  }
  return context
}
