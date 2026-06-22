import FiatValue from '@/components/common/FiatValue'
import { cn } from '@/utils/cn'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import SafeInfoDisplay from './SafeInfoDisplay'
import BalanceDisplay from './BalanceDisplay'
import RowEndColumn from './RowEndColumn'
import ChainLogo from './ChainLogo'
import RenameSafeButton from './RenameSafeButton'
import { NameSourceIcon } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import type { SafeItemData } from '../types'
import type { RenameClickTarget } from '../../../hooks/useRenameSafe'

const SafeItem = ({
  name,
  address,
  threshold,
  owners,
  chains,
  balance,
  isLoading,
  parentSafeId,
  canRename,
  onRename,
}: SafeItemData & { canRename?: boolean; onRename?: (target: RenameClickTarget) => void }) => {
  const isNested = Boolean(parentSafeId)
  const chainId = chains[0]?.chainId ?? ''
  const isUndeployed = Boolean(chains[0]?.isUndeployed)
  const isActivating = Boolean(chains[0]?.isActivating)

  const resolvedName = useSafeDisplayName(address, chainId, name)
  const addressBookItem = useAddressBookItem(address, chainId)
  const nameIndicator =
    addressBookItem?.name && addressBookItem.source ? <NameSourceIcon source={addressBookItem.source} /> : undefined

  const renameButton =
    canRename && onRename ? (
      <RenameSafeButton
        onClick={() => onRename({ address, chainIds: chains.map((c) => c.chainId), currentName: resolvedName })}
      />
    ) : undefined

  return (
    <div className={cn('flex items-center gap-3 w-full', isNested && 'pl-8')} data-testid="multichain-item-summary">
      <SafeInfoDisplay
        name={resolvedName}
        address={address}
        className="flex-1 min-w-0"
        threshold={threshold}
        owners={owners}
        nameIndicator={nameIndicator}
        nameAction={renameButton}
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
