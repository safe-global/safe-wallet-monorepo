import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import NetworkLogosTooltip from '../NetworkLogosTooltip'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

/** Logo size inside the pill — matches the safe-selector dropdown's SafeRowStats stack. */
const PILL_LOGO_SIZE = 22

export type NetworkLogosPillProps = {
  /** Chains rendered as a stacked-logo tooltip trigger; ignored when `children` is set. */
  networks?: Pick<Chain, 'chainId'>[]
  /** Max logos before the "+N" indicator */
  maxVisible?: number
  className?: string
  /** Custom pill content (e.g. AccountItemChainBadge) replacing the default logos tooltip. */
  children?: ReactNode
}

/**
 * The standard grey capsule around stacked network logos (22px logos, mask-cutout gaps,
 * transparent "+N") — the shared look of the networks cell in the accounts table, the space
 * address book, and the safe-selector dropdown rows.
 */
const NetworkLogosPill = ({ networks, maxVisible = 3, className, children }: NetworkLogosPillProps) => (
  <span className={cn('bg-foreground/5 inline-flex items-center rounded-full p-0.75', className)}>
    {children ?? (
      <NetworkLogosTooltip
        networks={networks ?? []}
        maxVisible={maxVisible}
        imageSize={PILL_LOGO_SIZE}
        // Overrides the default scale-85 trigger, which would shrink the logos inside the pill.
        triggerRender={<span className="inline-flex" />}
      />
    )}
  </span>
)

export default NetworkLogosPill
