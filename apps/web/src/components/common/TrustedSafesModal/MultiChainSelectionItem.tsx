import type { SelectableMultiChainSafe } from './useTrustedSafesModal.types'
import { useMultiAccountItemData, AccountItem } from '@/features/myAccounts'
import { FiatBalance } from '@/features/spaces'
import Identicon from '@/components/common/Identicon'
import AddressWithCopy from '@/components/common/AddressWithCopy'
import { Checkbox } from '@/components/ui/checkbox'
import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { cn } from '@/utils/cn'
import SimilarityWarning from './SimilarityWarning'
import { MODAL_SAFE_GRID } from './constants'
import { ThresholdBadge } from './ThresholdBadge'

interface MultiChainSelectionItemProps {
  multiSafe: SelectableMultiChainSafe
  onToggle: (address: string) => void
}

/**
 * Multichain safe row in the selection modal. Selecting trusts the address across all its
 * chains, so it's a single selectable row (the Chains column shows every network) — matching
 * how multichain safes appear in the SafesTable.
 */
const MultiChainSelectionItem = ({ multiSafe, onToggle }: MultiChainSelectionItemProps) => {
  const { sharedSetup, totalFiatValue } = useMultiAccountItemData(multiSafe)
  const { address, safes, name } = multiSafe

  const displayName = name || shortenAddress(address)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(address)}
      data-testid="safe-list-item"
      className={cn(
        MODAL_SAFE_GRID,
        'group border-muted hover:bg-muted/40 cursor-pointer border-b px-3 py-2 transition-colors',
        multiSafe.isSelected && 'bg-primary/5',
      )}
    >
      <Checkbox
        checked={multiSafe.isSelected}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none"
        data-testid={`safe-item-checkbox-${multiSafe.address}`}
      />

      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex shrink-0">
          <Identicon address={address} />
        </span>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <Typography variant="paragraph-small-bold" className="text-foreground truncate">
              {displayName}
            </Typography>
            {multiSafe.similarityGroup && <SimilarityWarning />}
          </div>
          <AddressWithCopy address={address} full />
        </div>
      </div>

      <div className="flex min-w-0 items-center">
        <AccountItem.ChainBadge safes={safes} />
      </div>

      <div className="flex items-center justify-end">
        <FiatBalance value={totalFiatValue?.toString()} />
      </div>

      <div className="flex items-center justify-end">
        <ThresholdBadge threshold={sharedSetup?.threshold} owners={sharedSetup?.owners.length} />
      </div>
    </div>
  )
}

export default MultiChainSelectionItem
