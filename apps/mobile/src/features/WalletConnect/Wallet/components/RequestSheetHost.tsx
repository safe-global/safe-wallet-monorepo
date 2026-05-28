import React, { useCallback, useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { Text, YStack } from 'tamagui'
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
  // The Safe protocol-kit SDK is initialized asynchronously by useInitSafeCoreSDK after the
  // active Safe loads. When WalletKit seeds a pending request on cold start, the host can
  // mount BEFORE the SDK is ready — composing then throws "Safe SDK is not initialized".
  // Hold off on rendering SendTransactionSheet until the SDK is ready; show a placeholder.
  const safeSDK = useSafeSDK()
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const ref = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (current) {
      ref.current?.present()
    } else {
      ref.current?.dismiss()
    }
  }, [current])

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
  const isTxRequest =
    current?.kind === 'request' && ['eth_sendTransaction', 'wallet_sendCalls'].includes(current.method)

  return (
    <BottomSheetModal ref={ref} snapPoints={['70%']} enableDynamicSizing={false} onDismiss={onSheetDismiss}>
      {walletKit && current?.kind === 'proposal' && <SessionProposalSheet walletKit={walletKit} pending={current} />}
      {walletKit && isTxRequest && current?.kind === 'request' && safeSDK && (
        <SendTransactionSheet walletKit={walletKit} pending={current} />
      )}
      {isTxRequest && !safeSDK && (
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center">
          <Text>Preparing…</Text>
        </YStack>
      )}
    </BottomSheetModal>
  )
}
