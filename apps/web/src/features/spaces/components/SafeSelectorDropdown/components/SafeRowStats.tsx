import { PendingBadge, ThresholdBadge } from '@/components/common/AccountBadges'
import ChainLogo from './ChainLogo'
import type { SafeItemDataChain } from '../types'

const MAX_CHAIN_LOGOS = 3

/**
 * Fixed-width stat columns (threshold | networks | pending) shared by the single- and multi-chain
 * dropdown rows. Empty cells keep their width so the values line up like a table across rows.
 */
const SafeRowStats = ({
  threshold,
  owners,
  chains,
  pending,
  thresholdIconOnly = false,
}: {
  threshold: number
  owners: number
  chains: SafeItemDataChain[]
  pending: number
  /** Multi-chain rows show an icon-only badge — the setup can differ per chain. */
  thresholdIconOnly?: boolean
}) => (
  <>
    <span className="flex w-14 shrink-0 justify-center" data-testid="row-threshold-column">
      <ThresholdBadge threshold={threshold} owners={owners} iconOnly={thresholdIconOnly || !owners} />
    </span>
    <span className="flex w-20 shrink-0 justify-center" data-testid="row-networks-column">
      <span className="flex items-center rounded-full bg-muted p-0.5">
        {chains.slice(0, MAX_CHAIN_LOGOS).map((chainItem, index) => (
          <span
            key={chainItem.chainId}
            className="size-6 rounded-full border-2 border-card overflow-hidden shrink-0 inline-flex items-center justify-center"
            style={{ marginLeft: index > 0 ? '-8px' : '0' }}
          >
            <ChainLogo chainId={chainItem.chainId} />
          </span>
        ))}
        {chains.length > MAX_CHAIN_LOGOS && (
          <span
            className="size-6 rounded-full border-2 border-card bg-muted shrink-0 inline-flex items-center justify-center text-[10px] leading-none text-muted-foreground select-none"
            style={{ marginLeft: '-8px' }}
          >
            +{chains.length - MAX_CHAIN_LOGOS}
          </span>
        )}
      </span>
    </span>
    <span className="flex w-12 shrink-0 justify-center" data-testid="row-pending-column">
      <PendingBadge count={pending} compact />
    </span>
  </>
)

export default SafeRowStats
