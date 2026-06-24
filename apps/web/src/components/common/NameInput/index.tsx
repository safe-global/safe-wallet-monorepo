import type { TextFieldProps } from '@mui/material'
import { TextField, Tooltip } from '@mui/material'
import {
  ADDRESS_BOOK_NAME_MAX_LENGTH,
  getNameValidationDisplay,
  sanitizeName,
  validateName,
} from '@safe-global/utils/validation/names'
import get from 'lodash/get'
import { useState } from 'react'
import { Controller, type FieldError, useFormContext } from 'react-hook-form'
import inputCss from '@/styles/inputs.module.css'

const NameInput = ({
  name,
  required = false,
  minLength = 0,
  maxLength = ADDRESS_BOOK_NAME_MAX_LENGTH,
  helperText,
  label,
  FormHelperTextProps,
  ...props
}: Omit<TextFieldProps, 'error' | 'variant' | 'ref' | 'fullWidth'> & {
  name: string
  required?: boolean
  minLength?: number
  maxLength?: number
}) => {
  const { formState, control } = useFormContext() || {}
  const [isFocused, setIsFocused] = useState(false)
  // the name can be a path: e.g. "owner.3.name"
  const fieldError = get(formState.errors, name) as FieldError | undefined
  const validationDisplay = fieldError?.message ? getNameValidationDisplay(fieldError.message) : undefined
  const resolvedLabel = validationDisplay?.label ?? label
  const resolvedHelperText = fieldError ? undefined : helperText
  const tooltip = validationDisplay?.tooltip

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (value) => {
          const sanitized = sanitizeName(value ?? '')
          if (sanitized === '') return required ? 'Required' : true
          return validateName(sanitized, { minLength, maxLength }) ?? true
        },
      }}
      // eslint-disable-next-line
      render={({ field: { ref, onBlur, onChange, ...field } }) => (
        <Tooltip title={tooltip ?? ''} open={Boolean(tooltip) && isFocused} arrow describeChild>
          <TextField
            {...field}
            {...props}
            inputRef={ref}
            variant="outlined"
            label={resolvedLabel}
            helperText={resolvedHelperText}
            FormHelperTextProps={FormHelperTextProps}
            error={Boolean(fieldError)}
            fullWidth
            onChange={(e) => onChange(e)}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false)
              onBlur()
              onChange(sanitizeName(e.target.value))
            }}
            required={required}
            className={inputCss.input}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </Tooltip>
      )}
    />
  )
}

export default NameInput
