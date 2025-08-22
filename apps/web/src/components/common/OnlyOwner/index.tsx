import { useMemo, type ReactElement } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import { Tooltip } from '@mui/material'

type CheckWalletProps = {
  children: (ok: boolean) => ReactElement
}

enum Message {
  WalletNotConnected = 'Please connect your wallet',
  NotSafeOwner = 'Your connected wallet is not a signer of this Safe Account',
}

const OnlyOwner = ({ children }: CheckWalletProps): ReactElement => {
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const connectWallet = useConnectWallet()

  const message = useMemo(() => {
    if (!wallet) {
      return Message.WalletNotConnected
    }

    if (!isSafeOwner) {
      return Message.NotSafeOwner
    }
  }, [isSafeOwner, wallet])

  if (!message) return children(true)

  return (
    <Tooltip title={message}>
      <span onClick={wallet ? undefined : connectWallet}>{children(false)}</span>
    </Tooltip>
  )
}

export default OnlyOwner
