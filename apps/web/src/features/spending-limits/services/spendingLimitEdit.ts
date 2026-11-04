import uniqWith from 'lodash/uniqWith'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../types'
import type { DesiredAllowance } from './spendingLimitExecution'
import { isSameAllowance, isSpendingLimitFor } from './spendingLimitMatching'

/**
 * The AllowanceModule stores two separate things per Safe: an allowance filed under
 * `(delegate, token)`, and the list of delegates itself. An edit therefore has two diffs to make,
 * not one — clearing a spender's last allowance still leaves them registered.
 */

/** A limit to clear. Only its key is needed: `deleteAllowance` takes no amount. */
export type RemovedSpendingLimit = {
  beneficiary: string
  tokenAddress: string
}

/**
 * What the chain is missing, grouped so that each field becomes one kind of module call:
 * `setAllowance`, `deleteAllowance`, `addDelegate`, `removeDelegate`.
 */
export type SpendingLimitEdit = {
  /** No limit exists yet for this spender and token. */
  added: DesiredAllowance[]
  /** A limit exists for this spender and token, but for a different amount or period. */
  modified: DesiredAllowance[]
  /** The chain holds this limit and the edited policy no longer claims it. */
  removed: RemovedSpendingLimit[]
  /** Spenders the module has never heard of, which `setAllowance` would revert for. */
  addedDelegates: string[]
  /** Spenders left with nothing, so the module has no reason to still know them. */
  removedDelegates: string[]
}

/**
 * @param addresses - The list to look in.
 * @param address - The address to look for.
 * @returns `true` when `address` is absent from `addresses`, comparing addresses rather than casing.
 */
const lacks = (addresses: readonly string[], address: string): boolean =>
  !addresses.some((known) => sameAddress(known, address))

/**
 * Works out the difference between the policy the form describes and the one the Safe holds now.
 *
 * @param desired - Every row of the edited form, flattened to one entry per spender and token.
 * @param onChain - The same policy as the chain holds it, read over RPC.
 * @returns The groups the batch builder turns into module calls.
 *
 * @remarks
 * Rows are paired by `(spender, token)` via {@link isSpendingLimitFor}, never by position, so
 * reordering the form or re-adding a spender unchanged describes no change at all.
 */
export const buildSpendingLimitEdit = (
  desired: readonly DesiredAllowance[],
  onChain: readonly SpendingLimitState[],
): SpendingLimitEdit => {
  const added: DesiredAllowance[] = []
  const modified: DesiredAllowance[] = []

  // Each row of the form against the limit the Safe already holds for that same spender and token.
  for (const allowance of desired) {
    const existing = onChain.find((limit) => isSpendingLimitFor(limit, allowance.beneficiary, allowance.tokenAddress))
    if (!existing) added.push(allowance)
    else if (!isSameAllowance({ amount: allowance.amount, resetTime: allowance.resetTime }, existing))
      modified.push(allowance)
  }

  // The other direction: a limit the chain holds that no row of the form still claims.
  const removed = onChain
    .filter(
      (limit) => !desired.some((allowance) => isSpendingLimitFor(limit, allowance.beneficiary, allowance.tokenAddress)),
    )
    .map((limit) => ({ beneficiary: limit.beneficiary, tokenAddress: limit.token.address }))

  // A spender is registered once however many tokens they hold limits for, so the delegate diff is
  // taken over the distinct addresses on each side rather than over the rows.
  const desiredDelegates = uniqWith(
    desired.map((allowance) => allowance.beneficiary),
    sameAddress,
  )
  const onChainDelegates = uniqWith(
    onChain.map((limit) => limit.beneficiary),
    sameAddress,
  )

  return {
    added,
    modified,
    removed,
    addedDelegates: desiredDelegates.filter((address) => lacks(onChainDelegates, address)),
    removedDelegates: onChainDelegates.filter((address) => lacks(desiredDelegates, address)),
  }
}
