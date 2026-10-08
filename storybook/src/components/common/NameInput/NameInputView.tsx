import type { ComponentProps, InputHTMLAttributes, ReactElement, ReactNode, Ref } from 'react'
import { Field, FieldDescription, FieldError as FieldErrorText, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

export type NameInputControlProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  ref?: Ref<HTMLInputElement>
}

export type NameInputViewProps = {
  id: string
  label?: ReactNode
  placeholder?: string
  required: boolean
  validateCharset: boolean
  fieldError?: { type?: string; message?: string }
  helperText?: ReactNode
  helperTextId?: string
  inputProps: NameInputControlProps
  hasAdornment: boolean
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  inputClassName?: string
  inputSize?: ComponentProps<typeof Input>['inputSize']
  variant?: ComponentProps<typeof Input>['variant']
  fieldClassName?: string
  errorPlacement?: ComponentProps<typeof Field>['errorPlacement']
}

export function NameInputView({
  id,
  label,
  placeholder,
  required,
  validateCharset,
  fieldError,
  helperText,
  helperTextId,
  inputProps,
  hasAdornment,
  startAdornment,
  endAdornment,
  inputClassName,
  inputSize,
  variant,
  fieldClassName,
  errorPlacement,
}: NameInputViewProps): ReactElement {
  const legacyLabel = fieldError?.type === 'maxLength' ? 'Maximum 50 symbols' : fieldError?.message || label
  const resolvedLabel = validateCharset ? label : legacyLabel
  const controlProps = { ...inputProps, placeholder: placeholder ?? (required ? undefined : 'Optional') }

  const inputControl = hasAdornment ? (
    <InputGroup inputSize={inputSize} variant={variant} className={inputClassName}>
      {startAdornment && <InputGroupAddon align="inline-start">{startAdornment}</InputGroupAddon>}
      <InputGroupInput {...controlProps} />
      {endAdornment && <InputGroupAddon align="inline-end">{endAdornment}</InputGroupAddon>}
    </InputGroup>
  ) : (
    <Input inputSize={inputSize} variant={variant} className={inputClassName} {...controlProps} />
  )

  return (
    <Field className={fieldClassName} errorPlacement={errorPlacement} data-invalid={Boolean(fieldError) || undefined}>
      {resolvedLabel != null && resolvedLabel !== '' && (
        <FieldLabel htmlFor={id} className={fieldError ? 'text-destructive' : undefined}>
          {resolvedLabel}
        </FieldLabel>
      )}

      {inputControl}

      {helperText ? (
        // In `validateCharset` mode the validation message lands here rather than in the label,
        // so it has to go through the error slot to read as a failure and not as a hint.
        fieldError ? (
          <FieldErrorText id={helperTextId}>{helperText}</FieldErrorText>
        ) : (
          <FieldDescription id={helperTextId}>{helperText}</FieldDescription>
        )
      ) : null}
    </Field>
  )
}
