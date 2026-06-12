import { useEffect, useRef, type ReactNode, type ComponentProps, type ChangeEventHandler } from 'react'
import { getLocalDecimalSeparator } from '@safe-global/utils/utils/formatNumber'

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/utils/cn'

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

type NumberFieldProps = Omit<ComponentProps<'input'>, 'onChange'> & {
  label?: ReactNode
  /** Marks the field invalid (sets aria-invalid + destructive styling). */
  error?: boolean
  helperText?: ReactNode
  fullWidth?: boolean
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  onChange?: ChangeEventHandler<HTMLInputElement>
}

const NumberField = ({
  label,
  error,
  helperText,
  fullWidth,
  startAdornment,
  endAdornment,
  onChange,
  className,
  id,
  ref,
  ...props
}: NumberFieldProps) => {
  const innerRef = useRef<HTMLInputElement | null>(null)

  const setRef = (node: HTMLInputElement | null) => {
    innerRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref != null) {
      ;(ref as { current: HTMLInputElement | null }).current = node
    }
  }

  useEffect(() => {
    const input = innerRef.current
    if (input) {
      input.value = _formatNumber(input.value)
    }
  })

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    event.target.value = _formatNumber(event.target.value)
    return onChange?.(event)
  }

  const inputId = id ?? (props.name ? `${props.name}-number-field` : undefined)
  const hasAdornment = Boolean(startAdornment || endAdornment)

  const control = hasAdornment ? (
    <InputGroup className={cn(fullWidth && 'w-full')}>
      {startAdornment && <InputGroupAddon align="inline-start">{startAdornment}</InputGroupAddon>}
      <InputGroupInput
        id={inputId}
        ref={setRef}
        autoComplete="off"
        aria-invalid={error || undefined}
        className={className}
        onChange={handleChange}
        {...props}
      />
      {endAdornment && <InputGroupAddon align="inline-end">{endAdornment}</InputGroupAddon>}
    </InputGroup>
  ) : (
    <Input
      id={inputId}
      ref={setRef}
      autoComplete="off"
      aria-invalid={error || undefined}
      className={cn(fullWidth && 'w-full', className)}
      onChange={handleChange}
      {...props}
    />
  )

  if (label == null && helperText == null) {
    return control
  }

  return (
    <Field data-invalid={error || undefined} className={cn(fullWidth && 'w-full')}>
      {label != null && (
        <FieldLabel htmlFor={inputId} className={error ? 'text-destructive' : undefined}>
          {label}
        </FieldLabel>
      )}
      {control}
      {helperText != null && (
        <FieldDescription className={error ? 'text-destructive' : undefined}>{helperText}</FieldDescription>
      )}
    </Field>
  )
}

NumberField.displayName = 'NumberField'

export default NumberField
