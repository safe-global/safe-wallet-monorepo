import { useCallback, type MouseEvent, type PointerEvent } from 'react'
import { useRouter } from 'next/router'
import type { EntityState } from '@reduxjs/toolkit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useGetHref } from '@/hooks/safes/useGetHref'
import { parseSafeId } from '../utils'

interface UseSafeSelectorNavigationParams {
  safeAddress: string
  chainsData: EntityState<Chain, string> | undefined
  onChainChange?: (chainId: string) => void
  onSafeChange?: (safeId: string) => void
  setSelectedChainId: (chainId: string) => void
  setLocalSelectedSafeId: (safeId: string | undefined) => void
}

export const useSafeSelectorNavigation = ({
  safeAddress,
  chainsData,
  onChainChange,
  onSafeChange,
  setSelectedChainId,
  setLocalSelectedSafeId,
}: UseSafeSelectorNavigationParams) => {
  const router = useRouter()
  const getHref = useGetHref(router)

  const handleChainSelect = useCallback(
    (newSelectedChainId: string, e?: PointerEvent | MouseEvent) => {
      e?.preventDefault()
      e?.stopPropagation()

      setSelectedChainId(newSelectedChainId)
      onChainChange?.(newSelectedChainId)

      const selectedChain = chainsData?.entities?.[newSelectedChainId]
      if (selectedChain && safeAddress) {
        const route = getHref(selectedChain, safeAddress)
        queueMicrotask(() => {
          router.push(route)
        })
      }
    },
    [onChainChange, chainsData?.entities, getHref, router, safeAddress, setSelectedChainId],
  )

  const handleSafeChange = useCallback(
    (value: string) => {
      setLocalSelectedSafeId(value)
      onSafeChange?.(value)

      const parsed = parseSafeId(value)
      if (!parsed) return

      const { chainId: newSelectedChainId, address: selectedSafeAddress } = parsed
      setSelectedChainId(newSelectedChainId)

      const selectedChain = chainsData?.entities?.[newSelectedChainId]
      if (selectedChain && selectedSafeAddress) {
        const route = getHref(selectedChain, selectedSafeAddress)
        router.push(route)
      }
    },
    [onSafeChange, chainsData?.entities, getHref, router, setLocalSelectedSafeId, setSelectedChainId],
  )

  return {
    handleChainSelect,
    handleSafeChange,
  }
}
