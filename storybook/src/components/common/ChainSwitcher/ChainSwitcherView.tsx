import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export type ChainSwitcherViewProps = {
  chainName?: string
  chainLogoUri?: string | null
  loading: boolean
  onSwitch: () => void
  fullWidth?: boolean
  primaryCta: boolean
}

export const ChainSwitcherView = ({
  chainName,
  chainLogoUri,
  loading,
  onSwitch,
  fullWidth,
  primaryCta,
}: ChainSwitcherViewProps): ReactElement => (
  <Button
    onClick={onSwitch}
    variant={primaryCta ? 'default' : 'outline'}
    className={cn('min-w-[200px]', !primaryCta && 'text-foreground', fullWidth && 'w-full')}
    size={primaryCta ? 'default' : 'sm'}
    disabled={loading}
  >
    {loading ? (
      <Spinner className="size-5" />
    ) : (
      <>
        <span className="whitespace-nowrap">Switch to&nbsp;</span>
        <img src={chainLogoUri ?? undefined} alt={`${chainName} Logo`} width={24} height={24} loading="lazy" />
        <span className="whitespace-nowrap">&nbsp;{chainName}</span>
      </>
    )}
  </Button>
)
