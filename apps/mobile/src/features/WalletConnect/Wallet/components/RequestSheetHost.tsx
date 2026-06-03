import React, { useCallback, useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import type { IWalletKit } from '@reown/walletkit'
import { getVariable, useTheme } from 'tamagui'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrentRequest } from '../store/walletKitSlice'

type Props = { walletKit: IWalletKit | null }

/**
 * Root-level host for incoming WalletConnect request sheets. Modal-strict: it cannot be
 * dismissed by swipe-down or backdrop tap (a dApp request must be answered explicitly).
 * Reads the FIFO head of the pending queue and presents the sheet for it. The request-type
 * sheets themselves are added in WA-2318 (proposal) and WA-2321/2322 (transactions); this
 * ticket ships only the shell, which renders nothing inside while the queue is empty.
 */
export const RequestSheetHost: React.FC<Props> = ({ walletKit }) => {
  const current = useAppSelector(selectCurrentRequest)
  const theme = useTheme()
  const ref = useRef<BottomSheetModal>(null)
  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  useEffect(() => {
    if (!current || !walletKit) {
      ref.current?.dismiss()
      return
    }
    ref.current?.present()
  }, [current, walletKit])

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['50%']}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      backgroundComponent={BackgroundComponent}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
    >
      {/* Request-type sheets added in WA-2318 / WA-2321 / WA-2322. */}
      {null}
    </BottomSheetModal>
  )
}
