import React, { useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import type { IWalletKit } from '@reown/walletkit'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrentRequest } from '../store/walletKitSlice'
import { SessionProposalSheet } from './SessionProposalSheet'
import { SendTransactionSheet } from './SendTransactionSheet'

type Props = { walletKit: IWalletKit | null }

export const RequestSheetHost: React.FC<Props> = ({ walletKit }) => {
  const current = useAppSelector(selectCurrentRequest)
  const ref = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (current) {
      ref.current?.present()
    } else {
      ref.current?.dismiss()
    }
  }, [current])

  return (
    <BottomSheetModal ref={ref} snapPoints={['70%']} enableDynamicSizing={false}>
      {walletKit && current?.kind === 'proposal' && <SessionProposalSheet walletKit={walletKit} pending={current} />}
      {walletKit &&
        current?.kind === 'request' &&
        (current.method === 'eth_sendTransaction' || current.method === 'wallet_sendCalls') && (
          <SendTransactionSheet walletKit={walletKit} pending={current} />
        )}
    </BottomSheetModal>
  )
}
