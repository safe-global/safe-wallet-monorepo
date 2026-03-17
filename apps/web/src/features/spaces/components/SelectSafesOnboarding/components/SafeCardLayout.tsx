import type { SafeItem } from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import { AccountItem } from '@/features/myAccounts/components/AccountItem'
import Identicon from '@/components/common/Identicon'
import { Badge } from '@/components/ui/badge'
import { TriangleAlert } from 'lucide-react'
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
}: SafeCardLayoutProps) => (
  <button
    ref={ref}
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onToggle}
    className="flex w-full cursor-pointer items-center gap-2 rounded-3xl bg-card py-4 pl-2 pr-6 text-left transition-colors border-2 border-card hover:bg-muted/50 disabled:opacity-60"
  >
    <div className="flex shrink-0 items-center px-2">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange ?? (() => onToggle())}
        onClick={(e) => e.stopPropagation()}
      />
    </div>

    <div className="flex min-w-0 flex-1 items-center gap-4">
      <Identicon address={address} />

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
        <span className="text-xs text-muted-foreground">
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

    <div className="ml-auto flex-1 items-center justify-center shrink-0 pl-4">
      <AccountItem.ChainBadge safes={safes} className="justify-center" />
    </div>

    <div className="flex shrink-0 flex-col min-w-16 items-end gap-2">
      <FiatBalance value={fiatValue} />
      {threshold > 0 && <ThresholdBadge threshold={threshold} owners={ownersCount} />}
    </div>
  </button>
)
