import React, { useCallback, useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import type { IWalletKit } from '@reown/walletkit'
import { useStore } from 'react-redux'
import { getVariable, useTheme } from 'tamagui'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { removePending, selectCurrentRequest } from '../store/walletKitSlice'
import { logWalletKitError } from '../utils/errors'
import { SessionProposalSheet } from './SessionProposalSheet'

type Props = { walletKit: IWalletKit | null }

/**
 * Root-level host for incoming WalletConnect request sheets. Reads the FIFO head of the
 * pending queue and presents the sheet for it. The sheet is dismissable by swipe-down or
 * backdrop tap; an implicit dismissal is treated as the user declining, so we send a
 * USER_REJECTED reply to the dApp (rejectSession for proposals, an error response for
 * requests). The request-type sheets themselves are added in WA-2318 (proposal) and
 * WA-2321/2322 (transactions); this ticket ships only the shell, which renders nothing
 * inside while the queue is empty.
 */
export const RequestSheetHost: React.FC<Props> = ({ walletKit }) => {
  const current = useAppSelector(selectCurrentRequest)
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const theme = useTheme()
  const ref = useRef<BottomSheetModal>(null)
  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  // The proposal's permissions panel is taller than the main state, so grow the sheet
  // (index 1 = 60%) while it's open and shrink back (index 0 = 40%) when it closes.
  const onPermissionsOpenChange = useCallback((open: boolean) => ref.current?.snapToIndex(open ? 1 : 0), [])

  useEffect(() => {
    if (!current || !walletKit) {
      ref.current?.dismiss()
      return
    }
    ref.current?.present()
  }, [current, walletKit])

  // Treat an implicit sheet dismissal (swipe-down, backdrop tap) as a USER_REJECTED reply
  // to the dApp. Once the inner sheets land, tapping an explicit action will dispatch
  // removePending first, clearing `current` synchronously — so by the time onDismiss fires
  // from those paths this is a no-op. Reading state imperatively avoids a stale closure.
  const onSheetDismiss = useCallback(async () => {
    if (!walletKit) {
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
  }, [walletKit, store, dispatch])

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['40%', '60%']}
      enableDynamicSizing={false}
      onDismiss={onSheetDismiss}
      backgroundComponent={BackgroundComponent}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
    >
      {walletKit && current?.kind === 'proposal' && (
        <SessionProposalSheet
          walletKit={walletKit}
          pending={current}
          onPermissionsOpenChange={onPermissionsOpenChange}
        />
      )}
      {/* Transaction request sheet (current?.kind === 'request') added in WA-2321 / WA-2322. */}
    </BottomSheetModal>
  )
}
