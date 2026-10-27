import { ESafeAction } from '@/features/spaces/store'

export const safeModalTitles: Record<ESafeAction, string> = {
  [ESafeAction.Send]: 'Send from',
  [ESafeAction.Receive]: 'Receive to',
  [ESafeAction.Swap]: 'Swap from',
  [ESafeAction.BuildTransaction]: 'Build transaction from',
  [ESafeAction.SpendingLimit]: 'Apply spending limit to',
}
