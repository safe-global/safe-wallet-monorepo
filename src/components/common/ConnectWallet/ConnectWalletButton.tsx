import { Button } from '@mui/material'
import { useAppKit, useAppKitAccount, useAppKitState, useDisconnect } from '@reown/appkit/react'

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
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount()

  const handleConnect = async () => {
    if (!isConnected) {
      open()
    } else {
      open()
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
