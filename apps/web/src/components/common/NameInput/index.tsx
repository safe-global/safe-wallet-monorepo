import type { TextFieldProps } from '@mui/material'
import { TextField } from '@mui/material'
import get from 'lodash/get'
import { type FieldError, useFormContext } from 'react-hook-form'
import inputCss from '@/styles/inputs.module.css'

const NameInput = ({
  name,
  required = false,
  ...props
}: Omit<TextFieldProps, 'error' | 'variant' | 'ref' | 'fullWidth'> & {
  name: string
  required?: boolean
}) => {
  const { register, formState } = useFormContext() || {}
  // the name can be a path: e.g. "owner.3.name"
  const fieldError = get(formState.errors, name) as FieldError | undefined

  return (
    <TextField
      {...props}
      variant="outlined"
      label={<>{fieldError?.type === 'maxLength' ? 'Maximum 50 symbols' : fieldError?.message || props.label}</>}
      error={Boolean(fieldError)}
      fullWidth
      required={required}
      className={inputCss.input}
      onKeyDown={(e) => e.stopPropagation()}
      {...register(name, {
        maxLength: 50,
        required,
        setValueAs: (value) => value.trim(),
      })}
    />
  )
}

export default NameInput
