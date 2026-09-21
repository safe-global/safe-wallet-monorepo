import { useCallback, useEffect, useRef, useState } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppDispatch } from '@/src/store/hooks'
import { showToast } from '@/src/store/toastSlice'
import type { DraftTx } from '@/src/store/draftTxSlice'
import { redirectDraft } from '@/src/services/tx/draft'
import { rebuildDraftWithNonce } from '@/src/services/tx/rebuildDraftWithNonce'
import { useNonce } from '@/src/features/Send/hooks/useNonce'
import Logger from '@/src/utils/logger'

/** Picking a different nonce rebuilds the draft under its new safeTxHash; the screen follows the redirect */
export function useDraftNonceEdit(draft: DraftTx, executionInfo: MultisigExecutionDetails) {
  const dispatch = useAppDispatch()
  const nonceSheetRef = useRef<BottomSheetModal>(null)
  const [showCustomNonceModal, setShowCustomNonceModal] = useState(false)
  const [isRebuilding, setIsRebuilding] = useState(false)

  const { recommendedNonce, currentNonce, queuedNonces, fetchMore, isFetchingMore } = useNonce(
    draft.chainId,
    draft.safeAddress,
  )

  const draftNonce = executionInfo.nonce

  // Intentionally closes over the pre-rebuild draft: its safeTxHash is the redirect source key
  const applyNonce = useCallback(
    async (nonce: number) => {
      if (nonce === draftNonce) {
        return
      }
      setIsRebuilding(true)
      try {
        const safe = { owners: executionInfo.signers, threshold: executionInfo.confirmationsRequired }
        const newSafeTxHash = await rebuildDraftWithNonce({ draft, newNonce: nonce, safe, dispatch })
        redirectDraft(dispatch, draft.safeTxHash, newSafeTxHash)
      } catch (error) {
        Logger.error('rebuildDraftWithNonce failed', error)
        dispatch(showToast({ message: 'Failed to update the nonce', duration: 3000, variant: 'error' }))
      } finally {
        setIsRebuilding(false)
      }
    },
    [draft, draftNonce, executionInfo, dispatch],
  )

  const handleOpenNonceSheet = useCallback(() => {
    nonceSheetRef.current?.present()
  }, [])

  const handleSelectNonce = useCallback(
    (nonce: number) => {
      nonceSheetRef.current?.dismiss()
      void applyNonce(nonce)
    },
    [applyNonce],
  )

  const customNonceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(customNonceTimer.current), [])

  const handleAddCustomNonce = useCallback(() => {
    nonceSheetRef.current?.dismiss()
    // Let the sheet's dismiss animation finish before the modal takes over
    clearTimeout(customNonceTimer.current)
    customNonceTimer.current = setTimeout(() => setShowCustomNonceModal(true), 300)
  }, [])

  const handleSaveCustomNonce = useCallback(
    (nonce: number) => {
      setShowCustomNonceModal(false)
      void applyNonce(nonce)
    },
    [applyNonce],
  )

  const handleCancelCustomNonce = useCallback(() => setShowCustomNonceModal(false), [])

  return {
    nonceSheetRef,
    draftNonce,
    recommendedNonce,
    currentNonce,
    queuedNonces,
    fetchMore,
    isFetchingMore,
    isRebuilding,
    showCustomNonceModal,
    handleOpenNonceSheet,
    handleSelectNonce,
    handleAddCustomNonce,
    handleSaveCustomNonce,
    handleCancelCustomNonce,
  }
}
