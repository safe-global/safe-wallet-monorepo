import { ESafeAction } from '../../public/store/safeActionsModalSlice'

export const safeModalTitles: Record<ESafeAction, string> = {
  [ESafeAction.Send]: 'Send from',
  [ESafeAction.Receive]: 'Receive to',
  [ESafeAction.Swap]: 'Swap from',
  [ESafeAction.BuildTransaction]: 'Build transaction from',
  [ESafeAction.NewTransaction]: 'New transaction from',
}

export const NO_ACTIVATED_SAFES_MESSAGE = 'No activated Safe accounts. Activate a Safe account to continue.'
