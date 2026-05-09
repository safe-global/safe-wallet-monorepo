import { useCallback, useState } from 'react'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useAppDispatch } from '@/store'
import { setHiddenTokensForChain } from '@/store/settingsSlice'

export const useHideAssets = (closeDialog: () => void) => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { balances } = useBalances()

  const [assetsToHide, setAssetsToHide] = useState<string[]>([])
  const [assetsToUnhide, setAssetsToUnhide] = useState<string[]>([])
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

  const saveChanges = useCallback(() => {
    const newHiddenAssets = [...hiddenAssets.filter((asset) => !assetsToUnhide.includes(asset)), ...assetsToHide]
    dispatch(setHiddenTokensForChain({ chainId, assets: newHiddenAssets }))
    cancel()
  }, [assetsToHide, assetsToUnhide, chainId, dispatch, hiddenAssets, cancel])

  return {
    saveChanges,
    cancel,
    toggleAsset,
    isAssetSelected,
    deselectAll,
  }
}

export const useVisibleAssets = () => {
  const { balances } = useVisibleBalances()
  return balances.items
}
