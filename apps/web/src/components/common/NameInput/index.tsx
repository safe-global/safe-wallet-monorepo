import type { TextFieldProps } from '@mui/material'
import { TextField } from '@mui/material'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, sanitizeName, validateName } from '@safe-global/utils/validation/names'
import get from 'lodash/get'
import { Controller, type FieldError, useFormContext } from 'react-hook-form'
import inputCss from '@/styles/inputs.module.css'

const NameInput = ({
  name,
  required = false,
  minLength = 0,
  maxLength = ADDRESS_BOOK_NAME_MAX_LENGTH,
  ...props
}: Omit<TextFieldProps, 'error' | 'variant' | 'ref' | 'fullWidth'> & {
  name: string
  required?: boolean
  minLength?: number
  maxLength?: number
}) => {
  const { formState, control } = useFormContext() || {}
  // the name can be a path: e.g. "owner.3.name"
  const fieldError = get(formState.errors, name) as FieldError | undefined

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
        <TextField
          {...field}
          {...props}
          variant="outlined"
          label={<>{fieldError?.message || props.label}</>}
          error={Boolean(fieldError)}
          fullWidth
          onChange={(e) => onChange(e)}
          onBlur={(e) => {
            onBlur()
            onChange(sanitizeName(e.target.value))
          }}
          required={required}
          className={inputCss.input}
          onKeyDown={(e) => e.stopPropagation()}
        />
      )}
    />
  )
}

export default NameInput
