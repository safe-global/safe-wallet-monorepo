import { DAY_IN_SECONDS } from './useRecoveryPeriods'

export const isCustomDelaySelected = (selectedDelay: string) => {
  return !Number(selectedDelay)
}

export const getDelay = (customDelay: string, selectedDelay: string) => {
  const isCustom = isCustomDelaySelected(selectedDelay)
  if (!isCustom) return selectedDelay
  return customDelay ? `${Number(customDelay) * DAY_IN_SECONDS}` : ''
}
