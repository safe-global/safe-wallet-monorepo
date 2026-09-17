import { useCallback, useMemo, type ReactElement } from 'react'
import { Plus, X } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import AddressBookInput from '@/components/common/AddressBookInput'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldDescription } from '@/components/ui/field'
import LimitRow from './LimitRow'
import { validateUniqueSpender } from '../utils/validation'
import { createEmptyLimit, limitsPath, spenderAddressPath, type SpendingLimitPolicyFormValues } from '../types'
import {
  ADD_TOKEN_LABEL,
  REMOVE_SPENDER_LABEL,
  SPENDER_HELPER_TEXT,
  SPENDER_LABEL,
  SPENDER_PLACEHOLDER,
} from '../constants'

export type SpenderCardProps = {
  spenderIndex: number
  /** How many spenders the policy has — the other spenders' address paths are this card's validation deps. */
  spenderCount: number
  removable: boolean
  onRemove: () => void
}

/** One spender with its own limit rows and its own "Add token". Renders inside the form's `FormProvider`. */
const SpenderCard = ({ spenderIndex, spenderCount, removable, onRemove }: SpenderCardProps): ReactElement => {
  const { control, getValues, watch } = useFormContext<SpendingLimitPolicyFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: limitsPath(spenderIndex) })

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
      validateUniqueSpender(
        address,
        (getValues('spenders') ?? []).map((spender) => spender.address).filter((_, index) => index !== spenderIndex),
      ),
    [getValues, spenderIndex],
  )

  // Keep the spenders already in the policy out of the suggestions, the way a limit row hides the
  // tokens its siblings use. RHF hands back the same mutated array every render, so key on the values.
  const otherSpendersKey = (watch('spenders') ?? [])
    .map((spender) => spender?.address ?? '')
    .filter((_, index) => index !== spenderIndex)
    .join(',')
  const excludeAddresses = useMemo(() => otherSpendersKey.split(',').filter(Boolean), [otherSpendersKey])

  return (
    <Card variant="muted" size="none" radius="xl" className="relative" data-testid="spender-card">
      {/* Card owns spacing/surface/radius; the visual gap/padding lives on this plain div. */}
      <div className="flex flex-col gap-4 p-4">
        {removable && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={REMOVE_SPENDER_LABEL}
            onClick={onRemove}
            data-testid="remove-spender-btn"
            /* z-10: the address field's wrapper is `position: relative` and follows this button in the
               DOM, so without it that wrapper's full-width label paints over the button and swallows
               the click everywhere but its top and bottom edges. */
            className="absolute top-2 right-2 z-10"
          >
            <X />
          </Button>
        )}

        <div className="flex flex-col gap-1">
          <AddressBookInput
            name={spenderAddressPath(spenderIndex)}
            label={SPENDER_LABEL}
            placeholder={SPENDER_PLACEHOLDER}
            validate={validateSpender}
            deps={otherSpenderPaths}
            excludeAddresses={excludeAddresses}
            data-testid="spender-address-input"
          />
          <FieldDescription>{SPENDER_HELPER_TEXT}</FieldDescription>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <LimitRow
              key={field.id}
              spenderIndex={spenderIndex}
              limitIndex={index}
              limitCount={fields.length}
              removable={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => append(createEmptyLimit())}
            data-testid="add-token-btn"
          >
            <Plus />
            {ADD_TOKEN_LABEL}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default SpenderCard
