import { useMemo, useState } from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { type AllSafeItems } from '@/hooks/safes'
import type { AccountLine } from '@/features/myAccounts'
import { addressOfSafeKey, countSeats, isSpaceAtSafeLimit, type SafeLimit } from '@/utils/spaces'
import { applySafeSelectionToggle, getSelectedLeafKeys } from '../utils/selection'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'

interface Args {
  /** Combined trusted + owned visible items, used to reconcile multi-chain parents. */
  items: AllSafeItems
  control: Control<AddAccountsFormValues>
  setValue: UseFormSetValue<AddAccountsFormValues>
  /** Lowercased addresses flagged as look-alikes — selecting one requires confirmation. */
  flaggedAddresses: Set<string>
  /** Max seats (distinct addresses): null means unlimited, undefined means not known yet. */
  limit: SafeLimit
}

/**
 * Bridges the accounts table's leaf-key selection model to the onboarding form's
 * `selectedSafes` record, reconciling multi-chain parent keys, and gates selection of
 * address-poisoning-flagged safes behind a confirmation dialog.
 */
const useOnboardingSelection = ({ items, control, setValue, flaggedAddresses, limit }: Args) => {
  const selectedSafes = useWatch({ control, name: 'selectedSafes' }) ?? {}
  const [pendingConfirmation, setPendingConfirmation] = useState<AccountLine | null>(null)

  const selectedKeys = useMemo(() => getSelectedLeafKeys(selectedSafes), [selectedSafes])
  // Everything starts selected, so the seat count can sit above the cap until the user deselects down to it.
  const seatCount = useMemo(() => countSeats(Array.from(selectedKeys, addressOfSafeKey)), [selectedKeys])
  const isAtLimit = isSpaceAtSafeLimit(seatCount, limit)
  const isOverLimit = typeof limit === 'number' && seatCount > limit
  const isSelectionLocked = isAtLimit || limit === undefined

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
    isSelectionLocked,
    handleToggle,
    pendingConfirmation,
    confirmPending,
    cancelPending,
  }
}

export default useOnboardingSelection
