import { useId, useMemo, type ReactElement, type ReactNode } from 'react'
import { Label } from '@safe-global/views/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@safe-global/views/components/ui/select'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import SafeRowStats from '../../SafeSelectorDropdown/components/SafeRowStats'
import ChainIndicator from '@/components/common/ChainIndicator'
import { ThresholdBadge } from '@safe-global/views/components/common/AccountBadges'
import { AccountBalance, toStatChains } from '../SafeAccountSelector/components/SafeAccountRow'
import type {
  SafeAccountGroup,
  SafeAccountOption,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { SafeAddress } from './m2Prototype'
import {
  getEligibilityCopy,
  INELIGIBILITY_TEXT,
  SAFE_ACCOUNT_SELECTOR_PLACEHOLDER,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import {
  isSafeAccountGroup,
  type SafeAccountEntry,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { findSafeAccount } from '../SafeAccountSelector/utils'
import { M2Alert } from './m2Alert'

/** M1's label says "Safe Account"; the prototype uses sentence case. */
const ACCOUNT_FIELD_LABEL = 'Which Safe account does this apply to?'

const TRIGGER_CONTENT_HEIGHT = 'min-h-9'

// 16px rows inside a 22px dropdown (16px + the list's 6px padding), so the notice banner sits concentric in it.
const INNER_RADIUS = 'rounded-lg'
const DROPDOWN_RADIUS = 'rounded-[22px]'

// Field and dropdown share columns: 18px = 6px list inset + 12px row; 12px + 24px chevron = 6px + 6px scrollbar + 24px.
const FIELD_PADDING = 'pl-[18px] pr-3'
const DROPDOWN_ROW_PADDING = 'pl-3 pr-6'

const ROW_CLASS = [
  `${INNER_RADIUS} ${DROPDOWN_ROW_PADDING} py-2.5`,
  '[&>*:first-child]:min-w-0 [&>*:first-child]:shrink',
  '[&>span.absolute]:hidden data-[selected]:bg-muted',
].join(' ')

// Keeps the one-line network rows as tall as the two-line account rows and headers.
const ROW_CONTENT_HEIGHT = 'min-h-10'

/** M1's SafeAccountSummary with the identity as SafeAddress, for the prototype's address tooltip. */
const AccountSummary = ({ account, fitStats }: { account: SafeAccountOption; fitStats?: boolean }): ReactElement => (
  <div className={cn('flex w-full min-w-0 items-center gap-3', ROW_CONTENT_HEIGHT)}>
    <div className="min-w-0 flex-1">
      <SafeAddress name={account.name} address={account.address} avatarSize={32} chainId={account.chainId} />
    </div>
    <SafeRowStats
      threshold={account.threshold ?? 0}
      owners={account.owners ?? 0}
      chains={toStatChains([account])}
      pending={0}
      showPending={false}
      fitColumns={fitStats}
    />
    <AccountBalance fiatTotal={account.fiatTotal} fitColumn={fitStats} />
  </div>
)

/** The picked account in the tile: identity, signers, network and balance spread evenly, the details in tooltips. */
export const SpreadAccountSummary = ({ account }: { account: SafeAccountOption }): ReactElement => (
  <div className={cn('flex w-full min-w-0 items-center justify-between gap-6', ROW_CONTENT_HEIGHT)}>
    <SafeAddress name={account.name} address={account.address} avatarSize={32} chainId={account.chainId} />
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <ThresholdBadge threshold={account.threshold} owners={account.owners} />
      </TooltipTrigger>
      <TooltipContent>
        {account.threshold} of {account.owners} signers needed
      </TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />} aria-label={account.chain?.chainName}>
        <ChainIndicator chainId={account.chainId} onlyLogo imageSize={24} />
      </TooltipTrigger>
      <TooltipContent>{account.chain?.chainName ?? account.chainId}</TooltipContent>
    </Tooltip>
    <AccountBalance fiatTotal={account.fiatTotal} fitColumn />
  </div>
)

/** A disabled row's reason tooltip opens below the row, clear of the address tooltip above it. */
const OptionRow = ({
  account,
  testId,
  children,
}: {
  account: SafeAccountOption
  testId: string
  children: ReactNode
}): ReactElement => {
  if (!account.ineligibleReason) {
    return (
      <SelectItem value={account.id} data-testid={testId} className={ROW_CLASS}>
        {children}
      </SelectItem>
    )
  }

  return (
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
      <TooltipContent side="bottom">{INELIGIBILITY_TEXT[account.ineligibleReason]}</TooltipContent>
    </Tooltip>
  )
}

const AccountRow = ({ account }: { account: SafeAccountOption }): ReactElement => (
  <OptionRow account={account} testId="safe-account-option">
    <AccountSummary account={account} />
  </OptionRow>
)

/** M1's SafeAccountChainRow, indented under the header's name (32px avatar + 8px gap). */
const AccountChainRow = ({ account }: { account: SafeAccountOption }): ReactElement => (
  <OptionRow account={account} testId="safe-account-chain-option">
    <div className={cn('flex w-full min-w-0 items-center gap-3 pl-10', ROW_CONTENT_HEIGHT)}>
      <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
        {account.chain?.chainName ?? account.chainId}
      </Typography>
      <SafeRowStats
        threshold={account.threshold ?? 0}
        owners={account.owners ?? 0}
        chains={toStatChains([account])}
        pending={0}
        showPending={false}
      />
      <AccountBalance fiatTotal={account.fiatTotal} />
    </div>
  </OptionRow>
)

/** M1's SafeAccountGroupHeader with the identity as SafeAddress. */
const AccountGroupHeader = ({ group }: { group: SafeAccountGroup }): ReactElement => (
  <SelectLabel
    data-testid="safe-account-group-header"
    className={cn('text-foreground flex min-w-0 items-center gap-3 py-2.5', DROPDOWN_ROW_PADDING, ROW_CONTENT_HEIGHT)}
  >
    <div className="min-w-0 flex-1">
      <SafeAddress name={group.name} address={group.address} avatarSize={32} chainId={group.accounts[0]?.chainId} />
    </div>
    <SafeRowStats
      threshold={group.threshold ?? 0}
      owners={group.owners ?? 0}
      chains={toStatChains(group.accounts)}
      pending={0}
      showPending={false}
      thresholdIconOnly={group.owners === undefined}
    />
    <AccountBalance fiatTotal={group.fiatTotal} />
  </SelectLabel>
)

/** M1's SafeAccountSelector, but the dropdown never flips above the field and identities are SafeAddress. */
export const AccountSelect = ({
  accounts,
  value,
  onChange,
  notice,
  id,
  readOnly = false,
  variant = 'field',
  fixed = false,
}: {
  accounts: SafeAccountEntry[]
  /** `${chainId}:${address}` */
  value?: string
  onChange: (value: string) => void
  notice?: { title: ReactNode; description: ReactNode }
  id?: string
  /** M1's read-only field (edit flow): the picked account, dimmed, and no dropdown. */
  readOnly?: boolean
  /** `tile`: a grey card titled "Safe account" with a borderless white item, like the setup's other cards. */
  variant?: 'field' | 'tile'
  /** Tile only: the account is a given (started from its row), so it's shown plainly, with no dropdown. */
  fixed?: boolean
}): ReactElement => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const isTile = variant === 'tile'
  const wrapperClass = isTile ? 'flex w-full flex-col gap-3 rounded-xl bg-muted p-4' : 'flex w-full flex-col gap-1.5'
  const label = isTile ? (
    <Label htmlFor={fieldId} className="text-base font-semibold">
      Safe account
    </Label>
  ) : (
    <Label htmlFor={fieldId}>{ACCOUNT_FIELD_LABEL}</Label>
  )
  // The tile's item: white, no border or shadow, at the cards' 8px radius.
  const surfaceClass = isTile ? 'border-0 bg-card shadow-none hover:bg-card data-popup-open:bg-card' : undefined
  const selectedAccount = useMemo(() => findSafeAccount(accounts, value), [accounts, value])
  const ineligibilityText =
    !readOnly && selectedAccount?.ineligibleReason ? INELIGIBILITY_TEXT[selectedAccount.ineligibleReason] : undefined

  const helper = ineligibilityText ? (
    <Typography variant="paragraph-mini" role="alert" className="text-destructive">
      {ineligibilityText}
    </Typography>
  ) : (
    <Typography variant="paragraph-mini" color="muted" data-testid="safe-account-helper-text">
      {getEligibilityCopy(false).helperText}
    </Typography>
  )

  if (isTile && fixed && selectedAccount) {
    return (
      <div className={wrapperClass} data-m2-new="New · Safe account tile (fixed)">
        <Typography variant="paragraph-bold">Safe account</Typography>
        <div className={cn('flex min-h-16 w-full items-center rounded-lg bg-card py-1.5', FIELD_PADDING)}>
          <SpreadAccountSummary account={selectedAccount} />
        </div>
      </div>
    )
  }

  if (readOnly && selectedAccount) {
    return (
      <div className={wrapperClass} data-m2-new="M1 copy · Account select (read-only)">
        {label}

        {/* No copy button: SafeAddress's tooltip already copies. */}
        <div
          id={fieldId}
          data-testid="safe-account-readonly"
          // The chevron's 24px stays empty so the columns don't move.
          className={cn(
            'border-border bg-input flex min-h-16 w-full cursor-not-allowed items-center gap-2 rounded-lg border py-1.5 pr-9 pl-[18px] shadow-xs',
            surfaceClass,
          )}
        >
          <span className="flex min-w-0 flex-1 opacity-50">
            {isTile ? <SpreadAccountSummary account={selectedAccount} /> : <AccountSummary account={selectedAccount} />}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={wrapperClass} data-m2-new="M1 copy · Account select">
      {label}

      <Select
        value={value || null}
        onValueChange={(next) => {
          if (next != null) onChange(next)
        }}
      >
        <SelectTrigger
          id={fieldId}
          aria-label={ACCOUNT_FIELD_LABEL}
          aria-invalid={ineligibilityText ? true : undefined}
          data-testid="safe-account-selector"
          // A plain `min-h-16` loses to SelectTrigger's own height; the `data-[size=default]` prefix is its escape hatch.
          // eslint-disable-next-line no-restricted-syntax -- two-line account trigger is taller than any SelectTrigger size
          className={cn('w-full rounded-lg data-[size=default]:min-h-16', FIELD_PADDING, surfaceClass)}
        >
          <SelectValue render={<div />} className={TRIGGER_CONTENT_HEIGHT}>
            {() =>
              selectedAccount ? (
                isTile ? (
                  <SpreadAccountSummary account={selectedAccount} />
                ) : (
                  <AccountSummary account={selectedAccount} />
                )
              ) : (
                <span className={cn('flex min-w-0 items-center gap-3', TRIGGER_CONTENT_HEIGHT)}>
                  <span className="bg-muted size-8 shrink-0 rounded-full" />
                  <span className="text-muted-foreground">{SAFE_ACCOUNT_SELECTOR_PLACEHOLDER}</span>
                </span>
              )
            }
          </SelectValue>
        </SelectTrigger>

        <SelectContent
          className={cn('max-h-80', DROPDOWN_RADIUS)}
          data-m2-dropdown=""
          data-m2-new="M1 copy · Account dropdown"
          data-m2-new-corner="end"
          alignItemWithTrigger={false}
          side="bottom"
          collisionAvoidance={{ side: 'none' }}
        >
          {notice && (
            <M2Alert
              tone="info"
              title={notice.title}
              description={notice.description}
              className={cn('mb-1 w-auto', INNER_RADIUS)}
            />
          )}

          {accounts.map((entry) =>
            isSafeAccountGroup(entry) ? (
              <SelectGroup key={entry.address}>
                <AccountGroupHeader group={entry} />
                {entry.accounts.map((account) => (
                  <AccountChainRow key={account.id} account={account} />
                ))}
              </SelectGroup>
            ) : (
              <AccountRow key={entry.id} account={entry} />
            ),
          )}
        </SelectContent>
      </Select>

      {helper}
    </div>
  )
}
