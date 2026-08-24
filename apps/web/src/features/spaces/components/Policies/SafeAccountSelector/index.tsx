import { useId, useMemo, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import InlineRetryError from '@/components/common/InlineRetryError'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import NoEligibleAccounts from './components/NoEligibleAccounts'
import SafeAccountGroupHeader from './components/SafeAccountGroupHeader'
import SafeAccountRow, {
  SafeAccountChainRow,
  SafeAccountRowSkeleton,
  SafeAccountSummary,
} from './components/SafeAccountRow'
import { ELIGIBILITY_HELPER_TEXT, SAFE_ACCOUNT_SELECTOR_LABEL, SAFE_ACCOUNT_SELECTOR_PLACEHOLDER } from './constants'
import { isSafeAccountGroup, type SafeAccountEntry } from './types'

export type SafeAccountSelectorProps = {
  /** Already filtered and grouped — see `useEligibleSafeAccounts`. */
  accounts: SafeAccountEntry[]
  /** `${chainId}:${address}` */
  value?: string
  onChange: (value: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  disabled?: boolean
  label?: string
  helperText?: ReactNode
  /** Defaults to `useConnectWallet()`. */
  onSwitchWallet?: () => void
  /** Replaces the helper text when set. */
  errorMessage?: string
  name?: string
  id?: string
}

const SKELETON_ROW_COUNT = 3

/** Height of the picked state's two-line identity. Every state reserves it so the field never jumps. */
const TRIGGER_CONTENT_HEIGHT = 'min-h-9'

/**
 * Safe-account picker for the policy flows. Controlled and form-library agnostic — wrap it in whatever
 * the flow uses. Chain scoping is the caller's job: pre-filter `accounts`.
 */
const SafeAccountSelector = ({
  accounts,
  value,
  onChange,
  isLoading = false,
  isError = false,
  onRetry,
  disabled = false,
  label = SAFE_ACCOUNT_SELECTOR_LABEL,
  helperText = ELIGIBILITY_HELPER_TEXT,
  onSwitchWallet,
  errorMessage,
  name,
  id,
}: SafeAccountSelectorProps) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const connectWallet = useConnectWallet()

  // The popup unmounts while closed, so the trigger cannot read a row's label. An unknown `value` falls
  // through to the placeholder rather than rendering a stale name.
  const selectedAccount = useMemo(() => {
    if (!value) return undefined
    return accounts
      .flatMap((entry) => (isSafeAccountGroup(entry) ? entry.accounts : [entry]))
      .find((account) => account.id === value)
  }, [accounts, value])

  const renderPopupContent = () => {
    if (isLoading) {
      return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => <SafeAccountRowSkeleton key={index} />)
    }

    if (isError) {
      return <InlineRetryError message="Failed to load Safe Accounts" onRetry={onRetry} />
    }

    if (accounts.length === 0) {
      return <NoEligibleAccounts onSwitchWallet={onSwitchWallet ?? connectWallet} />
    }

    return accounts.map((entry) =>
      isSafeAccountGroup(entry) ? (
        <SelectGroup key={entry.address}>
          <SafeAccountGroupHeader group={entry} />
          {entry.accounts.map((account) => (
            <SafeAccountChainRow key={account.id} account={account} />
          ))}
        </SelectGroup>
      ) : (
        <SafeAccountRow key={entry.id} account={entry} />
      ),
    )
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>

      <Select
        value={value || null}
        onValueChange={(next) => {
          if (next != null) onChange(next)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          name={name}
          aria-label={label}
          aria-invalid={errorMessage ? true : undefined}
          data-testid="safe-account-selector"
          className="w-full"
        >
          {isLoading ? (
            <span className={cn('flex min-w-0 items-center gap-3', TRIGGER_CONTENT_HEIGHT)}>
              <Skeleton data-testid="safe-account-avatar-skeleton" className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </span>
          ) : (
            // This wrapper computes to `flow-root`, so alignment set here would not reach its children:
            // each branch fills the reserved height and centres its own.
            <SelectValue render={<div />} className={TRIGGER_CONTENT_HEIGHT}>
              {() =>
                selectedAccount ? (
                  <SafeAccountSummary account={selectedAccount} />
                ) : (
                  <span className={cn('flex min-w-0 items-center gap-3', TRIGGER_CONTENT_HEIGHT)}>
                    {/* Static, not a skeleton: nothing is loading — the field is simply unfilled. */}
                    <span
                      data-testid="safe-account-avatar-placeholder"
                      className="bg-muted size-8 shrink-0 rounded-full"
                    />
                    <span className="text-muted-foreground">{SAFE_ACCOUNT_SELECTOR_PLACEHOLDER}</span>
                  </span>
                )
              }
            </SelectValue>
          )}
        </SelectTrigger>

        <SelectContent className="max-h-80" alignItemWithTrigger={false}>
          {renderPopupContent()}
        </SelectContent>
      </Select>

      {errorMessage ? (
        <Typography variant="paragraph-mini" role="alert" className="text-destructive">
          {errorMessage}
        </Typography>
      ) : (
        <Typography variant="paragraph-mini" color="muted" data-testid="safe-account-helper-text">
          {helperText}
        </Typography>
      )}
    </div>
  )
}

export default SafeAccountSelector
