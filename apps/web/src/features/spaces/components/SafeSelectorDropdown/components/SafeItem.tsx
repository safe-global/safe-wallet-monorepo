import FiatValue from '@/components/common/FiatValue'
import { cn } from '@/utils/cn'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { SimilarityFlag } from '@/features/address-poisoning'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import SafeInfoDisplay from './SafeInfoDisplay'
import BalanceDisplay from './BalanceDisplay'
import RowEndColumn from './RowEndColumn'
import ChainLogo from './ChainLogo'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData } from '../types'

const SafeItem = ({
  name,
  address,
  threshold,
  owners,
  chains,
  balance,
  isLoading,
  parentSafeId,
  match,
}: SafeItemData & { match?: SimilarityMatch }) => {
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
        flag={<SimilarityFlag match={match} />}
      />
      <div className="flex items-center gap-2 bg-muted rounded-full p-0.5 shrink-0">
        {chains.slice(0, 3).map((chainItem, index) => (
          <span
            key={chainItem.chainId}
            className="size-6 rounded-full border-2 border-card overflow-hidden shrink-0 inline-flex items-center justify-center"
            style={{ marginLeft: index > 0 ? '-8px' : '0' }}
          >
            <ChainLogo chainId={chainItem.chainId} />
          </span>
        ))}
      </div>
      {isUndeployed ? (
        <RowEndColumn>
          <NotActivatedBadge isActivating={isActivating} />
        </RowEndColumn>
      ) : (
        <BalanceDisplay balance={<FiatValue value={balance} />} isLoading={isLoading} />
      )}
    </div>
  )
}

export default SafeItem
