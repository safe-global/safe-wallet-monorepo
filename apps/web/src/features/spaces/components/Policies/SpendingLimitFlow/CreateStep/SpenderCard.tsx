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
  const { control, getValues } = useFormContext<SpendingLimitPolicyFormValues>()
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
            className="absolute top-2 right-2"
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
