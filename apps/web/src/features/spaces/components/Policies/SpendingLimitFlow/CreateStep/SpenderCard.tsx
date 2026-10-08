import { useCallback, useMemo, type ReactElement } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { addressIsNotCurrentSafe, addressIsNotReserved } from '@safe-global/utils/utils/validation'
import AddressBookInput from '@/components/common/AddressBookInput'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import { useIsEditMode } from '@views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import TokenLimitCard from './TokenLimitCard'
import { validateUniqueSpender } from '../utils/validation'
import {
  createEmptyLimit,
  limitsPath,
  spenderAddressPath,
  type SpendingLimitPolicyFormValues,
} from '@views/features/spaces/components/Policies/SpendingLimitFlow/types'
import {
  SPENDER_IS_SAFE_ERROR,
  SPENDER_RESERVED_ERROR,
} from '@views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { SpenderCardView } from '@views/features/spaces/components/Policies/SpendingLimitFlow/CreateStep/SpenderCardView'

export type SpenderCardProps = {
  spenderIndex: number
  /** The other spenders' address paths become this card's validation deps. */
  spenderCount: number
  removable: boolean
  onRemove: () => void
}

const SpenderCard = ({ spenderIndex, spenderCount, removable, onRemove }: SpenderCardProps): ReactElement => {
  const { control, getValues, watch } = useFormContext<SpendingLimitPolicyFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: limitsPath(spenderIndex) })
  const isEditMode = useIsEditMode()
  const { safeAddress } = useSafeInfo()
  const { limits: existingLimits } = useExistingSpendingLimits()
  const address = watch(spenderAddressPath(spenderIndex)) ?? ''
  // On chain there is no renaming a delegate: changing who it is means removing one and adding another.
  const isFixed = isEditMode && (existingLimits ?? []).some((limit) => sameAddress(limit.beneficiary, address))

  const otherSpenderPaths = useMemo(
    () =>
      Array.from({ length: spenderCount }, (_, index) => spenderAddressPath(index)).filter(
        (_, index) => index !== spenderIndex,
      ),
    [spenderCount, spenderIndex],
  )

  // Read the other spenders at validation time, not from a memo one render behind.
  const validateSpender = useCallback(
    (address: string) =>
      addressIsNotReserved(SPENDER_RESERVED_ERROR)(address) ??
      addressIsNotCurrentSafe(safeAddress, SPENDER_IS_SAFE_ERROR)(address) ??
      validateUniqueSpender(
        address,
        (getValues('spenders') ?? []).map((spender) => spender.address).filter((_, index) => index !== spenderIndex),
      ),
    [getValues, spenderIndex, safeAddress],
  )

  // Hide the spenders already in the policy, as a limit row hides its siblings' tokens. RHF returns
  // the same mutated array every render, so key on the values.
  const otherSpendersKey = (watch('spenders') ?? [])
    .map((spender) => spender?.address ?? '')
    .filter((_, index) => index !== spenderIndex)
    .join(',')
  const excludeAddresses = useMemo(() => otherSpendersKey.split(',').filter(Boolean), [otherSpendersKey])

  return (
    <SpenderCardView
      removable={removable}
      onRemove={onRemove}
      isFixed={isFixed}
      renderAddressInput={({ label, placeholder }) => (
        <AddressBookInput
          name={spenderAddressPath(spenderIndex)}
          label={label}
          placeholder={placeholder}
          validate={validateSpender}
          deps={otherSpenderPaths}
          excludeAddresses={excludeAddresses}
          disabled={isFixed}
          data-testid="spender-address-input"
        />
      )}
      limits={fields.map((field, index) => (
        <TokenLimitCard
          key={field.id}
          spenderIndex={spenderIndex}
          limitIndex={index}
          limitCount={fields.length}
          removable={fields.length > 1}
          onRemove={() => remove(index)}
        />
      ))}
      onAddToken={() => append(createEmptyLimit())}
    />
  )
}

export default SpenderCard
