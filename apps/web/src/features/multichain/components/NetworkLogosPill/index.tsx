import type { ReactNode } from 'react'
import NetworkLogosTooltip from '../NetworkLogosTooltip'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NetworkLogosPillView } from '@views/features/multichain/components/NetworkLogosPill/NetworkLogosPillView'

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
  <NetworkLogosPillView
    networks={networks}
    maxVisible={maxVisible}
    pillClassName={className}
    renderNetworkLogosTooltip={(props) => <NetworkLogosTooltip {...props} />}
  >
    {children}
  </NetworkLogosPillView>
)

export default NetworkLogosPill
