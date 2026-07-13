import { type ComponentProps, type ReactNode, useId } from 'react'
import get from 'lodash/get'
import { Controller, type FieldError, useFormContext } from 'react-hook-form'
import { getNameValidationDisplay, sanitizeName, validateName } from '@safe-global/utils/validation/names'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

type NameInputProps = {
  name: string
  required?: boolean
  label?: ReactNode
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  helperText?: ReactNode
  'data-testid'?: string
  // Charset validation (from the shared name rules): sanitizes + validates the allowed
  // character set and surfaces a focus tooltip explaining rejected characters.
  validateCharset?: boolean
  minLength?: number
  maxLength?: number
  inputSize?: ComponentProps<typeof Input>['inputSize']
  variant?: ComponentProps<typeof Input>['variant']
  InputProps?: {
    endAdornment?: ReactNode
    startAdornment?: ReactNode
    readOnly?: boolean
    className?: string
  }
  // Accepted for backwards-compatibility with the previous MUI TextField API; no shadcn equivalent.
  InputLabelProps?: { shrink?: boolean }
}

const DEFAULT_MAX_LENGTH = 50

const NameInput = ({
  name,
  required = false,
  label,
  placeholder,
  disabled,
  autoFocus,
  className,
  helperText,
  validateCharset = false,
  minLength = 0,
  maxLength,
  inputSize,
  variant,
  InputProps,
  InputLabelProps,
  ...props
}: NameInputProps) => {
  const id = useId()
  const { formState, control } = useFormContext() || {}
  // the name can be a path: e.g. "owner.3.name"
  const fieldError = get(formState.errors, name) as FieldError | undefined

  const validationDisplay =
    validateCharset && fieldError?.message ? getNameValidationDisplay(fieldError.message) : undefined
  const legacyLabel = fieldError?.type === 'maxLength' ? 'Maximum 50 symbols' : fieldError?.message || label
  const resolvedLabel = validateCharset ? label : legacyLabel
  const tooltip = validationDisplay?.tooltip
  const resolvedHelperText = validateCharset ? (validationDisplay?.label ?? helperText) : helperText

  const { endAdornment, startAdornment, readOnly } = InputProps ?? {}
  const hasAdornment = Boolean(endAdornment || startAdornment)

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        maxLength: validateCharset ? undefined : DEFAULT_MAX_LENGTH,
        required: validateCharset ? false : required,
        validate: (value) => {
          if (validateCharset) {
            const sanitized = sanitizeName(value ?? '')
            if (sanitized === '') return required ? 'Required' : true
            return validateName(sanitized, { minLength, maxLength }) ?? true
          }
          if (value?.trim() === '' && required) return 'Required'
          return true
        },
      }}
      render={({ field: { ref, onBlur, onChange, value, name: fieldName } }) => {
        const inputProps = {
          ...props,
          id,
          ref,
          name: fieldName,
          value: value ?? '',
          placeholder,
          disabled,
          readOnly,
          required,
          autoFocus,
          // Full charset-validation explanation as a native tooltip (short label goes in the description below).
          title: tooltip || undefined,
          'aria-invalid': Boolean(fieldError) || undefined,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e),
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            onBlur()
            onChange(validateCharset ? sanitizeName(e.target.value) : e.target.value.trim())
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => e.stopPropagation(),
        }

        const inputControl = hasAdornment ? (
          <InputGroup inputSize={inputSize} variant={variant} className={InputProps?.className}>
            {startAdornment && <InputGroupAddon align="inline-start">{startAdornment}</InputGroupAddon>}
            <InputGroupInput {...inputProps} />
            {endAdornment && <InputGroupAddon align="inline-end">{endAdornment}</InputGroupAddon>}
          </InputGroup>
        ) : (
          <Input inputSize={inputSize} variant={variant} className={InputProps?.className} {...inputProps} />
        )

        return (
          <Field className={className}>
            {resolvedLabel != null && resolvedLabel !== '' && (
              <FieldLabel htmlFor={id} className={fieldError ? 'text-destructive' : undefined}>
                {resolvedLabel}
              </FieldLabel>
            )}

            {inputControl}

            {resolvedHelperText ? <FieldDescription>{resolvedHelperText}</FieldDescription> : null}
          </Field>
        )
      }}
    />
  )
}

export default NameInput
