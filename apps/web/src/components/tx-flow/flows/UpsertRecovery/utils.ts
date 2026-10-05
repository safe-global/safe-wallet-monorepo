import { getCountdown } from '@safe-global/utils/utils/date'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { DAY_IN_SECONDS } from './useRecoveryPeriods'

export const isCustomDelaySelected = (selectedDelay: string) => {
  return !Number(selectedDelay)
}

export const getDelay = (customDelay: string, selectedDelay: string) => {
  const isCustom = isCustomDelaySelected(selectedDelay)
  if (!isCustom) return selectedDelay
  return customDelay ? `${Number(customDelay) * DAY_IN_SECONDS}` : ''
}

export const formatRecoveryPeriod = (seconds: number): string => {
  const { days, hours, minutes } = getCountdown(seconds)
  const units: Array<[number, string]> = [
    [days, 'day'],
    [hours, 'hour'],
    [minutes, 'minute'],
    [seconds % 60, 'second'],
  ]

  return units
    .filter(([amount]) => amount > 0)
    .map(([amount, unit]) => `${amount} ${unit}${maybePlural(amount)}`)
    .join(', ')
}
