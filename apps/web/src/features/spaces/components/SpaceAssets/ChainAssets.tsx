import { useEffect, useMemo, useRef, type ReactElement } from 'react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import ChainAssetsSection from '@safe-global/views/features/spaces/components/SpaceAssets/ChainAssetsSection'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useSafeAssets from '../../hooks/useSafeAssets'
import { toChainInfos } from '../../utils'
import { toAssetsSummary, toProtocolRows, toTokenRows, type ChainAssetsReport } from './utils'

type ChainAssetsProps = {
  chainId: string
  address: string
  /** Waits for its turn to load */
  skip: boolean
  /** Each new value retries a failed load */
  retryKey: number
  onReport: (chainId: string, address: string, report: ChainAssetsReport) => void
}

const ChainAssets = ({ chainId, address, skip, retryKey, onReport }: ChainAssetsProps): ReactElement => {
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const { balances, protocols, isDeployed, isUnsupported, isLoading, isFetching, error, positionsError, refetch } =
    useSafeAssets({
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

  const summary = useMemo(
    () => (state === 'ready' || state === 'inactive' ? toAssetsSummary(balances, protocols) : undefined),
    [state, balances, protocols],
  )

  const positionsFailed = state === 'ready' && !!positionsError

  useEffect(() => {
    onReport(chainId, address, { state, summary, isPartial: positionsFailed })
  }, [onReport, chainId, address, state, summary, positionsFailed])

  const handledRetryKey = useRef(retryKey)
  useEffect(() => {
    if (handledRetryKey.current === retryKey) return
    handledRetryKey.current = retryKey
    if (state === 'error' || positionsFailed) refetch()
  }, [retryKey, state, positionsFailed, refetch])

  const tokens = useMemo(() => (balances ? toTokenRows(balances.items, currency) : []), [balances, currency])
  const protocolRows = useMemo(
    () => (protocols ? toProtocolRows(protocols, currency) : undefined),
    [protocols, currency],
  )

  return (
    <ChainAssetsSection
      chain={toChainInfos([chainId], configs)[0]}
      state={state === 'pending' ? 'loading' : state}
      total={state === 'ready' && summary ? formatCurrency(summary.tokens + summary.positions, currency) : undefined}
      tokens={tokens}
      protocols={protocolRows}
      positionsFailed={positionsFailed}
      onRetry={refetch}
      isRetrying={isFetching}
    />
  )
}

export default ChainAssets
