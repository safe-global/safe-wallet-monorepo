import { useCallback, type MouseEvent, type PointerEvent } from 'react'
import { useRouter } from 'next/router'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useGetHref } from '@/hooks/safes/useGetHref'
import { parseSafeId } from '../utils'

interface UseSafeSelectorNavigationParams {
  safeAddress: string
  chainByChainId: Record<string, Chain>
  onChainChange?: (chainId: string) => void
  onSafeChange?: (safeId: string) => void
  setSelectedChainId: (chainId: string) => void
  setLocalSelectedSafeId: (safeId: string | undefined) => void
}

export const useSafeSelectorNavigation = ({
  safeAddress,
  chainByChainId,
  onChainChange,
  onSafeChange,
  setSelectedChainId,
  setLocalSelectedSafeId,
}: UseSafeSelectorNavigationParams) => {
  const router = useRouter()
  const getHref = useGetHref(router)

  const navigateToSafe = useCallback(
    (chainId: string, address: string) => {
      const selectedChain = chainByChainId[chainId]
      if (!selectedChain || !address) return
      const route = getHref(selectedChain, address)
      queueMicrotask(() => router.push(route))
    },
    [chainByChainId, getHref, router],
  )

  const handleChainSelect = useCallback(
    (newSelectedChainId: string, e?: PointerEvent | MouseEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      setSelectedChainId(newSelectedChainId)
      onChainChange?.(newSelectedChainId)
      navigateToSafe(newSelectedChainId, safeAddress)
    },
    [onChainChange, navigateToSafe, safeAddress, setSelectedChainId],
  )

  const handleSafeChange = useCallback(
    (value: string) => {
      setLocalSelectedSafeId(value)
      onSafeChange?.(value)
      const parsed = parseSafeId(value)
      if (!parsed) return
      setSelectedChainId(parsed.chainId)
      navigateToSafe(parsed.chainId, parsed.address)
    },
    [onSafeChange, navigateToSafe, setLocalSelectedSafeId, setSelectedChainId],
  )

  return {
    handleChainSelect,
    handleSafeChange,
  }
}
