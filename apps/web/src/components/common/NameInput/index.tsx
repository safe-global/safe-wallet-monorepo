import { type ReactNode, useId } from 'react'
import get from 'lodash/get'
import { Controller, type FieldError, useFormContext } from 'react-hook-form'
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
  InputProps?: {
    endAdornment?: ReactNode
    startAdornment?: ReactNode
    readOnly?: boolean
    className?: string
  }
  // Accepted for backwards-compatibility with the previous MUI TextField API; no shadcn equivalent.
  InputLabelProps?: { shrink?: boolean }
}

const NameInput = ({
  name,
  required = false,
  label,
  placeholder,
  disabled,
  autoFocus,
  className,
  helperText,
  InputProps,
  InputLabelProps,
  ...props
}: NameInputProps) => {
  const id = useId()
  const { formState, control } = useFormContext() || {}
  // the name can be a path: e.g. "owner.3.name"
  const fieldError = get(formState.errors, name) as FieldError | undefined

  const labelText = fieldError?.type === 'maxLength' ? 'Maximum 50 symbols' : fieldError?.message || label

  const { endAdornment, startAdornment, readOnly } = InputProps ?? {}
  const hasAdornment = Boolean(endAdornment || startAdornment)

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        maxLength: 50,
        required,
        validate: (value) => {
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
          'aria-invalid': Boolean(fieldError) || undefined,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e),
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            onBlur()
            onChange(e.target.value.trim())
          },
          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => e.stopPropagation(),
        }

        return (
          <Field className={className}>
            {labelText != null && labelText !== '' && (
              <FieldLabel htmlFor={id} className={fieldError ? 'text-destructive' : undefined}>
                {labelText}
              </FieldLabel>
            )}

            {hasAdornment ? (
              <InputGroup className={InputProps?.className}>
                {startAdornment && <InputGroupAddon align="inline-start">{startAdornment}</InputGroupAddon>}
                <InputGroupInput {...inputProps} />
                {endAdornment && <InputGroupAddon align="inline-end">{endAdornment}</InputGroupAddon>}
              </InputGroup>
            ) : (
              <Input className={InputProps?.className} {...inputProps} />
            )}

            {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
          </Field>
        )
      }}
    />
  )
}

export default NameInput
