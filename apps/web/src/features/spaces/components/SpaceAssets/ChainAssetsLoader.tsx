import { useEffect, useMemo, useRef } from 'react'
import useSafeAssets from '../../hooks/useSafeAssets'
import { toHoldings, type ChainAssetsReport } from './utils'

type ChainAssetsLoaderProps = {
  chainId: string
  address: string
  /** Waits for its turn to load */
  skip: boolean
  /** Each new value retries a failed load */
  retryKey: number
  onReport: (chainId: string, address: string, report: ChainAssetsReport) => void
}

/** Loads one Safe on one network and reports its holdings; the page groups them, so it renders nothing */
const ChainAssetsLoader = ({ chainId, address, skip, retryKey, onReport }: ChainAssetsLoaderProps): null => {
  const { balances, protocols, isDeployed, isUnsupported, isLoading, error, positionsError, refetch } = useSafeAssets({
    chainId,
    address,
    skip,
  })

  const state: ChainAssetsReport['state'] = skip
    ? 'pending'
    : isUnsupported
      ? 'unsupported'
      : !isDeployed
        ? 'inactive'
        : balances && !isLoading
          ? 'ready'
          : error
            ? 'error'
            : 'loading'

  const holdings = useMemo(
    () => (state === 'ready' ? toHoldings(address, chainId, balances, protocols) : undefined),
    [state, address, chainId, balances, protocols],
  )
  const positionsFailed = state === 'ready' && !!positionsError

  useEffect(() => {
    onReport(chainId, address, { state, holdings, isPartial: positionsFailed })
  }, [onReport, chainId, address, state, holdings, positionsFailed])

  const handledRetryKey = useRef(retryKey)
  useEffect(() => {
    if (handledRetryKey.current === retryKey) return
    handledRetryKey.current = retryKey
    if (state === 'error' || positionsFailed) refetch()
  }, [retryKey, state, positionsFailed, refetch])

  return null
}

export default ChainAssetsLoader
