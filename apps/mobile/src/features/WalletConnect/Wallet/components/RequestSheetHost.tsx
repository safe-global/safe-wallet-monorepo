import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetFooter,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet'
import type { IWalletKit } from '@reown/walletkit'
import { useStore } from 'react-redux'
import { getVariable, useTheme, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { SafeButton } from '@/src/components/SafeButton'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { removePending, selectCurrentRequest } from '../store/walletKitSlice'
import { useApproveProposal } from '../hooks/useApproveProposal'
import { verifyStatusToVariant } from '../utils/verifyStatus'
import { logWalletKitError } from '../utils/errors'
import { SessionProposalSheet } from './SessionProposalSheet'
import { ConnectionPermissionsPanel } from './ConnectionPermissionsPanel'

type Props = { walletKit: IWalletKit | null }

// Sheet snap indices: 0 = compact (proposal), 1 = taller (permissions panel).
const SNAP_COMPACT = 0
const SNAP_EXPANDED = 1

// Bottom padding for the scroll content so it never sits under the pinned footer CTA
// (button + its vertical padding). Added on top of the safe-area inset.
const FOOTER_CLEARANCE = 72

/**
 * Root-level host for incoming WalletConnect request sheets. Reads the FIFO head of the
 * pending queue and presents the sheet for it. The sheet is dismissable by swipe-down or
 * backdrop tap; an implicit dismissal is treated as the user declining, so we send a
 * USER_REJECTED reply to the dApp (rejectSession for proposals, an error response for
 * requests).
 *
 * The proposal flow has two views — the proposal and a permissions detail panel — and both
 * primary CTAs ("Connect" / "Got it") are rendered here as a BottomSheetFooter so they sit
 * pinned to the sheet's bottom edge regardless of content height. The body components are
 * pure presentation; the approve flow lives in useApproveProposal.
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
  const variant = proposal ? verifyStatusToVariant(proposal.proposal.verifyContext?.verified) : 'unverified'

  // Reset the permissions view whenever the queue head changes (new proposal or cleared).
  useEffect(() => {
    setPermissionsOpen(false)
  }, [current?.id, current?.kind])

  // The permissions panel is taller than the proposal, so grow the sheet (index 1) while
  // it's open and shrink back (index 0) when it closes.
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

  // Treat an implicit sheet dismissal (swipe-down, backdrop tap) as a USER_REJECTED reply
  // to the dApp. Tapping an explicit action dispatches removePending first, clearing
  // `current` synchronously — so by the time onDismiss fires from those paths this is a
  // no-op. Reading state imperatively avoids a stale closure.
  const onSheetDismiss = useCallback(async () => {
    if (!walletKit) {
      return
    }
    // A connect is in flight — let useApproveProposal own the outcome (approve resolves to
    // success/reject and clears the pending item). Rejecting here would race its response.
    if (busy) {
      return
    }
    const currentAtDismiss = selectCurrentRequest(store.getState())
    if (!currentAtDismiss) {
      return
    }
    if (currentAtDismiss.kind === 'proposal') {
      try {
        await walletKit.rejectSession({
          id: currentAtDismiss.id,
          reason: getSdkError('USER_REJECTED'),
        })
      } catch (e) {
        logWalletKitError('rejectSession on sheet dismiss failed', e)
      }
      dispatch(removePending({ id: currentAtDismiss.id, kind: 'proposal' }))
      return
    }
    // currentAtDismiss.kind === 'request'
    try {
      await walletKit.respondSessionRequest({
        topic: currentAtDismiss.topic,
        response: formatJsonRpcError(currentAtDismiss.id, getSdkError('USER_REJECTED').message),
      })
    } catch (e) {
      logWalletKitError('respondSessionRequest on sheet dismiss failed', e)
    }
    dispatch(removePending({ id: currentAtDismiss.id, kind: 'request' }))
  }, [walletKit, busy, store, dispatch])

  // The active view's primary CTA, pinned to the bottom edge of the sheet. No background so
  // its top edge doesn't show a seam against the content; the panel/proposal content is short
  // enough that it never scrolls under the CTA.
  const renderFooter = useCallback(
    (footerProps: BottomSheetFooterProps) => {
      if (!walletKit || !proposal) {
        return null
      }
      return (
        <BottomSheetFooter {...footerProps} bottomInset={insets.bottom}>
          <YStack paddingHorizontal="$4" paddingTop="$2" paddingBottom="$2">
            {permissionsOpen ? (
              <SafeButton primary onPress={closePermissions} testID="wc-proposal-permissions-dismiss">
                Got it
              </SafeButton>
            ) : (
              <SafeButton
                primary
                onPress={() => approve(proposal)}
                loading={busy}
                loadingText="Connecting…"
                testID="wc-proposal-connect"
              >
                Connect
              </SafeButton>
            )}
          </YStack>
        </BottomSheetFooter>
      )
    },
    [walletKit, proposal, permissionsOpen, closePermissions, approve, busy, insets.bottom],
  )

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
        {walletKit && proposal && !permissionsOpen && (
          <SessionProposalSheet pending={proposal} onOpenPermissions={openPermissions} />
        )}
        {walletKit && proposal && permissionsOpen && <ConnectionPermissionsPanel variant={variant} />}
        {/* Transaction request sheet (current?.kind === 'request') added in WA-2321 / WA-2322. */}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
