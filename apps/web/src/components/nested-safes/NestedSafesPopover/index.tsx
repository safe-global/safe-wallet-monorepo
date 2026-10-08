import { useContext, useState } from 'react'
import type { ReactElement } from 'react'

import {
  getIsFirstTimeCuration,
  getIsManageMode,
  getSafesToShow,
  getUncuratedCount,
} from '@views/components/nested-safes/NestedSafesPopover/utils'
import { ModalDialogTitle } from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { CreateNestedSafeFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import { NestedSafesList } from '@/components/nested-safes/NestedSafesList'
import CheckWallet from '@/components/common/CheckWallet'
import { useManageNestedSafes } from '@/components/nested-safes/NestedSafesList/useManageNestedSafes'
import { SimilarityConfirmDialog } from '@/components/nested-safes/NestedSafesList/SimilarityConfirmDialog'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import { NestedSafesPopoverView } from '@views/components/nested-safes/NestedSafesPopover/NestedSafesPopoverView'

export function NestedSafesPopover({
  anchorEl,
  onClose,
  rawNestedSafes,
  allSafesWithStatus,
  visibleSafes,
  hasCompletedCuration,
  isLoading = false,
  hideCreationButton = false,
  centered = false,
}: {
  anchorEl: HTMLElement | null
  onClose: () => void
  rawNestedSafes: string[]
  allSafesWithStatus: NestedSafeWithStatus[]
  visibleSafes: NestedSafeWithStatus[]
  hasCompletedCuration: boolean
  isLoading?: boolean
  hideCreationButton?: boolean
  centered?: boolean
}): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const [userRequestedManage, setUserRequestedManage] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const {
    toggleSafe,
    isSafeSelected,
    saveChanges,
    cancel,
    selectedCount,
    hasChanges,
    isFlagged,
    getSimilarAddresses,
    pendingConfirmation,
    confirmSimilarAddress,
    cancelSimilarAddress,
    groupedSafes,
  } = useManageNestedSafes(allSafesWithStatus)

  const isFirstTimeCuration = getIsFirstTimeCuration(hasCompletedCuration, rawNestedSafes)
  const showIntroScreen = isFirstTimeCuration && showIntro
  const isManageMode = getIsManageMode(userRequestedManage, isFirstTimeCuration, showIntro)

  const onAdd = () => {
    setTxFlow(<CreateNestedSafeFlow />)
    onClose()
  }

  const handleManageClick = () => setUserRequestedManage(true)

  const handleSave = () => {
    saveChanges()
    setUserRequestedManage(false)
  }

  const handleCancel = () => {
    cancel()
    setUserRequestedManage(false)
    onClose()
  }

  const safesToShow = getSafesToShow(isManageMode, allSafesWithStatus, visibleSafes)
  const uncuratedCount = getUncuratedCount(rawNestedSafes, visibleSafes)
  const canClose = !isManageMode

  const centeredAnchor = () => ({
    getBoundingClientRect: () => new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0),
  })

  return (
    <NestedSafesPopoverView
      open={!!anchorEl}
      onOpenChange={(open) => {
        if (!open && canClose) onClose()
      }}
      anchor={centered ? centeredAnchor : anchorEl}
      centered={centered}
      canClose={canClose}
      onClose={onClose}
      isManageMode={isManageMode}
      isFirstTimeCuration={isFirstTimeCuration}
      showIntroScreen={showIntroScreen}
      onReviewIntro={() => setShowIntro(false)}
      selectedCount={selectedCount}
      hasChanges={hasChanges}
      hasNestedSafes={rawNestedSafes.length > 0}
      isLoading={isLoading}
      safesCount={safesToShow.length}
      nestedSafesList={
        <NestedSafesList
          onClose={onClose}
          safesWithStatus={safesToShow}
          isManageMode={isManageMode}
          onToggleSafe={toggleSafe}
          isSafeSelected={isSafeSelected}
          isFlagged={isFlagged}
          groupedSafes={isManageMode ? groupedSafes : undefined}
        />
      }
      uncuratedCount={uncuratedCount}
      hasVisibleSafes={visibleSafes.length > 0}
      hideCreationButton={hideCreationButton}
      onManageClick={handleManageClick}
      onAdd={onAdd}
      onSave={handleSave}
      onCancel={handleCancel}
      similarityDialog={
        pendingConfirmation && (
          <SimilarityConfirmDialog
            address={pendingConfirmation}
            similarAddresses={getSimilarAddresses(pendingConfirmation)}
            onConfirm={confirmSimilarAddress}
            onCancel={cancelSimilarAddress}
          />
        )
      }
      renderModalDialogTitle={(props) => <ModalDialogTitle {...props} />}
      renderDialogActions={(props) => <DialogActions {...props} />}
      renderCheckWallet={(render) => <CheckWallet>{render}</CheckWallet>}
    />
  )
}
