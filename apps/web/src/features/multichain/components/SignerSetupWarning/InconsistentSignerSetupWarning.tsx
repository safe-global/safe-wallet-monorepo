import { useIsMultichainSafe } from '../../hooks/useIsMultichainSafe'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import { ActionCard } from '@/components/common/ActionCard'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppSelector } from '@/store'
import { selectCurrency, selectUndeployedSafes, useGetMultipleSafeOverviewsQuery } from '@/store/slices'
import { useAllSafesGrouped } from '@/hooks/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'
import { getDeviatingSetups, getSafeSetups } from '../../utils'
import { Typography, Box } from '@mui/material'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import ChainIndicator from '@/components/common/ChainIndicator'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'

/**
 * ChainIndicatorList component displays a list of chains with their logos and names
 * Used in address book and other contexts where chain visualization is needed
 */
export const ChainIndicatorList = ({ chainIds }: { chainIds: string[] }) => {
  const { configs } = useChains()

  return (
    <>
      {chainIds.map((chainId, index) => {
        const chain = configs.find((chain) => chain.chainId === chainId)
        return (
          <Box key={chainId} display="inline-flex" flexWrap="wrap" position="relative" top={5}>
            <ChainIndicator responsive key={chainId} chainId={chainId} showUnknown={false} onlyLogo={true} />
            <Typography position="relative" mx={0.5} top={2}>
              {chain && chain.chainName}
              {index === chainIds.length - 1 ? '.' : ','}
            </Typography>
          </Box>
        )
      })}
    </>
  )
}

export const InconsistentSignerSetupWarning = () => {
  const router = useRouter()
  const isMultichainSafe = useIsMultichainSafe()
  const safeAddress = useSafeAddress()
  const currentChain = useCurrentChain()
  const currency = useAppSelector(selectCurrency)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { allMultiChainSafes } = useAllSafesGrouped()

  const multiChainGroupSafes = useMemo(
    () => allMultiChainSafes?.find((account) => sameAddress(safeAddress, account.safes[0].address))?.safes ?? [],
    [allMultiChainSafes, safeAddress],
  )
  const deployedSafes = useMemo(
    () => multiChainGroupSafes.filter((safe) => undeployedSafes[safe.chainId]?.[safe.address] === undefined),
    [multiChainGroupSafes, undeployedSafes],
  )
  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery({ safes: deployedSafes, currency })

  const safeSetups = useMemo(
    () => getSafeSetups(multiChainGroupSafes, safeOverviews ?? [], undeployedSafes),
    [multiChainGroupSafes, safeOverviews, undeployedSafes],
  )
  const deviatingSetups = getDeviatingSetups(safeSetups, currentChain?.chainId)
  const deviatingChainIds = deviatingSetups.map((setup) => setup?.chainId)

  if (!isMultichainSafe || !deviatingChainIds.length) return

  const handleReviewSigners = () => {
    router.push({
      pathname: AppRoutes.settings.setup,
      query: { safe: router.query.safe },
    })
  }

  return (
    <ActionCard
      severity="warning"
      title="Different signers across chains "
      content="can break approvals and risk losing control of this Safe."
      action={{ label: 'Review signers', onClick: handleReviewSigners }}
      trackingEvent={ATTENTION_PANEL_EVENTS.REVIEW_SIGNERS}
    />
  )
}
