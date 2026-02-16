import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
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

interface CurrentSafeFields {
  currentSafeId: string | null
  currentSafeName: string
  currentSafeDisplayAddress: string
}

const getCurrentSafeId = (safeAddress: string, chainId: string): string | null =>
  safeAddress && chainId ? `${chainId}:${safeAddress}` : null

const getCurrentSafeName = (safeAddress: string, addressBook: Record<string, string>, safe: ExtendedSafeInfo): string =>
  addressBook[safeAddress] ?? safe.address.name ?? (safeAddress ? shortenAddress(safeAddress) : '')

const getCurrentSafeDisplayAddress = (safeAddress: string): string => (safeAddress ? shortenAddress(safeAddress) : '')

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

  const { currentSafeId, currentSafeName, currentSafeDisplayAddress } = useMemo<CurrentSafeFields>(
    () => ({
      currentSafeId: getCurrentSafeId(safeAddress, chainId),
      currentSafeName: getCurrentSafeName(safeAddress, addressBook, safe),
      currentSafeDisplayAddress: getCurrentSafeDisplayAddress(safeAddress),
    }),
    [safeAddress, chainId, addressBook, safe],
  )

  const [selectedChainId, setSelectedChainId] = useState<string>(chainId)
  const [localSelectedSafeId, setLocalSelectedSafeId] = useState<string | undefined>(
    selectedSafeId ?? safes[0]?.id ?? currentSafeId ?? undefined,
  )

  useEffect(() => setSelectedChainId(chainId), [chainId])

  useEffect(() => {
    if (selectedSafeId !== undefined) setLocalSelectedSafeId(selectedSafeId)
    else if (localSelectedSafeId === undefined) {
      setLocalSelectedSafeId(safes[0]?.id ?? currentSafeId ?? undefined)
    }
  }, [selectedSafeId, safes, currentSafeId, localSelectedSafeId])

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
