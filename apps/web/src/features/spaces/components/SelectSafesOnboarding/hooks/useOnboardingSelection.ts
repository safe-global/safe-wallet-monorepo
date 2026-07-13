import { useMemo, useState } from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { type AllSafeItems } from '@/hooks/safes'
import type { AccountLine } from '@/features/myAccounts'
import { SAFE_ACCOUNTS_LIMIT } from '../../../constants'
import { applySafeSelectionToggle, getSelectedLeafKeys } from '../utils/selection'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'

interface Args {
  /** Combined trusted + owned visible items, used to reconcile multi-chain parents. */
  items: AllSafeItems
  control: Control<AddAccountsFormValues>
  setValue: UseFormSetValue<AddAccountsFormValues>
  /** Lowercased owned addresses flagged as similar — selecting one requires confirmation. */
  flaggedOwnedAddresses: Set<string>
}

/**
 * Bridges the accounts table's leaf-key selection model to the onboarding form's
 * `selectedSafes` record, reconciling multi-chain parent keys, and gates selection of
 * address-poisoning-flagged owned safes behind a confirmation dialog.
 */
const useOnboardingSelection = ({ items, control, setValue, flaggedOwnedAddresses }: Args) => {
  const selectedSafes = useWatch({ control, name: 'selectedSafes' }) ?? {}
  const [pendingConfirmation, setPendingConfirmation] = useState<AccountLine | null>(null)

  const selectedKeys = useMemo(() => getSelectedLeafKeys(selectedSafes), [selectedSafes])

  // Total checked leaves across both sections count toward the per-workspace cap.
  const isAtLimit = selectedKeys.size >= SAFE_ACCOUNTS_LIMIT

  const applyToggle = (line: AccountLine, nextChecked: boolean) =>
    applySafeSelectionToggle(setValue, items, selectedSafes, line, nextChecked)

  const handleToggle = (line: AccountLine, nextChecked: boolean) => {
    // Selecting a flagged owned safe needs explicit confirmation first (address-poisoning defence).
    if (nextChecked && flaggedOwnedAddresses.has(line.address.toLowerCase())) {
      setPendingConfirmation(line)
      return
    }
    applyToggle(line, nextChecked)
  }

  const confirmPending = () => {
    if (pendingConfirmation) applyToggle(pendingConfirmation, true)
    setPendingConfirmation(null)
  }

  const cancelPending = () => setPendingConfirmation(null)

  return { selectedKeys, isAtLimit, handleToggle, pendingConfirmation, confirmPending, cancelPending }
}

export default useOnboardingSelection
