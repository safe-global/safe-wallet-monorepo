import useWallet from '@/hooks/wallets/useWallet'
import { Button } from '@mui/material'
import { usePrivy } from '@privy-io/react-auth'

const ConnectWalletButton = ({
  onConnect,
  contained = true,
  small = false,
  text,
}: {
  onConnect?: () => void
  contained?: boolean
  small?: boolean
  text?: string
}): React.ReactElement => {
  const { login, ready, authenticated, logout, connectWallet } = usePrivy()
  const wallet = useWallet()

  const handleConnect = async () => {
    if (!ready) return
    if (!wallet && authenticated) {
      connectWallet()
    } else {
      login()
      onConnect?.()
    }
  }

  return (
    <Button
      onClick={handleConnect}
      variant={contained ? 'contained' : 'text'}
      size={small ? 'small' : 'medium'}
      disableElevation
      fullWidth
      sx={{ fontSize: small ? ['12px', '13px'] : '' }}
    >
      {text || 'Connect'}
    </Button>
  )
}

export default ConnectWalletButton
