import React, { useCallback, useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import type { IWalletKit } from '@reown/walletkit'
import { useStore } from 'react-redux'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { removePending, selectCurrentRequest } from '../store/walletKitSlice'
import { SessionProposalSheet } from './SessionProposalSheet'
import { SendTransactionSheet } from './SendTransactionSheet'

type Props = { walletKit: IWalletKit | null }

export const RequestSheetHost: React.FC<Props> = ({ walletKit }) => {
  const current = useAppSelector(selectCurrentRequest)
  // Proposals don't need the Safe SDK and present immediately. Tx requests wait for SDK
  // readiness (useInitSafeCoreSDK populates it asynchronously after the active Safe
  // loads) — otherwise composeSafeTxDraft would throw "Safe SDK is not initialized" on
  // cold start when WalletKit seeds a backlogged pending request before the SDK warms up.
  const safeSDK = useSafeSDK()
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const ref = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (!current) {
      ref.current?.dismiss()
      return
    }
    if (current.kind === 'request' && !safeSDK) {
      // Hold off; this effect re-runs when safeSDK becomes available.
      return
    }
    ref.current?.present()
  }, [current, safeSDK])

  // Treat an implicit sheet dismissal (swipe-down, backdrop tap) as a USER_REJECTED reply
  // to the dApp. Tapping Sign or Reject inside a sheet always dispatches removePending
  // first, which clears `current` synchronously — so by the time onDismiss fires from
  // those paths, selectCurrentRequest returns null and this is a no-op. Reading state
  // imperatively here avoids a stale closure on `current`.
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
        console.log('[walletKit] rejectSession on sheet dismiss failed', e)
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
      console.log('[walletKit] respondSessionRequest on sheet dismiss failed', e)
    }
    dispatch(removePending({ id: currentAtDismiss.id, kind: 'request' }))
    // Draft / outstandingRequest cleanup happens automatically in SendTransactionSheet's
    // unmount effects (handedOffRef stays false on dismiss-without-Sign).
  }, [walletKit, store, dispatch])

  return (
    <BottomSheetModal ref={ref} snapPoints={['70%']} enableDynamicSizing={false} onDismiss={onSheetDismiss}>
      {walletKit && current?.kind === 'proposal' && <SessionProposalSheet walletKit={walletKit} pending={current} />}
      {walletKit && current?.kind === 'request' && safeSDK && (
        <SendTransactionSheet walletKit={walletKit} pending={current} />
      )}
    </BottomSheetModal>
  )
}
