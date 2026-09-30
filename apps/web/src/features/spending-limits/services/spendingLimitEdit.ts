import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../types'
import type { DesiredAllowance } from './spendingLimitExecution'
import { distinctAddresses, isSameAllowance, isSpendingLimitFor } from './spendingLimitMatching'

export type RemovedSpendingLimit = {
  beneficiary: string
  tokenAddress: string
}

export type SpendingLimitEdit = {
  added: DesiredAllowance[]
  modified: DesiredAllowance[]
  removed: RemovedSpendingLimit[]
  addedDelegates: string[]
  removedDelegates: string[]
}

const lacks = (addresses: readonly string[], address: string): boolean =>
  !addresses.some((known) => sameAddress(known, address))

export const buildSpendingLimitEdit = (
  desired: readonly DesiredAllowance[],
  onChain: readonly SpendingLimitState[],
): SpendingLimitEdit => {
  const added: DesiredAllowance[] = []
  const modified: DesiredAllowance[] = []

  for (const allowance of desired) {
    const existing = onChain.find((limit) => isSpendingLimitFor(limit, allowance.beneficiary, allowance.tokenAddress))
    if (!existing) added.push(allowance)
    else if (!isSameAllowance({ amount: allowance.amount, resetTime: allowance.resetTime }, existing))
      modified.push(allowance)
  }

  const removed = onChain
    .filter(
      (limit) => !desired.some((allowance) => isSpendingLimitFor(limit, allowance.beneficiary, allowance.tokenAddress)),
    )
    .map((limit) => ({ beneficiary: limit.beneficiary, tokenAddress: limit.token.address }))

  const desiredDelegates = distinctAddresses(desired.map((allowance) => allowance.beneficiary))
  const onChainDelegates = distinctAddresses(onChain.map((limit) => limit.beneficiary))

  return {
    added,
    modified,
    removed,
    addedDelegates: desiredDelegates.filter((address) => lacks(onChainDelegates, address)),
    removedDelegates: onChainDelegates.filter((address) => lacks(desiredDelegates, address)),
  }
}
