import { useId, useMemo, type ReactNode } from 'react'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import type { SafeAccountEntry } from '@views/features/spaces/components/Policies/SafeAccountSelector/types'
import { SafeAccountSelectorView } from '@views/features/spaces/components/Policies/SafeAccountSelector/SafeAccountSelectorView'
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
  /** Dimmed, but not the `Select`'s `disabled`, which would swallow the pointer events the copy button needs. */
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
  /** Pinned above the options, so it is read before a Safe is picked. */
  notice?: { title: ReactNode; description: ReactNode }
  name?: string
  id?: string
}

/**
 * Safe-account picker for the policy flows. Controlled and form-library agnostic — wrap it in whatever
 * the flow uses. Chain scoping is the caller's job: pre-filter `accounts`.
 */
const SafeAccountSelector = ({ accounts, value, onSwitchWallet, id, ...props }: SafeAccountSelectorProps) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const connectWallet = useConnectWallet()

  // The popup unmounts while closed, so the trigger cannot read a row's label. An unknown `value` falls
  // through to the placeholder rather than rendering a stale name.
  const selectedAccount = useMemo(() => findSafeAccount(accounts, value), [accounts, value])

  return (
    <SafeAccountSelectorView
      {...props}
      accounts={accounts}
      value={value}
      selectedAccount={selectedAccount}
      fieldId={fieldId}
      onSwitchWallet={onSwitchWallet ?? connectWallet}
    />
  )
}

export default SafeAccountSelector
