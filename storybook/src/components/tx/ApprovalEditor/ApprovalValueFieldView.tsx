import type { Ref } from 'react'
import type { Approval } from '@safe-global/utils/services/security/modules/ApprovalModule'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import css from './styles.module.css'
import { approvalMethodDescription } from './ApprovalItemView'
import InfoIcon from '@/public/images/notifications/info.svg'
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type ApprovalValueFieldViewProps = {
  name: string
  inputId: string
  readOnly: boolean
  value: string | undefined
  inputRef: Ref<HTMLInputElement>
  onBlur: () => void
  onInputChange: (next: string) => void
  selectValues: string[]
  errorMessage?: string
  hasError: boolean
  isDirty: boolean
  method: Approval['method']
  symbol: string
  tokenType?: Balance['tokenInfo']['type']
  showAmountTooltip: boolean
}

export const ApprovalValueFieldView = ({
  name,
  inputId,
  readOnly,
  value,
  inputRef,
  onBlur,
  onInputChange,
  selectValues,
  errorMessage,
  hasError,
  isDirty,
  method,
  symbol,
  tokenType,
  showAmountTooltip,
}: ApprovalValueFieldViewProps) => {
  const helperText = errorMessage ?? (isDirty ? 'Save to apply changes' : '')
  const labelText = approvalMethodDescription[method](symbol, tokenType)

  return (
    <Combobox
      items={selectValues}
      // Bound alongside `inputValue`: Base UI resets the input to the selected value on close.
      value={value ?? ''}
      onValueChange={(next) => onInputChange(typeof next === 'string' ? next : '')}
      inputValue={value ?? ''}
      onInputValueChange={onInputChange}
      // Always surface the presets regardless of the typed value
      filter={() => true}
      readOnly={readOnly}
      inputRef={inputRef}
    >
      <Field data-invalid={hasError}>
        <FieldLabel htmlFor={inputId} className={hasError ? 'text-destructive' : undefined}>
          {showAmountTooltip ? (
            <span className="inline-flex items-center gap-1">
              {labelText}
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex" />}>
                  <InfoIcon className="size-4 text-[var(--color-border-main)]" />
                </TooltipTrigger>
                <TooltipContent>Enter a decimal amount (e.g. 1.5), not a raw wei value.</TooltipContent>
              </Tooltip>
            </span>
          ) : (
            labelText
          )}
        </FieldLabel>

        <ComboboxInput
          id={inputId}
          name={name}
          readOnly={readOnly}
          showTrigger={!readOnly}
          autoComplete="off"
          aria-invalid={hasError}
          onBlur={onBlur}
          onFocus={(event) => {
            if (!readOnly) {
              event.target.select()
            }
          }}
          className={cn('w-full', css.approvalAmount)}
        />

        {!readOnly && (
          <ComboboxContent>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        )}

        {helperText && (
          <FieldDescription className={hasError ? 'text-destructive' : undefined}>{helperText}</FieldDescription>
        )}
      </Field>
    </Combobox>
  )
}
