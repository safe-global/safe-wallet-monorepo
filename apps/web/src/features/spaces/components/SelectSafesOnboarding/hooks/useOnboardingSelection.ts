import { useMemo, useState } from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { type AllSafeItems } from '@/hooks/safes'
import type { AccountLine } from '@/features/myAccounts'
import { SAFE_ACCOUNTS_LIMIT } from '../../../constants'
import { addressOfSafeKey, countSeats } from '@/utils/spaces'
import { applySafeSelectionToggle, getSelectedLeafKeys } from '../utils/selection'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'

interface Args {
  /** Combined trusted + owned visible items, used to reconcile multi-chain parents. */
  items: AllSafeItems
  control: Control<AddAccountsFormValues>
  setValue: UseFormSetValue<AddAccountsFormValues>
  /** Lowercased addresses flagged as look-alikes — selecting one requires confirmation. */
  flaggedAddresses: Set<string>
  /** Max seats (distinct addresses); defaults to the per-Workspace cap, null means unlimited. */
  limit?: number | null
}

/**
 * Bridges the accounts table's leaf-key selection model to the onboarding form's
 * `selectedSafes` record, reconciling multi-chain parent keys, and gates selection of
 * address-poisoning-flagged safes behind a confirmation dialog.
 */
const useOnboardingSelection = ({ items, control, setValue, flaggedAddresses, limit = SAFE_ACCOUNTS_LIMIT }: Args) => {
  const selectedSafes = useWatch({ control, name: 'selectedSafes' }) ?? {}
  const [pendingConfirmation, setPendingConfirmation] = useState<AccountLine | null>(null)

  const selectedKeys = useMemo(() => getSelectedLeafKeys(selectedSafes), [selectedSafes])
  // Checked leaves across both sections count toward the cap, one seat per address however many chains. Everything
  // starts selected, so the count can sit above the cap until the user deselects down to it.
  const seatCount = useMemo(() => countSeats(Array.from(selectedKeys, addressOfSafeKey)), [selectedKeys])
  const isAtLimit = limit !== null && seatCount >= limit
  const isOverLimit = limit !== null && seatCount > limit

  const applyToggle = (line: AccountLine, nextChecked: boolean) =>
    applySafeSelectionToggle(setValue, items, selectedSafes, line, nextChecked)

  const handleToggle = (line: AccountLine, nextChecked: boolean) => {
    // Selecting a flagged safe needs explicit confirmation first (address-poisoning defence).
    if (nextChecked && flaggedAddresses.has(line.address.toLowerCase())) {
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

  return {
    selectedKeys,
    seatCount,
    isAtLimit,
    isOverLimit,
    handleToggle,
    pendingConfirmation,
    confirmPending,
    cancelPending,
  }
}

export default useOnboardingSelection
