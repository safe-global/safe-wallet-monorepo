import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useAddressBook from '@/hooks/useAddressBook'
import useChains, { useCurrentChain } from '@/hooks/useChains'
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
  const { configs } = useChains()
  const { safeAddress, safe } = useSafeInfo()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const addressBook = useAddressBook(chainId)
  const { balances, loading: balancesLoading } = useBalances()

  const currentSafeId = safeAddress && chainId ? `${chainId}:${safeAddress}` : null
  const safeNameFromBook = safeAddress ? addressBook[safeAddress] : undefined
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

  const chainByChainId = useMemo(
    () => Object.fromEntries(configs.map((c: Chain) => [c.chainId, c])) as Record<string, Chain>,
    [configs],
  )

  const { handleChainSelect, handleSafeChange } = useSafeSelectorNavigation({
    safeAddress,
    chainByChainId,
    onChainChange,
    onSafeChange,
    setSelectedChainId,
    setLocalSelectedSafeId,
  })

  const allChainsFromConfig = useMemo(
    () =>
      configs.map((chain: Chain) => ({
        chainId: chain.chainId,
        chainName: chain.chainName ?? chain.shortName ?? chain.chainId,
        chainLogoUri: chain.chainLogoUri ?? undefined,
      })),
    [configs],
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
