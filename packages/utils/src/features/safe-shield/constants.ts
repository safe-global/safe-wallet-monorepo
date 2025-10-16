import { RecipientStatus, type Severity } from './types'
import { capitalise, formatCount } from './utils'

// Widget title for each severity
export const SEVERITY_TO_TITLE: Record<Severity, string> = {
  CRITICAL: 'Risk detected',
  WARN: 'Issues found',
  INFO: 'Review details',
  OK: 'Checks passed',
}

// Description for each recipient status with a multi-recipient analysis
export const MULTI_RESULT_DESCRIPTION: Record<RecipientStatus, (number: number, totalNumber?: number) => string> = {
  [RecipientStatus.KNOWN_RECIPIENT]: (number, totalNumber) =>
    `${capitalise(formatCount(number, totalNumber, 'recipient'))} ${number === 1 ? 'is' : 'are'} in the address book or an owned Safe.`,
  [RecipientStatus.UNKNOWN_RECIPIENT]: (number, totalNumber) =>
    `${capitalise(formatCount(number, totalNumber, 'recipient'))} ${number === 1 ? 'is' : 'are'} not in the address book and not an owned Safe.`,
  [RecipientStatus.LOW_ACTIVITY]: (number, totalNumber) =>
    `${capitalise(formatCount(number, totalNumber, 'recipient'))} ${number === 1 ? 'has' : 'have'} low activity.`,
  [RecipientStatus.HIGH_ACTIVITY]: (number, totalNumber) =>
    `${capitalise(formatCount(number, totalNumber, 'recipient'))} ${number === 1 ? 'has' : 'have'} high activity.`,
  [RecipientStatus.NEW_RECIPIENT]: (number, totalNumber) =>
    `You are interacting with ${formatCount(number, totalNumber, 'recipient')} for the first time.`,
  [RecipientStatus.RECURRING_RECIPIENT]: (number, totalNumber) =>
    `You have interacted with ${formatCount(number, totalNumber, 'recipient')} before.`,
}
