import type { TextFieldProps } from '@mui/material'
import { TextField } from '@mui/material'
import get from 'lodash/get'
import { Controller, type FieldError, useFormContext } from 'react-hook-form'
import inputCss from '@/styles/inputs.module.css'

const NameInput = ({
  name,
  required = false,
  ...props
}: Omit<TextFieldProps, 'error' | 'variant' | 'ref' | 'fullWidth'> & {
  name: string
  required?: boolean
}) => {
  const { formState, control } = useFormContext() || {}
  // the name can be a path: e.g. "owner.3.name"
  const fieldError = get(formState.errors, name) as FieldError | undefined

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
      // eslint-disable-next-line
      render={({ field: { ref, onBlur, onChange, ...field } }) => (
        <TextField
          {...field}
          {...props}
          variant="outlined"
          label={<>{fieldError?.type === 'maxLength' ? 'Maximum 50 symbols' : fieldError?.message || props.label}</>}
          error={Boolean(fieldError)}
          fullWidth
          onChange={(e) => onChange(e)}
          onBlur={(e) => {
            onBlur()
            onChange(e.target.value.trim())
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
