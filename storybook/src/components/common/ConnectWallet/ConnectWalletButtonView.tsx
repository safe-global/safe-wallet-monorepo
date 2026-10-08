import type { ComponentProps, ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export type ConnectWalletButtonViewProps = {
  onClick: () => void
  contained?: boolean
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
  text?: string
  className?: string
  fullWidth?: boolean
}

export function ConnectWalletButtonView({
  onClick,
  contained = true,
  variant,
  size = 'default',
  text,
  className,
  fullWidth = false,
}: ConnectWalletButtonViewProps): ReactElement {
  return (
    <Button
      data-testid="connect-wallet-btn"
      onClick={onClick}
      variant={variant ?? (contained ? 'default' : 'ghost')}
      size={size}
      className={cn(fullWidth && 'w-full', className)}
    >
      {text || 'Connect'}
    </Button>
  )
}
