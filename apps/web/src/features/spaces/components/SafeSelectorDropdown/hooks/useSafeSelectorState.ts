import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectAddressBookByChain } from '@/store/addressBookSlice'
import { useGetChainsConfigQuery } from '@safe-global/store/gateway'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'
import { shortenAddress } from '../utils'
import type { SafeSelectorDropdownProps } from '../types'
import { useSafeSelectorNavigation } from './useSafeSelectorNavigation'
import { useSafeSelectorDisplay } from './useSafeSelectorDisplay'
import { useSafeItemTransform } from './useSafeItemTransform'

export type { SafeItemData } from './useSafeItemTransform'

export const useSafeSelectorState = ({
  safes,
  selectedSafeId,
  onSafeChange,
  onChainChange,
}: Pick<SafeSelectorDropdownProps, 'safes' | 'selectedSafeId' | 'onSafeChange' | 'onChainChange'>) => {
  const { data: chainsData } = useGetChainsConfigQuery()
  const { safeAddress, safe } = useSafeInfo()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const addressBook = useAppSelector((state) => selectAddressBookByChain(state, chainId))
  const { balances, loading: balancesLoading } = useBalances()

  const currentSafeId = safeAddress && chainId ? `${chainId}:${safeAddress}` : null
  const safeNameFromBook = safeAddress ? addressBook?.[safeAddress] : undefined
  const currentSafeName = safeNameFromBook ?? safe.address.name ?? (safeAddress ? shortenAddress(safeAddress) : '')
  const currentSafeDisplayAddress = safeAddress ? shortenAddress(safeAddress) : ''

  const [selectedChainId, setSelectedChainId] = useState<string>(chainId)
  const [localSelectedSafeId, setLocalSelectedSafeId] = useState<string | undefined>(
    selectedSafeId ?? safes[0]?.id ?? currentSafeId ?? undefined,
  )

  useEffect(() => {
    setSelectedChainId(chainId)
  }, [chainId])

  useEffect(() => {
    if (selectedSafeId !== undefined) {
      setLocalSelectedSafeId(selectedSafeId)
    }
  }, [selectedSafeId])

  useEffect(() => {
    if (localSelectedSafeId === undefined) {
      setLocalSelectedSafeId(safes[0]?.id ?? currentSafeId ?? undefined)
    }
  }, [safes, currentSafeId, localSelectedSafeId])

  const { displayInfo, selectValue, showTrigger, isSingleSafe, selectedSafe, isCurrentSafeSelected } =
    useSafeSelectorDisplay({
      safes,
      currentSafeId,
      localSelectedSafeId,
      currentSafeName,
      currentSafeDisplayAddress,
      safe,
    })

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const handleOpenChange = useCallback(
    (next: boolean) => {
      setDropdownOpen(isSingleSafe ? false : next)
    },
    [isSingleSafe],
  )

  const { handleChainSelect, handleSafeChange } = useSafeSelectorNavigation({
    safeAddress,
    chainsData,
    onChainChange,
    onSafeChange,
    setSelectedChainId,
    setLocalSelectedSafeId,
  })

  const allChainsFromConfig = useMemo(
    () =>
      chainsData?.ids.map((id) => {
        const chain = chainsData.entities[id]
        return {
          chainId: id,
          chainName: chain.chainName ?? chain.shortName ?? id,
          chainLogoUri: chain.chainLogoUri ?? undefined,
        }
      }) ?? [],
    [chainsData],
  )

  const chainsToShow = isCurrentSafeSelected ? allChainsFromConfig : (selectedSafe?.chains ?? [])

  const { getSafeItemData } = useSafeItemTransform({
    currentSafeId,
    currentSafeName,
    currentSafeDisplayAddress,
    safe,
    chain,
    chainId,
    balances,
    balancesLoading,
  })

  return {
    displayInfo,
    selectValue,
    showTrigger,
    isSingleSafe,
    dropdownOpen,
    handleOpenChange,
    handleChainSelect,
    handleSafeChange,
    selectedChainId,
    chainsToShow,
    getSafeItemData,
    currentSafeId,
    currentSafeName,
    currentSafeDisplayAddress,
    selectedSafe,
    balances,
    balancesLoading,
    safe,
    chain,
    chainId,
  }
}
