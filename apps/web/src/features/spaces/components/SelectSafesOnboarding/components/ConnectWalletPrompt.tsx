import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { cn } from '@/utils/cn'

interface ConnectWalletPromptProps {
  message?: string
  buttonLabel?: string
  className?: string
  testId?: string
}

const ConnectWalletPrompt = ({
  message = 'Connect your wallet to access all your Safes',
  buttonLabel = 'Connect wallet',
  className,
  testId = 'connect-wallet-prompt-button',
}: ConnectWalletPromptProps) => {
  const connectWallet = useConnectWallet()

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <Wallet className="size-12 text-muted-foreground" />
      <Typography variant="paragraph" align="center" color="muted">
        {message}
      </Typography>
      <Button data-testid={testId} type="button" size="lg" onClick={connectWallet} className="w-full max-w-[300px]">
        {buttonLabel}
      </Button>
    </div>
  )
}

export default ConnectWalletPrompt
