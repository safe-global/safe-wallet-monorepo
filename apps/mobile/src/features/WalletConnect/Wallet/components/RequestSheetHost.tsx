import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetFooter,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet'
import type { IWalletKit } from '@reown/walletkit'
import { useStore } from 'react-redux'
import { getVariable, useTheme, YStack, XStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { SafeButton } from '@/src/components/SafeButton'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { rejectPending, selectCurrentRequest } from '../store/walletKitSlice'
import { useApproveProposal } from '../hooks/useApproveProposal'
import { useTxRequestActions } from '../hooks/useTxRequestActions'
import { verifyStatusToVariant } from '../utils/verifyStatus'
import { SessionProposalSheet } from './SessionProposalSheet'
import { SendTransactionSheet } from './SendTransactionSheet'
import { ConnectionPermissionsPanel } from './ConnectionPermissionsPanel'

type Props = { walletKit: IWalletKit | null }

// Sheet snap indices: 0 = compact (proposal), 1 = taller (permissions panel).
const SNAP_COMPACT = 0
const SNAP_EXPANDED = 1

// Scroll-content clearance so it never sits under the pinned footer CTA (on top of the inset).
const FOOTER_CLEARANCE = 72

/**
 * Root-level host for incoming WC request sheets: presents the FIFO head of the pending queue.
 * An implicit dismissal (swipe-down / backdrop) dispatches rejectPending. The CTAs ("Connect" /
 * "Got it" / "Reject" / "Review") are rendered as a pinned BottomSheetFooter; bodies are
 * presentation-only and the approve flow lives in useApproveProposal.
 */
export const RequestSheetHost: React.FC<Props> = ({ walletKit }) => {
  const current = useAppSelector(selectCurrentRequest)
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const ref = useRef<BottomSheetModal>(null)
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const { approve, busy } = useApproveProposal(walletKit)
  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  const proposal = current?.kind === 'proposal' ? current : null
  const request = current?.kind === 'request' ? current : null
  // Both sheet kinds carry WC's domain verification — the panel renders the same for either.
  const variant = verifyStatusToVariant(
    proposal ? proposal.proposal.verifyContext?.verified : request?.verifyContext?.verified,
  )

  const { review, reject, composing, ready } = useTxRequestActions(request)

  // Reset the permissions view whenever the queue head changes.
  useEffect(() => {
    setPermissionsOpen(false)
  }, [current?.id, current?.kind])

  // The permissions panel is taller, so grow the sheet while it's open and shrink back after.
  const openPermissions = useCallback(() => {
    setPermissionsOpen(true)
    ref.current?.snapToIndex(SNAP_EXPANDED)
  }, [])
  const closePermissions = useCallback(() => {
    setPermissionsOpen(false)
    ref.current?.snapToIndex(SNAP_COMPACT)
  }, [])

  useEffect(() => {
    if (!current || !walletKit) {
      ref.current?.dismiss()
      return
    }
    ref.current?.present()
  }, [current, walletKit])

  // Implicit dismissal (swipe / backdrop) = decline. Read state imperatively to avoid a stale
  // closure; explicit actions already cleared `current`, so this is a no-op for them.
  const onSheetDismiss = useCallback(() => {
    if (!walletKit) {
      return
    }
    // Connect/compose in flight — useApproveProposal / useTxRequestActions own the outcome.
    if (busy || composing) {
      return
    }
    const currentAtDismiss = selectCurrentRequest(store.getState())
    if (!currentAtDismiss) {
      return
    }
    dispatch(rejectPending(currentAtDismiss))
  }, [walletKit, busy, composing, store, dispatch])

  const renderFooter = useCallback(
    (footerProps: BottomSheetFooterProps) => {
      if (!walletKit) {
        return null
      }
      // "Got it" returns to the active view without responding to the dApp.
      if ((proposal || request) && permissionsOpen) {
        return (
          <BottomSheetFooter {...footerProps} bottomInset={insets.bottom}>
            <YStack paddingHorizontal="$4" paddingTop="$2" paddingBottom="$2">
              <SafeButton primary onPress={closePermissions} testID="wc-permissions-dismiss">
                Got it
              </SafeButton>
            </YStack>
          </BottomSheetFooter>
        )
      }
      if (proposal) {
        return (
          <BottomSheetFooter {...footerProps} bottomInset={insets.bottom}>
            <YStack paddingHorizontal="$4" paddingTop="$2" paddingBottom="$2">
              <SafeButton
                primary
                onPress={() => approve(proposal)}
                loading={busy}
                loadingText="Connecting…"
                testID="wc-proposal-connect"
              >
                Connect
              </SafeButton>
            </YStack>
          </BottomSheetFooter>
        )
      }
      if (request) {
        // Review is disabled until the Safe/chain/SDK are ready.
        return (
          <BottomSheetFooter {...footerProps} bottomInset={insets.bottom}>
            <XStack gap="$3" paddingHorizontal="$4" paddingTop="$2" paddingBottom="$2">
              <SafeButton flex={1} danger onPress={reject} disabled={composing} testID="wc-tx-reject">
                Reject
              </SafeButton>
              <SafeButton
                flex={1}
                primary
                onPress={review}
                loading={composing}
                loadingText="Preparing…"
                disabled={!ready}
                testID="wc-tx-review"
              >
                Review
              </SafeButton>
            </XStack>
          </BottomSheetFooter>
        )
      }
      return null
    },
    [
      walletKit,
      proposal,
      request,
      permissionsOpen,
      closePermissions,
      approve,
      busy,
      review,
      reject,
      composing,
      ready,
      insets.bottom,
    ],
  )

  if (!walletKit) {
    return null
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['40%', '60%']}
      enableDynamicSizing={false}
      onDismiss={onSheetDismiss}
      backgroundComponent={BackgroundComponent}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
    >
      {/* Scrollable so content can't clip under large font scaling; the footer is pinned. */}
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + FOOTER_CLEARANCE }}>
        {proposal && !permissionsOpen && (
          <SessionProposalSheet pending={proposal} onOpenPermissions={openPermissions} />
        )}
        {request && !permissionsOpen && <SendTransactionSheet pending={request} onOpenPermissions={openPermissions} />}
        {(proposal || request) && permissionsOpen && <ConnectionPermissionsPanel variant={variant} />}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
