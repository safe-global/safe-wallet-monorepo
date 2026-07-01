import type { SafeItem } from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import { AccountItem } from '@/features/myAccounts'
import Identicon from '@/components/common/Identicon'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SimilarityFlag } from '@/features/address-poisoning'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import { cn } from '@/utils/cn'
import FiatBalance from './FiatBalance'
import ThresholdBadge from './ThresholdBadge'

interface SafeCardLayoutProps {
  ref?: React.Ref<HTMLDivElement>
  checked: boolean
  onToggle: () => void
  onCheckedChange?: (checked: boolean) => void
  name: string | undefined
  address: string
  safes: SafeItem[]
  fiatValue: string | number | undefined
  threshold: number
  ownersCount: number
  match?: SimilarityMatch
  intraList?: boolean
  isUndeployed?: boolean
  isActivating?: boolean
  disabled?: boolean
}

export const SafeCardLayout = ({
  ref,
  checked,
  onToggle,
  onCheckedChange,
  name,
  address,
  safes,
  fiatValue,
  threshold,
  ownersCount,
  match,
  intraList,
  isUndeployed = false,
  isActivating = false,
  disabled = false,
}: SafeCardLayoutProps) => (
  <div
    ref={ref}
    data-testid="safe-card"
    onClick={disabled ? undefined : onToggle}
    data-disabled={disabled || undefined}
    className={cn(
      'box-border flex w-full min-w-0 max-w-full items-center gap-1.5 rounded-3xl border-2 py-4 pl-2 pr-3 text-left transition-colors sm:gap-2 sm:pr-6',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      checked
        ? 'border-[var(--color-secondary-light)] bg-[var(--color-secondary-background)]'
        : 'border-card bg-card hover:bg-muted/50',
    )}
  >
    <div className="flex shrink-0 items-center px-2">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange ?? (() => onToggle())}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select ${name || shortenAddress(address)}`}
      />
    </div>

    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
      <span className="inline-flex shrink-0">
        <Identicon address={address} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <SimilarityFlag match={match} intraList={intraList} />

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base font-medium text-foreground">{name || shortenAddress(address)}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="block min-w-0 break-all text-xs text-muted-foreground">
            {match ? (
              <EthHashInfo
                address={address}
                showAvatar={false}
                showCopyButton={false}
                showPrefix={false}
                shortAddress={false}
                similarity={match}
              />
            ) : (
              shortenAddress(address)
            )}
          </span>
          <CopyAddressIconButton address={address} />
        </div>
      </div>
    </div>

    <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5 pl-1 sm:gap-2 sm:pl-2">
      {isUndeployed && (
        <NotActivatedBadge
          isActivating={isActivating}
          data-testid="onboarding-not-activated-icon"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <AccountItem.ChainBadge safes={safes} className="justify-end" />
    </div>

    <div className="flex min-w-0 shrink-0 flex-col items-end gap-2 pl-1 sm:min-w-16 sm:pl-0">
      {!isUndeployed && <FiatBalance value={fiatValue} />}
      {threshold > 0 && <ThresholdBadge threshold={threshold} owners={ownersCount} />}
    </div>
  </div>
)
