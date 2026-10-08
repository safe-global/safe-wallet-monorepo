import type { ReactElement, ReactNode } from 'react'
import { CalendarClock, X } from 'lucide-react'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import FiatValue from '@/components/common/FiatValue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ResetTimeOption } from '@/features/spending-limits/constants'
import {
  EXISTING_LIMIT_TOOLTIP,
  FREQUENCY_LABEL,
  LIMIT_AMOUNT_LABEL,
  LIMIT_AMOUNT_PLACEHOLDER,
  REMOVE_LIMIT_LABEL,
} from '../constants'

/** Figma draws the remove glyph at lucide's 1.5 stroke, not its default 2. */
const ICON_STROKE_WIDTH = 1.5

export type TokenSelectorSlotProps = {
  helperText: ReactNode
  disabledAddressReason: string
}

export type AmountFieldSlotProps = {
  label: string
  placeholder: string
  helperText: ReactNode
}

export type FrequencyFieldProps = {
  name: string
  value: string
  onChange: (value: unknown) => void
  description: string
}

export type TokenLimitCardViewProps = {
  removable: boolean
  onRemove: () => void
  renderTokenSelector: (props: TokenSelectorSlotProps) => ReactNode
  tokenErrorMessage?: string
  tokenBalance?: { balance: string; decimals: number; label: string }
  renderAmountField: (props: AmountFieldSlotProps) => ReactNode
  amountErrorMessage?: string
  hasSelectedToken: boolean
  fiatValue: number | null
  renderFrequencyField: (renderField: (field: FrequencyFieldProps) => ReactElement) => ReactNode
  resetTimeOptions: ResetTimeOption[]
}

/** Holds one line even when empty, so the Frequency row does not move as the helpers come and go. */
const HelperLine = ({ children }: { children?: ReactNode }): ReactElement => (
  <span className="block min-h-lh">{children}</span>
)

const FiatLine = ({ fiat }: { fiat: number | null }): ReactElement | null => {
  if (fiat === null) return null

  return (
    <span data-testid="amount-fiat">
      <FiatValue value={fiat} />
    </span>
  )
}

export const TokenLimitCardView = ({
  removable,
  onRemove,
  renderTokenSelector,
  tokenErrorMessage,
  tokenBalance,
  renderAmountField,
  amountErrorMessage,
  hasSelectedToken,
  fiatValue,
  renderFrequencyField,
  resetTimeOptions,
}: TokenLimitCardViewProps): ReactElement => (
  <Card variant="muted-nested" size="none" radius="lg" className="relative" data-testid="token-limit-card">
    {/* Corner-pinned so it never narrows the two fields. */}
    {removable && (
      <Button
        type="button"
        variant="ghost-destructive"
        size="icon-circle"
        aria-label={REMOVE_LIMIT_LABEL}
        onClick={onRemove}
        data-testid="remove-limit-btn"
        className="absolute top-2 right-2"
      >
        <X strokeWidth={ICON_STROKE_WIDTH} />
      </Button>
    )}

    {/* `Card` takes spacing only through `size`/`radius`, so the padding lives on this div. */}
    <div className="flex flex-col gap-3 p-3">
      {/* Both columns bring their own label and helper via `Field`, so they line up with no spacing here. */}
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          {renderTokenSelector({
            disabledAddressReason: EXISTING_LIMIT_TOOLTIP,
            helperText: (
              <HelperLine>
                {tokenErrorMessage ? (
                  <span data-testid="token-error">{tokenErrorMessage}</span>
                ) : tokenBalance ? (
                  <span data-testid="token-balance">
                    {formatVisualAmount(tokenBalance.balance, tokenBalance.decimals)} {tokenBalance.label}
                  </span>
                ) : null}
              </HelperLine>
            ),
          })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {renderAmountField({
            label: LIMIT_AMOUNT_LABEL,
            placeholder: LIMIT_AMOUNT_PLACEHOLDER,
            helperText: (
              <HelperLine>
                {amountErrorMessage ? amountErrorMessage : hasSelectedToken ? <FiatLine fiat={fiatValue} /> : null}
              </HelperLine>
            ),
          })}
        </div>
      </div>

      {renderFrequencyField(({ name, value, onChange, description }) => {
        const triggerId = `${name}-frequency`
        return (
          <Field>
            <FieldLabel htmlFor={triggerId}>{FREQUENCY_LABEL}</FieldLabel>
            <Select items={resetTimeOptions} value={value} onValueChange={(next) => onChange(next)}>
              <SelectTrigger id={triggerId} className="w-full" data-testid="frequency-select">
                <CalendarClock className="text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resetTimeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} data-testid="frequency-item">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription data-testid="frequency-helper">{description}</FieldDescription>
          </Field>
        )
      })}
    </div>
  </Card>
)
