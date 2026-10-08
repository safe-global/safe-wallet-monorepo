import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

/** Logo size inside the pill — matches the safe-selector dropdown's SafeRowStats stack. */
const PILL_LOGO_SIZE = 22

export type NetworkLogosPillViewProps = {
  networks?: Pick<Chain, 'chainId'>[]
  maxVisible?: number
  pillClassName?: string
  children?: ReactNode
  renderNetworkLogosTooltip: (props: {
    networks: Pick<Chain, 'chainId'>[]
    maxVisible: number
    imageSize: number
    triggerRender: ReactElement
  }) => ReactNode
}

export const NetworkLogosPillView = ({
  networks,
  maxVisible = 3,
  pillClassName,
  children,
  renderNetworkLogosTooltip,
}: NetworkLogosPillViewProps) => (
  <span className={cn('bg-foreground/5 inline-flex items-center rounded-full p-0.75', pillClassName)}>
    {children ??
      renderNetworkLogosTooltip({
        networks: networks ?? [],
        maxVisible,
        imageSize: PILL_LOGO_SIZE,
        // Overrides the default scale-85 trigger, which would shrink the logos inside the pill.
        triggerRender: <span className="inline-flex" />,
      })}
  </span>
)
