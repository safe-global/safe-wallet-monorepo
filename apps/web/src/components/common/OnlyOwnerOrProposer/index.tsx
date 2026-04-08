import { useMemo, type ReactElement } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsWalletProposer } from '@/hooks/useProposers'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import { Tooltip, type TooltipProps } from '@mui/material'

type OnlyOwnerOrProposerProps = {
  children: (ok: boolean) => ReactElement
  placement?: TooltipProps['placement']
}

enum Message {
  WalletNotConnected = 'Please connect your wallet',
  NotSafeOwnerOrProposer = 'Your connected wallet is not a signer or proposer of this Safe Account',
}

const OnlyOwnerOrProposer = ({ children, placement = 'bottom' }: OnlyOwnerOrProposerProps): ReactElement => {
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const connectWallet = useConnectWallet()

  const message = useMemo(() => {
    if (!wallet) {
      return Message.WalletNotConnected
    }

    if (!isSafeOwner && !isProposer) {
      return Message.NotSafeOwnerOrProposer
    }
  }, [isSafeOwner, isProposer, wallet])

  if (!message) return children(true)

  return (
    <Tooltip title={message} placement={placement}>
      <span onClick={wallet ? undefined : connectWallet}>{children(false)}</span>
    </Tooltip>
  )
}

export default OnlyOwnerOrProposer
