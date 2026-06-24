import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import ChainIndicator from '@/components/common/ChainIndicator'
import { cn } from '@/utils/cn'
import useSafeCardData from '../../SelectSafesOnboarding/hooks/useSafeCardData'
import FiatBalance from '../../SelectSafesOnboarding/components/FiatBalance'

interface SelectableSafeRowProps {
  safe: SafeItem | MultiChainSafeItem
  checked: boolean
  onToggle: () => void
}

const SelectableSafeRow = ({ safe, checked, onToggle }: SelectableSafeRowProps) => {
  const { name, fiatValue, chainIds } = useSafeCardData(safe)
  const displayName = name || shortenAddress(safe.address)
  // Letter-initial avatar per Figma; the app's Identicon is intentionally not used here.
  const initial = name?.trim().charAt(0).toUpperCase() || '?'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Select ${displayName}`}
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center gap-3 text-left"
    >
      <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none" />

      <div
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors',
          checked
            ? 'border-[var(--color-secondary-light)] bg-[var(--color-secondary-background)]'
            : 'border-transparent bg-muted hover:bg-muted/70',
        )}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground"
          aria-hidden
        >
          {initial}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-medium leading-6 text-foreground">{displayName}</span>
          <span className="truncate text-xs font-normal leading-4 text-muted-foreground">
            {shortenAddress(safe.address)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} onlyLogo inline imageSize={20} />
          ))}
        </div>

        <FiatBalance value={fiatValue} />
      </div>
    </button>
  )
}

export default SelectableSafeRow
