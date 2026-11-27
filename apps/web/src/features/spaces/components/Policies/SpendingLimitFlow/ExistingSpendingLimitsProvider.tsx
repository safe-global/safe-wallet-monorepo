import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { SpendingLimitState } from '@safe-global/views/features/spending-limits/types'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { Errors, logError } from '@/services/exceptions'
import useSpendingLimitTokenOptions from '@/hooks/useSpendingLimitTokenOptions'
import { toTokenInfo } from '@/utils/tokenOptions'

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
 * The selected Safe's current spending limits, loaded once per Safe. Lives above `TxFlow` so the Create
 * step (hide the limits it already has) and the Review step (skip known delegates) read the same result.
 */
export const ExistingSpendingLimitsProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const scope = useSafeScope()
  const isSpendingLimitEnabled = useHasFeature(FEATURES.SPENDING_LIMIT) === true
  // No `extraTokens` here, deliberately: those are derived from the limits this loads, and `tokenInfos`
  // is one of its dependencies, so feeding them back would reload every limit a second time.
  const { options } = useSpendingLimitTokenOptions()

  // The options are a new array on every balance poll, so key on the fields the loader reads (the logo is cosmetic).
  const tokenInfosKey = options
    .map((option) => `${option.address}:${option.decimals}:${option.symbol}:${option.name}`)
    .join(',')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tokenInfos = useMemo(() => options.map(toTokenInfo), [tokenInfosKey])

  const scopeKey = scope?.scopeKey
  const provider = scope?.web3ReadOnly
  const modules = scope?.safe?.modules
  const safeLoaded = scope?.safeLoaded ?? false

  const [limits, error, loading] = useAsync<SpendingLimitState[] | undefined>(
    () => {
      if (!scope || !isSpendingLimitEnabled || !provider || !safeLoaded) return
      // No modules means no AllowanceModule, so nothing to ask the chain for.
      if (!modules?.length) return Promise.resolve([])

      return import('@/features/spending-limits/public/services/spendingLimitLoader')
        .then(({ loadSpendingLimits }) =>
          loadSpendingLimits(provider, modules, scope.safeAddress, scope.chainId, tokenInfos),
        )
        .then((result) => result ?? [])
        .catch((e) => {
          logError(Errors._609, e, getRpcErrorContext(provider))
          throw e
        })
    },
    // Keyed on the module count, as the Safe-level loader is: the SafeState poll returns a fresh array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeKey, isSpendingLimitEnabled, provider, safeLoaded, modules?.length, tokenInfos],
  )

  const value = useMemo<ExistingSpendingLimits>(() => ({ limits, loading, error }), [limits, loading, error])

  return <ExistingSpendingLimitsContext.Provider value={value}>{children}</ExistingSpendingLimitsContext.Provider>
}
