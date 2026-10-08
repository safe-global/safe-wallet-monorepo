import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { SafeInfoDisplayView } from '@views/components/common/AccountRow/SafeInfoDisplayView'
import BalanceDisplay from './BalanceDisplay'
import RowEndColumn from './RowEndColumn'
import SafeRowStats from './SafeRowStats'
import NotActivatedBadge from '@views/components/common/NotActivatedBadge'
import type { SafeItemDataChain } from '@views/features/spaces/components/SafeSelectorDropdown/types'

export interface SafeItemViewProps {
  name: string
  address: string
  threshold: number
  owners: number
  chains: SafeItemDataChain[]
  isLoading?: boolean
  isNested: boolean
  isUndeployed: boolean
  isActivating: boolean
  pending: number
  awaitingConfirmation: number
  explorerLink?: { href: string; title: string }
  onRename?: () => void
  copyButton: ReactNode
  balance: ReactNode
}

export const SafeItemView = ({
  name,
  address,
  threshold,
  owners,
  chains,
  isLoading,
  isNested,
  isUndeployed,
  isActivating,
  pending,
  awaitingConfirmation,
  explorerLink,
  onRename,
  copyButton,
  balance,
}: SafeItemViewProps) => (
  <div className={cn('flex items-center gap-2 w-full', isNested && 'pl-8')} data-testid="multichain-item-summary">
    <SafeInfoDisplayView
      name={name}
      address={address}
      className="flex-1 min-w-0"
      explorerLink={explorerLink}
      onRename={onRename}
      copyButton={copyButton}
    />
    <SafeRowStats
      threshold={threshold}
      owners={owners}
      chains={chains}
      pending={pending}
      awaitingConfirmation={awaitingConfirmation}
    />
    {isUndeployed ? (
      <RowEndColumn>
        <NotActivatedBadge isActivating={isActivating} />
      </RowEndColumn>
    ) : (
      <BalanceDisplay balance={balance} isLoading={isLoading} />
    )}
  </div>
)
