import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { SpendingLimitState } from '@safe-global/views/features/spending-limits/types'
import useSpendingLimitTokenOptions from '@/hooks/useSpendingLimitTokenOptions'
import { useSafeSpendingLimits } from '@/features/spending-limits/public/hooks/useSpendingLimits'
import { withKnownTokenInfo } from '@/features/spending-limits/public/services/withKnownTokenInfo'

export type ExistingSpendingLimits = {
  /** Undefined until loaded for the selected Safe, or while no Safe is selected. */
  limits?: SpendingLimitState[]
  loading: boolean
  error?: Error
}

const NOTHING_KNOWN: ExistingSpendingLimits = { loading: false }

/** Exported so a story or a test can stand in for the chain read without going near an RPC. */
export const ExistingSpendingLimitsContext = createContext<ExistingSpendingLimits>(NOTHING_KNOWN)

/** Outside the provider (stories, Safe-level) nothing is known, so nothing is excluded. */
export const useExistingSpendingLimits = (): ExistingSpendingLimits => useContext(ExistingSpendingLimitsContext)

/**
 * The selected Safe's current spending limits, read once per Safe. Lives above `TxFlow` so the Create
 * step (hide the limits it already has) and the Review step (skip known delegates) read the same result.
 */
export const ExistingSpendingLimitsProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const scope = useSafeScope()
  // A cached read could miss a change made since, and the Review step builds its transaction from it.
  const { spendingLimits, loading, error } = useSafeSpendingLimits(scope?.safeLoaded ? scope.safe : undefined, {
    refetchOnMount: true,
  })
  // No `extraTokens` here: those come from these limits, so they would add nothing the options lack.
  const { options } = useSpendingLimitTokenOptions()

  // The options are a new array on every balance poll, so key on what is merged: new limits rebuild the Review tx.
  const tokenInfoKey = options
    .map(({ address, symbol, decimals, logoUri }) => `${address}:${symbol}:${decimals}:${logoUri ?? ''}`)
    .join(',')
  const limits = useMemo(
    () => spendingLimits && withKnownTokenInfo(spendingLimits, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spendingLimits, tokenInfoKey],
  )
  const value = useMemo<ExistingSpendingLimits>(() => ({ limits, loading, error }), [limits, loading, error])

  return <ExistingSpendingLimitsContext.Provider value={value}>{children}</ExistingSpendingLimitsContext.Provider>
}
