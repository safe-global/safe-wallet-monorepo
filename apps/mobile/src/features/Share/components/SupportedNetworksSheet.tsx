import React from 'react'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectSafeChains } from '@/src/store/safesSlice'
import { getChainsByIds } from '@/src/store/chains'
import { SupportedNetworksList } from './SupportedNetworksList'

export const SupportedNetworksSheet = () => {
  const activeSafe = useDefinedActiveSafe()
  const chainIds = useAppSelector((state: RootState) => selectSafeChains(state, activeSafe.address))
  const chains = useAppSelector((state: RootState) => getChainsByIds(state, chainIds))

  return (
    <SafeBottomSheet title="Supported networks">
      <SupportedNetworksList chains={chains} />
    </SafeBottomSheet>
  )
}
