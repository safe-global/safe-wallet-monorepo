import { type ReactNode, useId } from 'react'
import get from 'lodash/get'
import { Controller, type FieldError, useFormContext } from 'react-hook-form'
import { getNameValidationDisplay, sanitizeName, validateName } from '@safe-global/utils/validation/names'
import { NameInputView, type NameInputViewProps } from '@views/components/common/NameInput/NameInputView'

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
  inputSize?: NameInputViewProps['inputSize']
  variant?: NameInputViewProps['variant']
  errorPlacement?: NameInputViewProps['errorPlacement']
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
  errorPlacement,
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
  const tooltip = validationDisplay?.tooltip
  const resolvedHelperText = validateCharset ? (validationDisplay?.label ?? helperText) : helperText

  const { endAdornment, startAdornment, readOnly } = InputProps ?? {}
  // Key presence (not the current value) decides the structure: adornments that toggle between a
  // node and null (e.g. `resolving && <Spinner />`) must not switch the tree between InputGroup and
  // a bare Input across renders — that remounts the input element, dropping focus and in-flight
  // keystrokes mid-typing. An addon-less InputGroup renders identically to a bare Input.
  const hasAdornment = Boolean(InputProps && ('endAdornment' in InputProps || 'startAdornment' in InputProps))

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
        const helperTextId = resolvedHelperText ? `${id}-${fieldError ? 'error' : 'description'}` : undefined

        const inputProps = {
          ...props,
          id,
          ref,
          name: fieldName,
          value: value ?? '',
          disabled,
          readOnly,
          required,
          autoFocus,
          // Full charset-validation explanation as a native tooltip (short label goes in the description below).
          title: tooltip || undefined,
          'aria-invalid': Boolean(fieldError) || undefined,
          'aria-describedby': helperTextId,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e),
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            onBlur()
            onChange(validateCharset ? sanitizeName(e.target.value) : e.target.value.trim())
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => e.stopPropagation(),
        }

        return (
          <NameInputView
            id={id}
            label={label}
            placeholder={placeholder}
            required={required}
            validateCharset={validateCharset}
            fieldError={fieldError}
            helperText={resolvedHelperText}
            helperTextId={helperTextId}
            inputProps={inputProps}
            hasAdornment={hasAdornment}
            startAdornment={startAdornment}
            endAdornment={endAdornment}
            inputClassName={InputProps?.className}
            inputSize={inputSize}
            variant={variant}
            fieldClassName={className}
            errorPlacement={errorPlacement}
          />
        )
      }}
    />
  )
}

export default NameInput
