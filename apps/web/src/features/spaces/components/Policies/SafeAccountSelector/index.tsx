import { useId, useMemo, type ReactNode } from 'react'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'
import { cn } from '@/utils/cn'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import LoadError from '../components/LoadError'
import { SKELETON_ROW_COUNT } from '../constants'
import NoEligibleAccounts from './components/NoEligibleAccounts'
import SafeAccountGroupHeader from './components/SafeAccountGroupHeader'
import SafeAccountRow, {
  SafeAccountChainRow,
  SafeAccountRowSkeleton,
  SafeAccountSummary,
} from './components/SafeAccountRow'
import {
  getEligibilityCopy,
  INELIGIBILITY_TEXT,
  SAFE_ACCOUNT_SELECTOR_LABEL,
  SAFE_ACCOUNT_SELECTOR_PLACEHOLDER,
} from './constants'
import { isSafeAccountGroup, type SafeAccountEntry } from './types'
import { findSafeAccount } from './utils'

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
  /**
   * Shows the picked account without offering the others, dimmed so it reads as a field that cannot be
   * edited. Not the `Select`'s own `disabled`, which would swallow the pointer events the copy button
   * needs; the dimming is applied to the account, and the copy button stays live beside it.
   */
  readOnly?: boolean
  label?: string
  /** Must match the rule `accounts` was filtered by. */
  signersOnly?: boolean
  helperText?: ReactNode
  /** Defaults to `useConnectWallet()`. Also serves the disconnected state's action. */
  onSwitchWallet?: () => void
  /** False swaps the empty state for a connect prompt. */
  hasWallet?: boolean
  /** Replaces the helper text when set. */
  errorMessage?: string
  name?: string
  id?: string
}

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
  readOnly = false,
  label = SAFE_ACCOUNT_SELECTOR_LABEL,
  signersOnly = false,
  helperText = getEligibilityCopy(signersOnly).helperText,
  onSwitchWallet,
  hasWallet = true,
  errorMessage,
  name,
  id,
}: SafeAccountSelectorProps) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const connectWallet = useConnectWallet()

  // The popup unmounts while closed, so the trigger cannot read a row's label. An unknown `value` falls
  // through to the placeholder rather than rendering a stale name.
  const selectedAccount = useMemo(() => findSafeAccount(accounts, value), [accounts, value])
  const ineligibilityText = selectedAccount?.ineligibleReason && INELIGIBILITY_TEXT[selectedAccount.ineligibleReason]
  const shownError = errorMessage ?? ineligibilityText

  const renderPopupContent = () => {
    if (isLoading) {
      return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => <SafeAccountRowSkeleton key={index} />)
    }

    if (isError) {
      return <LoadError onRetry={onRetry} />
    }

    if (accounts.length === 0) {
      return (
        <NoEligibleAccounts
          hasWallet={hasWallet}
          signersOnly={signersOnly}
          onSwitchWallet={onSwitchWallet ?? connectWallet}
        />
      )
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

  const helper = shownError ? (
    <Typography variant="paragraph-mini" role="alert" className="text-destructive">
      {shownError}
    </Typography>
  ) : (
    <Typography variant="paragraph-mini" color="muted" data-testid="safe-account-helper-text">
      {helperText}
    </Typography>
  )

  if (readOnly && selectedAccount) {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor={fieldId}>{label}</Label>

        {/* The trigger's own skin, minus the hover and the chevron: it is a field, not a control — and so
            carries no `aria-disabled`, which Chrome propagates onto the copy button and would kill it. */}
        <div
          id={fieldId}
          data-testid="safe-account-readonly"
          className="border-border bg-input flex min-h-9 w-full cursor-not-allowed items-center gap-2 rounded-md border px-3 py-1.5 shadow-xs"
        >
          {/* The summary brings its own tooltip with the whole address, which is what gets checked before signing. */}
          <span className="flex min-w-0 flex-1 opacity-50">
            <SafeAccountSummary account={selectedAccount} />
          </span>

          <CopyAddressIconButton address={selectedAccount.address} />
        </div>

        {helper}
      </div>
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
        // On the root, not the trigger: the root owns the hidden input a form submits.
        name={name}
      >
        <SelectTrigger
          id={fieldId}
          aria-label={label}
          aria-invalid={shownError ? true : undefined}
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

      {helper}
    </div>
  )
}

export default SafeAccountSelector
