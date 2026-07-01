import FiatValue from '@/components/common/FiatValue'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import SafeInfoDisplay from './SafeInfoDisplay'
import ChainLogo from './ChainLogo'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData } from '../types'

const SafeItem = ({ name, address, threshold, owners, chains, balance, isLoading, parentSafeId }: SafeItemData) => {
  const isNested = Boolean(parentSafeId)
  const chainId = chains[0]?.chainId ?? ''
  const isUndeployed = Boolean(chains[0]?.isUndeployed)
  const isActivating = Boolean(chains[0]?.isActivating)

  const resolvedName = useSafeDisplayName(address, chainId, name)

  return (
    <div className={cn('flex items-center gap-3 w-full', isNested && 'pl-8')} data-testid="multichain-item-summary">
      <SafeInfoDisplay
        name={resolvedName}
        address={address}
        className="flex-1 min-w-0"
        threshold={threshold}
        owners={owners}
      />
      {/* Fixed-width network + balance columns so they line up across every row. */}
      <div className="flex w-[44px] shrink-0 justify-end">
        <span className="size-6 overflow-hidden rounded-full inline-flex items-center justify-center shrink-0">
          <ChainLogo chainId={chainId} />
        </span>
      </div>
      <div className="flex w-[88px] shrink-0 items-center justify-end text-right">
        {isUndeployed ? (
          <NotActivatedBadge isActivating={isActivating} />
        ) : isLoading ? (
          <Skeleton className="h-4 w-14 rounded" />
        ) : (
          <Typography variant="paragraph-mini-medium" color="muted" className="whitespace-nowrap">
            <FiatValue value={balance ?? '0'} />
          </Typography>
        )}
      </div>
    </div>
  )
}

export default SafeItem
