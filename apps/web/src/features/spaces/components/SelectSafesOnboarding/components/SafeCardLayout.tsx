import type { SafeItem } from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import { AccountItem } from '@/features/myAccounts'
import Identicon from '@/components/common/Identicon'
import { Badge } from '@/components/ui/badge'
import { TriangleAlert } from 'lucide-react'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import { cn } from '@/utils/cn'
import FiatBalance from './FiatBalance'
import ThresholdBadge from './ThresholdBadge'

interface SafeCardLayoutProps {
  ref?: React.Ref<HTMLButtonElement>
  checked: boolean
  onToggle: () => void
  onCheckedChange?: (checked: boolean) => void
  name: string | undefined
  address: string
  safes: SafeItem[]
  fiatValue: string | number | undefined
  threshold: number
  ownersCount: number
  isSimilar?: boolean
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
  isSimilar,
  isUndeployed = false,
  isActivating = false,
  disabled = false,
}: SafeCardLayoutProps) => (
  <button
    ref={ref}
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onToggle}
    disabled={disabled}
    className={cn(
      'box-border flex w-full min-w-0 max-w-full cursor-pointer items-center gap-1.5 rounded-3xl border-2 py-4 pl-2 pr-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:pr-6',
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
      />
    </div>

    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
      <span className="inline-flex shrink-0">
        <Identicon address={address} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {isSimilar && (
          <Badge variant="warning" className="self-start -ml-px">
            <TriangleAlert data-icon="inline-start" />
            High similarity
          </Badge>
        )}
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base font-medium text-foreground">{name || shortenAddress(address)}</span>
        </div>
        <span className="block min-w-0 break-all text-xs text-muted-foreground">
          {isSimilar ? (
            <>
              {address.slice(0, 2)}
              <b>{address.slice(2, 6)}</b>
              {address.slice(6, -4)}
              <b>{address.slice(-4)}</b>
            </>
          ) : (
            shortenAddress(address)
          )}
        </span>
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
  </button>
)
