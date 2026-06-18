import { useMemo, useState, type ReactElement } from 'react'
import dynamic from 'next/dynamic'
import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import { skipToken } from '@reduxjs/toolkit/query'
import { useSpacesGetNestedSafesGraphV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useSpaceSafes } from '@/features/spaces'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import ChainSelector, { type ChainOption } from './ChainSelector'

const GraphCanvas = dynamic(() => import('./GraphCanvas'), { ssr: false })

function NestedSafesGraph(): ReactElement {
  const spaceId = useCurrentSpaceId()
  const currentChain = useCurrentChain()
  const { configs } = useChains()
  const { allSafes } = useSpaceSafes()
  const currency = useAppSelector(selectCurrency)
  const wallet = useWallet()

  // Chain options: only chains that have member safes, with counts.
  const chainOptions = useMemo<Array<ChainOption>>(() => {
    const counts = new Map<string, number>()
    const flat = allSafes?.flatMap((item) => ('safes' in item ? item.safes : [item])) ?? []
    for (const safe of flat) {
      counts.set(safe.chainId, (counts.get(safe.chainId) ?? 0) + 1)
    }
    return configs
      .filter((chain) => counts.has(chain.chainId))
      .map((chain) => ({ chainId: chain.chainId, chainName: chain.chainName, count: counts.get(chain.chainId) ?? 0 }))
  }, [allSafes, configs])

  const defaultChainId =
    chainOptions.find((chain) => chain.chainId === currentChain?.chainId)?.chainId ?? chainOptions[0]?.chainId ?? ''
  const [selectedChainId, setSelectedChainId] = useState<string>('')
  const chainId = selectedChainId || defaultChainId

  const { data, isLoading, isError } = useSpacesGetNestedSafesGraphV1Query(
    spaceId && chainId ? { spaceId, chainId } : skipToken,
  )

  // Enrich nodes with balances via the existing batch overviews query.
  const safeItems = useMemo(
    () =>
      (data?.nodes ?? []).map((node) => ({
        address: node.address,
        chainId,
        isReadOnly: false,
        isPinned: false,
        lastVisited: 0,
        name: undefined,
      })),
    [data?.nodes, chainId],
  )
  const { data: overviews } = useGetMultipleSafeOverviewsQuery(
    safeItems.length > 0 ? { safes: safeItems, currency, walletAddress: wallet?.address } : skipToken,
  )
  const fiatByAddress = useMemo(() => {
    const map: Record<string, string> = {}
    for (const overview of overviews ?? []) {
      map[overview.address.value.toLowerCase()] = overview.fiatTotal
    }
    return map
  }, [overviews])

  return (
    <Box display="flex" flexDirection="column" height="calc(100vh - 200px)" gap={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h2" fontWeight={700}>
          Nested safes
        </Typography>
        {chainOptions.length > 0 && (
          <ChainSelector chains={chainOptions} value={chainId} onChange={setSelectedChainId} />
        )}
      </Box>

      {data?.truncated && (
        <Alert severity="info" data-testid="graph-truncation-banner">
          {`This graph is truncated — showing the first ${data.nodes.length} Safes. Some nested Safes are not shown.`}
        </Alert>
      )}

      <Box flex="1 1 auto" minHeight={0} position="relative">
        {isLoading ? (
          <Box data-testid="graph-loading" display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error">Failed to load the nested Safes graph. Please try again.</Alert>
        ) : (
          <GraphCanvas
            apiNodes={data?.nodes ?? []}
            apiEdges={data?.edges ?? []}
            chainId={chainId}
            fiatByAddress={fiatByAddress}
          />
        )}
      </Box>
    </Box>
  )
}

export default NestedSafesGraph
