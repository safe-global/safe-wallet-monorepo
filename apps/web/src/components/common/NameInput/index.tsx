import type { TextFieldProps } from '@mui/material'
import { TextField, Tooltip } from '@mui/material'
import { getNameValidationDisplay, sanitizeName, validateName } from '@safe-global/utils/validation/names'
import get from 'lodash/get'
import { useState } from 'react'
import { Controller, type FieldError, useFormContext } from 'react-hook-form'
import inputCss from '@/styles/inputs.module.css'

const DEFAULT_MAX_LENGTH = 50

const NameInput = ({
  name,
  required = false,
  validateCharset = false,
  minLength = 0,
  maxLength,
  helperText,
  label,
  sx,
  ...props
}: Omit<TextFieldProps, 'error' | 'variant' | 'ref' | 'fullWidth'> & {
  name: string
  required?: boolean
  validateCharset?: boolean
  minLength?: number
  maxLength?: number
}) => {
  const { formState, control } = useFormContext() || {}
  const [isFocused, setIsFocused] = useState(false)
  // the name can be a path: e.g. "owner.3.name"
  const fieldError = get(formState.errors, name) as FieldError | undefined

  const validationDisplay =
    validateCharset && fieldError?.message ? getNameValidationDisplay(fieldError.message) : undefined
  const legacyLabel = fieldError?.type === 'maxLength' ? 'Maximum 50 symbols' : fieldError?.message || label
  const resolvedLabel = validateCharset ? label : legacyLabel
  const tooltip = validationDisplay?.tooltip
  const resolvedHelperText = validateCharset ? (validationDisplay?.label ?? helperText) : helperText

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
      render={({ field: { ref, onBlur, onChange, ...field } }) => (
        <Tooltip title={tooltip ?? ''} open={Boolean(tooltip) && isFocused} arrow describeChild>
          <TextField
            {...field}
            {...props}
            sx={[{ mb: validateCharset ? 2.5 : 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
            inputRef={ref}
            variant="outlined"
            label={resolvedLabel}
            helperText={resolvedHelperText}
            error={Boolean(fieldError)}
            fullWidth
            onChange={(e) => onChange(e)}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false)
              onBlur()
              onChange(validateCharset ? sanitizeName(e.target.value) : e.target.value.trim())
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
