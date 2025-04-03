import { useIsMultichainSafe } from '../../hooks/useIsMultichainSafe'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppSelector } from '@/store'
import { selectCurrency, selectUndeployedSafes, useGetMultipleSafeOverviewsQuery } from '@/store/slices'
import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'
import { getDeviatingSetups, getSafeSetups } from '@/features/multichain/utils/utils'
import { Box, Typography } from '@mui/material'
import ChainIndicator from '@/components/common/ChainIndicator'

const ChainIndicatorList = ({ chainIds }: { chainIds: string[] }) => {
  const { configs } = useChains()

  return (
    <>
      {chainIds.map((chainId, index) => {
        const chain = configs.find((chain) => chain.chainId === chainId)
        return (
          <Box key={chainId} display="inline-flex" flexWrap="wrap" position="relative" top={5}>
            <ChainIndicator key={chainId} chainId={chainId} showUnknown={false} onlyLogo={true} />
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

  return (
    <ErrorMessage level="warning" title="Signers are not consistent">
      <Typography display="inline" mr={1}>
        Signers are different on these networks of this account:
      </Typography>
      <ChainIndicatorList chainIds={deviatingChainIds} />
      <Typography display="inline">
        To manage your account easier and to prevent lose of funds, we recommend keeping the same signers.
      </Typography>
    </ErrorMessage>
  )
}
