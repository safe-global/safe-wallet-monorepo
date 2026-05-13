import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import React, { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectAllChains, selectChainById } from '@/src/store/chains'
import { switchActiveChain } from '@/src/store/activeSafeSlice'
import { ChainItems } from '../Assets/components/Balance/ChainItems'
import { POLLING_INTERVAL } from '@/src/config/constants'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { shouldDisplayPreciseBalance } from '@/src/utils/balance'
import { selectCurrency } from '@/src/store/settingsSlice'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { useSafeKnownChainsOverview } from '@/src/hooks/services/useSafeKnownChainsOverview'
import { useScanForNewNetworks } from './hooks/useScanForNewNetworks'
import { NetworksSheetFooter } from './NetworksSheetFooter'

export const NetworksSheetContainer = () => {
  const dispatch = useAppDispatch()
  const chains = useAppSelector(selectAllChains)
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const currency = useAppSelector(selectCurrency)
  const safeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))

  // Polling refreshes balances for chains the safe is already known to be on.
  // Discovery of new chain deployments happens via the explicit "Scan for new networks"
  // action in the footer — never as an implicit side effect of opening this sheet.
  useSafeKnownChainsOverview(activeSafe.address, { pollingInterval: POLLING_INTERVAL })

  const items = useMemo(() => Object.values(safeInfo ?? {}), [safeInfo])

  const { scan, phase, lastResult, errorMessage, isPressable } = useScanForNewNetworks(activeSafe.address)
  const newChainIdSet = useMemo(() => new Set(lastResult?.newChainIds ?? []), [lastResult])

  const handleChainChange = (chainId: string) => {
    dispatch(switchActiveChain({ chainId }))
  }

  const FooterComponent = useCallback(
    function NetworksSheetFooterSlot() {
      return (
        <NetworksSheetFooter
          phase={phase}
          lastResult={lastResult}
          errorMessage={errorMessage}
          isPressable={isPressable}
          onScan={scan}
          chains={chains}
        />
      )
    },
    [phase, lastResult, errorMessage, isPressable, scan, chains],
  )

  return (
    <SafeBottomSheet
      title="Select network"
      items={items}
      keyExtractor={({ item }) => item.chainId}
      FooterComponent={FooterComponent}
      renderItem={({ item, onClose }) => (
        <ChainItems
          onSelect={(chainId: string) => {
            handleChainChange(chainId)
            onClose()
          }}
          activeChain={activeChain}
          fiatTotal={
            shouldDisplayPreciseBalance(item.fiatTotal, 8)
              ? formatCurrencyPrecise(item.fiatTotal, currency)
              : formatCurrency(item.fiatTotal, currency)
          }
          chains={chains}
          chainId={item.chainId}
          isNewlyDiscovered={newChainIdSet.has(item.chainId)}
          key={item.chainId}
        />
      )}
    />
  )
}
