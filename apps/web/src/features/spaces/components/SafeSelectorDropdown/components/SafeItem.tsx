import FiatValue from '@/components/common/FiatValue'
import { cn } from '@/utils/cn'
import SafeInfoDisplay from './SafeInfoDisplay'
import BalanceDisplay from './BalanceDisplay'
import ChainLogo from './ChainLogo'
import type { SafeItemData } from '../types'

const SafeItem = ({ name, address, threshold, owners, chains, balance, isLoading, parentSafeId }: SafeItemData) => {
  const isNested = Boolean(parentSafeId)

  return (
    <div className={cn('flex items-center gap-3 w-full', isNested && 'pl-8')}>
      <SafeInfoDisplay name={name} address={address} className="flex-1" />
      <div className="flex items-center gap-2 bg-muted rounded-full px-0.5 py-0.5 pl-0.5 pr-2.5 shrink-0">
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
      <BalanceDisplay
        balance={<FiatValue value={balance} />}
        threshold={threshold}
        owners={owners}
        isLoading={isLoading}
        showThreshold={chains.length <= 1}
      />
    </div>
  )
}

export default SafeItem
