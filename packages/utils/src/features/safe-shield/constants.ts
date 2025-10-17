import { BridgeStatus, ContractStatus, RecipientStatus, type Severity } from './types'
import { capitalise, formatCount, pluralise } from './utils'

// Widget title for each severity
export const SEVERITY_TO_TITLE: Record<Severity, string> = {
  CRITICAL: 'Risk detected',
  WARN: 'Issues found',
  INFO: 'Review details',
  OK: 'Checks passed',
}

// Description for each recipient status with a multi-recipient analysis
export const MULTI_RESULT_DESCRIPTION: Record<
  RecipientStatus | BridgeStatus | ContractStatus,
  ((number: number, totalNumber?: number) => string) | undefined
> = {
  [RecipientStatus.KNOWN_RECIPIENT]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'recipient', totalNumber))} ${number === 1 ? 'is' : 'are'} in the address book or an owned Safe.`,
  [RecipientStatus.UNKNOWN_RECIPIENT]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'recipient', totalNumber))} ${number === 1 ? 'is' : 'are'} not in the address book and not an owned Safe.`,
  [RecipientStatus.LOW_ACTIVITY]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'recipient', totalNumber))} ${number === 1 ? 'has' : 'have'} low activity.`,
  [RecipientStatus.HIGH_ACTIVITY]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'recipient', totalNumber))} ${number === 1 ? 'has' : 'have'} high activity.`,
  [RecipientStatus.NEW_RECIPIENT]: (number, totalNumber) =>
    `You are interacting with ${formatCount(number, 'recipient', totalNumber)} for the first time.`,
  [RecipientStatus.RECURRING_RECIPIENT]: (number, totalNumber) =>
    `You have interacted with ${formatCount(number, 'recipient', totalNumber)} before.`,
  [BridgeStatus.INCOMPATIBLE_SAFE]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'Safe account', totalNumber))} cannot be created on the destination chain. You will not be able to claim ownership of the same address. Funds sent may be inaccessible.`,
  [BridgeStatus.MISSING_OWNERSHIP]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'Safe account', totalNumber))} ${number === 1 ? 'is' : 'are'} not activated on the target chain. First, create the ${pluralise(number, 'Safe')}, execute a test transaction, and then proceed with bridging. Funds sent may be inaccessible.`,
  [BridgeStatus.UNSUPPORTED_NETWORK]: (number, totalNumber) =>
    `app.safe.global does not support the network for ${formatCount(number, 'recipient', totalNumber)}. Unless you have a wallet deployed there, we recommend not to bridge. Funds sent may be inaccessible.`,
  [BridgeStatus.DIFFERENT_SAFE_SETUP]: (number, totalNumber) =>
    `Your Safe exists on the target chain for ${formatCount(number, 'recipient', totalNumber)} but with a different configuration. Review carefully before proceeding. Funds sent may be inaccessible if the setup is incorrect.`,
  [ContractStatus.VERIFIED]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'contract', totalNumber))} ${number === 1 ? 'is' : 'are'} verified.`,
  [ContractStatus.NOT_VERIFIED]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'contract', totalNumber))} ${number === 1 ? 'is' : 'are'} not verified yet.`,
  [ContractStatus.NEW_CONTRACT]: (number, totalNumber) =>
    `You are interacting with ${formatCount(number, 'contract', totalNumber)} for the first time.`,
  [ContractStatus.KNOWN_CONTRACT]: (number, totalNumber) =>
    `You have interacted with ${formatCount(number, 'contract', totalNumber)} before.`,
  [ContractStatus.UNEXPECTED_DELEGATECALL]: (number) =>
    `${capitalise(formatCount(number, 'unexpected delegateCall'))} detected.`,
  [ContractStatus.NOT_VERIFIED_BY_SAFE]: (number, totalNumber) =>
    `${capitalise(formatCount(number, 'contract', totalNumber))} ${number === 1 ? 'has' : 'have'} not been interacted with on Safe{Wallet}. If verified, it will be marked as such after the first transaction.`,
  [ContractStatus.VERIFICATION_UNAVAILABLE]: undefined,
}
