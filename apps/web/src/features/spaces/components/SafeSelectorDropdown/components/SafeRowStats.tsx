import type { CSSProperties, ReactNode } from 'react'
import { PendingBadge, ThresholdBadge, formatPendingLabel } from '@/components/common/AccountBadges'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { TOOLTIP_DELAY_MS } from '@/components/common/AccountRow'
import ChainLogo from './ChainLogo'
import type { SafeItemDataChain } from '../types'

const MAX_CHAIN_LOGOS = 3

/** Hover hint shared by the stat columns. Delayed to match the app's other row tooltips. */
const StatTooltip = ({
  label,
  triggerClassName,
  style,
  children,
}: {
  label: ReactNode
  triggerClassName?: string
  style?: CSSProperties
  children: ReactNode
}) => (
  <Tooltip delay={TOOLTIP_DELAY_MS}>
    {/* A span trigger (not the default button) so it can nest inside the row's select item / collapsible
        trigger without producing invalid nested-button markup. */}
    <TooltipTrigger render={<span className={triggerClassName} style={style} />}>{children}</TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
)

/**
 * Fixed-width stat columns (threshold | networks | pending) shared by the single- and multi-chain
 * dropdown rows. Empty cells keep their width so the values line up like a table across rows.
 */
const SafeRowStats = ({
  threshold,
  owners,
  chains,
  pending,
  awaitingConfirmation = 0,
  thresholdIconOnly = false,
}: {
  threshold: number
  owners: number
  chains: SafeItemDataChain[]
  pending: number
  /** Pending transactions awaiting the connected wallet's signature — flagged with an orange dot. */
  awaitingConfirmation?: number
  /** Multi-chain rows show an icon-only badge — the setup can differ per chain. */
  thresholdIconOnly?: boolean
}) => {
  const iconOnlyThreshold = thresholdIconOnly || !owners
  const thresholdLabel = iconOnlyThreshold ? 'Signer threshold' : `${threshold} out of ${owners} signers required`
  const overflowChains = chains.slice(MAX_CHAIN_LOGOS)
  const pendingLabel = formatPendingLabel(pending, awaitingConfirmation)

  return (
    <>
      <span className="flex w-14 shrink-0 justify-center" data-testid="row-threshold-column">
        <StatTooltip label={thresholdLabel} triggerClassName="inline-flex">
          <ThresholdBadge threshold={threshold} owners={owners} iconOnly={iconOnlyThreshold} />
        </StatTooltip>
      </span>
      <span className="flex w-20 shrink-0 justify-center" data-testid="row-networks-column">
        <span className="flex items-center rounded-full bg-muted p-0.5">
          {chains.slice(0, MAX_CHAIN_LOGOS).map((chainItem, index) => (
            <StatTooltip
              key={chainItem.chainId}
              label={chainItem.chainName}
              triggerClassName="size-6 rounded-full border-2 border-card overflow-hidden shrink-0 inline-flex items-center justify-center"
              style={{ marginLeft: index > 0 ? '-8px' : '0' }}
            >
              <ChainLogo chainId={chainItem.chainId} />
            </StatTooltip>
          ))}
          {overflowChains.length > 0 && (
            <StatTooltip
              label={overflowChains.map((chainItem) => chainItem.chainName).join(', ')}
              triggerClassName="size-6 rounded-full border-2 border-card bg-muted shrink-0 inline-flex items-center justify-center text-[10px] leading-none text-muted-foreground select-none"
              style={{ marginLeft: '-8px' }}
            >
              +{overflowChains.length}
            </StatTooltip>
          )}
        </span>
      </span>
      <span className="flex w-12 shrink-0 justify-center" data-testid="row-pending-column">
        {pending > 0 ? (
          <StatTooltip label={pendingLabel} triggerClassName="inline-flex">
            <PendingBadge count={pending} awaitingConfirmation={awaitingConfirmation} compact />
          </StatTooltip>
        ) : (
          <PendingBadge count={pending} compact />
        )}
      </span>
    </>
  )
}

export default SafeRowStats
