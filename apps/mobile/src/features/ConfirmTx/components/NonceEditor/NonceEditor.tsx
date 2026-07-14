import React from 'react'
import { View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Badge } from '@/src/components/Badge'
import { Loader } from '@/src/components/Loader'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useAppSelector } from '@/src/store/hooks'
import { selectDraftByHash, type DraftTx } from '@/src/store/draftTxSlice'
import { NonceBottomSheet } from '@/src/features/Send/components/NonceBottomSheet'
import { CustomNonceModal } from '@/src/features/Send/components/CustomNonceModal'
import { useDraftNonceEdit } from './useDraftNonceEdit'

/** Editable nonce row for draft transactions; proposed txs have a fixed nonce and render nothing */
export const NonceEditor = ({ txId }: { txId: string }) => {
  const draft = useAppSelector((state) => selectDraftByHash(state, txId))

  if (!draft) {
    return null
  }

  return <DraftNonceRow draft={draft} />
}

const DraftNonceRow = ({ draft }: { draft: DraftTx }) => {
  const nonce = useDraftNonceEdit(draft)

  return (
    <>
      <View marginTop="$4">
        <SafeListItem
          label="Nonce"
          rightNode={
            <View flexDirection="row" alignItems="center" gap="$2">
              {nonce.isRebuilding ? (
                <Loader size={16} color="$color" />
              ) : (
                <>
                  <Badge
                    themeName="badge_background_inverted"
                    content={String(nonce.draftNonce)}
                    circleSize="$6"
                    circular={false}
                    testID="nonce-row-value"
                  />
                  <SafeFontIcon name="chevron-right" />
                </>
              )}
            </View>
          }
          onPress={nonce.isRebuilding ? undefined : nonce.handleOpenNonceSheet}
          testID="nonce-row"
        />
      </View>

      <NonceBottomSheet
        ref={nonce.nonceSheetRef}
        recommendedNonce={nonce.recommendedNonce}
        queuedNonces={nonce.queuedNonces}
        selectedNonce={nonce.draftNonce}
        onSelectNonce={nonce.handleSelectNonce}
        onAddCustomNonce={nonce.handleAddCustomNonce}
        onEndReached={nonce.fetchMore}
        isFetchingMore={nonce.isFetchingMore}
      />

      <CustomNonceModal
        visible={nonce.showCustomNonceModal}
        defaultNonce={String(nonce.draftNonce)}
        currentNonce={nonce.currentNonce ?? 0}
        onSave={nonce.handleSaveCustomNonce}
        onCancel={nonce.handleCancelCustomNonce}
      />
    </>
  )
}
