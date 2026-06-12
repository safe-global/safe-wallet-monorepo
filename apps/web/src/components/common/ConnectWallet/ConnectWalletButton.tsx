import { Button } from '@/components/ui/button'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { cn } from '@/utils/cn'

const ConnectWalletButton = ({
  onConnect,
  contained = true,
  small = false,
  text,
  className,
  fullWidth = false,
}: {
  onConnect?: () => void
  contained?: boolean
  small?: boolean
  text?: string
  className?: string
  fullWidth?: boolean
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
      variant={contained ? 'default' : 'ghost'}
      size={small ? 'sm' : 'default'}
      className={cn(fullWidth && 'w-full', small && 'text-xs', className)}
    >
      {text || 'Connect'}
    </Button>
  )
}

export default ConnectWalletButton
