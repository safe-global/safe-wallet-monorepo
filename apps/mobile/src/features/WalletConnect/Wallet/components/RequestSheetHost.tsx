import React, { useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { Text, YStack } from 'tamagui'
import type { IWalletKit } from '@reown/walletkit'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrentRequest } from '../store/walletKitSlice'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
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
  const ref = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (current) {
      ref.current?.present()
    } else {
      ref.current?.dismiss()
    }
  }, [current])

  const isTxRequest =
    current?.kind === 'request' && ['eth_sendTransaction', 'wallet_sendCalls'].includes(current.method)

  return (
    <BottomSheetModal ref={ref} snapPoints={['70%']} enableDynamicSizing={false}>
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
