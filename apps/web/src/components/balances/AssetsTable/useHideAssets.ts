import { useCallback, useMemo, useState } from 'react'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import { useAppDispatch } from '@/store'
import { setHiddenTokensForChain } from '@/store/settingsSlice'

// This is the default for MUI Collapse
export const COLLAPSE_TIMEOUT_MS = 300

export const useHideAssets = (closeDialog: () => void) => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { balances } = useBalances()

  const [assetsToHide, setAssetsToHide] = useState<string[]>([])
  const [assetsToUnhide, setAssetsToUnhide] = useState<string[]>([])
  const [hidingAsset, setHidingAsset] = useState<string>()
  const hiddenAssets = useHiddenTokens()

  const toggleAsset = useCallback(
    (address: string) => {
      if (assetsToHide.includes(address)) {
        setAssetsToHide(assetsToHide.filter((asset) => asset !== address))
        return
      }

      if (assetsToUnhide.includes(address)) {
        setAssetsToUnhide(assetsToUnhide.filter((asset) => asset !== address))
        return
      }

      const assetIsHidden = hiddenAssets.includes(address)
      if (!assetIsHidden) {
        setAssetsToHide(assetsToHide.concat(address))
      } else {
        setAssetsToUnhide(assetsToUnhide.concat(address))
      }
    },
    [assetsToHide, assetsToUnhide, hiddenAssets],
  )

  /**
   * Unhide all assets which are included in the current Safe's balance.
   */
  const deselectAll = useCallback(() => {
    setAssetsToHide([])
    setAssetsToUnhide([
      ...hiddenAssets.filter((asset) => balances.items.some((item) => item.tokenInfo.address === asset)),
    ])
  }, [hiddenAssets, balances])

  // Assets are selected if they are either hidden or marked for hiding
  const isAssetSelected = useCallback(
    (address: string) =>
      (hiddenAssets.includes(address) && !assetsToUnhide.includes(address)) || assetsToHide.includes(address),
    [assetsToHide, assetsToUnhide, hiddenAssets],
  )

  const cancel = useCallback(() => {
    setAssetsToHide([])
    setAssetsToUnhide([])
    closeDialog()
  }, [closeDialog])

  const hideAsset = useCallback(
    (address: string) => {
      setHidingAsset(address)
      setTimeout(() => {
        const newHiddenAssets = [...hiddenAssets, address]
        dispatch(setHiddenTokensForChain({ chainId, assets: newHiddenAssets }))
        setHidingAsset(undefined)
      }, COLLAPSE_TIMEOUT_MS)
    },
    [chainId, dispatch, hiddenAssets],
  )

  const saveChanges = useCallback(() => {
    const newHiddenAssets = [...hiddenAssets.filter((asset) => !assetsToUnhide.includes(asset)), ...assetsToHide]
    dispatch(setHiddenTokensForChain({ chainId, assets: newHiddenAssets }))
    cancel()
  }, [assetsToHide, assetsToUnhide, chainId, dispatch, hiddenAssets, cancel])

  return {
    hideAsset,
    saveChanges,
    cancel,
    toggleAsset,
    isAssetSelected,
    deselectAll,
    hidingAsset,
  }
}

export const useVisibleAssets = () => {
  const hiddenAssets = useHiddenTokens()
  const { balances } = useBalances()
  return useMemo(
    () => balances.items?.filter((item) => !hiddenAssets.includes(item.tokenInfo.address)),
    [hiddenAssets, balances.items],
  )
}
