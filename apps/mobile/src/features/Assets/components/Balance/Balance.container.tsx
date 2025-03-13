import { SafeOverviewResult } from '@safe-global/store/gateway/types'
import { POLLING_INTERVAL } from '@/src/config/constants'
import { getChainsByIds, selectAllChains, selectChainById } from '@/src/store/chains'
import { Balance } from './Balance'
import { makeSafeId } from '@/src/utils/formatters'
import { RootState } from '@/src/store'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { useAppSelector } from '@/src/store/hooks'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import React from 'react'
import { useSelector } from 'react-redux'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export function BalanceContainer() {
  const chains = useAppSelector(selectAllChains)
  const activeSafe = useDefinedActiveSafe()
  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
  const activeSafeChains = useAppSelector((state: RootState) => getChainsByIds(state, activeSafeInfo.chains))
  const { data, isLoading } = useSafesGetOverviewForManyQuery<SafeOverviewResult>(
    {
      safes: chains.map((chain) => makeSafeId(chain.chainId, activeSafe.address)),
      currency: 'usd',
      trusted: true,
      excludeSpam: true,
    },
    {
      pollingInterval: POLLING_INTERVAL,
      skip: chains.length === 0,
    },
  )
  const activeChain = useSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const balance = data?.find((chain) => chain.chainId === activeSafe.chainId)

  return (
    <Balance
      chainName={activeChain?.chainName}
      chains={activeSafeChains}
      isLoading={isLoading}
      activeChainId={activeSafe.chainId}
      balanceAmount={balance?.fiatTotal || ''}
    />
  )
}
