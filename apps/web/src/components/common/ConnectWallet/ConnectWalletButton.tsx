import { Button } from '@/components/ui/button'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { cn } from '@/utils/cn'

const ConnectWalletButton = ({
  onConnect,
  contained = true,
  size = 'default',
  text,
  className,
  fullWidth = false,
}: {
  onConnect?: () => void
  contained?: boolean
  size?: React.ComponentProps<typeof Button>['size']
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
      size={size}
      className={cn(fullWidth && 'w-full', className)}
    >
      {text || 'Connect'}
    </Button>
  )
}

export default ConnectWalletButton
