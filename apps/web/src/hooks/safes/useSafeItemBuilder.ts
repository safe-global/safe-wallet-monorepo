import { useCallback } from 'react'
import type { AllOwnedSafes } from '@safe-global/store/gateway/types'

const EMPTY_OWNED: AllOwnedSafes = {}
import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks, selectAllVisitedSafes, selectUndeployedSafes } from '@/store/slices'
import useWallet from '@/hooks/wallets/useWallet'
import useAllOwnedSafes from './useAllOwnedSafes'
import { _buildSafeItem, type SafeItem } from './useAllSafes'

export type SafeItemBuilder = (chainId: string, address: string) => SafeItem

export interface UseSafeItemBuilderResult {
  buildSafeItem: SafeItemBuilder
  walletAddress: string
  isWalletConnected: boolean
  allOwned: AllOwnedSafes
  ownedError: ReturnType<typeof useAllOwnedSafes>[1]
  ownedLoading: ReturnType<typeof useAllOwnedSafes>[2]
}

/**
 * Aggregates the wallet, owners query, and the four Redux slices that
 * `_buildSafeItem` requires, and returns a memoized `(chainId, address) => SafeItem`
 * builder. Keeps consumers from re-deriving the same 8-arg call.
 */
const useSafeItemBuilder = (): UseSafeItemBuilderResult => {
  const wallet = useWallet()
  const walletAddress = wallet?.address ?? ''
  const isWalletConnected = walletAddress !== ''

  const [allOwned, ownedError, ownedLoading] = useAllOwnedSafes(walletAddress)
  const allAdded = useAppSelector(selectAllAddedSafes)
  const allUndeployed = useAppSelector(selectUndeployedSafes)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const allSafeNames = useAppSelector(selectAllAddressBooks)

  const ownedSafes = allOwned ?? EMPTY_OWNED

  const buildSafeItem = useCallback<SafeItemBuilder>(
    (chainId, address) =>
      _buildSafeItem(
        chainId,
        address,
        walletAddress,
        allAdded,
        ownedSafes,
        allUndeployed,
        allVisitedSafes,
        allSafeNames,
      ),
    [walletAddress, allAdded, ownedSafes, allUndeployed, allVisitedSafes, allSafeNames],
  )

  return {
    buildSafeItem,
    walletAddress,
    isWalletConnected,
    allOwned: ownedSafes,
    ownedError,
    ownedLoading,
  }
}

export default useSafeItemBuilder
