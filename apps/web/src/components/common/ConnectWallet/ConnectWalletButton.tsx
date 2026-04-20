import { Button } from '@mui/material'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { cn } from '@/utils/cn'

const ConnectWalletButton = ({
  onConnect,
  contained = true,
  small = false,
  text,
  className,
}: {
  onConnect?: () => void
  contained?: boolean
  small?: boolean
  text?: string
  className?: string
}): React.ReactElement => {
  const connectWallet = useConnectWallet()

  const handleConnect = () => {
    onConnect?.()
    connectWallet()
  }

  return (
    <Button
      data-testid="connect-wallet-btn"
      onClick={handleConnect}
      variant={contained ? 'contained' : 'text'}
      size={small ? 'small' : 'medium'}
      disableElevation
      className={cn(className)}
      sx={{ fontSize: small ? ['12px', '13px'] : '' }}
    >
      {text || 'Connect'}
    </Button>
  )
}

export default ConnectWalletButton
