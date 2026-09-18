import { useCallback, useMemo, type ReactElement } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import AddressBookInput from '@/components/common/AddressBookInput'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldDescription } from '@/components/ui/field'
import TokenLimitCard from './TokenLimitCard'
import { validateUniqueSpender } from '../utils/validation'
import { createEmptyLimit, limitsPath, spenderAddressPath, type SpendingLimitPolicyFormValues } from '../types'
import {
  ADD_TOKEN_LABEL,
  REMOVE_SPENDER_LABEL,
  SPENDER_HELPER_TEXT,
  SPENDER_LABEL,
  SPENDER_PLACEHOLDER,
} from '../constants'

/** Figma draws the remove glyph at lucide's 1.5 stroke, not its default 2. */
const ICON_STROKE_WIDTH = 1.5

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

  // Hide the spenders already in the policy, as a limit row hides its siblings' tokens. RHF returns
  // the same mutated array every render, so key on the values.
  const otherSpendersKey = (watch('spenders') ?? [])
    .map((spender) => spender?.address ?? '')
    .filter((_, index) => index !== spenderIndex)
    .join(',')
  const excludeAddresses = useMemo(() => otherSpendersKey.split(',').filter(Boolean), [otherSpendersKey])

  return (
    <Card variant="muted" size="none" radius="xl" className="relative" data-testid="spender-card">
      {/* `Card` takes spacing only through `size`/`radius`, so the padding lives on this div. */}
      <div className="flex flex-col gap-4 p-4">
        {removable && (
          <Button
            type="button"
            variant="ghost-destructive"
            size="icon-circle"
            aria-label={REMOVE_SPENDER_LABEL}
            onClick={onRemove}
            data-testid="remove-spender-btn"
            /* The address field's wrapper follows this in the DOM and would otherwise paint over it. */
            className="absolute top-2 right-2 z-10"
          >
            <Trash2 strokeWidth={ICON_STROKE_WIDTH} />
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
            <TokenLimitCard
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
