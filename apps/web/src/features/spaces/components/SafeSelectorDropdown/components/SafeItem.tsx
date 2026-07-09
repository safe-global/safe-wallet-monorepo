import FiatValue from '@/components/common/FiatValue'
import { cn } from '@/utils/cn'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { SafeInfoDisplay } from '@/components/common/AccountRow'
import BalanceDisplay from './BalanceDisplay'
import RowEndColumn from './RowEndColumn'
import SafeRowStats from './SafeRowStats'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData, SafeRenameTarget } from '../types'

const SafeItem = ({
  name,
  address,
  threshold,
  owners,
  chains,
  balance,
  isLoading,
  parentSafeId,
  onRename,
}: SafeItemData & { onRename?: (target: SafeRenameTarget) => void }) => {
  const isNested = Boolean(parentSafeId)
  const chainId = chains[0]?.chainId ?? ''
  const isUndeployed = Boolean(chains[0]?.isUndeployed)
  const isActivating = Boolean(chains[0]?.isActivating)
  const pending = chains.reduce((sum, chain) => sum + (chain.queued ?? 0), 0)

  const resolvedName = useSafeDisplayName(address, chainId, name)
  const chainConfig = useChain(chainId)
  const explorerLink = chainConfig ? getBlockExplorerLink(chainConfig, address) : undefined

  return (
    <div className={cn('flex items-center gap-2 w-full', isNested && 'pl-8')} data-testid="multichain-item-summary">
      <SafeInfoDisplay
        name={resolvedName}
        address={address}
        className="flex-1 min-w-0"
        explorerLink={explorerLink}
        onRename={
          onRename && (() => onRename({ address, name: resolvedName, chainIds: chains.map((chain) => chain.chainId) }))
        }
      />
      <SafeRowStats threshold={threshold} owners={owners} chains={chains} pending={pending} />
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
