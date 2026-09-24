import type { ReactNode } from 'react'
import FiatValue from '@/components/common/FiatValue'
import { SelectItem } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { INELIGIBILITY_TEXT } from '../constants'
import BalanceDisplay from '../../../SafeSelectorDropdown/components/BalanceDisplay'
import RowEndColumn from '../../../SafeSelectorDropdown/components/RowEndColumn'
import SafeRowStats from '../../../SafeSelectorDropdown/components/SafeRowStats'
import type { SafeItemDataChain } from '../../../SafeSelectorDropdown/types'
import SafeIdentity from './SafeIdentity'
import type { SafeAccountIneligibility, SafeAccountOption } from '../types'

const ROW_CLASS = [
  'rounded-lg px-3 py-2.5',
  // `SelectItem` wraps children in an `ItemText` that is `shrink-0 whitespace-nowrap`, which pushes the
  // trailing columns out of the popup instead of ellipsizing. Letting it shrink restores truncation.
  '[&>*:first-child]:min-w-0 [&>*:first-child]:shrink',
  // No check gutter: the picked row reads via its background, and reclaiming `pr-8` is what leaves the
  // identity column room for a name plus an address.
  '[&>span.absolute]:hidden data-[selected]:bg-muted',
].join(' ')

const NO_PENDING = 0

export const toStatChains = (options: SafeAccountOption[]): SafeItemDataChain[] =>
  options.flatMap((option) => (option.chain ? [option.chain] : []))

export const AccountBalance = ({ fiatTotal, fitColumn }: { fiatTotal?: string; fitColumn?: boolean }) => (
  <BalanceDisplay
    balance={fiatTotal !== undefined ? <FiatValue value={fiatTotal} /> : undefined}
    className={fitColumn ? 'sm:w-auto sm:shrink' : undefined}
  />
)

/** The row's own tooltip explains the state, so the badge renders as a bare icon. */
const NotActivated = () => (
  <RowEndColumn>
    <NotActivatedBadge showTooltip={false} data-testid="safe-account-not-activated-icon" />
  </RowEndColumn>
)

/**
 * Identity, stat columns and balance — the same column set as the topbar rows. `fitStats` is for a
 * lone row, where the stats' table widths buy no alignment and cost the address 101px.
 */
export const SafeAccountSummary = ({ account, fitStats }: { account: SafeAccountOption; fitStats?: boolean }) => (
  <div className="flex w-full min-w-0 items-center gap-3">
    <SafeIdentity address={account.address} name={account.name} />
    <SafeRowStats
      threshold={account.threshold ?? 0}
      owners={account.owners ?? 0}
      chains={toStatChains([account])}
      pending={NO_PENDING}
      showPending={false}
      fitColumns={fitStats}
    />
    {account.ineligibleReason === 'not-activated' ? (
      <NotActivated />
    ) : (
      <AccountBalance fiatTotal={account.fiatTotal} fitColumn={fitStats} />
    )}
  </div>
)

/** Mirrors the real row's shape so the list does not jump when the data lands. */
export const SafeAccountRowSkeleton = () => (
  <div data-testid="safe-account-skeleton" className="flex w-full items-center gap-3 px-3 py-2.5">
    <Skeleton data-testid="safe-account-avatar-skeleton" className="size-8 shrink-0 rounded-full" />
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-20" />
    </div>
    <RowEndColumn>
      <Skeleton className="h-4 w-14 rounded" />
    </RowEndColumn>
  </div>
)

const IneligibleRow = ({
  account,
  reason,
  testId,
  children,
}: {
  account: SafeAccountOption
  reason: SafeAccountIneligibility
  testId: string
  children: ReactNode
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <SelectItem
          value={account.id}
          data-testid={testId}
          disabled
          className={cn(ROW_CLASS, 'data-[disabled]:pointer-events-auto')}
        />
      }
    >
      {children}
    </TooltipTrigger>

    <TooltipContent>{INELIGIBILITY_TEXT[reason]}</TooltipContent>
  </Tooltip>
)

/** A Safe eligible on exactly one chain. */
const SafeAccountRow = ({ account }: { account: SafeAccountOption }) => {
  const summary = <SafeAccountSummary account={account} />

  if (account.ineligibleReason) {
    return (
      <IneligibleRow account={account} reason={account.ineligibleReason} testId="safe-account-option">
        {summary}
      </IneligibleRow>
    )
  }

  return (
    <SelectItem value={account.id} data-testid="safe-account-option" className={ROW_CLASS}>
      {summary}
    </SelectItem>
  )
}

/**
 * One chain of a multi-chain Safe. The identity sits on the header above, so the row carries only what
 * distinguishes it. Indented to line up under the header's name (avatar 32px + gap-3 12px).
 */
export const SafeAccountChainRow = ({ account }: { account: SafeAccountOption }) => {
  const summary = (
    <div className="flex w-full min-w-0 items-center gap-3 pl-11">
      <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
        {account.chain?.chainName ?? account.chainId}
      </Typography>
      <SafeRowStats
        threshold={account.threshold ?? 0}
        owners={account.owners ?? 0}
        chains={toStatChains([account])}
        pending={NO_PENDING}
        showPending={false}
      />
      {account.ineligibleReason === 'not-activated' ? (
        <NotActivated />
      ) : (
        <AccountBalance fiatTotal={account.fiatTotal} />
      )}
    </div>
  )

  if (account.ineligibleReason) {
    return (
      <IneligibleRow account={account} reason={account.ineligibleReason} testId="safe-account-chain-option">
        {summary}
      </IneligibleRow>
    )
  }

  return (
    <SelectItem value={account.id} data-testid="safe-account-chain-option" className={ROW_CLASS}>
      {summary}
    </SelectItem>
  )
}

export default SafeAccountRow
