import { TextField } from '@mui/material'
import { forwardRef, useEffect, useRef } from 'react'
import type { TextFieldProps } from '@mui/material'
import type { ReactElement } from 'react'
import { getLocalDecimalSeparator } from '@safe-global/utils/utils/formatNumber'

export const _formatNumber = (value: string) => {
  value = value.trim()

  if (value === '') {
    return value
  }

  const decimalSeparator = getLocalDecimalSeparator()

  // Replace all decimal separators with the local language decimal separator
  value = value.replace(/[.,]/g, decimalSeparator)

  let index = 0
  // replace all decimal separators except the first one
  value = value.replace(new RegExp(`\\${decimalSeparator}`, 'g'), (item) => (index++ === 0 ? item : ''))

  // Remove all characters except numbers and decimal separator
  value = value.replace(new RegExp(`[^0-9${decimalSeparator}]`, 'g'), '')

  if (value.length > 1) {
    // Remove leading zeros from the string
    value = value.replace(/^0+/, '')
  }

  // If the string starts with a decimal separator, add a leading zero
  if (value.startsWith(decimalSeparator)) {
    value = '0' + value
  }

  return value
}

const NumberField = forwardRef<HTMLInputElement, TextFieldProps>(({ onChange, value, ...props }, ref): ReactElement => {
  const innerRef = useRef<HTMLInputElement | null>(null)

  const combinedRef = (node: HTMLInputElement | null) => {
    innerRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  useEffect(() => {
    const input = innerRef.current
    if (input) {
      input.value = _formatNumber(input.value)
    }
  })

  return (
    <TextField
      autoComplete="off"
      value={value}
      onChange={(event) => {
        event.target.value = _formatNumber(event.target.value)
        return onChange?.(event)
      }}
      {...props}
      inputProps={{
        ...props.inputProps,
        ref: combinedRef,
        // Autocomplete passes `onChange` in `inputProps`
        onChange: (event) => {
          // inputProps['onChange'] is generically typed
          if ('value' in event.target && typeof event.target.value === 'string') {
            event.target.value = _formatNumber(event.target.value)
            return props.inputProps?.onChange?.(event)
          }
        },
      }}
    />
  )
})

NumberField.displayName = 'NumberField'

export default NumberField
