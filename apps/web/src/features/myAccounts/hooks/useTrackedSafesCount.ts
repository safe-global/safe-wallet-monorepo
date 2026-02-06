import { AppRoutes } from '@/config/routes'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { type SafeItem, type MultiChainSafeItem, type AllSafeItemsGrouped, isMultiChainSafeItem } from '@/hooks/safes'

let isOwnedSafesTracked = false
let isPinnedSafesTracked = false

const useTrackSafesCount = (safes: AllSafeItemsGrouped, wallet: ConnectedWallet | null) => {
  const router = useRouter()
  const isLoginPage = router.pathname === AppRoutes.welcome.accounts

  const ownedMultiChainSafes = useMemo(
    () => safes.allMultiChainSafes?.filter((account) => account.safes.some(({ isReadOnly }) => !isReadOnly)),
    [safes],
  )

  const ownedSafes = useMemo<(MultiChainSafeItem | SafeItem)[]>(
    () => [...(ownedMultiChainSafes ?? []), ...(safes.allSingleSafes?.filter(({ isReadOnly }) => !isReadOnly) ?? [])],
    [safes, ownedMultiChainSafes],
  )

  // TODO: This is computed here and inside PinnedSafes now. Find a way to optimize it
  const pinnedSafes = useMemo<(MultiChainSafeItem | SafeItem)[]>(
    () => [
      ...(safes.allSingleSafes?.filter(({ isPinned }) => isPinned) ?? []),
      ...(safes.allMultiChainSafes?.filter(({ isPinned }) => isPinned) ?? []),
    ],
    [safes],
  )

  // Reset tracking for new wallet
  useEffect(() => {
    isOwnedSafesTracked = false
  }, [wallet?.address])

  useEffect(() => {
    const totalSafesOwned = ownedSafes?.reduce(
      (prev, current) => prev + (isMultiChainSafeItem(current) ? current.safes.length : 1),
      0,
    )
    if (wallet && !isOwnedSafesTracked && ownedSafes && ownedSafes.length > 0 && isLoginPage) {
      trackEvent({ ...OVERVIEW_EVENTS.TOTAL_SAFES_OWNED, label: totalSafesOwned })
      isOwnedSafesTracked = true
    }
  }, [isLoginPage, ownedSafes, wallet])

  useEffect(() => {
    const totalSafesPinned = pinnedSafes?.reduce(
      (prev, current) => prev + (isMultiChainSafeItem(current) ? current.safes.length : 1),
      0,
    )
    if (!isPinnedSafesTracked && pinnedSafes && pinnedSafes.length > 0 && isLoginPage) {
      trackEvent({ ...OVERVIEW_EVENTS.TOTAL_SAFES_PINNED, label: totalSafesPinned })
      isPinnedSafesTracked = true
    }
  }, [isLoginPage, pinnedSafes])
}

export default useTrackSafesCount
