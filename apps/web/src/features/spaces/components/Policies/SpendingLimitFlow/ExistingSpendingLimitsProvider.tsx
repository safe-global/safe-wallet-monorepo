import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react'
import type { Erc20Token, NativeToken } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import { useLoadFeature } from '@/features/__core__'
import { SpendingLimitsFeature, type SpendingLimitState } from '@/features/spending-limits'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { Errors, logError } from '@/services/exceptions'
import useSpendingLimitTokenOptions from './hooks/useSpendingLimitTokenOptions'
import type { TokenOption } from './utils/tokenOptions'

export type ExistingSpendingLimits = {
  /** Undefined until loaded for the selected Safe, or while no Safe is selected. */
  limits?: SpendingLimitState[]
  loading: boolean
  error?: Error
}

const NOTHING_KNOWN: ExistingSpendingLimits = { loading: false }

const ExistingSpendingLimitsContext = createContext<ExistingSpendingLimits>(NOTHING_KNOWN)

/** Outside the provider (stories, Safe-level) nothing is known, so nothing is excluded. */
export const useExistingSpendingLimits = (): ExistingSpendingLimits => useContext(ExistingSpendingLimitsContext)

/** The loader names tokens from this list first; anything missing costs an on-chain lookup. */
const toTokenInfo = (option: TokenOption): Erc20Token | NativeToken => {
  const info = {
    address: option.address,
    decimals: option.decimals,
    symbol: option.symbol,
    name: option.name,
    logoUri: option.logoUri ?? '',
  }
  return sameAddress(option.address, ZERO_ADDRESS) ? { ...info, type: 'NATIVE_TOKEN' } : { ...info, type: 'ERC20' }
}

/**
 * The selected Safe's current spending limits, loaded once per Safe. Lives above `TxFlow` so the Create
 * step (hide existing pairs) and the Review step (skip known delegates) read the same result.
 */
export const ExistingSpendingLimitsProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const scope = useSafeScope()
  const { loadSpendingLimits, $isReady } = useLoadFeature(SpendingLimitsFeature)
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
      if (!scope || !$isReady || !provider || !safeLoaded) return
      // No modules means no AllowanceModule, so nothing to ask the chain for.
      if (!modules?.length) return Promise.resolve([])

      return loadSpendingLimits(provider, modules, scope.safeAddress, scope.chainId, tokenInfos)
        .then((result) => result ?? [])
        .catch((e) => {
          logError(Errors._609, e, getRpcErrorContext(provider))
          throw e
        })
    },
    // Keyed on the module count, as the Safe-level loader is: the SafeState poll returns a fresh array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeKey, $isReady, provider, safeLoaded, modules?.length, tokenInfos],
  )

  const value = useMemo<ExistingSpendingLimits>(() => ({ limits, loading, error }), [limits, loading, error])

  return <ExistingSpendingLimitsContext.Provider value={value}>{children}</ExistingSpendingLimitsContext.Provider>
}
