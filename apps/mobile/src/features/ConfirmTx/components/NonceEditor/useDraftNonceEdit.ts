import { useCallback, useRef, useState } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useAppDispatch } from '@/src/store/hooks'
import { showToast } from '@/src/store/toastSlice'
import type { DraftTx } from '@/src/store/draftTxSlice'
import { redirectDraft } from '@/src/services/tx/draft'
import { rebuildDraftWithNonce } from '@/src/services/tx/rebuildDraftWithNonce'
import { useNonce } from '@/src/features/Send/hooks/useNonce'
import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'
import Logger from '@/src/utils/logger'

/** Picking a different nonce rebuilds the draft under its new safeTxHash; the screen follows the redirect */
export function useDraftNonceEdit(draft: DraftTx) {
  const dispatch = useAppDispatch()
  const nonceSheetRef = useRef<BottomSheetModal>(null)
  const [showCustomNonceModal, setShowCustomNonceModal] = useState(false)
  const [isRebuilding, setIsRebuilding] = useState(false)

  const { recommendedNonce, currentNonce, queuedNonces, fetchMore, isFetchingMore } = useNonce(
    draft.chainId,
    draft.safeAddress,
  )

  const draftNonce =
    typeof draft.buildParams.nonce === 'number' ? draft.buildParams.nonce : Number(draft.buildParams.nonce ?? 0)

  const applyNonce = useCallback(
    async (nonce: number) => {
      if (nonce === draftNonce) {
        return
      }
      setIsRebuilding(true)
      try {
        const executionInfo = draft.txDetails.detailedExecutionInfo
        if (!isMultisigDetailedExecutionInfo(executionInfo)) {
          throw new Error('Draft transaction has no multisig execution info')
        }
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
    [draft, draftNonce, dispatch],
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

  const handleAddCustomNonce = useCallback(() => {
    nonceSheetRef.current?.dismiss()
    // Let the sheet's dismiss animation finish before the modal takes over
    setTimeout(() => setShowCustomNonceModal(true), 300)
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
