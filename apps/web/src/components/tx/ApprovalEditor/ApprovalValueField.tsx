import { _formatNumber } from '@/components/common/NumberField'
import { validateAmount, validateDecimalLength } from '@safe-global/utils/utils/validation'
import { useController, useFormContext } from 'react-hook-form'
import type { ApprovalInfo } from './hooks/useApprovalInfos'
import css from './styles.module.css'
import { PSEUDO_APPROVAL_VALUES } from './utils/approvals'
import { approvalMethodDescription } from './ApprovalItem'
import InfoIcon from '@/public/images/notifications/info.svg'
import { TokenType } from '@safe-global/store/gateway/types'
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export const ApprovalValueField = ({ name, tx, readOnly }: { name: string; tx: ApprovalInfo; readOnly: boolean }) => {
  const { control } = useFormContext()
  const selectValues: string[] = Object.values(PSEUDO_APPROVAL_VALUES)
  const {
    field: { ref, onBlur, onChange, value },
    fieldState,
  } = useController({
    name,
    control,
    rules: {
      required: true,
      validate: (val) => {
        if (selectValues.includes(val)) {
          return undefined
        }
        const decimals = tx.tokenInfo?.decimals
        return validateAmount(val, true) || validateDecimalLength(val, decimals)
      },
    },
  })

  const helperText = fieldState.error?.message ?? (fieldState.isDirty ? 'Save to apply changes' : '')
  const hasError = !!fieldState.error

  const symbol = tx.tokenInfo?.symbol ?? ''
  const labelText = approvalMethodDescription[tx.method](symbol)
  const showAmountTooltip = tx.tokenInfo?.type === TokenType.ERC20
  const inputId = `${name}-approval-amount`

  // On free-text entry, reformat the number; preset values (e.g. "Unlimited amount") pass through untouched.
  const handleInputChange = (next: string) => {
    onChange(selectValues.includes(next) ? next : _formatNumber(next))
  }

  return (
    <Combobox
      items={selectValues}
      inputValue={value ?? ''}
      onInputValueChange={handleInputChange}
      readOnly={readOnly}
      inputRef={ref}
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
