import { useMemo, type ReactElement } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsWalletProposer } from '@/hooks/useProposers'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import {
  OnlyOwnerOrProposerView,
  type OnlyOwnerOrProposerReason,
} from '@views/components/common/OnlyOwnerOrProposer/OnlyOwnerOrProposerView'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

type OnlyOwnerOrProposerProps = {
  children: (ok: boolean) => ReactElement
  placement?: TooltipSide
}

const OnlyOwnerOrProposer = ({ children, placement = 'bottom' }: OnlyOwnerOrProposerProps): ReactElement => {
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const connectWallet = useConnectWallet()

  const reason = useMemo((): OnlyOwnerOrProposerReason | undefined => {
    if (!wallet) {
      return 'walletNotConnected'
    }

    if (!isSafeOwner && !isProposer) {
      return 'notSafeOwnerOrProposer'
    }
  }, [isSafeOwner, isProposer, wallet])

  if (!reason) return children(true)

  return (
    <OnlyOwnerOrProposerView reason={reason} placement={placement} onClick={wallet ? undefined : connectWallet}>
      {children(false)}
    </OnlyOwnerOrProposerView>
  )
}

export default OnlyOwnerOrProposer
