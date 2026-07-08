import { useMemo, useState } from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { isMultiChainSafeItem, type AllSafeItems, type MultiChainSafeItem } from '@/hooks/safes'
import type { AccountLine } from '@/features/myAccounts'
import { SAFE_ACCOUNTS_LIMIT } from '../../../constants'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../constants'
import type { AddAccountsFormValues } from '../../../hooks/useSelectAll.types'

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

  const selectedKeys = useMemo(
    () =>
      new Set(
        Object.entries(selectedSafes)
          .filter(([key, value]) => value && !key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX))
          .map(([key]) => key),
      ),
    [selectedSafes],
  )

  // Total checked leaves across both sections count toward the per-workspace cap.
  const isAtLimit = selectedKeys.size >= SAFE_ACCOUNTS_LIMIT

  const applyToggle = (line: AccountLine, nextChecked: boolean) => {
    if (line.variant === 'group') {
      const group = line.source as MultiChainSafeItem
      setValue(`selectedSafes.${MULTICHAIN_SAFE_KEY_PREFIX}${group.address}`, nextChecked, { shouldValidate: true })
      group.safes.forEach((safe) =>
        setValue(`selectedSafes.${safe.chainId}:${safe.address}`, nextChecked, { shouldValidate: true }),
      )
      return
    }

    setValue(`selectedSafes.${line.key}`, nextChecked, { shouldValidate: true })

    // Reconcile the multi-chain parent key when a child leaf is toggled individually.
    const parent = items.find(
      (item): item is MultiChainSafeItem =>
        isMultiChainSafeItem(item) && item.safes.some((safe) => `${safe.chainId}:${safe.address}` === line.key),
    )
    if (parent) {
      const allChecked = parent.safes.every((safe) => {
        const key = `${safe.chainId}:${safe.address}`
        return key === line.key ? nextChecked : Boolean(selectedSafes?.[key])
      })
      setValue(`selectedSafes.${MULTICHAIN_SAFE_KEY_PREFIX}${parent.address}`, allChecked, { shouldValidate: true })
    }
  }

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
