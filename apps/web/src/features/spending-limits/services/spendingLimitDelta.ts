import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../types'
import type { SpendingLimitPair } from './spendingLimitExecution'
import { distinctAddresses, isSameAllowance, isSpendingLimitFor } from './spendingLimitMatching'

export type RemovedSpendingLimit = {
  beneficiary: string
  tokenAddress: string
}

export type SpendingLimitDelta = {
  added: SpendingLimitPair[]
  modified: SpendingLimitPair[]
  removed: RemovedSpendingLimit[]
  addedDelegates: string[]
  removedDelegates: string[]
}

const lacks = (addresses: readonly string[], address: string): boolean =>
  !addresses.some((known) => sameAddress(known, address))

export const buildSpendingLimitDelta = (
  desired: readonly SpendingLimitPair[],
  onChain: readonly SpendingLimitState[],
): SpendingLimitDelta => {
  const added: SpendingLimitPair[] = []
  const modified: SpendingLimitPair[] = []

  for (const pair of desired) {
    const existing = onChain.find((limit) => isSpendingLimitFor(limit, pair.beneficiary, pair.tokenAddress))
    if (!existing) added.push(pair)
    else if (!isSameAllowance({ amount: pair.amount, resetTime: pair.resetTime }, existing)) modified.push(pair)
  }

  const removed = onChain
    .filter((limit) => !desired.some((pair) => isSpendingLimitFor(limit, pair.beneficiary, pair.tokenAddress)))
    .map((limit) => ({ beneficiary: limit.beneficiary, tokenAddress: limit.token.address }))

  const desiredDelegates = distinctAddresses(desired.map((pair) => pair.beneficiary))
  const onChainDelegates = distinctAddresses(onChain.map((limit) => limit.beneficiary))

  return {
    added,
    modified,
    removed,
    addedDelegates: desiredDelegates.filter((address) => lacks(onChainDelegates, address)),
    removedDelegates: onChainDelegates.filter((address) => lacks(desiredDelegates, address)),
  }
}
