import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import React from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectAllChains, selectChainById } from '@/src/store/chains'
import { switchActiveChain } from '@/src/store/activeSafeSlice'
import { ChainItems } from '../Assets/components/Balance/ChainItems'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { SafeOverviewResult } from '@safe-global/store/gateway/types'
import { makeSafeId } from '@/src/utils/formatters'
import { POLLING_INTERVAL } from '@/src/config/constants'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { shouldDisplayPreciseBalance } from '@/src/utils/balance'

export const NetworksSheetContainer = () => {
  const dispatch = useAppDispatch()
  const chains = useAppSelector(selectAllChains)
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { data } = useSafesGetOverviewForManyQuery<SafeOverviewResult>(
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

  const handleChainChange = (chainId: string) => {
    dispatch(switchActiveChain({ chainId }))
  }

  return (
    <SafeBottomSheet
      title="Select network"
      items={data}
      keyExtractor={({ item }) => item.chainId}
      renderItem={({ item, onClose }) => (
        <ChainItems
          onSelect={(chainId: string) => {
            handleChainChange(chainId)
            onClose()
          }}
          activeChain={activeChain}
          fiatTotal={
            shouldDisplayPreciseBalance(item.fiatTotal, 8)
              ? formatCurrencyPrecise(item.fiatTotal, 'usd')
              : formatCurrency(item.fiatTotal, 'usd')
          }
          chains={chains}
          chainId={item.chainId}
          key={item.chainId}
        />
      )}
    />
  )
}
