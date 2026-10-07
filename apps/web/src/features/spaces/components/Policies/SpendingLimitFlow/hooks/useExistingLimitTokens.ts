import { useMemo } from 'react'
import type { SpendingLimitState } from '@/features/spending-limits'
import { useIsEditMode } from '../EditFlow/EditModeContext'
import { useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import type { TokenOption } from '../utils/tokenOptions'

/** The loader resolves a token the option lists never offered by asking the chain, so this is complete. */
const toTokenOption = ({ token }: SpendingLimitState): TokenOption | undefined => {
  const { address, symbol, decimals, logoUri } = token
  if (decimals == null) return undefined

  return { address, symbol, name: symbol, decimals, logoUri, group: 'held' }
}

/**
 * The tokens the Safe already limits, to be kept selectable alongside the balances and the popular list.
 *
 * @returns Those tokens in edit mode, where the form opens prefilled with them; nothing anywhere else,
 *   since the create flow only ever writes limits for tokens its lists already offered.
 *
 * @remarks
 * Without this, a limit on a token the balances endpoint withholds — untrusted under the default token
 * list setting, or simply never held — cannot be resolved, and every edit of that policy fails with
 * "A token in this policy could not be resolved".
 *
 * A token whose decimals the chain never yielded is left out: no amount can be converted from it, and
 * standing in a `0` would pass the transaction builder's guard and sign the wrong amount.
 */
export const useExistingLimitTokens = (): TokenOption[] => {
  const isEditMode = useIsEditMode()
  const { limits } = useExistingSpendingLimits()

  return useMemo(
    () => (isEditMode && limits ? limits.flatMap((limit) => toTokenOption(limit) ?? []) : []),
    [isEditMode, limits],
  )
}
